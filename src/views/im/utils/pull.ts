import { getDb } from './db'

/**
 * IM 状态事件补偿（增量拉取）通用编排
 *
 * 各业务模块（好友、群、申请、读位置）共用一套 update_time + id 正向游标：
 * 从持久化游标出发循环拉取变更并合并进本地 store，直到某页不满（没有更多），
 * 用于 WebSocket 漏推后的兜底补偿（进入 IM、断线重连时触发）
 */

/** 增量拉取游标：上次拉到的位置 */
export interface PullCursor {
  lastUpdateTime?: number
  lastId?: number
}

/** 可作为游标的拉取记录：服务端按 update_time + id 返回，客户端取最后一条推进游标 */
interface PullRecord {
  id: number
  updateTime?: number
}

/** 单次拉取条数（与后端 limit 上限对齐） */
const PULL_PAGE_SIZE = 100
/** 单轮最多翻页数，兜底防御异常游标导致的死循环 */
const PULL_MAX_PAGES = 100
/** 状态事件拉取回扫窗口，覆盖同秒内旧行更新和客户端 / 服务端时钟精度差 */
const PULL_OVERLAP_MS = 5000
/** 消息类 minId 拉取的单轮翻页上限，兜底防御异常游标死翻；消息量可能远大于状态事件，放宽到 1000 */
const MIN_ID_PULL_MAX_PAGES = 1000

/** 读取某模块的拉取游标；无则返回空游标（首次拉全量） */
export async function getPullCursor(key: string): Promise<PullCursor> {
  return (await getDb().getSetting<PullCursor>(key)) ?? {}
}

/**
 * 通用增量拉取：从持久化游标出发，循环拉取并应用变更，直到某页不满
 *
 * @param cursorKey 游标在 settings 里的 key（每个模块一份）
 * @param fetchPage 按游标拉一页（调对应 pull 接口，返回 VO 列表）
 * @param apply 把一页变更合并进本地 store；返回 false 表示本页未完全落地（如账号已切、依赖资源补拉失败），
 *              此时不推进游标并终止本轮，避免游标越过未落地的记录、导致后续增量永久漏拉。可返回 Promise
 */
export async function runIncrementalPull<T extends PullRecord>(
  cursorKey: string,
  fetchPage: (params: { lastUpdateTime?: number; lastId?: number; limit: number }) => Promise<T[]>,
  apply: (records: T[]) => boolean | Promise<boolean>,
  isActive?: () => boolean
): Promise<void> {
  const storedCursor = await getPullCursor(cursorKey)
  const highWater = { ...storedCursor }
  let cursor =
    storedCursor.lastUpdateTime != null
      ? { lastUpdateTime: Math.max(0, storedCursor.lastUpdateTime - PULL_OVERLAP_MS), lastId: 0 }
      : {}
  for (let page = 0; page < PULL_MAX_PAGES; page++) {
    if (isActive && !isActive()) {
      return
    }
    const list = await fetchPage({
      lastUpdateTime: cursor.lastUpdateTime,
      lastId: cursor.lastId,
      limit: PULL_PAGE_SIZE
    })
    if (isActive && !isActive()) {
      return
    }
    if (list.length) {
      // apply 未完全落地（返回 false）时直接终止：游标只能跟着已落地的数据走，否则会跳过本页记录
      if ((await apply(list)) === false) {
        return
      }
      if (isActive && !isActive()) {
        return
      }
      // 推进游标到本页最后一条并持久化：下次从这里接着拉
      const last = list[list.length - 1]
      if (last.updateTime == null) {
        return
      }
      cursor = { lastUpdateTime: last.updateTime, lastId: last.id }
      if (
        highWater.lastUpdateTime == null ||
        cursor.lastUpdateTime > highWater.lastUpdateTime ||
        (cursor.lastUpdateTime === highWater.lastUpdateTime &&
          cursor.lastId > (highWater.lastId ?? 0))
      ) {
        highWater.lastUpdateTime = cursor.lastUpdateTime
        highWater.lastId = cursor.lastId
        await getDb().setSetting(cursorKey, highWater)
      }
    }
    // 不满一页 = 没有更多变更
    if (list.length < PULL_PAGE_SIZE) {
      return
    }
  }
  console.warn(`[IM pull] ${cursorKey} 达到单轮翻页上限，提前结束本轮补偿`)
}

/**
 * 消息类增量拉取通用编排：按单调 minId 游标循环翻页，直到空页或游标不再前进
 *
 * 与 runIncrementalPull 的区别：消息游标是单调消息 id（非 update_time + id 复合游标），且 messageMaxId 的持久化
 * 跟随消息入库在 applyPage 内完成（messageStore），故本函数只负责「循环翻页机制」，不碰 settings，也不掺消息业务。
 *
 * @param initialMinId 起始游标：上次入库的最大消息 id
 * @param pageSize     单页条数
 * @param fetchPage    按 minId 拉一页
 * @param applyPage    处理本页（建会话 / 分发 / 入库 + 推进 messageMaxId）；返回 false 表示本页未落地，停止且不推进游标
 * @param isActive     每次 await 前后自检：取消 / 切账号时返回 false，丢弃本批不入库、不再翻页
 * @param maxPages     单轮翻页上限
 */
export async function runMinIdPull<T extends { id?: number }>(options: {
  initialMinId: number
  pageSize: number
  fetchPage: (params: { minId: number; size: number }) => Promise<T[]>
  applyPage: (records: T[], nextMinId?: number) => Promise<boolean | void>
  isActive?: () => boolean
  maxPages?: number
}): Promise<void> {
  const { initialMinId, pageSize, fetchPage, applyPage, isActive } = options
  const maxPages = options.maxPages ?? MIN_ID_PULL_MAX_PAGES
  let minId = initialMinId || 0
  for (let page = 0; page < maxPages; page++) {
    if (isActive && !isActive()) {
      return
    }
    const list = await fetchPage({ minId, size: pageSize })
    // 拉取期间取消 / 切账号：丢弃本批不入库，也不再翻页
    if (isActive && !isActive()) {
      return
    }
    if (!list || list.length === 0) {
      return
    }
    // 本批最大消息 id 作为下次游标；无有效 id 则本批 apply 后停（无法继续翻页）
    const validIds = list.map((record) => record.id).filter((id): id is number => id != null)
    const nextMinId = validIds.length > 0 ? Math.max(...validIds) : undefined
    // applyPage 返回 false：本页未落地（如入库失败），不推进游标并终止，避免漏消息
    if ((await applyPage(list, nextMinId)) === false) {
      return
    }
    // 无有效 id，或游标没前进（后端契约是 id > minId，理论不会出现）：停，防御死翻
    if (nextMinId == null || nextMinId <= minId) {
      return
    }
    minId = nextMinId
  }
  console.warn('[IM pull] runMinIdPull 达到单轮翻页上限，提前结束本轮')
}

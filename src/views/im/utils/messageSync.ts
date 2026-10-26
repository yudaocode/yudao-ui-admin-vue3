import { compareId } from '@/utils/id'
/** 消息状态优先级；高优先级终态不可被普通消息覆盖 */
export enum MessageTerminalPriority {
  NORMAL = 0, // 普通消息
  CONFIRMED = 1, // 服务端已确认消息
  RECALL = 2 // 撤回终态
}

/** 会话写 lane 与全量屏障 */
interface ConversationWriteState {
  barrierTail: Promise<void> // 当前全量屏障尾部
  tails: Map<string, Promise<void>> // 各会话写入尾部
}

interface RelationState {
  terminated: boolean
  messageId: number
  localTerminationPending: boolean
}

const writeState: ConversationWriteState = {
  // 当前运行时的会话写状态
  barrierTail: Promise.resolve(),
  tails: new Map()
}
const relationStates = new Map<string, RelationState>() // 群关系消息终态

/** 同一会话串行执行消息与会话终态写入 */
export async function enqueueConversationWrite<T>(
  clientConversationId: string,
  operation: () => Promise<T>
): Promise<T> {
  return enqueueConversationWrites([clientConversationId], operation)
}

/** 一次写入原子占用全部会话 lane，避免嵌套获取与屏障互锁 */
export function enqueueConversationWrites<T>(
  clientConversationIds: string[],
  operation: () => Promise<T>
): Promise<T> {
  // 1. 等待全量屏障和所有目标会话的前驱写入
  const keys = Array.from(new Set(clientConversationIds)).sort()
  const predecessors = [
    writeState.barrierTail,
    ...keys.map((key) => writeState.tails.get(key) || Promise.resolve())
  ]
  const current = Promise.all(predecessors.map((task) => task.catch(() => undefined))).then(
    operation
  )
  const settled = current.then(
    () => undefined,
    () => undefined
  )
  // 2. 先发布 recovery tail；完成时仅清理仍指向本任务的 lane
  keys.forEach((key) => writeState.tails.set(key, settled))
  return current.finally(() => {
    keys.forEach((key) => {
      if (writeState.tails.get(key) === settled) {
        writeState.tails.delete(key)
      }
    })
  })
}

/** 独占全部会话写入；只用于全量快照重建，常规写仍按会话并行 */
export function enqueueConversationBarrier<T>(operation: () => Promise<T>): Promise<T> {
  // 1. 同步发布 gate，阻止后续会话写越过本次全量操作
  const previousBarrier = writeState.barrierTail
  const existingWrites = Array.from(writeState.tails.values())
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  writeState.barrierTail = previousBarrier.catch(() => undefined).then(() => gate)
  return (async () => {
    // 2. 排空封门前的屏障和会话写，再独占执行全量操作
    await previousBarrier.catch(() => undefined)
    await Promise.all(existingWrites.map((task) => task.catch(() => undefined)))
    return await operation()
  })().finally(release)
}

/** 终态优先；相同优先级使用后到达状态 */
export function reduceMessageState<T>(
  current: { priority: MessageTerminalPriority; value?: T } | undefined,
  incoming: { priority: MessageTerminalPriority; value?: T }
) {
  return current && current.priority > incoming.priority ? current : incoming
}

/** 在会话写 lane 内记录关系终态；本地主动操作等待服务端终态消息后才允许重开 */
export function markRelationTerminated(clientConversationId: string, messageId?: number): boolean {
  return applyRelationState(clientConversationId, true, messageId)
}

/** 显式重新加入后清除关系终态；旧通知不得重开新终态 */
export function reopenRelation(clientConversationId: string, messageId?: number): boolean {
  return applyRelationState(clientConversationId, false, messageId)
}

export function isRelationTerminated(clientConversationId: string): boolean {
  return relationStates.get(clientConversationId)?.terminated === true
}

/** 排空当前 IM 运行时的消息写入，并在调用方仍允许时清理关系终态 */
export async function clearMessageSyncState(shouldClear: () => boolean): Promise<void> {
  const barrier = writeState.barrierTail
  const tails = Array.from(writeState.tails.entries())
  await Promise.all([
    barrier.catch(() => undefined),
    ...tails.map(([, task]) => task.catch(() => undefined))
  ])
  if (!shouldClear()) {
    return
  }
  relationStates.clear()
  if (writeState.barrierTail === barrier) {
    writeState.barrierTail = Promise.resolve()
  }
  tails.forEach(([key, task]) => {
    if (writeState.tails.get(key) === task) {
      writeState.tails.delete(key)
    }
  })
}

/** 按服务端关系消息编号单调归约群关系；本地主动终止在服务端终态确认前阻止旧成员消息重开 */
function applyRelationState(
  clientConversationId: string,
  terminated: boolean,
  messageId?: number
): boolean {
  const current = relationStates.get(clientConversationId)
  if (messageId === undefined) {
    if (!terminated && current?.localTerminationPending) {
      return false
    }
    if (terminated && current?.terminated) {
      return true
    }
    relationStates.set(clientConversationId, {
      terminated,
      messageId: current?.messageId ?? 0,
      localTerminationPending: terminated
    })
    return true
  }
  if (!terminated && current?.localTerminationPending) {
    return false
  }
  if (current && compareId(messageId, current.messageId) <= 0) {
    return false
  }
  relationStates.set(clientConversationId, {
    terminated,
    messageId,
    localTerminationPending: false
  })
  return true
}

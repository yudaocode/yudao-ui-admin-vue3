import type { FriendLite } from '../home/types'
import { loadImage } from './image'
import { getAvatarBgColor, getAvatarText } from './user'

/** 默认群名生成：所选好友前 4 个名字拼接，超过补「等 N 人」；为空兜底「群聊」 */
export function buildDefaultGroupName(members: FriendLite[]): string {
  if (members.length === 0) {
    return '群聊'
  }
  const names = members.slice(0, 4).map((m) => m.displayName || m.nickname || '')
  const head = names.filter(Boolean).join('、')
  if (members.length > 4) {
    // members 只含被选好友，+1 把创建者也计入实际成员数
    return `${head}等${members.length + 1}人`
  }
  return head || '群聊'
}

/** 群头像单格的输入：头像 URL + 名字 ，至少给一个，二者都缺时走灰底空格 */
export interface GroupAvatarMember {
  /** 头像 URL；缺失或加载失败时按 name 画色卡 */
  avatar?: string
  /** 显示名（昵称 / 备注）；色卡文字 + 底色 hash 来源 */
  name?: string
}

/** 群头像拼接的可选参数 */
export interface BuildGroupAvatarOptions {
  /** 输出画布边长（像素）；默认 64 */
  targetSize?: number
  /** 单格之间的间隔（像素）；默认 1 */
  divider?: number
  /** 画布底色；默认透明，让上下留白透出宿主容器底色 */
  background?: string
}

/** 单格在画布上的位置 + 尺寸 */
interface CellRect {
  x: number
  y: number
  w: number
  h: number
}

/** 单格的最终绘制内容 */
type Cell = { kind: 'image'; img: HTMLImageElement } | { kind: 'color'; text: string; bg: string }

/**
 * 把群成员头像拼成一张方形群头像 dataURL，按 1 ~ 9 张走九宫格变体布局
 *
 * - 仅取前 9 个成员
 * - 单格 avatar 为空 / 加载失败：按 name 在 canvas 上画色卡兜底
 * - 跨域要求图片源开启 CORS（img.crossOrigin = 'anonymous'）
 */
export async function buildGroupAvatar(
  members: GroupAvatarMember[],
  options: BuildGroupAvatarOptions = {}
): Promise<string> {
  const targetSize = options.targetSize ?? 64
  const divider = options.divider ?? 1
  const background = options.background

  const top = members.slice(0, 9)
  if (top.length === 0) {
    return ''
  }

  const cells = await Promise.all(top.map((m) => resolveCell(m)))
  const rects = computeCellRects(cells.length, targetSize, divider)

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return ''
  }
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, targetSize, targetSize)
  }
  cells.forEach((cell, idx) => {
    const rect = rects[idx]
    if (!rect) {
      return
    }
    drawCell(ctx, rect, cell)
  })
  return canvas.toDataURL('image/png')
}

/** 群头像 dataURL 缓存上限：每条约 5 ~ 30KB，200 条软封顶约 5MB 常驻 */
const MERGED_AVATAR_CACHE_MAX = 200
const mergedAvatarCache = new Map<string, string>()

/** 取群头像 dataURL 缓存；命中时按 LRU 提到末尾 */
export function getCachedGroupAvatar(key: string): string | undefined {
  const cached = mergedAvatarCache.get(key)
  if (cached === undefined) {
    return undefined
  }
  mergedAvatarCache.delete(key)
  mergedAvatarCache.set(key, cached)
  return cached
}

/** 写群头像 dataURL 缓存；超上限时丢弃最早一条（Map 迭代顺序 = 插入顺序，配合 get 的提升即 LRU） */
export function setCachedGroupAvatar(key: string, value: string): void {
  if (mergedAvatarCache.has(key)) {
    mergedAvatarCache.delete(key)
  } else if (mergedAvatarCache.size >= MERGED_AVATAR_CACHE_MAX) {
    const oldest = mergedAvatarCache.keys().next().value
    if (oldest !== undefined) {
      mergedAvatarCache.delete(oldest)
    }
  }
  mergedAvatarCache.set(key, value)
}

/** 单成员 → Cell：有 avatar 且加载成功走 image，否则走 color */
async function resolveCell(member: GroupAvatarMember): Promise<Cell> {
  if (member.avatar) {
    const img = await loadImage(member.avatar)
    if (img) {
      return { kind: 'image', img }
    }
  }
  return {
    kind: 'color',
    text: getAvatarText(member.name),
    bg: getAvatarBgColor(member.name)
  }
}

/** 把单个 Cell 画到 ctx 上指定格子里；image 走 cover 裁剪保比例，color 走 fillRect + 居中文字 */
function drawCell(ctx: CanvasRenderingContext2D, rect: CellRect, cell: Cell): void {
  const { x, y, w, h } = rect
  if (cell.kind === 'image') {
    drawImageCover(ctx, cell.img, x, y, w, h)
    return
  }
  ctx.fillStyle = cell.bg
  ctx.fillRect(x, y, w, h)
  if (!cell.text) {
    return
  }
  // 字号按短边算；单字 0.42、双字 0.34
  const baseSize = Math.min(w, h)
  const fontSize = Math.floor(baseSize * (cell.text.length > 1 ? 0.34 : 0.42))
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cell.text, x + w / 2, y + h / 2)
}

/** cover 裁剪：从源图中心裁出与目标矩形同比例的子区域，画到目标矩形（保持比例不变形） */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): void {
  const srcAspect = img.width / img.height
  const dstAspect = dw / dh
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height
  if (srcAspect > dstAspect) {
    sw = sh * dstAspect
    sx = (img.width - sw) / 2
  } else if (srcAspect < dstAspect) {
    sh = sw / dstAspect
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

/**
 * 按张数计算每格的位置 + 尺寸
 *
 * - 1 张：占满画布
 * - 2~4 张：2 列 2 行正方形单格
 * - 5~6 张：3 列 2 行正方形单格 + 垂直居中
 * - 7~9 张：3 列 3 行正方形单格
 */
function computeCellRects(count: number, target: number, divider: number): CellRect[] {
  if (count <= 0) {
    return []
  }
  if (count === 1) {
    return [{ x: 0, y: 0, w: target, h: target }]
  }
  if (count <= 4) {
    return computeCellRectsSmall(count, target, divider)
  }
  if (count <= 6) {
    return computeCellRectsMedium(count, target, divider)
  }
  return computeCellRectsLarge(count, target, divider)
}

/** 2~4 张：2 列 2 行正方形 */
function computeCellRectsSmall(count: number, target: number, divider: number): CellRect[] {
  const s = (target - 3 * divider) / 2
  const step = s + divider
  const rects: CellRect[] = []
  switch (count) {
    case 2: {
      // 居中 1 行（留上下空白）
      const y = target / 4
      rects.push({ x: divider, y, w: s, h: s })
      rects.push({ x: divider + step, y, w: s, h: s })
      break
    }
    case 3: {
      // 上 1 居中 + 下 2
      rects.push({ x: target / 4, y: divider, w: s, h: s })
      const y1 = divider + step
      rects.push({ x: divider, y: y1, w: s, h: s })
      rects.push({ x: divider + step, y: y1, w: s, h: s })
      break
    }
    case 4: {
      // 2×2 满铺
      rects.push({ x: divider, y: divider, w: s, h: s })
      rects.push({ x: divider + step, y: divider, w: s, h: s })
      const y1 = divider + step
      rects.push({ x: divider, y: y1, w: s, h: s })
      rects.push({ x: divider + step, y: y1, w: s, h: s })
      break
    }
  }
  return rects
}

/** 5~6 张：3 列 2 行正方形单格 + 垂直居中；上下留白由透明背景透出 GroupAvatar 容器底色 */
function computeCellRectsMedium(count: number, target: number, divider: number): CellRect[] {
  const s = (target - 4 * divider) / 3
  const step = s + divider
  const xs = [divider, divider + step, divider + 2 * step]
  // 2 行高 + 1 行间 div
  const totalH = 2 * s + divider
  const y0 = (target - totalH) / 2
  const y1 = y0 + step
  const rects: CellRect[] = []
  if (count === 5) {
    // 上 2 居中（左右对称留白） + 下 3 左右贴边
    const upX0 = (target - 2 * s - divider) / 2
    rects.push({ x: upX0, y: y0, w: s, h: s })
    rects.push({ x: upX0 + step, y: y0, w: s, h: s })
    rects.push({ x: xs[0], y: y1, w: s, h: s })
    rects.push({ x: xs[1], y: y1, w: s, h: s })
    rects.push({ x: xs[2], y: y1, w: s, h: s })
    return rects
  }
  // count === 6：上 3 + 下 3 满铺
  rects.push({ x: xs[0], y: y0, w: s, h: s })
  rects.push({ x: xs[1], y: y0, w: s, h: s })
  rects.push({ x: xs[2], y: y0, w: s, h: s })
  rects.push({ x: xs[0], y: y1, w: s, h: s })
  rects.push({ x: xs[1], y: y1, w: s, h: s })
  rects.push({ x: xs[2], y: y1, w: s, h: s })
  return rects
}

/** 7~9 张：3 列 3 行正方形单格 */
function computeCellRectsLarge(count: number, target: number, divider: number): CellRect[] {
  const s = (target - 4 * divider) / 3
  const step = s + divider
  const xs = [divider, divider + step, divider + 2 * step]
  const ys = [divider, divider + step, divider + 2 * step]
  const rects: CellRect[] = []
  if (count === 7) {
    // 上 1 居中 + 中 3 + 下 3
    rects.push({ x: xs[1], y: ys[0], w: s, h: s })
    rects.push({ x: xs[0], y: ys[1], w: s, h: s })
    rects.push({ x: xs[1], y: ys[1], w: s, h: s })
    rects.push({ x: xs[2], y: ys[1], w: s, h: s })
    rects.push({ x: xs[0], y: ys[2], w: s, h: s })
    rects.push({ x: xs[1], y: ys[2], w: s, h: s })
    rects.push({ x: xs[2], y: ys[2], w: s, h: s })
    return rects
  }
  if (count === 8) {
    // 上 2 居中 + 中 3 + 下 3
    const upX0 = (target - 2 * s - divider) / 2
    rects.push({ x: upX0, y: ys[0], w: s, h: s })
    rects.push({ x: upX0 + step, y: ys[0], w: s, h: s })
    rects.push({ x: xs[0], y: ys[1], w: s, h: s })
    rects.push({ x: xs[1], y: ys[1], w: s, h: s })
    rects.push({ x: xs[2], y: ys[1], w: s, h: s })
    rects.push({ x: xs[0], y: ys[2], w: s, h: s })
    rects.push({ x: xs[1], y: ys[2], w: s, h: s })
    rects.push({ x: xs[2], y: ys[2], w: s, h: s })
    return rects
  }
  // count === 9：3×3 满铺
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      rects.push({ x: xs[col], y: ys[row], w: s, h: s })
    }
  }
  return rects
}

// AI 短剧 3D 导演：导演工程的文档结构、关键帧插值与校验，白模动作，以及示例工程
import { Euler, MathUtils, Quaternion } from 'three'

// ========== 类型与常量 ==========

/** A portable previs document. Frames, metres and degrees are independent of WebGL. */
export type Vec3 = [number, number, number]
export type DirectorKind = 'actor' | 'box' | 'wall' | 'door' | 'castle' | 'cannon'
export type DirectorAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'wave'
  | 'sit'
  | 'reach'
  | 'point'
  | 'nod'
  | 'shakeHead'
  | 'crouch'
  | 'bow'
  | 'talk'
export type DirectorJoint =
  | 'pelvis'
  | 'torso'
  | 'head'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftArm'
  | 'leftElbow'
  | 'rightArm'
  | 'rightElbow'
  | 'leftHand'
  | 'rightHand'
  | 'leftLeg'
  | 'leftKnee'
  | 'rightLeg'
  | 'rightKnee'
  | 'leftFoot'
  | 'rightFoot'
export type DirectorPose = Partial<Record<DirectorJoint, Vec3>> & { height?: number }
export type DirectorEase = 'linear' | 'smooth' | 'hold'
export interface ActionClip {
  id: string
  action: DirectorAction
  start: number
  end: number
  speed: number
  strength: number
  blend: number
}
export interface ObjectKey {
  frame: number
  position: Vec3
  yaw: number
  action: DirectorAction
  pose?: DirectorPose
  ease?: DirectorEase
}
export interface DirectorObject {
  id: string
  kind: DirectorKind
  name: string
  color: string
  scale: Vec3
  visible: boolean
  locked: boolean
  keys: ObjectKey[]
  clips?: ActionClip[]
  autoFace?: boolean
  lookAtId?: string
  grounded?: boolean
  quaternionPose?: boolean
  fireFrame?: number
  targetId?: string
}
export interface CameraKey {
  frame: number
  position: Vec3
  target: Vec3
  fov: number
  roll: number
  ease?: DirectorEase
}
export interface CameraFollow {
  objectId: string
  mode: 'aim' | 'follow'
  offset: Vec3
  height: number
}
export interface DirectorDocument {
  schema: 1
  fps: 24
  duration: number
  aspect: '16:9' | '9:16'
  objects: DirectorObject[]
  camera: { keys: CameraKey[]; follow?: CameraFollow }
  markers?: { frame: number; label: string }[]
}
export const directorMaxDuration = 60
export const directorKinds: Record<DirectorKind, string> = {
  actor: '人物白模',
  box: '方块道具',
  wall: '墙体',
  door: '门框',
  castle: '城门城墙',
  cannon: '大炮白模'
}
export const directorActions: Record<DirectorAction, string> = {
  idle: '站立',
  walk: '行走',
  run: '奔跑',
  wave: '招手',
  sit: '坐姿',
  reach: '伸手',
  point: '指向',
  nod: '点头',
  shakeHead: '摇头',
  crouch: '下蹲',
  bow: '鞠躬',
  talk: '交谈手势'
}
export const directorJoints: Record<DirectorJoint, string> = {
  pelvis: '骨盆',
  torso: '躯干',
  head: '头部',
  leftShoulder: '左肩带',
  rightShoulder: '右肩带',
  leftArm: '左上臂',
  leftElbow: '左肘',
  rightArm: '右上臂',
  rightElbow: '右肘',
  leftHand: '左手腕',
  rightHand: '右手腕',
  leftLeg: '左大腿',
  leftKnee: '左膝',
  rightLeg: '右大腿',
  rightKnee: '右膝',
  leftFoot: '左脚踝',
  rightFoot: '右脚踝'
}
export const directorEases: Record<DirectorEase, string> = {
  linear: '匀速',
  smooth: '缓入缓出',
  hold: '保持后切换'
}

// ========== 核心操作：插值、校验、关键帧 ==========

export const cloneDirector = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const totalFrames = (doc: DirectorDocument) => doc.duration * doc.fps
export const emptyDirector = (): DirectorDocument => ({
  schema: 1,
  fps: 24,
  duration: 8,
  aspect: '16:9',
  objects: [],
  camera: { keys: [{ frame: 0, position: [5, 3, 7], target: [0, 1, 0], fov: 45, roll: 0 }] }
})
export function newDirectorObject(kind: DirectorKind, count = 0): DirectorObject {
  return {
    id: crypto.randomUUID(),
    kind,
    name: `${directorKinds[kind]} ${count + 1}`,
    color: kind === 'actor' ? '#e9edf3' : '#b9c5d5',
    visible: true,
    locked: false,
    scale: kind === 'wall' ? [4, 2.8, 0.2] : [1, 1, 1],
    keys: [{ frame: 0, position: [(count % 3) * 1.8, 0, 0], yaw: 0, action: 'idle' }]
  }
}
function interval<T extends { frame: number }>(keys: T[], frame: number): [T, T, number] {
  const a =
    keys
      .slice()
      .reverse()
      .find((k) => k.frame <= frame) || keys[0]!
  const b = keys.find((k) => k.frame > frame) || a
  return [a, b, a === b ? 0 : Math.max(0, (frame - a.frame) / (b.frame - a.frame))]
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const vector = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t)
]
export const easeValue = (t: number, ease?: DirectorEase) =>
  ease === 'hold' ? 0 : ease === 'smooth' ? t * t * (3 - 2 * t) : t
export function interpolatePose(
  a: DirectorPose = {},
  b: DirectorPose = {},
  t: number,
  quaternion = false
): DirectorPose {
  const pose: DirectorPose = {}
  for (const joint of Object.keys(directorJoints) as DirectorJoint[])
    if (a[joint] || b[joint]) {
      const start = a[joint] || [0, 0, 0],
        end = b[joint] || [0, 0, 0]
      if (!quaternion || t === 0 || t === 1) pose[joint] = vector(start, end, t)
      else {
        const q = (v: Vec3) =>
          new Quaternion().setFromEuler(new Euler(...(v.map(MathUtils.degToRad) as Vec3)))
        const e = new Euler().setFromQuaternion(q(start).slerp(q(end), t))
        pose[joint] = [e.x, e.y, e.z].map(MathUtils.radToDeg) as Vec3
      }
    }
  if (a.height !== undefined || b.height !== undefined)
    pose.height = lerp(a.height || 0, b.height || 0, t)
  return pose
}
export function objectAt(object: DirectorObject, frame: number): ObjectKey {
  const [a, b, raw] = interval(object.keys, frame),
    t = easeValue(raw, a.ease)
  const delta = ((b.yaw - a.yaw + 540) % 360) - 180
  let yaw = ((a.yaw + delta * t + 540) % 360) - 180
  if (object.autoFace) {
    let direction = [b.position[0] - a.position[0], b.position[2] - a.position[2]]
    if (Math.hypot(...direction) < 0.001) {
      const index = object.keys.indexOf(a)
      const prev = object.keys
        .slice(0, index)
        .reverse()
        .find(
          (k) => Math.hypot(a.position[0] - k.position[0], a.position[2] - k.position[2]) > 0.001
        )
      if (prev) direction = [a.position[0] - prev.position[0], a.position[2] - prev.position[2]]
    }
    if (Math.hypot(...direction) > 0.001)
      yaw = (Math.atan2(direction[0]!, direction[1]!) * 180) / Math.PI
  }
  return {
    frame,
    position: vector(a.position, b.position, t),
    yaw,
    action: a.action,
    ...(a.pose || b.pose
      ? { pose: interpolatePose(a.pose, b.pose, t, object.quaternionPose) }
      : {}),
    ...(a.ease ? { ease: a.ease } : {})
  }
}
export function cameraAt(doc: DirectorDocument, frame: number): CameraKey {
  const [a, b, raw] = interval(doc.camera.keys, frame),
    t = easeValue(raw, a.ease)
  const key: CameraKey = {
    frame,
    position: vector(a.position, b.position, t),
    target: vector(a.target, b.target, t),
    fov: lerp(a.fov, b.fov, t),
    roll: lerp(a.roll, b.roll, t),
    ...(a.ease ? { ease: a.ease } : {})
  }
  const follow = doc.camera.follow,
    actor = follow && doc.objects.find((o) => o.id === follow.objectId)
  if (follow && actor) {
    const position = objectAt(actor, frame).position
    key.target = [position[0], position[1] + follow.height, position[2]]
    if (follow.mode === 'follow')
      key.position = position.map((v, i) => v + follow.offset[i]!) as Vec3
  }
  return key
}
export function upsertKey<T extends { frame: number }>(keys: T[], key: T): T[] {
  return [...keys.filter((k) => k.frame !== key.frame), cloneDirector(key)].sort(
    (a, b) => a.frame - b.frame
  )
}
/** Shorten a clip without throwing away its former end pose. */
export function resizeDirector(doc: DirectorDocument, duration: number): DirectorDocument {
  const next = cloneDirector(doc),
    end = duration * doc.fps - 1
  if (duration < doc.duration) {
    next.objects.forEach((o, i) => {
      const pose = objectAt(doc.objects[i]!, end)
      o.keys = upsertKey(
        o.keys.filter((k) => k.frame < end),
        pose
      )
      if (o.clips)
        o.clips = o.clips
          .filter((c) => c.start <= end)
          .map((c) => ({
            ...c,
            end: Math.min(c.end, end + 1),
            blend: Math.min(c.blend, Math.floor((Math.min(c.end, end + 1) - c.start) / 2))
          }))
      if (o.fireFrame !== undefined && o.fireFrame > end) delete o.fireFrame
    })
    next.camera.keys = upsertKey(
      next.camera.keys.filter((k) => k.frame < end),
      cameraAt(doc, end)
    )
  }
  next.duration = duration
  if (next.markers) next.markers = next.markers.filter((m) => m.frame <= end)
  return next
}
export function validateDirector(value: unknown): DirectorDocument {
  const doc = value as DirectorDocument
  const fail = (message: string): never => {
    throw new Error(message)
  }
  if (
    !doc ||
    doc.schema !== 1 ||
    doc.fps !== 24 ||
    !Number.isInteger(doc.duration) ||
    doc.duration < 2 ||
    doc.duration > directorMaxDuration ||
    !['16:9', '9:16'].includes(doc.aspect) ||
    !Array.isArray(doc.objects) ||
    doc.objects.length > 80 ||
    !doc.camera
  )
    fail('工程格式无效（2–60 秒，24 fps）')
  const vec = (v: unknown, scale = false) =>
    Array.isArray(v) &&
    v.length === 3 &&
    v.every(
      (n) =>
        typeof n === 'number' &&
        Number.isFinite(n) &&
        (scale ? n >= 0.1 && n <= 20 : Math.abs(n) <= 100)
    )
  const num = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max
  const ease = (v: unknown) =>
    v === undefined ||
    (typeof v === 'string' && Object.prototype.hasOwnProperty.call(directorEases, v))
  const keys = (list: { frame: number }[]) =>
    Array.isArray(list) &&
    list.length > 0 &&
    list.length <= 1440 &&
    list[0]?.frame === 0 &&
    list.every(
      (k, i) =>
        Number.isInteger(k.frame) &&
        k.frame >= 0 &&
        k.frame < totalFrames(doc) &&
        (!i || k.frame > list[i - 1]!.frame)
    )
  const ids = new Set<string>()
  for (const o of doc.objects) {
    if (
      !o ||
      typeof o.id !== 'string' ||
      !/^[\w-]{1,100}$/.test(o.id) ||
      ids.has(o.id) ||
      !Object.prototype.hasOwnProperty.call(directorKinds, o.kind) ||
      typeof o.name !== 'string' ||
      !o.name.trim() ||
      o.name.length > 100 ||
      !/^#[\da-f]{6}$/i.test(o.color) ||
      !vec(o.scale, true) ||
      typeof o.visible !== 'boolean' ||
      typeof o.locked !== 'boolean' ||
      !keys(o.keys)
    )
      fail('场景对象或关键帧无效')
    ids.add(o.id)
    if (
      o.fireFrame !== undefined &&
      (o.kind !== 'cannon' ||
        !Number.isInteger(o.fireFrame) ||
        o.fireFrame < 0 ||
        o.fireFrame >= totalFrames(doc))
    )
      fail('开炮时刻必须在大炮的时间轴范围内')
    if (o.autoFace !== undefined && typeof o.autoFace !== 'boolean') fail('朝向选项无效')
    if (
      [o.grounded, o.quaternionPose].some((v) => v !== undefined && typeof v !== 'boolean') ||
      (o.kind !== 'actor' && (o.grounded || o.quaternionPose))
    )
      fail('人物姿态选项无效')
    if (
      o.keys.some(
        (k) =>
          !vec(k.position) ||
          !num(k.yaw, 360) ||
          !Object.prototype.hasOwnProperty.call(directorActions, k.action) ||
          !ease(k.ease)
      )
    )
      fail('对象动作或坐标无效')
    for (const k of o.keys)
      if (k.pose !== undefined) {
        if (
          !k.pose ||
          typeof k.pose !== 'object' ||
          Array.isArray(k.pose) ||
          Object.keys(k.pose).some(
            (j) => j !== 'height' && !Object.prototype.hasOwnProperty.call(directorJoints, j)
          )
        )
          fail('关节姿态无效')
        for (const j of Object.keys(directorJoints) as DirectorJoint[])
          if (
            k.pose[j] !== undefined &&
            (!Array.isArray(k.pose[j]) ||
              k.pose[j]!.length !== 3 ||
              !k.pose[j]!.every((n) => num(n, 180)))
          )
            fail('关节角度必须在 -180 至 180 度之间')
        if (k.pose.height !== undefined && (!num(k.pose.height, 1) || k.pose.height < -0.9))
          fail('身体高度偏移无效')
      }
    if (o.clips !== undefined) {
      if (o.kind !== 'actor' || !Array.isArray(o.clips) || o.clips.length > 100)
        fail('动作片段无效')
      const clips = new Set<string>()
      for (const [i, c] of o.clips.entries()) {
        if (
          !c ||
          typeof c.id !== 'string' ||
          !/^[\w-]{1,100}$/.test(c.id) ||
          clips.has(c.id) ||
          !Object.prototype.hasOwnProperty.call(directorActions, c.action) ||
          !Number.isInteger(c.start) ||
          !Number.isInteger(c.end) ||
          c.start < 0 ||
          c.end > totalFrames(doc) ||
          c.end <= c.start ||
          (i > 0 && c.start < o.clips[i - 1]!.end) ||
          !num(c.speed, 3) ||
          c.speed < 0.25 ||
          !num(c.strength, 1.5) ||
          c.strength < 0 ||
          !Number.isInteger(c.blend) ||
          c.blend < 0 ||
          c.blend > Math.floor((c.end - c.start) / 2)
        )
          fail('动作片段不能重叠；速度 0.25–3，幅度 0–1.5，过渡不超过片段一半')
        clips.add(c.id)
      }
    }
  }
  for (const o of doc.objects)
    if (
      o.lookAtId !== undefined &&
      (typeof o.lookAtId !== 'string' || !ids.has(o.lookAtId) || o.lookAtId === o.id)
    )
      fail('注视对象无效')
  for (const o of doc.objects)
    if (
      o.targetId !== undefined &&
      (o.kind !== 'cannon' || !doc.objects.some((t) => t.id === o.targetId && t.kind === 'castle'))
    )
      fail('大炮命中目标必须是当前场景的城门城墙')
  if (
    !keys(doc.camera.keys) ||
    doc.camera.keys.some(
      (k) =>
        !vec(k.position) ||
        !vec(k.target) ||
        !num(k.roll, 180) ||
        !num(k.fov, 100) ||
        k.fov < 15 ||
        !ease(k.ease) ||
        k.position.every((n, i) => Math.abs(n - k.target[i]!) < 0.001)
    )
  )
    fail('机位参数无效（视角 15–100 度，机位与目标不能重合）')
  const follow = doc.camera.follow
  if (
    doc.markers !== undefined &&
    (!Array.isArray(doc.markers) ||
      doc.markers.length > 100 ||
      doc.markers.some(
        (m) =>
          !m ||
          !Number.isInteger(m.frame) ||
          m.frame < 0 ||
          m.frame >= totalFrames(doc) ||
          typeof m.label !== 'string' ||
          !m.label.trim() ||
          m.label.length > 60
      ))
  )
    fail('动作标记无效')
  if (
    follow !== undefined &&
    (!follow ||
      !ids.has(follow.objectId) ||
      !['aim', 'follow'].includes(follow.mode) ||
      !vec(follow.offset) ||
      !num(follow.height, 3) ||
      follow.height < 0 ||
      (follow.mode === 'follow' &&
        Math.hypot(follow.offset[0], follow.offset[1] - follow.height, follow.offset[2]) < 0.01))
  )
    fail('摄影机跟随参数无效')
  if (JSON.stringify(doc).length > 1024 * 1024) fail('工程不能超过 1MB')
  return cloneDirector(doc)
}

/** Moves an existing key without overwriting another key or the initial anchor. */
export function moveDirectorKey<T extends { frame: number }>(
  keys: T[],
  from: number,
  to: number,
  end: number,
  copy = false
): T[] {
  if (!Number.isInteger(to) || to < 0 || to > end) throw new Error('关键帧时间超出片段')
  const key = keys.find((k) => k.frame === from)
  if (!key) throw new Error('请先选择已记录的关键帧')
  if (from === to) return keys
  if (keys.some((k) => k.frame === to)) throw new Error('目标时刻已有关键帧，请选择其他时刻')
  if (!copy && from === 0) throw new Error('第 0 帧不能移动，可复制到其他时刻')
  return upsertKey(copy ? keys : keys.filter((k) => k.frame !== from), {
    ...cloneDirector(key),
    frame: to
  })
}

// ========== 白模动作：关节姿态、动作片段 ==========

// DONE @AI：drama 是不是融合成一个 ts？（drama.ts 公共层保留；导演的模型、动作、示例合并在本文件）
/** Pure joint rotations in degrees. Shared by the viewport, exports and motion tests. */
function actionPose(action: DirectorAction, seconds: number, strength = 1): DirectorPose {
  const p: DirectorPose = { height: 0 }
  const set = (joint: DirectorJoint, x = 0, y = 0, z = 0) => {
    p[joint] = [x, y, z]
  }
  const fast = action === 'run',
    stride = Math.sin(seconds * (fast ? 12 : 7))
  if (action === 'walk' || fast) {
    set('leftLeg', stride * (fast ? 48 : 28))
    set('rightLeg', -stride * (fast ? 48 : 28))
    set('leftArm', -stride * 25)
    set('rightArm', stride * 25)
    set('leftKnee', Math.max(0, -stride) * 35)
    set('rightKnee', Math.max(0, stride) * 35)
    set('leftElbow', fast ? -45 : -12)
    set('rightElbow', fast ? -45 : -12)
    set('torso', fast ? 10 : 0)
    p.height = Math.abs(Math.cos(seconds * (fast ? 12 : 7))) * (fast ? 0.07 : 0.025)
  } else if (action === 'wave') {
    // The right shoulder is on +X: positive Z raises the arm away from the head.
    set('rightArm', 0, 0, 145)
    set('rightElbow', -30, 0, Math.sin(seconds * 8) * 25)
    set('head', 0, Math.sin(seconds * 2) * 6)
  } else if (action === 'reach' || action === 'point') {
    set('rightArm', action === 'point' ? -95 : -75, action === 'point' ? -15 : 0)
    set('rightElbow', -12)
    set('torso', 8)
    set('head', -4, -8)
  } else if (action === 'sit') {
    p.height = -0.43
    set('leftLeg', -90)
    set('rightLeg', -90)
    set('leftKnee', 90)
    set('rightKnee', 90)
    set('leftArm', -18)
    set('rightArm', -18)
    set('leftElbow', -25)
    set('rightElbow', -25)
  } else if (action === 'crouch') {
    p.height = -0.48
    set('leftLeg', -70)
    set('rightLeg', -70)
    set('leftKnee', 105)
    set('rightKnee', 105)
    set('torso', 30)
    set('leftArm', -38)
    set('rightArm', -38)
  } else if (action === 'bow') {
    set('torso', 38)
    set('head', 12)
    set('leftArm', -12)
    set('rightArm', -12)
  } else if (action === 'nod') set('head', Math.sin(seconds * 5) * 18)
  else if (action === 'shakeHead') set('head', 0, Math.sin(seconds * 5) * 28)
  else if (action === 'talk') {
    set('rightArm', -25, 0, -12)
    set('rightElbow', -55 + Math.sin(seconds * 4) * 18)
    set('leftElbow', -20)
    set('head', Math.sin(seconds * 2) * 4)
  }
  for (const joint of Object.keys(directorJoints) as DirectorJoint[])
    if (p[joint]) p[joint] = p[joint]!.map((v) => v * strength) as Vec3
  // Larger gesture strengths must not swing the raised arm back through the head.
  if (action === 'wave') p.rightArm![2] = Math.min(155, p.rightArm![2])
  p.height! *= strength
  return p
}

export function actorMotion(
  object: DirectorObject,
  frame: number,
  doc?: DirectorDocument
): DirectorPose {
  const key = objectAt(object, frame),
    anchor =
      object.keys
        .slice()
        .reverse()
        .find((k) => k.frame <= frame) || object.keys[0]!
  let result = actionPose(key.action, (frame - anchor.frame) / 24)
  const clip = object.clips?.find((c) => frame >= c.start && frame < c.end)
  if (clip) {
    const target = actionPose(clip.action, ((frame - clip.start) / 24) * clip.speed, clip.strength)
    // A clip blends from/to the underlying action; custom joint offsets stay independent.
    const weight =
      clip.blend === 0
        ? 1
        : Math.min(
            easeValue(Math.min(1, (frame - clip.start) / clip.blend), 'smooth'),
            easeValue(Math.min(1, (clip.end - frame) / clip.blend), 'smooth')
          )
    result = interpolatePose(result, target, weight)
  }
  for (const joint of Object.keys(directorJoints) as DirectorJoint[]) {
    const a = result[joint] || [0, 0, 0],
      b = key.pose?.[joint] || [0, 0, 0]
    result[joint] = a.map((v, i) => v + b[i]!) as Vec3
  }
  result.height = (result.height || 0) + (key.pose?.height || 0)
  const target = doc?.objects.find((o) => o.id === object.lookAtId)
  if (target) {
    const there = objectAt(target, frame),
      dx = there.position[0] - key.position[0],
      dz = there.position[2] - key.position[2]
    if (Math.hypot(dx, dz) > 0.01) {
      const angle = (((Math.atan2(dx, dz) * 180) / Math.PI - key.yaw + 540) % 360) - 180
      result.head![1] += Math.max(-70, Math.min(70, angle))
    }
  }
  return result
}

/** Finds an unoccupied interval beginning at the playhead. End is exclusive. */
export function newActionClip(
  object: DirectorObject,
  frame: number,
  last: number,
  action: DirectorAction
): ActionClip {
  if (object.clips?.some((c) => frame >= c.start && frame < c.end))
    throw new Error('当前时刻已有动作片段，先移到空白时段或编辑该片段')
  const next = object.clips?.find((c) => c.start > frame)?.start ?? last + 1,
    end = Math.min(frame + 48, next, last + 1)
  if (end - frame < 2) throw new Error('片段末尾空间不足，请移到更早的时刻')
  return {
    id: crypto.randomUUID(),
    action,
    start: frame,
    end,
    speed: 1,
    strength: 1,
    blend: Math.min(6, Math.floor((end - frame) / 2))
  }
}

export function mirrorDirectorPose(pose: DirectorPose): DirectorPose {
  const next: DirectorPose = { height: pose.height }
  for (const joint of Object.keys(directorJoints) as DirectorJoint[]) {
    const source = joint.startsWith('left')
      ? (joint.replace('left', 'right') as DirectorJoint)
      : joint.startsWith('right')
        ? (joint.replace('right', 'left') as DirectorJoint)
        : joint
    if (pose[source]) next[joint] = [pose[source]![0], -pose[source]![1], -pose[source]![2]]
  }
  return next
}

// ========== 示例工程 ==========

/** An optional, editable blocking exercise, never inserted into an empty document automatically. */
export function sampleDirector(): DirectorDocument {
  const doc = emptyDirector(),
    actor = newDirectorObject('actor'),
    other = newDirectorObject('actor', 1),
    door = newDirectorObject('door'),
    box = newDirectorObject('box')
  actor.name = '来客'
  actor.color = '#e2eaf4'
  actor.keys = [
    { frame: 0, position: [-3, 0, 0], yaw: 90, action: 'walk' },
    { frame: 96, position: [0, 0, 0], yaw: 90, action: 'wave' },
    { frame: 191, position: [0, 0, 0], yaw: 90, action: 'idle' }
  ]
  other.name = '等候者'
  other.color = '#8bafdf'
  other.keys[0]!.position = [1.4, 0, 0]
  other.keys[0]!.yaw = -90
  door.name = '入口门框'
  door.keys[0]!.position = [-2, 0, 0]
  door.keys[0]!.yaw = 90
  box.name = '座椅'
  box.scale = [1.2, 0.45, 0.8]
  box.keys[0]!.position = [1.4, 0, -1]
  doc.objects = [actor, other, door, box]
  doc.camera.keys = [
    { frame: 0, position: [-0.5, 3, 7], target: [-0.5, 1, 0], fov: 45, roll: 0 },
    { frame: 191, position: [3, 2, 4.5], target: [0.6, 1.3, 0], fov: 38, roll: 0 }
  ]
  return doc
}

/** An editable twelve-second exercise; imported only on the user's explicit action. */
export function performanceDirector(): DirectorDocument {
  const doc = emptyDirector()
  doc.duration = 12
  const guest = newDirectorObject('actor'),
    host = newDirectorObject('actor', 1),
    table = newDirectorObject('box'),
    door = newDirectorObject('door')
  guest.name = '来客 · 走近伸手'
  guest.color = '#e6ebf1'
  guest.autoFace = true
  guest.lookAtId = host.id
  guest.keys = [
    { frame: 0, position: [-3.2, 0, 0], yaw: 90, action: 'idle' },
    { frame: 72, position: [-0.75, 0, 0], yaw: 90, action: 'idle', ease: 'smooth' },
    {
      frame: 120,
      position: [-0.75, 0, 0],
      yaw: 90,
      action: 'idle',
      pose: { head: [0, 10, 0], rightElbow: [-15, 0, 0] },
      ease: 'smooth'
    },
    {
      frame: 168,
      position: [-0.75, 0, 0],
      yaw: 90,
      action: 'idle',
      pose: { head: [0, 0, 0], rightElbow: [-30, 0, 0], torso: [8, 0, 0] },
      ease: 'smooth'
    },
    { frame: 216, position: [-0.75, 0, 0], yaw: 90, action: 'idle', pose: {}, ease: 'smooth' },
    { frame: 287, position: [-0.75, 0, 0], yaw: 90, action: 'idle' }
  ]
  guest.clips = [
    {
      id: crypto.randomUUID(),
      action: 'walk',
      start: 0,
      end: 72,
      speed: 1,
      strength: 0.8,
      blend: 6
    },
    {
      id: crypto.randomUUID(),
      action: 'wave',
      start: 72,
      end: 120,
      speed: 0.8,
      strength: 0.85,
      blend: 8
    },
    {
      id: crypto.randomUUID(),
      action: 'reach',
      start: 120,
      end: 216,
      speed: 1,
      strength: 1,
      blend: 12
    },
    {
      id: crypto.randomUUID(),
      action: 'nod',
      start: 216,
      end: 264,
      speed: 0.8,
      strength: 0.7,
      blend: 8
    }
  ]
  host.name = '等候者 · 回应'
  host.color = '#8daed3'
  host.lookAtId = guest.id
  host.keys = [
    { frame: 0, position: [1, 0, 0], yaw: -90, action: 'idle' },
    {
      frame: 144,
      position: [1, 0, 0],
      yaw: -90,
      action: 'idle',
      pose: { leftElbow: [-20, 0, 0] },
      ease: 'smooth'
    },
    { frame: 216, position: [1, 0, 0], yaw: -90, action: 'idle', pose: {}, ease: 'smooth' }
  ]
  host.clips = [
    {
      id: crypto.randomUUID(),
      action: 'nod',
      start: 84,
      end: 120,
      speed: 0.7,
      strength: 0.6,
      blend: 6
    },
    {
      id: crypto.randomUUID(),
      action: 'reach',
      start: 144,
      end: 216,
      speed: 1,
      strength: 0.8,
      blend: 12
    },
    {
      id: crypto.randomUUID(),
      action: 'talk',
      start: 216,
      end: 288,
      speed: 0.7,
      strength: 0.8,
      blend: 10
    }
  ]
  table.name = '矮台 · 空间参考'
  table.scale = [0.65, 0.7, 0.75]
  table.keys[0]!.position = [0.15, 0, -0.7]
  door.name = '入场门框'
  door.keys[0]!.position = [-2.6, 0, 0]
  door.keys[0]!.yaw = 90
  doc.objects = [guest, host, table, door]
  doc.camera.keys = [
    {
      frame: 0,
      position: [-0.7, 2.5, 6.5],
      target: [-0.7, 1.15, 0],
      fov: 46,
      roll: 0,
      ease: 'smooth'
    },
    {
      frame: 120,
      position: [1.6, 2, 4.8],
      target: [0.1, 1.2, 0],
      fov: 42,
      roll: 0,
      ease: 'smooth'
    },
    {
      frame: 216,
      position: [2.8, 1.8, 3.8],
      target: [0.1, 1.25, 0],
      fov: 38,
      roll: 0,
      ease: 'smooth'
    },
    { frame: 287, position: [2.8, 1.8, 3.8], target: [0.1, 1.25, 0], fov: 38, roll: 0 }
  ]
  return doc
}

/** Editable siege blocking: attackers fire at the gate; defenders react to damage. */
export function battleDirector() {
  const doc = emptyDirector()
  doc.duration = 12
  const castle = newDirectorObject('castle')
  castle.id = 'gate'
  castle.name = '城池 · 受击城门'
  castle.color = '#b4c0ca'
  castle.locked = true
  const cannon = newDirectorObject('cannon')
  cannon.id = 'cannon'
  cannon.name = '土匪攻城炮 · 7秒发射'
  cannon.color = '#526577'
  cannon.fireFrame = 168
  cannon.targetId = castle.id
  const key = (frame: number, position: Vec3, yaw = 0): ObjectKey => ({
    frame,
    position,
    yaw,
    action: 'idle',
    ease: 'smooth'
  })
  cannon.keys = [
    key(0, [0, 0, 9.4], 180),
    key(168, [0, 0, 9.4], 180),
    key(173, [0, 0, 9.75], 180),
    key(192, [0, 0, 9.4], 180)
  ]
  const clip = (
    action: ActionClip['action'],
    start: number,
    end: number,
    strength = 0.8
  ): ActionClip => ({ id: crypto.randomUUID(), action, start, end, speed: 1, strength, blend: 6 })
  const gunner = newDirectorObject('actor')
  gunner.id = 'gunner'
  gunner.name = '土匪 · 炮手'
  gunner.color = '#b49878'
  gunner.grounded = true
  gunner.keys = [
    key(0, [1.25, 0, 9.15], -90),
    { ...key(120, [1.25, 0, 9.15], -90), pose: { torso: [12, 0, 0] } },
    key(166, [1.25, 0, 9.15], -90),
    key(180, [1.7, 0, 9.5], -90),
    key(216, [1.7, 0, 9.5], 180),
    key(280, [2.1, 0, 6.5], 180),
    key(287, [2.1, 0, 6.5], 180)
  ]
  gunner.clips = [
    clip('reach', 48, 166, 0.8),
    clip('crouch', 168, 198, 0.4),
    clip('run', 216, 280, 0.65)
  ]
  const leader = newDirectorObject('actor')
  leader.id = 'leader'
  leader.name = '土匪 · 指挥推进'
  leader.color = '#927a63'
  leader.grounded = true
  leader.keys = [
    key(0, [-1.7, 0, 9.1], 180),
    key(168, [-1.7, 0, 9.1], 180),
    key(192, [-2, 0, 9.3], 180),
    key(216, [-2, 0, 9.3], 180),
    key(280, [-2.2, 0, 6.3], 180),
    key(287, [-2.2, 0, 6.3], 180)
  ]
  leader.clips = [
    clip('point', 24, 144, 0.7),
    clip('crouch', 168, 198, 0.35),
    clip('run', 216, 280, 0.65)
  ]
  const defender = (id: string, name: string, x: number, color: string) => {
    const actor = newDirectorObject('actor')
    actor.id = id
    actor.name = name
    actor.color = color
    actor.keys = [key(0, [x, 3.85, 0]), key(168, [x, 3.85, 0]), key(287, [x, 3.85, 0])]
    actor.clips = [clip('point', 24, 144, 0.55), clip('crouch', 177, 234, 0.95)]
    return actor
  }
  doc.objects = [
    castle,
    cannon,
    gunner,
    leader,
    defender('guard-left', '官军 · 左城墙守卫', -3.1, '#789dc1'),
    defender('guard-right', '官军 · 右城墙守卫', 3.1, '#4f759d')
  ]
  doc.camera.keys = [
    { frame: 0, position: [12, 7, 16], target: [0, 2.9, 4.1], fov: 48, roll: 0, ease: 'smooth' },
    { frame: 144, position: [10, 6, 14.3], target: [0, 3, 3.6], fov: 48, roll: 0, ease: 'smooth' },
    { frame: 216, position: [10, 6, 14.3], target: [0, 3, 3.6], fov: 48, roll: 0, ease: 'smooth' },
    { frame: 287, position: [10.5, 6.5, 14.8], target: [0, 2.7, 3.2], fov: 48, roll: 0 }
  ]
  doc.markers = [
    { frame: 0, label: '土匪架炮 · 官军守城' },
    { frame: 72, label: '炮手准备' },
    { frame: 168, label: '向城门开炮' },
    { frame: 180, label: '命中城门 · 碎砖崩落' },
    { frame: 198, label: '官军伏身避险' },
    { frame: 216, label: '破口留下 · 土匪推进' }
  ]
  return validateDirector(doc)
}

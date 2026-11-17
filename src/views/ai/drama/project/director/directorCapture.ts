// AI 短剧 3D 导演：视频动作复刻。在浏览器本地识别视频中的人体姿态，换算为白模关节，再修正手臂，生成导演工程
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import {
  cloneDirector,
  directorJoints,
  emptyDirector,
  newDirectorObject,
  objectAt,
  upsertKey,
  validateDirector,
  type DirectorDocument,
  type DirectorJoint,
  type DirectorPose,
  type ObjectKey,
  type Vec3
} from './director'
import { applyDirectorFrame, createDirectorWorld, disposeDirectorWorld } from './directorScene'

// 姿态识别的 WASM 运行时：版本需与 package.json 固定的 @mediapipe/tasks-vision 一致，升级 SDK 时同步修改
const POSE_WASM_ROOT = 'https://registry.npmmirror.com/@mediapipe/tasks-vision/1.0.1/files/wasm'
// 姿态模型：Google 的 pose_landmarker_full，经 jsDelivr 读取 npm 包中的同一文件
const POSE_MODEL_URL =
  'https://cdn.jsdelivr.net/npm/vision-camera-pose-landmarks-plugin@0.1.0/assets/pose_landmarker_full.task'

/**
 * 识别视频中的人体姿态，生成导演工程
 *
 * 执行时才加载 SDK，并从公共 CDN 下载上面固定版本的 WASM 运行时、姿态模型；视频在浏览器本地解码、识别，不上传
 */
export async function captureVideo(
  source: string,
  start: number,
  end: number,
  progress: (value: number) => void,
  signal: AbortSignal
) {
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  // 站点内已有的视频可能在文件存储的域名下：按跨域读取，存储需允许跨域，否则浏览器不能逐帧识别
  if (!source.startsWith('blob:')) video.crossOrigin = 'anonymous'
  video.src = source
  const event = (name: string) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('视频读取超时，请确认视频编码可播放')), 15000)
      const success = () => finish(),
        failure = () => finish(new Error('浏览器不能解码此视频，请转换为 H.264 MP4')),
        cancel = () => finish(new Error('动作解析已取消'))
      function finish(error?: Error) {
        clearTimeout(timer)
        video.removeEventListener(name, success)
        video.removeEventListener('error', failure)
        signal.removeEventListener('abort', cancel)
        error ? reject(error) : resolve()
      }
      video.addEventListener(name, success, { once: true })
      video.addEventListener('error', failure, { once: true })
      signal.addEventListener('abort', cancel, { once: true })
      if (signal.aborted) cancel()
    })
  let detector: import('@mediapipe/tasks-vision').PoseLandmarker | undefined
  try {
    if (video.readyState < 1) await event('loadedmetadata')
    const finish = Math.min(end, video.duration),
      duration = finish - start
    if (!Number.isFinite(duration) || duration < 2 || duration > 60 || start < 0)
      throw new Error('请选择视频内 2–60 秒的连续区间')
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
    detector = await PoseLandmarker.createFromOptions(
      await FilesetResolver.forVisionTasks(POSE_WASM_ROOT),
      {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5
      }
    )
    const samples: PoseSample[] = [],
      count = Math.ceil(duration * 12)
    for (let index = 0; index < count; index++) {
      if (signal.aborted) throw new Error('动作解析已取消')
      const time = start + index / 12
      if (Math.abs(video.currentTime - time) > 0.001) {
        const seek = event('seeked')
        video.currentTime = time
        await seek
      }
      if (video.readyState < 2) await event('loadeddata')
      const result = detector.detect(video)
      const points = (
        list: { x: number; y: number; z: number; visibility?: number }[] | undefined
      ) =>
        list?.map((p) => [p.x, p.y, p.z, p.visibility ?? 0] as [number, number, number, number]) ||
        []
      samples.push({
        frame: index * 2,
        world: points(result.worldLandmarks[0]),
        image: points(result.landmarks[0])
      })
      progress((index + 1) / count)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
    const recording: PoseRecording = { version: 1, duration, samples }
    return {
      document: correctCaptureArms(captureDirector(recording)),
      samples: samples.length,
      detected: samples.filter((s) => s.world.length === 33).length
    }
  } finally {
    detector?.close()
    video.removeAttribute('src')
    video.load()
  }
}

// ========== 姿态 → 白模关节 ==========

type PoseLandmark = [number, number, number, number]
interface PoseSample {
  frame: number
  world: PoseLandmark[]
  image: PoseLandmark[]
}
interface PoseRecording {
  version: 1
  duration: number
  samples: PoseSample[]
}
const down = new Vector3(0, -1, 0),
  up = new Vector3(0, 1, 0)
const degrees = (q: Quaternion): Vec3 => {
  const e = new Euler().setFromQuaternion(q, 'XYZ')
  return [e.x, e.y, e.z].map((n) => Number(MathUtils.radToDeg(n).toFixed(3))) as Vec3
}
const basis = (x: Vector3, y: Vector3) => {
  x.normalize()
  const z = x.clone().cross(y).normalize()
  y = z.clone().cross(x).normalize()
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))
}
const fullBody = (image: PoseLandmark[]) =>
  [23, 24, 25, 26, 27, 28].every((i) => image[i]![1] < 1.04 && image[i]![1] > 0) &&
  [23, 24].every((i) => image[i]![3] > 0.4) &&
  [27, 28].some((i) => image[i]![3] > 0.4)

/** Retarget fixed-length FK chains. Input image X stays screen X, avoiding a mirrored imitation.
 * Pose depth is an estimate; the reference plane has more weight than monocular depth. */
function retargetPose(sample: PoseSample): DirectorPose {
  const w = sample.world,
    image = sample.image
  if (w.length !== 33 || image.length !== 33) return {}
  const point = (i: number) => new Vector3(w[i]![0], -w[i]![1], -w[i]![2] * 0.65)
  const middle = (a: number, b: number) => point(a).add(point(b)).multiplyScalar(0.5)
  const hips = middle(23, 24),
    shoulders = middle(11, 12),
    upright = shoulders.clone().sub(hips)
  const full = fullBody(image)
  const pelvis = full ? basis(point(23).sub(point(24)), up.clone()) : new Quaternion()
  const chest = basis(point(11).sub(point(12)), upright.length() > 0.1 ? upright : up.clone())
  const result: DirectorPose = {
    pelvis: degrees(pelvis),
    torso: degrees(pelvis.clone().invert().multiply(chest))
  }
  const chain = (joint: DirectorJoint, a: number, b: number, parent: Quaternion, axis = down) => {
    const direction = point(b).sub(point(a)).normalize().applyQuaternion(parent.clone().invert())
    const local = new Quaternion().setFromUnitVectors(axis, direction)
    result[joint] = degrees(local)
    return parent.clone().multiply(local)
  }
  // Current white-model labels use screen-left/-X and screen-right/+X in a frontal shot.
  for (const [side, shoulder, elbow, wrist, hip, knee, ankle, heel, toe] of [
    ['left', 12, 14, 16, 24, 26, 28, 30, 32],
    ['right', 11, 13, 15, 23, 25, 27, 29, 31]
  ] as const) {
    result[`${side}Shoulder`] = [0, 0, 0]
    if (image[elbow]![3] > 0.45 && image[wrist]![3] > 0.4) {
      const arm = chain(`${side}Arm`, shoulder, elbow, chest)
      const forearm = chain(`${side}Elbow`, elbow, wrist, arm)
      const finger = wrist === 16 ? 20 : 19
      if (image[finger]![3] > 0.45) chain(`${side}Hand`, wrist, finger, forearm)
    }
    if (full) {
      const thigh = chain(`${side}Leg`, hip, knee, pelvis),
        shin = chain(`${side}Knee`, knee, ankle, thigh)
      const footDirection = point(toe)
        .sub(point(heel))
        .normalize()
        .applyQuaternion(shin.clone().invert())
      result[`${side}Foot`] = degrees(
        new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), footDirection)
      )
    }
  }
  const neck = middle(7, 8).sub(shoulders).normalize().applyQuaternion(chest.clone().invert())
  const head = new Quaternion().setFromUnitVectors(up, neck)
  const face = point(0).sub(middle(7, 8)).normalize().applyQuaternion(chest.clone().invert())
  const tilt = new Euler().setFromQuaternion(head)
  result.head = [
    MathUtils.clamp(MathUtils.radToDeg(tilt.x), -35, 35),
    MathUtils.clamp(MathUtils.radToDeg(Math.atan2(face.x, face.z)), -55, 55),
    MathUtils.clamp(MathUtils.radToDeg(tilt.z), -30, 30)
  ]
  // Fill every joint so low-confidence legs and hidden arms cannot carry a stale pose across a cut.
  for (const joint of Object.keys(directorJoints) as DirectorJoint[]) result[joint] ||= [0, 0, 0]
  return result
}

function captureDirector(recording: PoseRecording, name = '视频动作复刻'): DirectorDocument {
  if (
    recording.version !== 1 ||
    !Number.isFinite(recording.duration) ||
    recording.duration < 2 ||
    recording.duration > 60 ||
    !Array.isArray(recording.samples) ||
    !recording.samples.length ||
    recording.samples.length > 1440
  )
    throw new Error('动作数据必须为 2–60 秒、最多 1440 帧')
  const doc = emptyDirector()
  doc.duration = Math.ceil(recording.duration)
  const actor = newDirectorObject('actor')
  actor.name = name.slice(0, 100)
  actor.grounded = true
  actor.quaternionPose = true
  let previous: DirectorPose = {},
    lastFrame = -1,
    origin = 0.5,
    wasFull = false
  const keys: ObjectKey[] = []
  for (const sample of recording.samples) {
    if (
      !Number.isInteger(sample.frame) ||
      sample.frame <= lastFrame ||
      sample.frame < 0 ||
      sample.frame >= doc.duration * 24 ||
      ![sample.world, sample.image].every(
        (points) =>
          Array.isArray(points) &&
          (points.length === 0 || points.length === 33) &&
          points.every((p) => Array.isArray(p) && p.length === 4 && p.every(Number.isFinite))
      )
    )
      throw new Error('动作采样格式或时间顺序无效')
    lastFrame = sample.frame
    if (!sample.world.length || !sample.image.length) continue
    const full = fullBody(sample.image),
      hipX = (sample.image[23]![0] + sample.image[24]![0]) / 2
    if (full && !wasFull) origin = hipX
    wasFull = full
    const pose = retargetPose(sample)
    // Two-frame samples retain sharp beats. Small quaternion smoothing damps detector noise.
    for (const joint of Object.keys(directorJoints) as DirectorJoint[])
      if (previous[joint]) {
        const q = (v: Vec3) =>
          new Quaternion().setFromEuler(new Euler(...(v.map(MathUtils.degToRad) as Vec3)))
        pose[joint] = degrees(q(previous[joint]!).slerp(q(pose[joint]!), 0.8))
      }
    previous = pose
    const shoulderWidth = Math.max(0.08, Math.abs(sample.image[11]![0] - sample.image[12]![0]))
    keys.push({
      frame: sample.frame,
      position: [full ? Number((((hipX - origin) / shoulderWidth) * 0.45).toFixed(4)) : 0, 0, 0],
      yaw: 0,
      action: 'idle',
      ease: 'linear',
      pose
    })
  }
  if (keys.length < 12) throw new Error('未找到足够的人物动作，请使用清晰的单人视频')
  if (keys[0]!.frame !== 0) keys.unshift({ ...structuredClone(keys[0]!), frame: 0 })
  keys.push({ ...structuredClone(keys[keys.length - 1]!), frame: doc.duration * 24 - 1 })
  actor.keys = keys.filter((k, i) => !i || k.frame !== keys[i - 1]!.frame)
  doc.objects = [actor]
  doc.camera.keys = [{ frame: 0, position: [0, 1.1, 6], target: [0, 0.9, 0], fov: 40, roll: 0 }]
  return validateDirector(doc)
}

// ========== 修正手臂 ==========

/** Small authoring correction for the white-model's proportions, stored in editable shoulder keys.
 * This checks the head against arm segments only; it is not a physics/collision system. */
function correctCaptureArms(document: DirectorDocument): DirectorDocument {
  const doc = cloneDirector(document),
    world = createDirectorWorld(doc)
  const distance = (p: Vector3, a: Vector3, b: Vector3) => {
    const d = b.clone().sub(a)
    return p.distanceTo(
      a
        .clone()
        .addScaledVector(
          d,
          Math.max(0, Math.min(1, p.clone().sub(a).dot(d) / Math.max(1e-9, d.lengthSq())))
        )
    )
  }
  try {
    for (const actor of doc.objects.filter((o) => o.kind === 'actor')) {
      const puppet = world.puppets.get(actor.id)!
      for (const key of actor.keys) {
        if (!key.pose) continue
        for (const side of ['left', 'right'] as const) {
          const clearance = () => {
            applyDirectorFrame(world, doc, key.frame)
            world.scene.updateMatrixWorld(true)
            const head = puppet.joints.head.localToWorld(new Vector3(0, 0.12, 0)),
              shoulder = puppet.joints[`${side}Arm`].getWorldPosition(new Vector3()),
              elbow = puppet.joints[`${side}Elbow`].getWorldPosition(new Vector3()),
              hand = puppet.joints[`${side}Elbow`].localToWorld(new Vector3(0, -0.32, 0))
            return Math.min(
              distance(head, shoulder, elbow) - 0.205,
              distance(head, elbow, hand) - 0.195,
              head.distanceTo(hand) - 0.21
            )
          }
          const joint = `${side}Shoulder` as const,
            original = key.pose[joint] || [0, 0, 0]
          let best = clearance(),
            angle = original[2]
          if (best < 0.018) {
            for (let offset = 5; offset <= 90; offset += 5) {
              key.pose[joint] = [
                original[0],
                original[1],
                original[2] + offset * (side === 'left' ? -1 : 1)
              ]
              const score = clearance()
              if (score > best) {
                best = score
                angle = key.pose[joint]![2]
              }
              if (score >= 0.018) break
            }
            key.pose[joint] = [original[0], original[1], angle]
            if (best < 0.018) {
              let tilt = original[0]
              for (const delta of [-5, 5, -10, 10, -15, 15, -20, 20, -30, 30, -45, 45]) {
                key.pose[joint] = [original[0] + delta, original[1], angle]
                const score = clearance()
                if (score > best) {
                  best = score
                  tilt = original[0] + delta
                }
                if (score >= 0.018) break
              }
              key.pose[joint] = [tilt, original[1], angle]
            }
          }
        }
      }
      // Add an editable sample when an interpolated arm crosses the head between detections.
      for (let frame = 0; frame < doc.duration * 24; frame++) {
        if (actor.keys.some((k) => k.frame === frame)) continue
        applyDirectorFrame(world, doc, frame)
        world.scene.updateMatrixWorld(true)
        const head = puppet.joints.head.localToWorld(new Vector3(0, 0.12, 0))
        const crosses = ['left', 'right'].some((side) => {
          const elbow = puppet.joints[`${side}Elbow` as 'leftElbow' | 'rightElbow']
          return (
            head.distanceTo(elbow.getWorldPosition(new Vector3())) < 0.22 ||
            head.distanceTo(elbow.localToWorld(new Vector3(0, -0.32, 0))) < 0.225
          )
        })
        if (crosses) {
          const key = objectAt(actor, frame)
          actor.keys = upsertKey(actor.keys, key)
          for (const side of ['left', 'right'] as const) {
            const joint = `${side}Shoulder` as const,
              original = key.pose?.[joint] || [0, 0, 0]
            if (!key.pose) continue
            for (let offset = 5; offset <= 70; offset += 5) {
              key.pose[joint] = [
                original[0],
                original[1],
                original[2] + offset * (side === 'left' ? -1 : 1)
              ]
              actor.keys = upsertKey(actor.keys, key)
              applyDirectorFrame(world, doc, frame)
              world.scene.updateMatrixWorld(true)
              const h = puppet.joints.head.localToWorld(new Vector3(0, 0.12, 0)),
                elbow = puppet.joints[`${side}Elbow`]
              if (
                h.distanceTo(elbow.getWorldPosition(new Vector3())) > 0.225 &&
                h.distanceTo(elbow.localToWorld(new Vector3(0, -0.32, 0))) > 0.23
              )
                break
            }
          }
        }
      }
    }
  } finally {
    disposeDirectorWorld(world)
  }
  return doc
}

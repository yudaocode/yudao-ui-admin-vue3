// AI 短剧 3D 导演：three.js 场景，按帧摆放白模、道具和摄影机
import * as T from 'three'
import {
  actorMotion,
  cameraAt,
  objectAt,
  type DirectorDocument,
  type DirectorJoint
} from './director'
import { createDirectorProp, updateDirectorProp } from './directorProps'

interface Puppet {
  root: T.Group
  joints: Record<DirectorJoint, T.Group>
  feet: [T.Mesh, T.Mesh]
}
export const directorFloorHeight = -0.055
export interface DirectorWorld {
  scene: T.Scene
  objects: Map<string, T.Group>
  puppets: Map<string, Puppet>
  guides: T.Group
  cameraMarker: T.Group
  camera: T.PerspectiveCamera
}
function mesh(
  geometry: T.BufferGeometry,
  material: T.Material,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0
) {
  const m = new T.Mesh(geometry, material)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}
function puppet(color: string): Puppet {
  const root = new T.Group(),
    mat = new T.MeshStandardMaterial({ color, roughness: 0.75 }),
    joint = new T.MeshStandardMaterial({ color: '#71839a', roughness: 0.85 })
  const pivot = (parent: T.Group, position: [number, number, number]) => {
    const g = new T.Group()
    g.position.set(...position)
    parent.add(g)
    return g
  }
  const pelvis = pivot(root, [0, 0.91, 0]),
    torso = pivot(pelvis, [0, 0.09, 0]),
    head = pivot(torso, [0, 0.62, 0])
  mesh(new T.CapsuleGeometry(0.2, 0.32, 6, 12), mat, torso, 0, 0.27)
  mesh(new T.SphereGeometry(0.14, 16, 12), mat, head, 0, 0.12)
  // A small nose makes facing direction readable in blocking shots.
  mesh(new T.SphereGeometry(0.045, 8, 8), joint, head, 0, 0.1, 0.14)
  mesh(new T.SphereGeometry(0.15, 12, 8), mat, torso, 0, -0.03)
  const arm = (x: number) => {
    const shoulder = pivot(torso, [Math.sign(x) * 0.08, 0.4, 0])
    const a = pivot(shoulder, [Math.sign(x) * 0.2, 0.03, 0])
    mesh(new T.SphereGeometry(0.085, 10, 8), joint, a)
    mesh(new T.CapsuleGeometry(0.065, 0.21, 4, 8), mat, a, 0, -0.17)
    const elbow = pivot(a, [0, -0.34, 0])
    mesh(new T.SphereGeometry(0.065, 8, 8), joint, elbow)
    mesh(new T.CapsuleGeometry(0.052, 0.2, 4, 8), mat, elbow, 0, -0.15)
    const hand = pivot(elbow, [0, -0.32, 0])
    mesh(new T.SphereGeometry(0.06, 8, 8), mat, hand)
    mesh(new T.BoxGeometry(0.09, 0.09, 0.055), mat, hand, 0, -0.025, 0)
    return [a, elbow, shoulder, hand] as const
  }
  const leg = (x: number) => {
    // Legs pivot at the pelvis independently: a torso lean must not tip the entire body.
    const l = pivot(pelvis, [x, 0, 0])
    mesh(new T.SphereGeometry(0.08, 8, 8), joint, l)
    mesh(new T.CapsuleGeometry(0.09, 0.28, 4, 8), mat, l, 0, -0.21)
    const knee = pivot(l, [0, -0.42, 0])
    mesh(new T.SphereGeometry(0.075, 8, 8), joint, knee)
    mesh(new T.CapsuleGeometry(0.065, 0.26, 4, 8), mat, knee, 0, -0.19)
    const foot = pivot(knee, [0, -0.43, 0.05]),
      sole = mesh(new T.BoxGeometry(0.14, 0.09, 0.25), mat, foot)
    return [l, knee, foot, sole] as const
  }
  const [leftLeg, leftKnee, leftFoot, leftSole] = leg(-0.12),
    [rightLeg, rightKnee, rightFoot, rightSole] = leg(0.12)
  const [leftArm, leftElbow, leftShoulder, leftHand] = arm(-0.28),
    [rightArm, rightElbow, rightShoulder, rightHand] = arm(0.28)
  return {
    root,
    joints: {
      pelvis,
      torso,
      head,
      leftShoulder,
      rightShoulder,
      leftArm,
      leftElbow,
      rightArm,
      rightElbow,
      leftHand,
      rightHand,
      leftLeg,
      rightLeg,
      leftKnee,
      rightKnee,
      leftFoot,
      rightFoot
    },
    feet: [leftSole, rightSole]
  }
}
function path(
  parent: T.Group,
  keys: { frame: number; position: [number, number, number] }[],
  color: string,
  id: string
) {
  if (keys.length > 1) {
    const geometry = new T.BufferGeometry().setFromPoints(
      keys.map((k) => new T.Vector3(...k.position).add(new T.Vector3(0, 0.03, 0)))
    )
    parent.add(new T.Line(geometry, new T.LineBasicMaterial({ color })))
  }
  keys.forEach((k) => {
    const m = mesh(
      new T.SphereGeometry(0.075, 10, 8),
      new T.MeshBasicMaterial({ color }),
      parent,
      ...k.position
    )
    m.position.y += 0.04
    m.userData = { objectId: id, keyFrame: k.frame }
  })
}
export function createDirectorWorld(doc: DirectorDocument): DirectorWorld {
  const scene = new T.Scene()
  scene.background = new T.Color('#eef2f7')
  scene.add(new T.HemisphereLight('#ffffff', '#8896af', 2.5))
  const light = new T.DirectionalLight('#fffaf3', 3)
  light.position.set(4, 8, 6)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  Object.assign(light.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 })
  light.shadow.normalBias = 0.025
  scene.add(light)
  const floor = mesh(
    new T.PlaneGeometry(200, 200),
    new T.MeshStandardMaterial({ color: '#e7ecf3', roughness: 0.95 }),
    scene
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = directorFloorHeight
  floor.castShadow = false
  const guides = new T.Group()
  scene.add(guides)
  const grid = new T.GridHelper(30, 30, '#91a9c6', '#cdd7e4')
  grid.position.y = -0.04
  guides.add(grid)
  const objects = new Map<string, T.Group>(),
    puppets = new Map<string, Puppet>()
  doc.objects.forEach((o) => {
    const p = o.kind === 'actor' ? puppet(o.color) : undefined,
      root = p?.root || createDirectorProp(o)
    root.userData.objectId = o.id
    scene.add(root)
    objects.set(o.id, root)
    if (p) {
      puppets.set(o.id, p)
      for (const [joint, g] of Object.entries(p.joints)) g.userData = { objectId: o.id, joint }
    }
    if (o.visible) path(guides, o.keys, '#3a84de', o.id)
  })
  const camera = new T.PerspectiveCamera(45, doc.aspect === '16:9' ? 16 / 9 : 9 / 16, 0.05, 250)
  const cameraMarker = new T.Group()
  cameraMarker.userData.objectId = 'camera'
  guides.add(cameraMarker)
  const markerMat = new T.MeshStandardMaterial({ color: '#e09b32' })
  mesh(new T.BoxGeometry(0.35, 0.22, 0.28), markerMat, cameraMarker)
  const lens = mesh(new T.ConeGeometry(0.17, 0.27, 4), markerMat, cameraMarker, 0, 0, -0.22)
  lens.rotation.x = Math.PI / 2
  path(guides, doc.camera.keys, '#d79b3b', 'camera')
  const world = { scene, objects, puppets, guides, cameraMarker, camera }
  applyDirectorFrame(world, doc, 0)
  return world
}
export function applyDirectorFrame(world: DirectorWorld, doc: DirectorDocument, frame: number) {
  doc.objects.forEach((o) => {
    const root = world.objects.get(o.id)
    if (!root) return
    const key = objectAt(o, frame)
    root.position.set(...key.position)
    root.rotation.set(0, T.MathUtils.degToRad(key.yaw), 0)
    root.scale.set(...o.scale)
    root.visible = o.visible
    const target = doc.objects.find((t) => t.id === o.targetId && t.visible)
    let targetWorld: T.Vector3 | undefined
    if (target) {
      const anchor = objectAt(target, frame)
      targetWorld = new T.Vector3(0, 3.3, 0.65)
        .multiply(new T.Vector3(...target.scale))
        .applyAxisAngle(new T.Vector3(0, 1, 0), T.MathUtils.degToRad(anchor.yaw))
        .add(new T.Vector3(...anchor.position))
    }
    const hits = doc.objects
      .filter((c) => c.visible && c.targetId === o.id && c.fireFrame !== undefined)
      .map((c) => c.fireFrame! + 12)
    updateDirectorProp(root, o, frame, targetWorld, hits.length ? Math.min(...hits) : undefined)
    const p = world.puppets.get(o.id)
    if (p) {
      const pose = actorMotion(o, frame, doc)
      p.joints.pelvis.position.y = 0.91 + (pose.height || 0)
      for (const [joint, g] of Object.entries(p.joints)) {
        const rotation = pose[joint as DirectorJoint] || [0, 0, 0]
        g.rotation.set(...(rotation.map(T.MathUtils.degToRad) as [number, number, number]))
      }
      if (o.grounded) {
        root.updateMatrixWorld(true)
        const lowest = Math.min(...p.feet.map((foot) => new T.Box3().setFromObject(foot).min.y))
        root.position.y += key.position[1] + directorFloorHeight + 0.003 - lowest
      }
    }
  })
  const k = cameraAt(doc, frame)
  world.camera.position.set(...k.position)
  world.camera.up.set(0, 1, 0)
  world.camera.lookAt(...k.target)
  world.camera.rotateZ(T.MathUtils.degToRad(k.roll))
  world.camera.fov = k.fov
  world.camera.updateProjectionMatrix()
  world.cameraMarker.position.copy(world.camera.position)
  world.cameraMarker.quaternion.copy(world.camera.quaternion)
}
export function disposeDirectorWorld(world: DirectorWorld) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>()
  world.scene.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Line) {
      geometries.add(o.geometry)
      ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m))
    }
  })
  geometries.forEach((g) => g.dispose())
  materials.forEach((m) => m.dispose())
  world.scene.clear()
}
export function directorRenderer() {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFSoftShadowMap
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  return renderer
}
// DONE @AI：是不是 ts 融合掉？director ts？（模型、动作、示例合并为 director.ts；三维场景独立，捕捉合并为 directorCapture）

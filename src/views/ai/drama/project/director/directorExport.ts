// AI 短剧 3D 导演：逐帧渲染，导出 MP4 视频、单帧图片
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output } from 'mediabunny'
import { cloneDirector, totalFrames, type DirectorDocument } from './director'
import {
  createDirectorWorld,
  applyDirectorFrame,
  directorRenderer,
  disposeDirectorWorld
} from './directorScene'

/** Encode each designed frame explicitly, independent of monitor refresh rate or tab throttling. */
export async function exportDirectorVideo(
  document: DirectorDocument,
  progress: (value: number) => void,
  signal: AbortSignal
): Promise<Blob> {
  const doc = cloneDirector(document),
    world = createDirectorWorld(doc),
    renderer = directorRenderer()
  world.guides.visible = false
  renderer.setSize(doc.aspect === '16:9' ? 1280 : 720, doc.aspect === '16:9' ? 720 : 1280)
  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() })
  const source = new CanvasSource(renderer.domElement, { codec: 'avc', bitrate: 5_000_000 })
  output.addVideoTrack(source, { frameRate: doc.fps })
  try {
    await output.start()
    for (let frame = 0; frame < totalFrames(doc); frame++) {
      if (signal.aborted) throw new Error('导出已取消')
      applyDirectorFrame(world, doc, frame)
      renderer.render(world.scene, world.camera)
      await source.add(frame / doc.fps, 1 / doc.fps)
      progress((frame + 1) / totalFrames(doc))
      if (frame % 8 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
    await output.finalize()
    if (!output.target.buffer) throw new Error('视频编码未返回数据')
    return new Blob([output.target.buffer], { type: 'video/mp4' })
  } catch (e) {
    await output.cancel()
    throw e
  } finally {
    source.close()
    disposeDirectorWorld(world)
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
export async function exportDirectorFrame(doc: DirectorDocument, frame: number): Promise<Blob> {
  const world = createDirectorWorld(doc),
    renderer = directorRenderer()
  world.guides.visible = false
  try {
    renderer.setSize(doc.aspect === '16:9' ? 1280 : 720, doc.aspect === '16:9' ? 720 : 1280)
    applyDirectorFrame(world, doc, frame)
    renderer.render(world.scene, world.camera)
    return await new Promise<Blob>((resolve, reject) =>
      renderer.domElement.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('导出画面失败'))),
        'image/png'
      )
    )
  } finally {
    disposeDirectorWorld(world)
    renderer.dispose()
    renderer.forceContextLoss()
  }
}

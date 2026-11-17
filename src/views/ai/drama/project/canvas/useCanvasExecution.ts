import { ref, type Ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { generateUUID } from '@/utils'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { isAiDramaRunning } from '@/views/ai/utils/constants'
import {
  DramaCanvasData,
  DramaCanvasDocument,
  DramaCanvasNode,
  getDramaCanvasInputs
} from './canvas'

/**
 * 画布节点的执行：保存到项目（剧本、角色形象、场景、道具、分镜），以及生成（打磨剧本、出图、样音、镜头视频）
 *
 * 业务编号写入节点后立即保存画布，避免失败重试时重复创建
 */
export const useCanvasExecution = (options: {
  projectId: number
  detail: Ref<DramaProjectDetailVO>
  doc: Ref<DramaCanvasDocument>
  patch: (id: string, data: Partial<DramaCanvasData>) => void
  persist: () => Promise<boolean>
  refresh: () => Promise<void>
}) => {
  const message = useMessage() // 消息弹窗
  const busy = ref(false)
  const { projectId, detail, doc, patch } = options

  /** 提示并中止执行：与接口报错一致，调用方不再重复提示 */
  const fail = (text: string): never => {
    message.warning(text)
    throw text
  }

  const getNode = (id: string) => {
    const node = doc.value.nodes.find((item) => item.id === id)
    if (!node) {
      return fail('节点已删除')
    }
    return node
  }

  /** 写入业务编号并保存画布 */
  const bindBusiness = async (id: string, business: DramaCanvasData['business']) => {
    patch(id, { business })
    if (!(await options.persist())) {
      return fail('业务编号未能保存到画布，请先处理画布保存问题')
    }
  }

  /** 输入节点中的文本：文本、剧本节点的正文 */
  const getInputText = (inputs: DramaCanvasNode[]) =>
    inputs
      .filter((item) => ['text', 'script'].includes(item.kind))
      .map((item) => item.data.content)
      .filter(Boolean)
      .join('\n\n')

  // ========== 保存到项目 ==========

  const syncScript = async (node: DramaCanvasNode, text: string) => {
    if (!(node.data.content || text).trim()) {
      return fail('请填写剧本正文，或连接文本节点')
    }
    // 已绑定剧本版本时更新该版本；未绑定（新建、复制的节点）时新增版本，不覆盖当前剧本
    const id = await DramaScriptApi.updateScript({
      id: node.data.business?.type === 'script' ? node.data.business.id : undefined,
      projectId,
      title: node.data.title,
      content: node.data.content || text
    })
    await options.refresh()
    await bindBusiness(node.id, { id, type: 'script' })
  }

  const syncCharacter = async (node: DramaCanvasNode, prompt: string, referenceUrl: string) => {
    // 1. 角色：新建时自带第一个形象
    let character = detail.value.characters.find((item) => item.id === node.data.business?.id)
    if (character) {
      await DramaAssetApi.updateCharacter({ ...character, name: node.data.title })
    } else {
      const characterId = await DramaAssetApi.createCharacter({ projectId, name: node.data.title })
      await options.refresh()
      character = detail.value.characters.find((item) => item.id === characterId)!
      await bindBusiness(node.id, {
        id: characterId,
        type: 'character',
        appearanceId: character.appearances[0]?.id
      })
    }
    // 2. 形象：描述、参考图
    let appearanceId = getNode(node.id).data.business?.appearanceId
    const appearance = character.appearances.find((item) => item.id === appearanceId)
    if (appearance) {
      await DramaAssetApi.updateAppearance({
        ...appearance,
        description: prompt,
        referenceImageUrl: referenceUrl || appearance.referenceImageUrl
      })
    } else {
      appearanceId = await DramaAssetApi.createAppearance({
        characterId: character.id,
        description: prompt,
        referenceImageUrl: referenceUrl || undefined,
        changeReason: '画布形象'
      })
      await bindBusiness(node.id, { id: character.id, type: 'character', appearanceId })
    }
  }

  const syncLocation = async (node: DramaCanvasNode, prompt: string, referenceUrl: string) => {
    const location = detail.value.locations.find((item) => item.id === node.data.business?.id)
    if (location) {
      await DramaAssetApi.updateLocation({
        ...location,
        name: node.data.title,
        description: prompt,
        referenceImageUrl: referenceUrl || location.referenceImageUrl
      })
      return
    }
    const id = await DramaAssetApi.createLocation({
      projectId,
      name: node.data.title,
      description: prompt,
      referenceImageUrl: referenceUrl || undefined
    })
    await bindBusiness(node.id, { id, type: 'location' })
  }

  const syncProp = async (node: DramaCanvasNode, prompt: string, referenceUrl: string) => {
    const asset = detail.value.visualAssets.find((item) => item.id === node.data.business?.id)
    if (asset) {
      await DramaAssetApi.updateVisualAsset({
        id: asset.id,
        projectId,
        title: node.data.title,
        prompt,
        referenceImageUrl: referenceUrl || asset.referenceImages?.referenceImageUrl,
        shotNumbers: asset.referenceImages?.shotNumbers
      })
      return
    }
    const id = await DramaAssetApi.createVisualAsset({
      projectId,
      title: node.data.title,
      prompt,
      referenceImageUrl: referenceUrl || undefined
    })
    await bindBusiness(node.id, { id, type: 'prop' })
  }

  /** 声音：写入角色的声音描述、样音文本 */
  const syncAudio = async (node: DramaCanvasNode, inputs: DramaCanvasNode[]) => {
    const actor =
      inputs.find((item) => item.kind === 'image' && item.data.purpose === 'character') ||
      doc.value.nodes.find((item) => item.id === node.data.actorNodeId)
    if (!actor || actor.kind !== 'image' || actor.data.purpose !== 'character') {
      return fail('请把声音节点连接到一个角色图片节点')
    }
    await syncNode(actor.id)
    await options.refresh()
    const characterId = getNode(actor.id).data.business!.id
    const character = detail.value.characters.find((item) => item.id === characterId)!
    await DramaAssetApi.updateCharacter({
      ...character,
      voiceDescription: node.data.prompt || character.voiceDescription,
      sampleText: node.data.content || character.sampleText
    })
    patch(node.id, { actorNodeId: actor.id })
    await bindBusiness(node.id, { id: characterId, type: 'character' })
  }

  /**
   * 视频：保存为分镜。画布控制的字段为出场角色、场景、道具、发言角色、起始帧，其它规划字段保留
   */
  const syncVideo = async (node: DramaCanvasNode, inputs: DramaCanvasNode[], text: string) => {
    // 1. 分镜：不存在时先创建并记下编号，后续校验失败也不会重复创建
    await options.refresh()
    let storyboard = detail.value.storyboards.find((item) => item.id === node.data.business?.id)
    // 已绑定、但不在当前剧本版本中的镜头：按真实镜头核对，历史版本只能查看，已删除时确认后才新建，不静默另建
    if (!storyboard && node.data.business?.id) {
      const bound = await DramaStoryboardApi.getStoryboard(node.data.business.id)
      if (bound) {
        return fail(
          bound.projectId === projectId && bound.scriptId !== detail.value.script?.id
            ? '节点绑定的镜头属于历史剧本版本，只能在剧本版本中查看，不能保存或生成；如需在当前版本使用，请复制节点后再执行'
            : '节点绑定的镜头不属于本项目的当前剧本版本，不能保存或生成'
        )
      }
      try {
        await message.confirm('节点绑定的镜头已删除，是否在当前剧本版本新建一个镜头？')
      } catch {
        return fail('已取消：节点绑定的镜头已删除')
      }
    }
    if (storyboard && isAiDramaRunning(storyboard.videoStatus)) {
      return fail('镜头视频生成中，请等待完成或在提交记录中处理')
    }
    if (!storyboard) {
      // 镜头挂在当前剧本版本下：输入的剧本节点是历史版本时不创建
      const scriptId = inputs.find((item) => item.kind === 'script')?.data.business?.id
      if (scriptId && scriptId !== detail.value.script?.id) {
        return fail('输入的剧本节点不是当前剧本版本，请连接当前剧本后再保存镜头')
      }
      const id = await DramaStoryboardApi.createStoryboard({
        projectId,
        scriptId,
        title: node.data.title
      })
      await bindBusiness(node.id, { id, type: 'storyboard' })
      await options.refresh()
      storyboard = detail.value.storyboards.find((item) => item.id === id)!
    }

    // 2. 引用：图片节点需已保存到项目
    const images = inputs.filter((item) => item.kind === 'image')
    const locations = images.filter((item) => item.data.purpose === 'location')
    if (locations.length > 1) {
      return fail('一个镜头只能引用一个场景')
    }
    const characters = images
      .filter((item) => item.data.purpose === 'character')
      .map((item) => ({
        ...storyboard!.characters?.find(
          (ref) => ref.appearanceId === item.data.business?.appearanceId
        ),
        appearanceId: item.data.business!.appearanceId
      }))
    const speakers = inputs.filter((item) => item.kind === 'audio')
    for (const speaker of speakers) {
      await syncNode(speaker.id)
    }
    const frame = images.find((item) => item.data.purpose === 'frame' && item.data.url)
    const continuity = { ...storyboard.continuity }
    if (speakers.length || continuity.voiceSpeakerIds?.length) {
      continuity.voiceSpeakerIds = speakers.map((item) => getNode(item.id).data.business!.id)
    }
    // 起始帧：连入时设为手动起始帧；断开后清除画布设置的那张，不影响在镜头表单上传、承接上一镜的
    if (frame) {
      continuity.manualStartFrame = { url: frame.data.url }
      patch(node.id, { startFrameUrl: frame.data.url })
    } else if (node.data.startFrameUrl) {
      if (continuity.manualStartFrame?.url === node.data.startFrameUrl) {
        delete continuity.manualStartFrame
      }
      patch(node.id, { startFrameUrl: undefined })
    }

    // 3. 保存
    const data: DramaStoryboardVO = {
      ...storyboard,
      title: node.data.title,
      sceneText: node.data.content || storyboard.sceneText,
      videoPrompt: node.data.prompt || storyboard.videoPrompt,
      sourceText: text || storyboard.sourceText,
      characters,
      locationId: locations[0]?.data.business?.id,
      visualAssetIds: images
        .filter((item) => item.data.purpose === 'prop')
        .map((item) => item.data.business!.id),
      continuity,
      videoModelId: node.data.modelId || storyboard.videoModelId,
      videoResolution: node.data.resolution || storyboard.videoResolution
    }
    await DramaStoryboardApi.updateStoryboard(data)
  }

  /** 保存节点到项目：先保存输入的剧本、图片节点 */
  const syncNode = async (id: string): Promise<void> => {
    const node = getNode(id)
    if (['text', 'group', 'previs'].includes(node.kind)) {
      return
    }
    if (!node.data.title.trim()) {
      return fail('请填写节点名称')
    }
    const inputs = getDramaCanvasInputs(doc.value, id)
    for (const input of inputs.filter((item) => ['script', 'image'].includes(item.kind))) {
      await syncNode(input.id)
    }
    const text = getInputText(inputs)
    if (node.kind === 'script') {
      await syncScript(node, text)
    } else if (node.kind === 'image') {
      if (node.data.purpose === 'frame') {
        return
      }
      const prompt = node.data.prompt || text
      if (!prompt.trim()) {
        return fail('请填写图片描述，或连接文本节点')
      }
      // 参考图：优先使用连入的上游图片，其次本节点的图片
      const referenceUrl =
        inputs.find((item) => item.kind === 'image' && item.data.url)?.data.url || node.data.url
      await options.refresh()
      if (node.data.purpose === 'character') {
        await syncCharacter(node, prompt, referenceUrl)
      } else if (node.data.purpose === 'location') {
        await syncLocation(node, prompt, referenceUrl)
      } else {
        await syncProp(node, prompt, referenceUrl)
      }
    } else if (node.kind === 'audio') {
      await syncAudio(node, inputs)
    } else if (node.kind === 'video') {
      await syncVideo(node, inputs, text)
    }
  }

  // ========== 生成 ==========

  /**
   * 打磨剧本、拆分分镜都按项目的当前剧本执行：绑定历史剧本版本的节点不能执行，避免操作到其它版本、替换当前分镜。
   * 在保存前校验，不修改该历史版本
   */
  const validateCurrentScriptNode = async (node: DramaCanvasNode) => {
    if (node.kind !== 'script' || node.data.business?.type !== 'script') {
      return
    }
    await options.refresh()
    if (node.data.business.id !== detail.value.script?.id) {
      return fail(
        '节点绑定的是历史剧本版本，不能打磨或拆分分镜；如需在此基础上继续，请复制节点后再执行（副本保存为新的剧本版本）'
      )
    }
  }

  const generateNode = async (id: string) => {
    await validateCurrentScriptNode(getNode(id))
    await syncNode(id)
    await options.refresh()
    const node = getNode(id)
    const business = node.data.business
    if (node.kind === 'script') {
      const script = await DramaScriptApi.polishScript(
        projectId,
        node.data.prompt || '依据已保存的剧本和输入资料，完善为可拍摄的短剧剧本，保留原有剧情与对白'
      )
      // 打磨新增剧本版本：节点改为绑定新版本
      patch(id, { content: script.content || node.data.content })
      await bindBusiness(id, { id: script.id, type: 'script' })
      return
    }
    if (node.kind === 'image') {
      if (node.data.purpose === 'frame') {
        return fail('起始帧请上传图片后连接到视频节点')
      }
      if (!node.data.modelId) {
        return fail('请选择绘画模型')
      }
      if (node.data.purpose === 'character') {
        await DramaAssetApi.generateAppearanceImage(business!.appearanceId!, node.data.modelId)
      } else if (node.data.purpose === 'location') {
        await DramaAssetApi.generateLocationImage(business!.id, node.data.modelId)
      } else {
        await DramaAssetApi.generateVisualAssetImage(business!.id, node.data.modelId)
      }
      return
    }
    if (node.kind === 'audio') {
      if (!node.data.modelId || !node.data.voice?.trim() || !node.data.content.trim()) {
        return fail('请选择语音模型，填写音色标识与样音文本')
      }
      // 合成样音并选用为角色的样音
      const audioId = await DramaAssetApi.generateAudio({
        projectId,
        characterId: business!.id,
        modelId: node.data.modelId,
        voice: node.data.voice.trim(),
        text: node.data.content.trim()
      })
      await DramaAssetApi.selectAudio(audioId)
      return
    }
    if (node.kind === 'video') {
      if (!node.data.modelId) {
        return fail('请选择视频模型')
      }
      await DramaStoryboardApi.generateStoryboardVideo(
        business!.id,
        node.data.modelId,
        node.data.resolution,
        generateUUID()
      )
    }
  }

  /** 剧本节点：保存后分析角色场景、拆分分镜；拆分会替换当前剧本的分镜 */
  const planNode = async (id: string) => {
    await validateCurrentScriptNode(getNode(id))
    await syncNode(id)
    await DramaScriptApi.analyzeAssetList(projectId)
    await DramaScriptApi.generateStoryboardList(projectId)
  }

  /** 选用候选图：角色形象、场景 */
  const selectImage = async (id: string, index: number) => {
    const node = getNode(id)
    const business = node.data.business!
    if (node.data.purpose === 'character') {
      const character = detail.value.characters.find((item) => item.id === business.id)
      const appearance = character?.appearances.find((item) => item.id === business.appearanceId)
      await DramaAssetApi.updateAppearance({ ...appearance, selectedIndex: index })
      patch(id, { url: appearance?.imageUrls?.[index] })
    } else {
      const location = detail.value.locations.find((item) => item.id === business.id)
      await DramaAssetApi.updateLocation({ ...location, selectedIndex: index })
      patch(id, { url: location?.imageUrls?.[index] })
    }
  }

  /** 执行：同一时间只执行一个；结束后刷新项目详情 */
  const run = async (action: () => Promise<void>) => {
    if (busy.value) {
      return false
    }
    busy.value = true
    try {
      await action()
      return true
    } finally {
      busy.value = false
      await options.refresh()
    }
  }

  return {
    busy,
    sync: (id: string) => run(() => syncNode(id)),
    generate: (id: string) => run(() => generateNode(id)),
    plan: (id: string) => run(() => planNode(id)),
    selectImage: (id: string, index: number) => run(() => selectImage(id, index))
  }
}

/**
 * AI 视频：模型表单能力、类型匹配、参数格式化用的工具方法
 */
import { AiPlatformEnum, AiVideoModeEnum, AiVideoTypeEnum } from '@/views/ai/utils/constants'
import type { VideoVO } from '@/api/ai/video'

/**
 * AI 视频模型的表单能力：决定可选的生成方式、参数；只用于表单展示，最终以服务端（客户端）校验为准
 */
export interface VideoModelCapability {
  modes: string[] // 支持的生成方式，参见 AiVideoModeEnum
  resolutions: string[] // 可选分辨率，第一个为默认；为空表示不传
  ratios: string[] // 可选比例，第一个为默认；为空表示不传
  durations: number[] // 可选时长（秒），第一个为默认；为空表示不传
  sizes: string[] // 可选尺寸（宽*高），第一个为默认；万相 2.6 及更早的文生视频用它代替分辨率、比例
  fields: string[] // 额外参数：size、generateAudio、cameraFixed、watermark、negativePrompt、promptExtend、promptExpansionMode、quality、shotType、seed
  maxReferenceImages: number // 参考图最多张数
  referenceVideo: boolean // 是否支持参考视频
  referenceAudio: boolean // 是否支持参考音频
  promptRequired: boolean // 提示词是否必填
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index)

const RATIOS_COMMON = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9']

/** 万相 2.6 及更早文生视频的尺寸：与后端 TongYiWanVideoApi.LEGACY_T2V_SIZES 一致 */
const WAN_SIZES_480P = ['832*480', '480*832', '624*624']
const WAN_SIZES_720P = ['1280*720', '720*1280', '960*960', '1088*832', '832*1088']
const WAN_SIZES_1080P = ['1920*1080', '1080*1920', '1440*1440', '1632*1248', '1248*1632']
const WAN_LEGACY_T2V_SIZES: Record<string, string[]> = {
  'wan2.6-t2v': [...WAN_SIZES_720P, ...WAN_SIZES_1080P],
  'wan2.5-t2v-preview': [...WAN_SIZES_480P, ...WAN_SIZES_720P, ...WAN_SIZES_1080P],
  'wan2.2-t2v-plus': [...WAN_SIZES_480P, ...WAN_SIZES_1080P],
  'wanx2.1-t2v-turbo': [...WAN_SIZES_480P, ...WAN_SIZES_720P],
  'wanx2.1-t2v-plus': WAN_SIZES_720P
}
/** 万相 2.6 及更早图生视频的分辨率：与后端 TongYiWanVideoApi.LEGACY_I2V_RESOLUTIONS 一致 */
const WAN_LEGACY_I2V_RESOLUTIONS: Record<string, string[]> = {
  'wan2.6-i2v-flash': ['1080P', '720P'],
  'wan2.6-i2v': ['1080P', '720P'],
  'wan2.5-i2v-preview': ['1080P', '480P', '720P'],
  'wan2.2-i2v-flash': ['720P', '480P', '1080P'],
  'wan2.2-i2v-plus': ['1080P', '480P'],
  'wanx2.1-i2v-turbo': ['720P', '480P'],
  'wanx2.1-i2v-plus': ['720P']
}

/**
 * 获得视频模型的表单能力：按平台、模型标识、生成方式推断
 *
 * 部分模型的可选分辨率还与时长、生成音频有关：海螺 10 秒只支持 768P，kling-2.6 生成音频只支持 1080p
 */
export const getVideoModelCapability = (
  platform?: string,
  model?: string,
  mode?: string,
  duration?: number,
  generateAudio?: boolean
): VideoModelCapability => {
  const name = model || ''
  const base: VideoModelCapability = {
    modes: [AiVideoModeEnum.TEXT],
    resolutions: [],
    ratios: [],
    durations: [],
    sizes: [],
    fields: [],
    maxReferenceImages: 0,
    referenceVideo: false,
    referenceAudio: false,
    promptRequired: mode === AiVideoModeEnum.TEXT
  }
  // 1. 字节跳动：即梦视频 3.0、方舟 Seedance；数字人口播、动作模仿没有可选参数
  if (platform === AiPlatformEnum.BYTEDANCE) {
    if (!isVideoModelOfType(AiVideoTypeEnum.GENERATE, platform, name)) {
      return { ...base, promptRequired: false }
    }
    return name.startsWith('jimeng_')
      ? getJimengCapability(base, name, mode)
      : getSeedanceCapability(base, name, mode)
  }
  // 2. 可灵：kling-v 开头为旧版接口
  if (platform === AiPlatformEnum.KLING) {
    return getKlingCapability(base, name, mode, generateAudio)
  }
  // 3. MiniMax：H3 走 v2 接口，其余为海螺
  if (platform === AiPlatformEnum.MINIMAX) {
    return name.startsWith('MiniMax-H3')
      ? getMiniMaxH3Capability(base, name, mode)
      : getHailuoCapability(base, name, mode, duration)
  }
  // 4. 阿里：HappyHorse 按 t2v / i2v / r2v 分模型；其余为通义万相
  if (platform === AiPlatformEnum.ALIBABA) {
    return name.startsWith('happyhorse')
      ? getHappyHorseCapability(base, name)
      : getTongYiWanCapability(base, name)
  }
  // 5. Google Veo（Vertex AI）
  if (platform === AiPlatformEnum.GEMINI && name.startsWith('veo-')) {
    return getVeoCapability(base, name, mode)
  }
  return base
}

/** 即梦视频 3.0：只有文生支持比例；除 3.0 Pro 的图生外，都需要提示词 */
const getJimengCapability = (
  base: VideoModelCapability,
  name: string,
  mode?: string
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const ti2v = name.includes('ti2v')
  let modes = [IMAGE]
  if (name.includes('t2v')) {
    modes = [TEXT]
  } else if (name.includes('first_tail')) {
    modes = [FIRST_LAST]
  } else if (ti2v) {
    modes = [TEXT, IMAGE]
  }
  return {
    ...base,
    modes,
    ratios: mode === TEXT ? RATIOS_COMMON : [],
    durations: [5, 10],
    fields: ['seed'],
    promptRequired: mode === TEXT || !ti2v
  }
}

/** 方舟 Seedance：按系列区分时长与参数，2.0 / 2.5 支持参考视频、参考音频 */
const getSeedanceCapability = (
  base: VideoModelCapability,
  name: string,
  mode?: string
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const v10 = name.includes('seedance-1-0')
  const v15 = name.includes('seedance-1-5')
  const v20 = name.includes('seedance-2-0')
  const v25 = name.includes('seedance-2-5')
  let modes = [TEXT, IMAGE, FIRST_LAST]
  if (name.includes('t2v')) {
    modes = [TEXT]
  } else if (name.includes('i2v')) {
    modes = [IMAGE, FIRST_LAST, REFERENCE]
  } else if (name.includes('pro-fast')) {
    modes = [TEXT, IMAGE]
  } else if (v20 || v25) {
    modes = [TEXT, IMAGE, FIRST_LAST, REFERENCE]
  }
  // 随机种子、固定镜头只有 1.0 支持（参考图不支持固定镜头）；生成音频 1.0 不支持
  const fields = ['watermark']
  if (!v15 && !v20 && !v25) {
    fields.push('seed')
    if (mode !== REFERENCE) {
      fields.push('cameraFixed')
    }
  }
  if (!v10) {
    fields.push('generateAudio')
  }
  let durations = range(2, 12)
  if (v20) {
    durations = range(4, 15)
  } else if (v25) {
    durations = range(4, 30)
  }
  const lite = v20 && (name.includes('fast') || name.includes('mini'))
  // 2.5 的首帧、首尾帧只支持 adaptive，比例跟随首帧
  const frameAdaptive = v25 && (mode === IMAGE || mode === FIRST_LAST)
  return {
    ...base,
    modes,
    resolutions: lite ? ['720p', '480p'] : ['720p', '480p', '1080p'],
    ratios: frameAdaptive ? ['adaptive'] : [...RATIOS_COMMON, 'adaptive'],
    durations,
    fields,
    maxReferenceImages: v20 || v25 ? 9 : 4,
    referenceVideo: v20 || v25,
    referenceAudio: v20 || v25
  }
}

/** 可灵：新版只有文生支持比例，不支持反向提示词；kling-2.6 的首尾帧、生成音频只支持 1080p，首尾帧不能生成音频 */
const getKlingCapability = (
  base: VideoModelCapability,
  name: string,
  mode?: string,
  generateAudio?: boolean
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const modes = [TEXT, IMAGE, FIRST_LAST]
  if (/^kling-v\d/.test(name)) {
    return {
      ...base,
      modes,
      ratios: ['16:9', '9:16', '1:1'],
      durations: [5, 10],
      fields: ['negativePrompt', 'quality']
    }
  }
  const v26 = name === 'kling-2.6'
  let ratios: string[] = []
  if (mode === TEXT) {
    ratios =
      v26 || name === 'kling-2.5-turbo' ? ['16:9', '9:16', '1:1'] : ['16:9', '9:16', '1:1', '21:9']
  }
  const firstLast = mode === FIRST_LAST
  return {
    ...base,
    modes,
    resolutions: v26 && (firstLast || generateAudio) ? ['1080p'] : ['720p', '1080p'],
    ratios,
    durations: [5, 10],
    fields: v26 && !firstLast ? ['generateAudio', 'watermark'] : ['watermark']
  }
}

/** MiniMax-H3：都需要提示词；文生、H3-Lite 的参考生视频必须指定比例，只有 H3-Max 支持提示词扩写 */
const getMiniMaxH3Capability = (
  base: VideoModelCapability,
  name: string,
  mode?: string
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const max = name === 'MiniMax-H3-Max'
  const adaptive = mode !== TEXT && !(name === 'MiniMax-H3-Lite' && mode === REFERENCE)
  return {
    ...base,
    modes: [TEXT, IMAGE, FIRST_LAST, REFERENCE],
    resolutions: name === 'MiniMax-H3' ? ['768P', '2K'] : ['768P', '480P'],
    ratios: adaptive ? ['adaptive', ...RATIOS_COMMON] : RATIOS_COMMON,
    durations: range(max ? 5 : 4, 15),
    fields: max ? ['promptExpansionMode'] : [],
    maxReferenceImages: 9,
    referenceVideo: true,
    referenceAudio: true,
    promptRequired: true
  }
}

/** MiniMax 海螺：按型号区分生成方式、分辨率与时长，与后端 MiniMaxHailuoVideoApi.MODEL_SPECS 一致 */
const getHailuoCapability = (
  base: VideoModelCapability,
  name: string,
  mode?: string,
  duration?: number
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const capability = { ...base, fields: ['promptExtend'] }
  // S2V-01 主体参考：不支持指定分辨率、时长
  if (name.startsWith('S2V')) {
    return { ...capability, modes: [REFERENCE], maxReferenceImages: 1 }
  }
  if (name.startsWith('T2V-01')) {
    return { ...capability, modes: [TEXT], resolutions: ['720P'], durations: [6] }
  }
  if (name.startsWith('I2V-01')) {
    return { ...capability, modes: [IMAGE], resolutions: ['720P'], durations: [6] }
  }
  let modes = [TEXT, IMAGE]
  if (name.includes('Fast')) {
    modes = [IMAGE]
  } else if (name.includes('02')) {
    modes = [TEXT, IMAGE, FIRST_LAST]
  }
  // 10 秒只支持 768P（02 的图生另有 512P）
  const resolutions =
    name.includes('02') && mode === IMAGE ? ['768P', '512P', '1080P'] : ['768P', '1080P']
  return {
    ...capability,
    modes,
    resolutions: duration === 10 ? resolutions.filter((item) => item !== '1080P') : resolutions,
    durations: [6, 10]
  }
}

/** 阿里 HappyHorse：图生不支持比例，提示词可选 */
const getHappyHorseCapability = (
  base: VideoModelCapability,
  name: string
): VideoModelCapability => {
  const { TEXT, IMAGE, REFERENCE } = AiVideoModeEnum
  const i2v = name.includes('i2v')
  let modes = [TEXT]
  if (name.includes('r2v')) {
    modes = [REFERENCE]
  } else if (i2v) {
    modes = [IMAGE]
  }
  return {
    ...base,
    modes,
    resolutions: ['720P', '480P', '1080P'],
    ratios: i2v ? [] : RATIOS_COMMON,
    durations: range(3, 15),
    fields: ['seed', 'watermark'],
    maxReferenceImages: 9,
    promptRequired: !i2v
  }
}

/** 通义万相：2.7 文生用分辨率 + 比例，2.6 及更早的文生用尺寸；图生不支持比例 */
const getTongYiWanCapability = (
  base: VideoModelCapability,
  name: string
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const fields = ['seed', 'negativePrompt', 'promptExtend', 'watermark']
  if (name.startsWith('wan2.6-')) {
    fields.push('shotType')
  }
  if (name === 'wan2.6-i2v-flash') {
    fields.push('generateAudio')
  }
  const durations = /^wan2\.[567]-/.test(name) ? [5, 10] : [5]
  if (name.startsWith('wan2.7-t2v')) {
    return {
      ...base,
      modes: [TEXT],
      resolutions: ['720P', '1080P'],
      ratios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
      durations,
      fields
    }
  }
  if (name.startsWith('wan2.7-i2v')) {
    return {
      ...base,
      modes: [IMAGE, FIRST_LAST],
      resolutions: ['720P', '1080P'],
      durations,
      fields
    }
  }
  const sizes = WAN_LEGACY_T2V_SIZES[name]
  if (sizes) {
    return { ...base, modes: [TEXT], sizes, durations, fields: [...fields, 'size'] }
  }
  const resolutions = WAN_LEGACY_I2V_RESOLUTIONS[name]
  if (resolutions) {
    return { ...base, modes: [IMAGE], resolutions, durations, fields }
  }
  return base
}

/** Google Veo（Vertex AI）：参考图最多 3 张，且只支持 8 秒；Lite 不支持参考图；只有 Veo 3.1 支持 4k */
const getVeoCapability = (
  base: VideoModelCapability,
  name: string,
  mode?: string
): VideoModelCapability => {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const lite = name.includes('lite')
  return {
    ...base,
    modes: lite ? [TEXT, IMAGE, FIRST_LAST] : [TEXT, IMAGE, FIRST_LAST, REFERENCE],
    resolutions: name === 'veo-3.1-generate-001' ? ['720p', '1080p', '4k'] : ['720p', '1080p'],
    ratios: ['16:9', '9:16'],
    durations: mode === REFERENCE ? [8] : [8, 6, 4],
    fields: ['seed', 'negativePrompt', 'generateAudio'],
    maxReferenceImages: lite ? 0 : 3,
    promptRequired: mode === TEXT || mode === REFERENCE
  }
}

/** 模型是否属于某个创作类型：数字人口播、动作模仿只支持即梦对应的模型，其余为视频生成 */
export const isVideoModelOfType = (type: number, platform: string, model: string) => {
  const avatar = platform === AiPlatformEnum.BYTEDANCE && /realman|omni/i.test(model)
  const motion = platform === AiPlatformEnum.BYTEDANCE && /dream_?actor/i.test(model)
  if (type === AiVideoTypeEnum.AVATAR) {
    return avatar
  }
  if (type === AiVideoTypeEnum.MOTION) {
    return motion
  }
  return !avatar && !motion
}

/** 获得创作类型、生成方式使用的输入文件角色：与后端 AiVideoUtils.filterInputUrls 一致 */
export const getVideoInputRoles = (type: number, mode?: string): string[] => {
  if (type === AiVideoTypeEnum.AVATAR) {
    return ['image', 'audio']
  }
  if (type === AiVideoTypeEnum.MOTION) {
    return ['image', 'video']
  }
  switch (mode) {
    case AiVideoModeEnum.IMAGE:
      return ['first_frame']
    case AiVideoModeEnum.FIRST_LAST:
      return ['first_frame', 'last_frame']
    case AiVideoModeEnum.REFERENCE:
      return ['reference_image', 'reference_video', 'reference_audio']
    default:
      return []
  }
}

/** 生成方式的名称 */
export const VIDEO_MODE_LABELS: Record<string, string> = {
  text: '文生视频',
  image: '图生视频',
  first_last: '首尾帧',
  reference: '参考生视频'
}

/** 输入文件角色的名称 */
export const VIDEO_ROLE_LABELS: Record<string, string> = {
  first_frame: '首帧',
  last_frame: '尾帧',
  reference_image: '参考图',
  reference_video: '参考视频',
  reference_audio: '参考音频',
  image: '人物图片',
  audio: '驱动音频',
  video: '动作视频'
}

/** 生成参数的名称 */
export const VIDEO_OPTION_LABELS: Record<string, string> = {
  resolution: '分辨率',
  ratio: '比例',
  size: '尺寸',
  duration: '时长',
  seed: '种子',
  watermark: '水印',
  generateAudio: '生成音频',
  cameraFixed: '固定镜头',
  negativePrompt: '反向提示词',
  promptExtend: '优化提示词',
  promptExpansionMode: '提示词扩写',
  quality: '生成模式',
  shotType: '镜头类型',
  outputResolution: '输出分辨率'
}

/** 格式化生成参数：分辨率、比例、时长与其它参数一起展示，只展示有值的 */
export const formatVideoOptions = (video: VideoVO) => {
  const params = {
    resolution: video.resolution,
    ratio: video.ratio,
    duration: video.duration,
    ...video.options
  }
  const text = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const display = typeof value === 'boolean' ? (value ? '是' : '否') : value
      return `${VIDEO_OPTION_LABELS[key] || key}：${display}`
    })
    .join('；')
  return text || '-'
}

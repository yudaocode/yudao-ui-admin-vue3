/**
 * AI 语音：平台能力、状态、格式化、下载用的工具方法
 */

import { SpeechVO } from '@/api/ai/speech'
import { ModelVO } from '@/api/ai/model/model'

/** 朗读文本的计数单位：GBK 字节 */
export const SPEECH_TEXT_UNIT_GBK = 'gbk'

/** 语音合成平台的能力：上限、格式、语速与后端各语音模型的校验一致，提交时后端会再校验 */
export interface SpeechPlatformConfig {
  async: boolean // 是否为长文本任务（腾讯云）：后台提交后等待结果，可能需要数分钟
  maxTextLength: number // 朗读文本的上限
  textUnit: 'char' | 'gbk' // 计数单位：char 字符，gbk GBK 字节
  formats: string[] // 支持的音频格式，第一个为默认
  minSpeed: number // 最小语速
  maxSpeed: number // 最大语速
  voices: { value: string; name: string }[] // 推荐音色，也可输入服务商的其它音色
}

/** 语音合成平台的能力，key 为 AI 平台 */
export const SPEECH_PLATFORM_CONFIGS: Record<string, SpeechPlatformConfig> = {
  // 阿里云：通义千问 Qwen TTS
  ALIBABA: {
    async: false,
    maxTextLength: 600,
    textUnit: 'char',
    formats: ['wav'],
    minSpeed: 1,
    maxSpeed: 1,
    voices: [
      { value: 'Cherry', name: '芊悦' },
      { value: 'Ethan', name: '晨煦' },
      { value: 'Jennifer', name: '詹妮弗' },
      { value: 'Ryan', name: '甜茶' }
    ]
  },
  // MiniMax
  MINIMAX: {
    async: false,
    maxTextLength: 9999,
    textUnit: 'char',
    formats: ['mp3', 'wav', 'flac'],
    minSpeed: 0.5,
    maxSpeed: 2,
    voices: [
      { value: 'male-qn-qingse', name: '青涩青年' },
      { value: 'male-qn-jingying', name: '精英青年' },
      { value: 'female-shaonv', name: '少女' },
      { value: 'female-yujie', name: '御姐' }
    ]
  },
  // 字节跳动：豆包语音（不是火山方舟）的 API Key
  BYTEDANCE: {
    async: false,
    maxTextLength: 10000,
    textUnit: 'char',
    formats: ['mp3', 'ogg_opus'],
    minSpeed: 0.5,
    maxSpeed: 2,
    voices: [{ value: 'zh_female_vv_uranus_bigtts', name: 'Vivi 2.0' }]
  },
  // 腾讯云：长文本语音合成，密钥为 SecretId|SecretKey
  TENCENT: {
    async: true,
    maxTextLength: 10000,
    textUnit: 'char',
    formats: ['mp3', 'wav'],
    minSpeed: 0.6,
    maxSpeed: 2.5,
    voices: [{ value: '101001', name: '智瑜' }]
  },
  // 百度智能云：短文本语音合成，按 GBK 字节计数
  BAIDU: {
    async: false,
    maxTextLength: 1023,
    textUnit: 'gbk',
    formats: ['mp3', 'wav'],
    minSpeed: 0.5,
    maxSpeed: 2,
    voices: [{ value: '5003', name: '度逍遥' }]
  }
}

/** 语音模型：AI 模型 + 平台的能力 */
export type SpeechModel = Pick<ModelVO, 'id' | 'name' | 'model' | 'platform'> & SpeechPlatformConfig

/** 构建语音模型：只保留支持语音合成的平台 */
export const buildSpeechModels = (models: ModelVO[]): SpeechModel[] =>
  models
    .filter((model) => !!SPEECH_PLATFORM_CONFIGS[model.platform])
    .map((model) => ({
      id: model.id,
      name: model.name,
      model: model.model,
      platform: model.platform,
      ...SPEECH_PLATFORM_CONFIGS[model.platform]
    }))

/** AI 语音的状态 */
export const AiSpeechStatusEnum = {
  IN_PROGRESS: 10, // 生成中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}

/** AI 语音的状态名字 */
export const AiSpeechStatusLabels: Record<number, string> = {
  [AiSpeechStatusEnum.IN_PROGRESS]: '生成中',
  [AiSpeechStatusEnum.SUCCESS]: '已完成',
  [AiSpeechStatusEnum.FAIL]: '已失败'
}

/** 是否生成中 */
export const isSpeechRunning = (speech?: SpeechVO) =>
  speech?.status === AiSpeechStatusEnum.IN_PROGRESS

/** 是否可播放、下载 */
export const canPlaySpeech = (speech?: SpeechVO) =>
  speech?.status === AiSpeechStatusEnum.SUCCESS && !!speech.audioUrl

/**
 * 朗读文本的长度：按字符（码点）计数；GBK 时按 GBK 字节估算（ASCII 1 字节，其它 2 字节），以后端校验为准
 */
export const getSpeechTextLength = (text: string, textUnit?: string): number => {
  if (!text) {
    return 0
  }
  const chars = Array.from(text)
  if (textUnit !== SPEECH_TEXT_UNIT_GBK) {
    return chars.length
  }
  return chars.reduce((total, char) => total + (char.charCodeAt(0) <= 0x7f ? 1 : 2), 0)
}

/** 音频格式的文件扩展名：ogg_opus 为 opus，与后端一致 */
export const getSpeechFileExtension = (format?: string) =>
  format === 'ogg_opus' ? 'opus' : format || 'mp3'

/** 音频格式的展示名字 */
export const getSpeechFormatLabel = (format?: string) =>
  format === 'ogg_opus' ? 'OGG Opus' : (format || '').toUpperCase()

/** 音频大小 */
export const formatSpeechSize = (size?: number) => {
  if (!size && size !== 0) {
    return '-'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

/** 语速：保留 2 位小数，去掉末尾的 0 */
export const formatSpeechSpeed = (speed?: number) => `${Number((speed ?? 1).toFixed(2))}x`

/** 音色名字：推荐音色显示名字，其它显示音色本身 */
export const getSpeechVoiceLabel = (speech: SpeechVO) => {
  const voices = SPEECH_PLATFORM_CONFIGS[speech.platform]?.voices || []
  const voice = voices.find((item) => item.value === speech.voice)
  return voice ? `${voice.name}（${voice.value}）` : speech.voice
}

/**
 * 下载音频：优先按文件名下载；音频地址跨域不允许读取时，在新窗口打开
 */
export const downloadSpeech = async (speech: SpeechVO) => {
  if (!speech.audioUrl) {
    return
  }
  const fileName = `speech-${speech.id}.${getSpeechFileExtension(speech.format)}`
  try {
    const response = await fetch(speech.audioUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const href = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = href
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  } catch {
    window.open(speech.audioUrl, '_blank', 'noopener')
  }
}

/**
 * Created by 芋道源码
 *
 * AI 枚举类
 *
 * 问题：为什么不放在 src/utils/constants.ts 呢？
 * 回答：主要 AI 是可选模块，考虑到独立、解耦，所以放在了 /views/ai/utils/constants.ts
 */

/**
 * AI 平台的枚举
 */
export const AiPlatformEnum = {
  TONG_YI: 'TongYi', // 阿里
  YI_YAN: 'YiYan', // 百度
  DEEP_SEEK: 'DeepSeek', // DeepSeek
  ZHI_PU: 'ZhiPu', // 智谱 AI
  XING_HUO: 'XingHuo', // 讯飞
  OPENAI: 'OpenAI',
  Ollama: 'Ollama',
  STABLE_DIFFUSION: 'StableDiffusion', // Stability AI
  MIDJOURNEY: 'Midjourney', // Midjourney
  SUNO: 'Suno' // Suno AI
}

/**
 * AI 图像生成状态的枚举
 */
export const AiImageStatusEnum = {
  IN_PROGRESS: 10, // 进行中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}

/**
 * AI 音乐生成状态的枚举
 */
export const AiMusicStatusEnum = {
  IN_PROGRESS: 10, // 进行中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}

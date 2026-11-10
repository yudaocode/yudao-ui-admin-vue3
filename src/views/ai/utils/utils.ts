/**
 * Created by 芋道源码
 *
 * AI 枚举类
 *
 * 问题：为什么不放在 src/utils/common-utils.ts 呢？
 * 回答：主要 AI 是可选模块，考虑到独立、解耦，所以放在了 /views/ai/utils/common-utils.ts
 */
import { AiReasoningLevelLabels } from '@/views/ai/utils/constants'
import { ModelReasoningConfigVO } from '@/api/ai/model/model'

/**  判断字符串是否包含中文  */
export const hasChinese = (str: string) => {
  return /[\u4e00-\u9fa5]/.test(str)
}

// ========== 【思考配置】相关 ==========

/** 获得思考档位的展示名 */
export const getReasoningLevelLabel = (level?: string) => {
  if (!level) {
    return ''
  }
  // 只认自有属性，避免 constructor、__proto__ 等档位值读到 Object 原型上的属性
  return Object.prototype.hasOwnProperty.call(AiReasoningLevelLabels, level)
    ? AiReasoningLevelLabels[level]
    : level
}

/** 获得模型配置的思考档位：按配置顺序，含 off；未配置时为空数组 */
export const getReasoningLevels = (config?: ModelReasoningConfigVO) => {
  return (config?.levels || []).map((item) => item.level)
}

/** 计算思考档位：选中的档位在模型配置中时使用，否则用默认档位；未配置档位时返回 undefined，请求不带 reasoningLevel */
export const resolveReasoningLevel = (config?: ModelReasoningConfigVO, selected?: string) => {
  const levels = getReasoningLevels(config)
  if (levels.length === 0) {
    return undefined
  }
  if (selected && levels.includes(selected)) {
    return selected
  }
  const defaultLevel = config?.defaultLevel
  return defaultLevel && levels.includes(defaultLevel) ? defaultLevel : levels[0]
}

// ========== 【音乐】相关 ==========

/** 格式化音乐时长（秒）为 mm:ss；为空时返回 - */
export const formatMusicDuration = (seconds?: number | null): string => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '-'
  }
  const total = Math.max(0, Math.floor(seconds))
  const minute = Math.floor(total / 60)
  const second = total % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

/** 音乐名称为空时的展示文案 */
export const getMusicTitle = (title?: string | null): string => title || '未命名歌曲'

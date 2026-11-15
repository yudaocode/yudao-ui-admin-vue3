/**
 * AI 短剧：画幅、转场等选项，候选图、时长、任务状态用的工具方法
 */
import { isAiDramaRunning } from '@/views/ai/utils/constants'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import type { DramaCandidateVO } from '@/api/ai/drama/asset'

/** 画幅 */
export const DRAMA_ASPECT_RATIOS = ['9:16', '16:9', '1:1', '3:4', '4:3']

/** 转场：与后端 AiDramaTransitionTypeEnum 一致 */
export const DRAMA_TRANSITION_NONE = 0
export const DRAMA_TRANSITIONS = [
  { label: '无', value: DRAMA_TRANSITION_NONE },
  { label: '溶解', value: 1 },
  { label: '黑场淡入淡出', value: 2 },
  { label: '滑动', value: 3 }
]

/** 公开广场的时长筛选 */
export const DRAMA_DURATION_TYPES = [
  { label: '30 秒内', value: 1 },
  { label: '30-60 秒', value: 2 },
  { label: '1 分钟以上', value: 3 }
]

/** 视觉资产类型：道具 */
export const DRAMA_VISUAL_ASSET_KIND_PROP = 'prop'

/** 获得选用的候选图；未选用时为空 */
export const getSelectedCandidateUrl = (
  candidates?: DramaCandidateVO[],
  selectedIndex?: number
) => {
  if (!candidates?.length || selectedIndex === undefined || selectedIndex === null) {
    return undefined
  }
  return candidates[selectedIndex]?.url
}

/** 是否有成功的候选图 */
export const hasCandidateImage = (candidates?: DramaCandidateVO[]) =>
  !!candidates?.some((item) => !!item.url)

/** 格式化时长：秒 → m:ss */
export const formatDramaDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) {
    return '-'
  }
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** 项目详情中是否有生成中的任务：出图、镜头视频、成片 */
export const hasDramaRunning = (detail?: DramaProjectDetailVO) => {
  if (!detail) {
    return false
  }
  return (
    isAiDramaRunning(detail.project.composeStatus) ||
    detail.characters.some((character) =>
      character.appearances.some((item) => isAiDramaRunning(item.status))
    ) ||
    detail.locations.some((item) => isAiDramaRunning(item.status)) ||
    detail.visualAssets.some((item) => isAiDramaRunning(item.status)) ||
    detail.storyboards.some((item) => isAiDramaRunning(item.videoStatus))
  )
}

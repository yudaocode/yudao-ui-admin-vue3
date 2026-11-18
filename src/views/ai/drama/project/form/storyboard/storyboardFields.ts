import type { DramaContinuityVO, DramaStoryboardVO } from '@/api/ai/drama/storyboard'

/** 表单数据：分镜的字段；台词、表演、出场角色、道具编辑时不为空 */
export type StoryboardFormData = Partial<DramaStoryboardVO> &
  Required<Pick<DramaStoryboardVO, 'dialogues' | 'actingNotes' | 'characters' | 'visualAssetIds'>>

/** 连续性设置：参考视频、素材图片编辑时不为空 */
export type ContinuityFormData = DramaContinuityVO &
  Required<Pick<DramaContinuityVO, 'referenceVideoUrls' | 'materialUrls'>>

/** 镜头的编辑状态：切换镜头时暂存，切回时恢复 */
export interface StoryboardFieldsState {
  formData: StoryboardFormData
  continuity: ContinuityFormData
  propsAuto: boolean
  manualStartFrameUrl: string
}

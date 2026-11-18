// DONE @AI：应该按照模块，拆分下 api 噢；（按后端 Controller 拆为 project、script、asset、storyboard、task 五个模块，各自导出 VO 与 DramaXxxApi；原 index.ts 删除）
import request from '@/config/axios'
import type { DramaScriptVO } from '@/api/ai/drama/script'
import type {
  DramaAudioVO,
  DramaCharacterVO,
  DramaLocationVO,
  DramaMotionReferenceVO,
  DramaVisualAssetVO
} from '@/api/ai/drama/asset'
import type { DramaStoryboardVO } from '@/api/ai/drama/storyboard'

// AI 短剧项目 VO
export interface DramaProjectVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  name: string // 项目名称
  description?: string // 项目简介
  idea?: string // 故事想法
  style?: number // 画风，参见 AiDramaStyleEnum
  aestheticSkillId?: number // 美学技能编号
  directorSkillId?: number // 导演技能编号
  storyboardSkillIds?: number[] // 分镜技能编号，按顺序生效
  status: number // 项目状态，参见 AiDramaProjectStatusEnum
  publicStatus: boolean // 是否公开
  composeAspectRatio?: string // 画幅：生成镜头视频、成片使用
  composeTransitionType?: number // 转场类型，参见 AiDramaTransitionTypeEnum
  composeTransitionDurationSeconds?: number // 转场时长（秒）
  composeStatus?: number // 成片状态，参见 AiDramaStatusEnum；为空表示未合成
  composeProgress?: number // 合成进度（0-100）
  composeFileUrl?: string // 成片地址
  composeDuration?: number // 成片时长（秒）
  composeStoryboardCount?: number // 成片镜头数：成片实际拼接的
  composeErrorMessage?: string // 合成失败原因
  composeFinishTime?: Date // 成片完成时间
  composeStale?: boolean // 成片是否待重新合成：实际合成输入（参与的镜头视频、镜头增删）已变化；只在项目详情返回
  composeStaleReason?: string // 待重新合成的原因，例如「镜头视频已更换」
  storyboardCount?: number // 镜头数
  storyboardSuccessCount?: number // 视频已完成的镜头数
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

// AI 短剧项目创建 / 修改 Request VO
export interface DramaProjectSaveReqVO {
  id?: number
  name: string
  description?: string
  idea?: string
  style?: number
  aestheticSkillId?: number
  directorSkillId?: number
  storyboardSkillIds?: number[]
  composeAspectRatio?: string
}

// AI 短剧公开项目 VO
export interface DramaPublicVO {
  id: number
  name: string
  style?: number // 画风，参见 AiDramaStyleEnum
  aspectRatio?: string // 画幅：成片实际使用的
  composeFileUrl: string
  composeDuration?: number
  userId: number
  userNickname?: string
  owner: boolean // 是否本人的项目
  updateTime?: Date
  storyboardCount?: number // 镜头数：成片实际拼接的
  outline?: string // 剧情大纲（详情）
  characters?: { name: string; imageUrl?: string }[] // 角色（详情）
}

// AI 短剧合成成片 Request VO
export interface DramaComposeReqVO {
  projectId: number
  storyboardIds: number[] // 镜头，按播放顺序
  aspectRatio: string
  transitionType: number // 转场类型，参见 AiDramaTransitionTypeEnum
  transitionDuration?: number
  narrationAudioId?: number
  watermarkText?: string
}

// AI 短剧项目详情 VO：工作台、管理端只读查看
export interface DramaProjectDetailVO {
  project: DramaProjectVO
  script?: DramaScriptVO
  characters: DramaCharacterVO[]
  locations: DramaLocationVO[]
  visualAssets: DramaVisualAssetVO[] // 道具、关键帧，以及它们的历史版本
  audios: DramaAudioVO[] // 不属于角色的音频：旁白、配乐、参考音频等
  motionReferences: DramaMotionReferenceVO[] // 动作参考视频
  storyboards: DramaStoryboardVO[]
}

// AI 短剧项目 API
export const DramaProjectApi = {
  // ---------- 项目：我的 ----------
  createProject: async (data: DramaProjectSaveReqVO) => {
    return await request.post({ url: `/ai/drama/project/create`, data })
  },
  updateProjectMy: async (data: DramaProjectSaveReqVO) => {
    return await request.put({ url: `/ai/drama/project/update-my`, data })
  },
  deleteProjectMy: async (id: number) => {
    return await request.delete({ url: `/ai/drama/project/delete-my?id=${id}` })
  },
  getProjectMyPage: async (params: any) => {
    return await request.get({ url: `/ai/drama/project/my-page`, params })
  },
  getProjectDetailMy: async (id: number): Promise<DramaProjectDetailVO> => {
    return await request.get({ url: `/ai/drama/project/get-detail-my?id=${id}` })
  },
  composeProject: async (data: DramaComposeReqVO) => {
    return await request.post({ url: `/ai/drama/project/compose`, data })
  },
  // ---------- 项目：公开广场 ----------
  getProjectPublicPage: async (params: any) => {
    return await request.get({ url: `/ai/drama/project/public-page`, params })
  },
  getProjectPublicDetail: async (id: number): Promise<DramaPublicVO> => {
    return await request.get({ url: `/ai/drama/project/public-detail?id=${id}` })
  },
  // ---------- 项目：管理 ----------
  getProjectPage: async (params: any) => {
    return await request.get({ url: `/ai/drama/project/page`, params })
  },
  getProjectDetail: async (id: number): Promise<DramaProjectDetailVO> => {
    return await request.get({ url: `/ai/drama/project/get-detail?id=${id}` })
  },
  updateProjectPublicStatus: async (id: number, publicStatus: boolean) => {
    return await request.put({ url: `/ai/drama/project/update-public`, data: { id, publicStatus } })
  },
  deleteProject: async (id: number) => {
    return await request.delete({ url: `/ai/drama/project/delete?id=${id}` })
  }
}

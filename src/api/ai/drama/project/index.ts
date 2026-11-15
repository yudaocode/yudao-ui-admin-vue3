// DONE @AI：应该按照模块，拆分下 api 噢；（按后端 Controller 拆为 project、script、asset、storyboard、task 五个模块，各自导出 VO 与 DramaXxxApi；原 index.ts 删除）
import request from '@/config/axios'
import type { DramaScriptVO } from '@/api/ai/drama/script'
import type {
  DramaAudioVO,
  DramaCharacterVO,
  DramaLocationVO,
  DramaVisualAssetVO
} from '@/api/ai/drama/asset'
import type { DramaStoryboardVO } from '@/api/ai/drama/storyboard'

// AI 短剧项目 VO
export interface DramaProjectVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  name: string // 项目名称
  idea?: string // 故事想法
  style?: string // 画风
  aspectRatio: string // 画幅：项目的设置，用于生成镜头视频
  composeTransitionType?: number // 转场类型，参见 AiDramaTransitionTypeEnum
  composeTransitionDurationSeconds?: number // 转场时长（秒）
  status: number // 当前步骤，参见 AiDramaStepEnum
  publicStatus: boolean // 是否公开
  composeStatus?: number // 成片状态，参见 AiDramaStatusEnum；为空表示未合成
  composeFileUrl?: string // 成片地址
  composeDuration?: number // 成片时长（秒）
  composeAspectRatio?: string // 成片画幅：成片实际使用的
  composeStoryboardCount?: number // 成片镜头数：成片实际拼接的
  composeErrorMessage?: string // 合成失败原因
  storyboardCount?: number // 镜头数
  storyboardSuccessCount?: number // 视频已完成的镜头数
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

// AI 短剧项目创建 / 修改 Request VO
export interface DramaProjectSaveReqVO {
  id?: number
  name: string
  idea?: string
  style?: string
  aspectRatio?: string
}

// AI 短剧公开项目 VO
export interface DramaPublicVO {
  id: number
  name: string
  style?: string
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
  visualAssets: DramaVisualAssetVO[]
  narrations: DramaAudioVO[]
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
  updateProjectStatusMy: async (id: number, status: number) => {
    return await request.put({ url: `/ai/drama/project/update-status-my`, data: { id, status } })
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

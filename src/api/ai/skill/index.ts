import request from '@/config/axios'

/** AI 技能信息 */
export interface SkillVO {
  id?: number // 编号
  name: string // 名称：小写字母、数字、中划线，创建后不可修改
  description?: string // 描述：以 SKILL.md 头信息为准
  version: string // 版本
  status: number // 状态
  remark?: string // 备注
  fileCount?: number // 文件数量
  roleNames?: string[] // 引用的角色名称
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI 技能文件信息 */
export interface SkillFileVO {
  id: number // 编号
  skillId: number // 技能编号
  parentId: number // 父目录编号
  name: string // 名称
  type: number // 类型，参见 AiSkillFileTypeEnum
  fileType?: string // 文件扩展名
  content?: string // 文件内容
  size?: number // 内容字节数
  locked: boolean // 是否固定
  sort: number // 排序
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
  children?: SkillFileVO[] // 子节点
}

// AI 技能 API
export const SkillApi = {
  // 查询技能分页
  getSkillPage: async (params: any) => {
    return await request.get({ url: `/ai/skill/page`, params })
  },

  // 查询技能详情
  getSkill: async (id: number) => {
    return await request.get({ url: `/ai/skill/get?id=` + id })
  },

  // 查询启用的技能精简列表：只有编号、名称、描述
  getSkillSimpleList: async (): Promise<SkillVO[]> => {
    return await request.get({ url: `/ai/skill/simple-list` })
  },

  // 新增技能
  createSkill: async (data: SkillVO) => {
    return await request.post({ url: `/ai/skill/create`, data })
  },

  // 修改技能
  updateSkill: async (data: SkillVO) => {
    return await request.put({ url: `/ai/skill/update`, data })
  },

  // 删除技能
  deleteSkill: async (id: number) => {
    return await request.delete({ url: `/ai/skill/delete?id=` + id })
  }
}

// AI 技能文件 API
export const SkillFileApi = {
  // 查询技能文件列表
  getSkillFileList: async (skillId: number): Promise<SkillFileVO[]> => {
    return await request.get({ url: `/ai/skill/file/list?skillId=` + skillId })
  },

  // 查询技能文件详情
  getSkillFile: async (id: number): Promise<SkillFileVO> => {
    return await request.get({ url: `/ai/skill/file/get?id=` + id })
  },

  // 新增技能文件
  createSkillFile: async (data: {
    skillId: number
    parentId: number
    name: string
    type: number
  }): Promise<number> => {
    return await request.post({ url: `/ai/skill/file/create`, data })
  },

  // 重命名技能文件
  renameSkillFile: async (data: { id: number; name: string }) => {
    return await request.put({ url: `/ai/skill/file/rename`, data })
  },

  // 移动技能文件
  moveSkillFile: async (data: { id: number; parentId: number }) => {
    return await request.put({ url: `/ai/skill/file/move`, data })
  },

  // 修改技能文件内容
  updateSkillFileContent: async (data: { id: number; content: string }) => {
    return await request.put({ url: `/ai/skill/file/update-content`, data })
  },

  // 删除技能文件
  deleteSkillFile: async (id: number) => {
    return await request.delete({ url: `/ai/skill/file/delete?id=` + id })
  }
}

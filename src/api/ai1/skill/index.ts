import request from '@/config/axios'

/** AI1 SKILL 信息 */
export interface Skill {
  id?: number // 编号
  name: string // 名称
  description?: string // 描述
  version: string // 版本
  status: number // 状态
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI1 SKILL 文件信息 */
export interface SkillFile {
  id: number // 编号
  skillId: number // SKILL 编号
  parentId: number // 父目录编号
  name: string // 名称
  type: number // 类型，参见 Ai1SkillFileTypeEnum
  fileType?: string // 文件类型
  content?: string // 文件内容
  locked: boolean // 是否固定
  sort: number // 排序
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
  children?: SkillFile[] // 子节点
}

// AI1 SKILL API
export const SkillApi = {
  // 查询 SKILL 分页
  getSkillPage: async (params: any) => {
    return await request.get({ url: `/ai1/skill/page`, params })
  },

  // 查询 SKILL 详情
  getSkill: async (id: number) => {
    return await request.get({ url: `/ai1/skill/get?id=` + id })
  },

  // 查询 SKILL 精简列表
  getSkillSimpleList: async (): Promise<Skill[]> => {
    return await request.get({ url: `/ai1/skill/simple-list` })
  },

  // 新增 SKILL
  createSkill: async (data: Skill) => {
    return await request.post({ url: `/ai1/skill/create`, data })
  },

  // 修改 SKILL
  updateSkill: async (data: Skill) => {
    return await request.put({ url: `/ai1/skill/update`, data })
  },

  // 删除 SKILL
  deleteSkill: async (id: number) => {
    return await request.delete({ url: `/ai1/skill/delete?id=` + id })
  },

  // 批量删除 SKILL
  deleteSkillList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/skill/delete-list?ids=${ids.join(',')}` })
  }
}

// AI1 SKILL 文件 API
export const SkillFileApi = {
  // 查询 SKILL 文件列表
  getSkillFileList: async (skillId: number): Promise<SkillFile[]> => {
    return await request.get({ url: `/ai1/skill/file/list?skillId=` + skillId })
  },

  // 查询 SKILL 文件详情
  getSkillFile: async (id: number) => {
    return await request.get({ url: `/ai1/skill/file/get?id=` + id })
  },

  // 新增 SKILL 文件
  createSkillFile: async (data: {
    skillId: number
    parentId: number
    name: string
    type: number
  }): Promise<number> => {
    return await request.post({ url: `/ai1/skill/file/create`, data })
  },

  // 重命名 SKILL 文件
  renameSkillFile: async (data: { id: number; name: string }) => {
    return await request.put({ url: `/ai1/skill/file/rename`, data })
  },

  // 移动 SKILL 文件
  moveSkillFile: async (data: { id: number; parentId: number }) => {
    return await request.put({ url: `/ai1/skill/file/move`, data })
  },

  // 修改 SKILL 文件内容
  updateSkillFileContent: async (data: { id: number; content: string }) => {
    return await request.put({ url: `/ai1/skill/file/update-content`, data })
  },

  // 删除 SKILL 文件
  deleteSkillFile: async (id: number) => {
    return await request.delete({ url: `/ai1/skill/file/delete?id=` + id })
  }
}

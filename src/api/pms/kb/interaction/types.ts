// PMS 知识交互对象 VO
export interface PmsKnowledgeInteractionItemVO {
  id: number // 记录编号
  type: number // 对象类型
  entityId: number // 对象编号
  libraryId: number // 知识库编号
  libraryName: string // 知识库名称
  name: string // 对象名称
  description?: string // 知识库简介
  folderId?: number // 文件夹编号
  documentId?: number // 文档编号
  fileType?: string // 文件类型
  fileSize?: number // 文件大小，单位：字节
  targetUpdateTime?: number // 对象更新时间
  createTime: number // 记录时间
}

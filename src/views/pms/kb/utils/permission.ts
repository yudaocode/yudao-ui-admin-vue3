import { PmsKnowledgeContentLevel } from './constants'

/** 判断知识内容协作等级是否可编辑 */
export function canEditKnowledgeContent(level?: number) {
  return (
    level === PmsKnowledgeContentLevel.MANAGE ||
    level === PmsKnowledgeContentLevel.EDIT ||
    level === PmsKnowledgeContentLevel.UPLOAD_DOWNLOAD
  )
}

/** 判断知识内容协作等级是否可管理目录结构和协作权限 */
export function canManageKnowledgeContent(level?: number) {
  return level === PmsKnowledgeContentLevel.MANAGE
}

/** 判断知识内容协作等级是否可删除 */
export function canDeleteKnowledgeContent(level?: number) {
  return level === PmsKnowledgeContentLevel.MANAGE || level === PmsKnowledgeContentLevel.EDIT
}

import { PmsKnowledgeDocumentType } from '@/views/pms/kb/utils/constants'

/** 知识库目录树节点 */
export interface KnowledgeTreeNode {
  key: string
  entityId: number
  kind: 'folder' | 'document'
  label: string
  currentUserLevel?: number
  type?: number
  children: KnowledgeTreeNode[]
}

/** 知识库详情当前内容 */
export type KnowledgeContentView = 'home' | 'folder' | 'document' | 'recycle'

/** 获得目录节点图标 */
export function getKnowledgeTreeNodeIcon(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') return 'ep:folder'
  return node.type === PmsKnowledgeDocumentType.FILE ? 'ep:paperclip' : 'ep:document'
}

/** 获得目录节点类型名称 */
export function getKnowledgeTreeNodeTypeName(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') return '文件夹'
  return node.type === PmsKnowledgeDocumentType.FILE ? '文件' : '文档'
}

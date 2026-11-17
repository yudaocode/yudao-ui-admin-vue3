import request from '@/config/axios'

// 画布文档：节点、连线；预演节点打开 3D 导演
export interface DramaCanvasDocument {
  schema: 1
  nodes: {
    id: string
    // DONE @AI：kind 不是 int 枚举么？是后端没改么？（不是遗漏：这是画布节点类型，存在画布 JSON 文档里，后端按字符串集合校验；与视觉资产的整数 kind 是两套，不混用）
    kind: 'text' | 'script' | 'image' | 'video' | 'audio' | 'group' | 'previs'
    data: Record<string, any>
    position: { x: number; y: number }
    parentId?: string
  }[]
  edges: { id: string; source: string; target: string }[]
  viewport?: { x: number; y: number; zoom: number }
}

// 画布、3D 导演工程：revision 为 0 表示还没有保存过
export interface DramaCanvasVO<T = any> {
  revision: number
  document?: T
}

// AI 短剧画布、3D 导演 API
export const DramaCanvasApi = {
  getCanvas: async (projectId: number): Promise<DramaCanvasVO<DramaCanvasDocument>> => {
    return await request.get({ url: `/ai/drama/canvas/get?projectId=${projectId}` })
  },
  // 保存画布：返回新的修订号；修订号不一致时报错
  saveCanvas: async (data: {
    projectId: number
    revision: number
    document: DramaCanvasDocument
  }): Promise<number> => {
    return await request.put({ url: `/ai/drama/canvas/save`, data })
  },
  getDirector: async (projectId: number, nodeId: string): Promise<DramaCanvasVO> => {
    return await request.get({
      url: `/ai/drama/canvas/get-director?projectId=${projectId}&nodeId=${encodeURIComponent(nodeId)}`
    })
  },
  saveDirector: async (data: {
    projectId: number
    nodeId: string
    revision: number
    document: any
  }): Promise<number> => {
    return await request.put({ url: `/ai/drama/canvas/save-director`, data })
  }
}

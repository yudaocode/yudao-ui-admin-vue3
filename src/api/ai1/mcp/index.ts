import request from '@/config/axios'

/** AI1 MCP 信息 */
export interface Mcp {
  id?: number // 编号
  name: string // 名称
  transport: string // 传输方式，参见 Ai1McpTransportEnum
  url?: string // 服务地址
  headers?: Record<string, string> // 请求头
  config?: string // MCP 配置
  status: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI1 MCP 工具信息 */
export interface McpTool {
  name: string // 工具名称
  title?: string // 工具标题
  description?: string // 工具描述
}

/** AI1 MCP 连通测试结果 */
export interface McpConnect {
  connectable: boolean // 是否连通
  serverName?: string // 服务名称
  serverVersion?: string // 服务版本
  instructions?: string // 服务说明
  toolCount: number // 可用工具数量
  elapsedMs: number // 测试耗时，单位：毫秒
  message: string // 测试过程描述
  tools?: McpTool[] // 可用工具明细
}

// AI1 MCP API
export const McpApi = {
  // 查询 MCP 分页
  getMcpPage: async (params: any) => {
    return await request.get({ url: `/ai1/mcp/page`, params })
  },

  // 查询 MCP 详情
  getMcp: async (id: number) => {
    return await request.get({ url: `/ai1/mcp/get?id=` + id })
  },

  // 查询 MCP 精简列表
  getMcpSimpleList: async (): Promise<Mcp[]> => {
    return await request.get({ url: `/ai1/mcp/simple-list` })
  },

  // 新增 MCP
  createMcp: async (data: Mcp) => {
    return await request.post({ url: `/ai1/mcp/create`, data })
  },

  // 修改 MCP
  updateMcp: async (data: Mcp) => {
    return await request.put({ url: `/ai1/mcp/update`, data })
  },

  // 删除 MCP
  deleteMcp: async (id: number) => {
    return await request.delete({ url: `/ai1/mcp/delete?id=` + id })
  },

  // 批量删除 MCP
  deleteMcpList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/mcp/delete-list?ids=${ids.join(',')}` })
  },

  // 测试 MCP 连通
  testMcp: async (id: number): Promise<McpConnect> => {
    return await request.post({ url: `/ai1/mcp/test?id=` + id })
  }
}

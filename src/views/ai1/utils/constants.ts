/**
 * AI1 大模型的公共常量，与后端 yudao-module-ai1-springai 的枚举保持一致
 */

/** 模型类型，对应后端 Ai1ModelTypeEnum */
export const Ai1ModelTypeEnum = {
  CHAT: 0, // 对话
  EMBEDDING: 1 // 嵌入
} as const

/** MCP 传输方式，对应后端 Ai1McpTransportEnum */
export const Ai1McpTransportEnum = {
  HTTP: 'http', // 远程（Streamable HTTP）
  STDIO: 'stdio' // 本地进程（stdio）
} as const

/** 知识文档向量化状态，对应后端 Ai1KnowledgeDocumentStatusEnum */
export const Ai1KnowledgeDocumentStatusEnum = {
  UNPROCESSED: 0, // 未处理
  VECTORIZED: 1, // 已向量化
  FAILED: 2 // 失败
} as const

/** SKILL 内容节点类型，对应后端 Ai1SkillFileTypeEnum */
export const Ai1SkillFileTypeEnum = {
  DIRECTORY: 0, // 目录
  FILE: 1 // 文件
} as const

/** 会话消息角色，对应后端 Ai1SessionMessageRoleEnum */
export const Ai1SessionMessageRoleEnum = {
  USER: 'user', // 用户
  ASSISTANT: 'assistant' // 助手
} as const

/** 会话消息生成状态，对应后端 Ai1SessionMessageStatusEnum */
export const Ai1SessionMessageStatusEnum = {
  GENERATING: 0, // 生成中
  SUCCESS: 1, // 完成
  FAILED: 2 // 失败
} as const

/** 会话流 SSE 事件类型，对应后端 Ai1SessionStreamTool */
export const Ai1SessionStreamEventEnum = {
  STREAM: 'stream', // 结果流标识
  THINKING: 'thinking', // 思考过程增量
  MESSAGE: 'message', // 回复内容增量
  PING: 'ping', // 心跳
  DONE: 'done', // 生成结束
  ERROR: 'error' // 生成失败
} as const

/** 知识库创建时的默认参数 */
export const AI1_KNOWLEDGE_BASE_DEFAULTS = {
  CHUNK_SIZE: 500, // 分片大小
  CHUNK_OVERLAP: 50, // 分片重叠
  TOP_K: 5 // 检索数量
} as const

/** SKILL 创建时的默认版本 */
export const AI1_SKILL_DEFAULT_VERSION = '1.0'

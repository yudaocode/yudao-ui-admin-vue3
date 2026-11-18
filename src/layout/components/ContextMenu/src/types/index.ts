// command 调用时传入当前菜单项；不需要参数的处理函数同样可用
export interface ContextMenuSchema {
  disabled?: boolean
  divided?: boolean
  icon?: string
  label: string
  command?: (item: ContextMenuSchema) => void
}

// 芋道原有的小写名称，保留为兼容别名
export type contextMenuSchema = ContextMenuSchema

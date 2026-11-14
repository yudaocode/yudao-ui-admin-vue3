// 主定义与上游同名（上游 HEAD components/ContextMenu/types.ts 的 interface ContextMenuSchema，名称沿用自 4f8330a4f 时期）；
// command 额外传入当前菜单项，是上游 HEAD () => void 的超集，无参处理函数同样可用
export interface ContextMenuSchema {
  disabled?: boolean
  divided?: boolean
  icon?: string
  label: string
  command?: (item: ContextMenuSchema) => void
}

// 芋道原有的小写名称，保留为兼容别名
export type contextMenuSchema = ContextMenuSchema

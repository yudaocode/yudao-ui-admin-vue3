import { JSONEditorOptions, JSONEditorMode } from 'jsoneditor'

export interface JsonEditorProps {
  /**
   * JSON数据，支持双向绑定
   */
  modelValue: any
  
  /**
   * 编辑器模式
   * @default 'tree'
   */
  mode?: JSONEditorMode
  
  /**
   * 编辑器高度
   * @default '400px'
   */
  height?: string
  
  /**
   * 是否显示模式选择下拉菜单
   * @default false
   */
  showModeSelection?: boolean
  
  /**
   * 是否显示导航栏
   * @default false
   */
  showNavigationBar?: boolean
  
  /**
   * 是否显示状态栏
   * @default true
   */
  showStatusBar?: boolean
  
  /**
   * 是否显示主菜单栏
   * @default true
   */
  showMainMenuBar?: boolean
  
  /**
   * JSONEditor配置选项
   * @see https://github.com/josdejong/jsoneditor/blob/develop/docs/api.md
   */
  options?: Partial<JSONEditorOptions>
}

/**
 * JsonEditor组件触发的事件
 */
export interface JsonEditorEmits {
  /**
   * 数据更新时触发
   */
  (e: 'update:modelValue', value: any): void
  
  /**
   * 数据变化时触发
   */
  (e: 'change', value: any): void
  
  /**
   * 验证错误时触发
   */
  (e: 'error', errors: any): void
}

/**
 * JsonEditor组件暴露的方法
 */
export interface JsonEditorExpose {
  /**
   * 获取原始的JSONEditor实例
   */
  getEditor: () => any
} 

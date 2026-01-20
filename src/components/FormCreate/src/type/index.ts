// 左侧拖拽按钮
export interface MenuItem {
  label: string
  name: string
  icon: string
}

// 左侧拖拽按钮分类
export interface Menu {
  title: string
  name: string
  list: MenuItem[]
}

// 通用下拉组件 Props 类型
export interface ApiSelectProps {
  name: string // 组件名称
  labelField?: string // 选项标签
  valueField?: string // 选项的值
  url?: string // url 接口
  isDict?: boolean // 是否字典选择器
}

// 选择组件规则配置类型
export interface SelectRuleOption {
  label: string // label 名称
  name: string // 组件名称
  icon: string // 组件图标
  props?: any[] // 组件规则
  event?: any[] // 事件配置
}

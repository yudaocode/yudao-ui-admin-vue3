import { Rule } from '@form-create/element-ui' //左侧拖拽按钮

//左侧拖拽按钮
export interface MenuItem {
  label: string
  name: string
  icon: string
}

//左侧拖拽按钮分类
export interface Menu {
  title: string
  name: string
  list: MenuItem[]
}

export interface MenuList extends Array<Menu> {}

//拖拽组件的规则
export interface DragRule {
  icon: string
  name: string
  label: string
  children?: string
  inside?: true
  drag?: true | String
  dragBtn?: false
  mask?: false

  rule(): Rule

  props(v: any, v1: any): Rule[]
}

// 通用下拉组件 Props 类型
export interface CurrencySelectProps {
  name: string // 组件名称
  labelField?: string // 字典类型
  valueField?: string // 字典值类型
  restful?: string // api 接口
}

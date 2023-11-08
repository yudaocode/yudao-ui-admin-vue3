import { ComponentStyle, DiyComponent } from '@/components/DiyEditor/util'

/** 列表导航属性 */
export interface MenuListProperty {
  // 导航菜单列表
  list: MenuListItemProperty[]
  // 组件样式
  style: ComponentStyle
}
/** 列表导航项目属性 */
export interface MenuListItemProperty {
  // 图标链接
  iconUrl: string
  // 标题
  title: string
  // 标题颜色
  titleColor: string
  // 副标题
  subtitle: string
  // 副标题颜色
  subtitleColor: string
  // 链接
  url: string
}

// 定义组件
export const component = {
  id: 'MenuList',
  name: '列表导航',
  icon: 'fa-solid:list',
  property: {
    list: [],
    style: {
      bgType: 'color',
      bgColor: '#fff',
      marginBottom: 8
    } as ComponentStyle
  }
} as DiyComponent<MenuListProperty>

import { DiyComponent } from '@/components/DiyEditor/util'

/** 顶部导航栏属性 */
export interface NavigationBarProperty {
  // 页面标题
  title: string
  // 页面描述
  description: string
  // 顶部导航高度
  navBarHeight: number
  // 页面背景颜色
  backgroundColor: string
  // 页面背景图片
  backgroundImage: string
  // 样式类型：默认 | 沉浸式
  styleType: 'default' | 'immersion'
  // 常驻显示
  alwaysShow: boolean
  // 是否显示返回按钮
  showGoBack: boolean
}

// 定义组件
export const component = {
  id: 'NavigationBar',
  name: '顶部导航栏',
  icon: 'tabler:layout-navbar',
  property: {
    title: '页面标题',
    description: '',
    navBarHeight: 35,
    backgroundColor: '#fff',
    backgroundImage: '',
    styleType: 'default',
    alwaysShow: true,
    showGoBack: true
  }
} as DiyComponent<NavigationBarProperty>

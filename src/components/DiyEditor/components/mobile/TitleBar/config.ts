import { DiyComponent } from '@/components/DiyEditor/util'

/** 标题栏属性 */
export interface TitleBarProperty {
  // 主标题
  title: string
  // 副标题
  description: string
  // 标题大小
  titleSize: number
  // 描述大小
  descriptionSize: number
  // 标题粗细
  titleWeight: number
  // 显示位置
  position: 'left' | 'center'
  // 描述粗细
  descriptionWeight: number
  // 标题颜色
  titleColor: string
  // 描述颜色
  descriptionColor: string
  // 背景颜色
  backgroundColor: string
  // 底部分割线
  showBottomBorder: false
  // 查看更多
  more: {
    // 是否显示查看更多
    show: false
    // 样式选择
    type: 'text' | 'icon' | 'all'
    // 自定义文字
    text: string
    // 链接
    url: string
  }
}

// 定义组件
export const component = {
  id: 'TitleBar',
  name: '标题栏',
  icon: 'material-symbols:line-start',
  property: {
    title: '主标题',
    description: '副标题',
    titleSize: 16,
    descriptionSize: 12,
    titleWeight: 400,
    position: 'left',
    descriptionWeight: 200,
    titleColor: 'rgba(50, 50, 51, 10)',
    descriptionColor: 'rgba(150, 151, 153, 10)',
    backgroundColor: 'rgba(255, 255, 255, 10)',
    showBottomBorder: false,
    more: {
      //查看更多
      show: false,
      type: 'icon',
      text: '查看更多',
      url: ''
    }
  }
} as DiyComponent<TitleBarProperty>

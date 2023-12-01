import { ComponentStyle, DiyComponent } from '@/components/DiyEditor/util'

/** 秒杀属性 */
export interface PromotionSeckillProperty {
  // 布局类型：单列 | 三列
  layoutType: 'oneCol' | 'threeCol'
  // 商品字段
  fields: {
    // 商品名称
    name: PromotionSeckillFieldProperty
    // 商品价格
    price: PromotionSeckillFieldProperty
  }
  // 角标
  badge: {
    // 是否显示
    show: boolean
    // 角标图片
    imgUrl: string
  }
  // 上圆角
  borderRadiusTop: number
  // 下圆角
  borderRadiusBottom: number
  // 间距
  space: number
  // 秒杀活动编号
  activityId: number
  // 组件样式
  style: ComponentStyle
}
// 商品字段
export interface PromotionSeckillFieldProperty {
  // 是否显示
  show: boolean
  // 颜色
  color: string
}

// 定义组件
export const component = {
  id: 'PromotionSeckill',
  name: '秒杀',
  icon: 'mdi:calendar-time',
  property: {
    activityId: undefined,
    layoutType: 'oneCol',
    fields: {
      name: { show: true, color: '#000' },
      price: { show: true, color: '#ff3000' }
    },
    badge: { show: false, imgUrl: '' },
    borderRadiusTop: 8,
    borderRadiusBottom: 8,
    space: 8,
    style: {
      bgType: 'color',
      bgColor: '',
      marginLeft: 8,
      marginRight: 8,
      marginBottom: 8
    } as ComponentStyle
  }
} as DiyComponent<PromotionSeckillProperty>

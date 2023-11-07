import { ref, Ref } from 'vue'
import { PageConfigProperty } from '@/components/DiyEditor/components/mobile/PageConfig/config'
import { NavigationBarProperty } from '@/components/DiyEditor/components/mobile/NavigationBar/config'
import { TabBarProperty } from '@/components/DiyEditor/components/mobile/TabBar/config'

// 页面装修组件
export interface DiyComponent<T> {
  // 组件唯一标识
  id: string
  // 组件名称
  name: string
  // 组件图标
  icon: string
  // 组件属性
  property: T
}

// 页面装修组件库
export interface DiyComponentLibrary {
  // 组件库名称
  name: string
  // 是否展开
  extended: boolean
  // 组件列表
  components: string[]
}

// 组件样式
export interface ComponentStyle {
  // 背景类型
  bgType: 'color' | 'img'
  // 背景颜色
  bgColor: string
  // 背景图片
  bgImg: string
  // 外边距
  margin: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  // 内边距
  padding: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  // 边框圆角
  borderRadius: number
  borderTopLeftRadius: number
  borderTopRightRadius: number
  borderBottomRightRadius: number
  borderBottomLeftRadius: number
}

// 页面配置
export interface PageConfig {
  // 页面属性
  page: PageConfigProperty
  // 顶部导航栏属性
  navigationBar: NavigationBarProperty
  // 底部导航菜单属性
  tabBar?: TabBarProperty
  // 页面组件列表
  components: PageComponent[]
}
// 页面组件，只保留组件ID，组件属性
export interface PageComponent extends Pick<DiyComponent<any>, 'id' | 'property'> {}

// 属性表单监听
export function usePropertyForm<T>(modelValue: T, emit: Function): { formData: Ref<T> } {
  const formData = ref<T>()
  // 监听属性数据变动
  watch(
    () => modelValue,
    () => {
      formData.value = modelValue
    },
    {
      deep: true,
      immediate: true
    }
  )
  // 监听表单数据变动
  watch(
    () => formData.value,
    () => {
      emit('update:modelValue', formData.value)
    },
    {
      deep: true
    }
  )

  return { formData }
}

// 页面组件库
export const PAGE_LIBS = [
  {
    name: '基础组件',
    extended: true,
    components: [
      'SearchBar',
      'NoticeBar',
      'GridNavigation',
      'ListNavigation',
      'Divider',
      'TitleBar'
    ]
  },
  { name: '图文组件', extended: true, components: ['ImageBar', 'Carousel', 'VideoPlayer'] },
  { name: '商品组件', extended: true, components: ['ProductCard'] },
  {
    name: '会员组件',
    extended: true,
    components: ['UserCard', 'OrderCard', 'WalletCard', 'CouponCard']
  },
  { name: '营销组件', extended: true, components: ['Combination', 'Seckill', 'Point', 'Coupon'] }
] as DiyComponentLibrary[]

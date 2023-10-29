import { DiyComponent } from '@/components/DiyEditor/util'

/** 轮播图属性 */
export interface CarouselProperty {
  // 选择模板
  swiperType: number
  // 图片圆角
  borderRadius: number
  // 页面边距
  pageMargin: number
  // 图片边距
  imageMargin: number
  // 分页类型
  pagingType: 'bullets' | 'fraction' | 'progressbar'
  // 一行个数
  rowIndividual: number
  // 添加图片
  items: CarouselItemProperty[]
}

export interface CarouselItemProperty {
  title: string
  imgUrl: string
  link: string
}

// 定义组件
export const component = {
  id: 'Carousel',
  name: '轮播图',
  icon: 'system-uicons:carousel',
  property: {
    swiperType: 0, // 选择模板
    borderRadius: 0, // 图片圆角
    pageMargin: 0, // 页面边距
    imageMargin: 0, // 图片边距
    pagingType: 'bullets', // 分页类型
    rowIndividual: 2, // 一行个数
    items: [
      { imgUrl: 'https://static.iocoder.cn/mall/banner-01.jpg' },
      { imgUrl: 'https://static.iocoder.cn/mall/banner-02.jpg' }
    ] as CarouselItemProperty[]
  }
} as DiyComponent<CarouselProperty>

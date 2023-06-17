import { CrudSchema } from '@/hooks/web/useCrudSchemas'

export const basicInfoSchema = reactive<CrudSchema[]>([
  {
    label: '商品名称',
    field: 'name'
  },
  {
    label: '关键字',
    field: 'keyword'
  },
  {
    label: '商品简介',
    field: 'introduction'
  },
  {
    label: '商品分类',
    field: 'categoryId'
  },
  {
    label: '商品品牌',
    field: 'brandId'
  },
  {
    label: '商品封面图',
    field: 'picUrl'
  },
  {
    label: '商品轮播图',
    field: 'sliderPicUrls'
  },
  {
    label: '商品视频',
    field: 'videoUrl'
  },
  {
    label: '单位',
    field: 'unit',
    dictType: DICT_TYPE.PRODUCT_UNIT
  },
  {
    label: '规格类型',
    field: 'specType'
  },
  {
    label: '分销类型',
    field: 'subCommissionType'
  },
  {
    label: '物流模版',
    field: 'deliveryTemplateId'
  },
  {
    label: '商品属性列表',
    field: 'skus'
  }
])
export const descriptionSchema = reactive<CrudSchema[]>([
  {
    label: '商品详情',
    field: 'description'
  }
])
export const otherSettingsSchema = reactive<CrudSchema[]>([
  {
    label: '商品排序',
    field: 'sort'
  },
  {
    label: '赠送积分',
    field: 'giveIntegral'
  },
  {
    label: '虚拟销量',
    field: 'virtualSalesCount'
  },
  {
    label: '是否热卖推荐',
    field: 'recommendHot'
  },
  {
    label: '是否优惠推荐',
    field: 'recommendBenefit'
  },
  {
    label: '是否精品推荐',
    field: 'recommendBest'
  },
  {
    label: '是否新品推荐',
    field: 'recommendNew'
  },
  {
    label: '是否优品推荐',
    field: 'recommendGood'
  },
  {
    label: '赠送的优惠劵',
    field: 'giveCouponTemplateIds'
  },
  {
    label: '活动显示排序',
    field: 'activityOrders'
  }
])

export interface Property {
  /**
   * 属性编号
   *
   * 关联 {@link ProductPropertyDO#getId()}
   */
  propertyId?: number
  /**
   * 属性值编号
   *
   * 关联 {@link ProductPropertyValueDO#getId()}
   */
  valueId?: number
  /**
   * 属性值名称
   */
  valueName?: string
}

export interface SkuType {
  /**
   * 商品 SKU 编号，自增
   */
  id?: number
  /**
   * SPU 编号
   */
  spuId?: number
  /**
   * 属性数组，JSON 格式
   */
  properties?: Property[]
  /**
   * 商品价格，单位：分
   */
  price?: number
  /**
   * 市场价，单位：分
   */
  marketPrice?: number
  /**
   * 成本价，单位：分
   */
  costPrice?: number
  /**
   * 商品条码
   */
  barCode?: string
  /**
   * 图片地址
   */
  picUrl?: string
  /**
   * 库存
   */
  stock?: number
  /**
   * 商品重量，单位：kg 千克
   */
  weight?: number
  /**
   * 商品体积，单位：m^3 平米
   */
  volume?: number

  /**
   * 一级分销的佣金，单位：分
   */
  subCommissionFirstPrice?: number
  /**
   * 二级分销的佣金，单位：分
   */
  subCommissionSecondPrice?: number

  /**
   * 商品销量
   */
  salesCount?: number
}

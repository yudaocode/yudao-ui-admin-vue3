import BasicInfoForm from './BasicInfoForm.vue'
import DescriptionForm from './DescriptionForm.vue'
import OtherSettingsForm from './OtherSettingsForm.vue'
import ProductAttributes from './ProductAttributes.vue'
import ProductPropertyAddForm from './ProductPropertyAddForm.vue'
import SkuList from './SkuList.vue'

import { Spu } from '@/api/mall/product/spu'

interface Properties {
  id: number
  name: string
  values?: Properties[]
}

interface RuleConfig {
  // 需要校验的字段
  // 例：name: 'name' 则表示校验 sku.name 的值
  // 例：name: 'productConfig.stock' 则表示校验 sku.productConfig.name 的值,此处 productConfig 表示我在 Sku 上扩展的属性
  name: string
  // 校验规格为一个毁掉函数，其中 arg 为需要校验的字段的值。
  // 例：需要校验价格必须大于0.01
  // {
  //  name:'price',
  //  rule:(arg) => arg > 0.01
  // }
  rule: (arg: any) => boolean
  // 校验不通过时的消息提示
  message: string
}

/**
 *  商品通用函数
 * @param spu
 */
const getPropertyList = (spu: Spu): Properties[] => {
  //  直接拿返回的 skus 属性逆向生成出 propertyList
  const properties: Properties[] = []
  // 只有是多规格才处理
  if (spu.specType) {
    spu.skus?.forEach((sku) => {
      sku.properties?.forEach(({ propertyId, propertyName, valueId, valueName }) => {
        // 添加属性
        if (!properties?.some((item) => item.id === propertyId)) {
          properties.push({ id: propertyId!, name: propertyName!, values: [] })
        }
        // 添加属性值
        const index = properties?.findIndex((item) => item.id === propertyId)
        if (!properties[index].values?.some((value) => value.id === valueId)) {
          properties[index].values?.push({ id: valueId!, name: valueName! })
        }
      })
    })
  }
  return properties
}

export {
  BasicInfoForm,
  DescriptionForm,
  OtherSettingsForm,
  ProductAttributes,
  ProductPropertyAddForm,
  SkuList,
  getPropertyList,
  Properties,
  RuleConfig
}

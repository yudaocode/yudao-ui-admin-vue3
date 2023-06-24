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
  name: string // 需要校验的字段
  geValue: number // TODO 暂定大于一个数字
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

<!-- WMS 往来企业选择器 -->
<template>
  <el-select
    v-bind="$attrs"
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :filter-method="handleFilter"
    :placeholder="placeholder"
    class="w-1/1"
    filterable
    @change="handleChange"
  >
    <el-option
      v-for="merchant in filteredList"
      :key="merchant.id!"
      :label="merchant.name"
      :value="merchant.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { MerchantApi, MerchantVO } from '@/api/wms/md/merchant'
import { CustomerMerchantTypeList, SupplierMerchantTypeList } from '@/views/wms/utils/constants'

/** WMS 往来企业选择器 */
defineOptions({ name: 'WmsMerchantSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    supplier?: boolean
    customer?: boolean
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择往来企业'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [merchant: MerchantVO | undefined]
}>()

const merchantList = ref<MerchantVO[]>([]) // 往来企业列表
const filteredList = ref<MerchantVO[]>([]) // 过滤后的往来企业列表

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 获得可选往来企业列表 */
const loadSelectableList = async () => {
  const types = props.supplier
    ? SupplierMerchantTypeList
    : props.customer
      ? CustomerMerchantTypeList
      : undefined
  merchantList.value = await MerchantApi.getMerchantSimpleList(types ? { types } : undefined)
  handleFilter('')
}

/** 前端过滤 */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = merchantList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = merchantList.value.filter((merchant) =>
    merchant.name?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (value: number | undefined) => {
  emit(
    'change',
    merchantList.value.find((merchant) => merchant.id === value)
  )
}

/** 供应商开关变化时，重新加载可选列表 */
watch(
  () => [props.supplier, props.customer],
  () => loadSelectableList()
)

/** 初始化 */
onMounted(() => loadSelectableList())
</script>

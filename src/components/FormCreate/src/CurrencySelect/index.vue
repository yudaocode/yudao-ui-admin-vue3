<template>
  <el-select class="w-1/1" v-bind="attrs">
    <el-option
      v-for="(item, index) in options"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script lang="ts" setup>
import request from '@/config/axios'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'CurrencySelect' })

// 接受父组件参数
interface Props {
  labelField?: string // 字典类型
  valueField?: string // 字典值类型
  restful?: string // api 接口
}

const props = withDefaults(defineProps<Props>(), {
  labelField: 'nickname',
  valueField: 'id',
  restful: '/system/user/simple-list'
})

const attrs = useAttrs()
const options = ref<any[]>([]) // 下拉数据
const getOptions = async () => {
  options.value = []
  if (isEmpty(props.restful)) {
    return
  }
  // TODO 只支持 GET 查询，复杂下拉构建条件请使用业务表单
  const data = await request.get({ url: props.restful })
  if (Array.isArray(data)) {
    options.value = data.map((item: any) => ({
      label: item[props.labelField],
      value: item[props.valueField]
    }))
    return
  }
  console.log(`接口[${props.restful}] 返回结果不是一个数组`)
}

onMounted(() => {
  getOptions()
})
</script>

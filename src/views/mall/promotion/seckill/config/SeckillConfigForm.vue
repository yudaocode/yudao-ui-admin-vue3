<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <Form ref="formRef" v-loading="formLoading" :rules="rules" :schema="allSchemas.formSchema" />
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" name="SeckillConfigForm" setup>
import * as SeckillConfigApi from '@/api/mall/promotion/seckill/seckillConfig'
import { allSchemas, rules } from './seckillConfig.data'
import { cloneDeep } from 'lodash-es'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await SeckillConfigApi.getSeckillConfig(id)
      data.sliderPicUrls = data['sliderPicUrls']?.map((item) => ({
        url: item
      }))
      formRef.value.setValues(data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.getElFormRef().validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    // 处理轮播图列表
    const data = formRef.value.formModel as SeckillConfigApi.SeckillConfigVO
    const cloneData = cloneDeep(data)
    const newSliderPicUrls = []
    cloneData.sliderPicUrls.forEach((item) => {
      // 如果是前端选的图
      typeof item === 'object' ? newSliderPicUrls.push(item.url) : newSliderPicUrls.push(item)
    })
    cloneData.sliderPicUrls = newSliderPicUrls
    if (formType.value === 'create') {
      await SeckillConfigApi.createSeckillConfig(cloneData)
      message.success(t('common.createSuccess'))
    } else {
      await SeckillConfigApi.updateSeckillConfig(cloneData)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>

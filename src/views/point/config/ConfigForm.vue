<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" style="width: 600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="积分抵扣" prop="tradeDeductEnable">
        <el-select v-model="formData.tradeDeductEnable" placeholder="请选择是否开启">
          <el-option
            v-for="dict in options"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="抵扣单位(元)" prop="tradeDeductUnitPrice">
        <el-input v-model="formData.tradeDeductUnitPrice" placeholder="请输入抵扣单位(元)" />
      </el-form-item>
      <el-form-item label="积分抵扣最大值" prop="tradeDeductMaxPrice">
        <el-input v-model="formData.tradeDeductMaxPrice" placeholder="请输入积分抵扣最大值" />
      </el-form-item>
      <el-form-item label="1元赠送多少分" prop="tradeGivePoint">
        <el-input v-model="formData.tradeGivePoint" placeholder="请输入1元赠送多少分" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/point/config'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  tradeDeductEnable: undefined,
  tradeDeductUnitPrice: undefined,
  tradeDeductMaxPrice: undefined,
  tradeGivePoint: undefined
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref

const options = [
  {
    value: '1',
    label: '是'
  },
  {
    value: '0',
    label: '否'
  }
]

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ConfigApi.getConfig(id)
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
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ConfigApi.ConfigVO
    if (formType.value === 'create') {
      await ConfigApi.createConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await ConfigApi.updateConfig(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    tradeDeductEnable: undefined,
    tradeDeductUnitPrice: undefined,
    tradeDeductMaxPrice: undefined,
    tradeGivePoint: undefined
  }
  formRef.value?.resetFields()
}
</script>

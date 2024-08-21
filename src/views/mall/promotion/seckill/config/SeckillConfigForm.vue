<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="秒杀时段名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入秒杀时段名称" />
      </el-form-item>
      <el-form-item label="开始时间点" prop="startTime">
        <el-time-picker
          v-model="formData.startTime"
          value-format="HH:mm:ss"
          placeholder="选择开始时间点"
        />
      </el-form-item>
      <el-form-item label="结束时间点" prop="endTime">
        <el-time-picker
          v-model="formData.endTime"
          value-format="HH:mm:ss"
          placeholder="选择结束时间点"
        />
      </el-form-item>
      <el-form-item label="秒杀轮播图" prop="sliderPicUrls">
        <UploadImgs v-model="formData.sliderPicUrls" placeholder="请输入秒杀轮播图" />
      </el-form-item>
      <el-form-item label="活动状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { SeckillConfigApi, SeckillConfigVO } from '@/api/mall/promotion/seckill/seckillConfig.ts'
import { CommonStatusEnum } from '@/utils/constants'

/** 秒杀时段 表单 */
defineOptions({ name: 'SeckillConfigForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  startTime: undefined,
  endTime: undefined,
  sliderPicUrls: undefined,
  status: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '秒杀时段名称不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间点不能为空', trigger: 'blur' }],
  endTime: [{ required: true, message: '结束时间点不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '活动状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await SeckillConfigApi.getSeckillConfig(id)
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
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as SeckillConfigVO
    if (formType.value === 'create') {
      await SeckillConfigApi.createSeckillConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await SeckillConfigApi.updateSeckillConfig(data)
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
    name: undefined,
    startTime: undefined,
    endTime: undefined,
    sliderPicUrls: [],
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="500">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="表情图" prop="url">
        <UploadImg v-model="formData.url" :limit="1" @update:model-value="onUrlChange" />
      </el-form-item>
      <el-form-item label="表情名" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="可选；如「狗头」「捂脸」"
          maxlength="64"
          show-word-limit
          class="w-1/1"
        />
      </el-form-item>
      <!-- 尺寸：拆两个 form-item 让 prop / rules 各自绑定，避免单 form-item 时 rules 不生效 -->
      <el-form-item label="宽度" prop="width">
        <el-input-number
          v-model="formData.width"
          :min="1"
          :max="2048"
          controls-position="right"
          class="!w-1/3"
        />
        <span class="ml-2 text-12px text-[var(--el-text-color-placeholder)]">
          上传后自动探测；可手动调整（1 ~ 2048 像素）
        </span>
      </el-form-item>
      <el-form-item label="高度" prop="height">
        <el-input-number
          v-model="formData.height"
          :min="1"
          :max="2048"
          controls-position="right"
          class="!w-1/3"
        />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          :max="9999"
          controls-position="right"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status" class="w-1/1">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ManagerFacePackItemApi from '@/api/im/manager/face/item'
import { probeImageSize } from '@/views/im/utils/image'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'ImManagerFacePackItemForm' })

const props = defineProps<{
  /** 所属表情包 id；create 时必填 */
  packId: number
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  packId: 0,
  url: '',
  name: '',
  width: undefined as number | undefined,
  height: undefined as number | undefined,
  sort: 0,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive<FormRules>({
  url: [{ required: true, message: '表情图不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  // 宽高自动探测后允许手改，但提交前必须落 1-2048 范围；防止用户清空后 submit 让后端报错
  // 范围 rule 加 transform 把 null/undefined 透传给 async-validator，让空值只触发上面的 required 文案
  width: [
    { required: true, message: '宽度不能为空', trigger: 'change' },
    {
      type: 'integer',
      min: 1,
      max: 2048,
      message: '宽度需在 1 - 2048 像素之间',
      trigger: 'change',
      transform: (value) => (value == null ? value : Number(value))
    }
  ],
  height: [
    { required: true, message: '高度不能为空', trigger: 'change' },
    {
      type: 'integer',
      min: 1,
      max: 2048,
      message: '高度需在 1 - 2048 像素之间',
      trigger: 'change',
      transform: (value) => (value == null ? value : Number(value))
    }
  ]
})
const formRef = ref() // 表单 Ref

/** 上传完成后从 URL 回探宽高，自动填表单（用户仍可手改） */
async function onUrlChange(url: string) {
  if (!url) {
    formData.value.width = undefined
    formData.value.height = undefined
    return
  }
  const size = await probeImageSize(url)
  formData.value.width = size.width
  formData.value.height = size.height
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增表情' : '修改表情'
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ManagerFacePackItemApi.getManagerFacePackItem(id)
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
    const data = formData.value as unknown as ManagerFacePackItemApi.ImManagerFacePackItemVO
    if (formType.value === 'create') {
      data.packId = props.packId
      await ManagerFacePackItemApi.createManagerFacePackItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await ManagerFacePackItemApi.updateManagerFacePackItem(data)
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
    packId: props.packId,
    url: '',
    name: '',
    width: undefined,
    height: undefined,
    sort: 0,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>

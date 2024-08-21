<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="等级名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入等级名称" class="!w-240px" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="等级" prop="level">
            <el-input-number
              v-model="formData.level"
              :min="0"
              :precision="0"
              placeholder="请输入等级"
              class="!w-240px"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="升级经验" prop="experience">
            <el-input-number
              v-model="formData.experience"
              :min="0"
              :precision="0"
              placeholder="请输入升级经验"
              class="!w-240px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="享受折扣(%)" prop="discountPercent">
            <el-input-number
              v-model="formData.discountPercent"
              :min="0"
              :max="100"
              :precision="0"
              placeholder="请输入享受折扣"
              class="!w-240px"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="等级图标">
            <UploadImg v-model="formData.icon" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="背景图">
            <UploadImg v-model="formData.backgroundUrl" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="状态" prop="status">
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as LevelApi from '@/api/member/level'
import { CommonStatusEnum } from '@/utils/constants'

/** 会员等级表单 **/
defineOptions({ name: 'MemberLevelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  experience: undefined,
  level: undefined,
  discountPercent: undefined,
  icon: undefined,
  backgroundUrl: undefined,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  name: [{ required: true, message: '等级名称不能为空', trigger: 'blur' }],
  experience: [{ required: true, message: '升级经验不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '等级不能为空', trigger: 'blur' }],
  discountPercent: [{ required: true, message: '享受折扣不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
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
      formData.value = await LevelApi.getLevel(id)
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
    const data = formData.value as unknown as LevelApi.LevelVO
    if (formType.value === 'create') {
      await LevelApi.createLevel(data)
      message.success(t('common.createSuccess'))
    } else {
      await LevelApi.updateLevel(data)
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
    experience: undefined,
    level: undefined,
    discountPercent: undefined,
    icon: undefined,
    backgroundUrl: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>

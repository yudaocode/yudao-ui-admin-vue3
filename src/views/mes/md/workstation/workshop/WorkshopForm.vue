<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="车间编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入车间编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="车间名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入车间名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="面积" prop="area">
            <el-input-number v-model="formData.area" :precision="2" :min="0" controls-position="right" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="chargeUserId">
            <el-select v-model="formData.chargeUserId" placeholder="请选择负责人" clearable class="!w-1/1">
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.nickname"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdWorkshopApi, MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'WorkshopForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增车间',
    update: '修改车间',
    detail: '查看车间'
  }
  return titles[formType.value] || formType.value
})
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  area: undefined,
  chargeUserId: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '车间编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '车间名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 加载用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdWorkshopApi.getWorkshop(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as MdWorkshopVO
    if (formType.value === 'create') {
      await MdWorkshopApi.createWorkshop(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdWorkshopApi.updateWorkshop(data)
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
    code: undefined,
    name: undefined,
    area: undefined,
    chargeUserId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

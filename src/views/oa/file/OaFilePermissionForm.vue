<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="共享类型" prop="subjectType">
            <el-select
              v-model="formData.subjectType"
              placeholder="请选择共享类型"
              @change="handleSubjectTypeChange"
              :disabled="formType === 'update'"
            >
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_FILE_SUBJECT_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="共享对象" prop="subjectId">
            <UserSelect
              v-if="formData.subjectType === OA_FILE_SUBJECT_TYPE.USER"
              v-model="formData.subjectId"
              :disabled="formType === 'update'"
            />
            <DeptSelect
              v-else
              v-model="formData.subjectId"
              :disabled="formType === 'update'"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="权限" prop="level">
            <template #label>
              <Tooltip
                title="权限"
                message="查看权限仅可查看文件信息，预览和下载需选择更高权限；管理权限可改名、编辑和管理共享，删除、移动仍由文件所有者操作。"
              />
            </template>
            <el-select v-model="formData.level" placeholder="请选择权限">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_FILE_PERMISSION_LEVEL)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="继承权限" prop="inherit">
            <template #label>
              <Tooltip title="继承权限" message="开启后对子项生效，关闭后子项需单独授权。" />
            </template>
            <el-switch v-model="formData.inherit" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="到期时间" prop="expireTime">
            <el-date-picker
              v-model="formData.expireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="不填则长期有效"
              clearable
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormRules } from 'element-plus'
import * as PermissionApi from '@/api/oa/file/permission'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { OA_FILE_PERMISSION_LEVEL, OA_FILE_SUBJECT_TYPE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaFilePermissionForm' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<PermissionApi.OaFilePermissionVO>({
  id: undefined,
  nodeId: 0,
  subjectType: OA_FILE_SUBJECT_TYPE.USER,
  subjectId: undefined,
  level: OA_FILE_PERMISSION_LEVEL.READ,
  inherit: true,
  expireTime: undefined
})
const formRules = reactive<FormRules>({
  subjectType: [{ required: true, message: '共享类型不能为空', trigger: 'change' }],
  subjectId: [{ required: true, message: '共享对象不能为空', trigger: 'change' }],
  level: [{ required: true, message: '权限不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, nodeId: number, row?: PermissionApi.OaFilePermissionVO) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type) + '共享'
  formType.value = type
  resetForm(nodeId)
  // 修改时回显已有授权，仅调整权限、继承和到期时间
  if (row) {
    formData.value = { ...row }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 切换共享类型 */
function handleSubjectTypeChange() {
  formData.value.subjectId = undefined
  formRef.value?.clearValidate('subjectId')
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await PermissionApi.saveFilePermission(formData.value)
    message.success(
      t(formType.value === 'create' ? 'common.createSuccess' : 'common.updateSuccess')
    )
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm(nodeId: number) {
  formRef.value?.resetFields()
  formData.value = {
    id: undefined,
    nodeId,
    subjectType: OA_FILE_SUBJECT_TYPE.USER,
    subjectId: undefined,
    level: OA_FILE_PERMISSION_LEVEL.READ,
    inherit: true,
    expireTime: undefined
  }
}
</script>

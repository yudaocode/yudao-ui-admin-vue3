<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <DeptSelect v-model="formData.deptId" placeholder="请选择所属部门" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="印章编号">
            <el-input v-model="formData.no" placeholder="保存后自动生成" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="印章名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入印章名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="印章类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择印章类型" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="印章分类" prop="category">
            <el-select v-model="formData.category" placeholder="请选择印章分类" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_CATEGORY)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="保管人" prop="keeperUserId">
            <UserSelectV2 v-model="formData.keeperUserId" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="保管部门" prop="keeperDeptId">
            <DeptSelect v-model="formData.keeperDeptId" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 状态及日期随表单保存 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="购买时间" prop="purchaseTime">
            <el-date-picker
              v-model="formData.purchaseTime"
              type="datetime"
              value-format="x"
              placeholder="请选择购买时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="启用时间" prop="enableTime">
            <el-date-picker
              v-model="formData.enableTime"
              type="datetime"
              value-format="x"
              placeholder="请选择启用时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="停用时间" prop="disableTime">
            <el-date-picker
              v-model="formData.disableTime"
              type="datetime"
              value-format="x"
              placeholder="请选择停用时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="印章照片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示顺序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="3"
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
import type { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { OaSealStatus } from '@/views/oa/utils/constants'
import * as SealApi from '@/api/oa/seal'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'

defineOptions({ name: 'OaSealForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<SealApi.SealVO>({ picUrl: '' }) // 表单数据
const formRules = reactive<FormRules>({
  deptId: [{ required: true, message: '所属部门不能为空', trigger: 'change' }],
  name: [{ required: true, message: '印章名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '印章类型不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  keeperUserId: [{ required: true, message: '保管人不能为空', trigger: 'change' }],
  keeperDeptId: [{ required: true, message: '保管部门不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '显示顺序不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await SealApi.getSeal(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await SealApi.createSeal(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await SealApi.updateSeal(formData.value)
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
function resetForm() {
  formData.value = {
    id: undefined,
    deptId: undefined,
    no: '',
    name: '',
    type: undefined,
    category: undefined,
    status: OaSealStatus.AVAILABLE,
    keeperUserId: undefined,
    keeperDeptId: undefined,
    purchaseTime: undefined,
    enableTime: undefined,
    disableTime: undefined,
    picUrl: '',
    sort: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>

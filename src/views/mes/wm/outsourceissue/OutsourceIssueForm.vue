<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isHeaderReadonly"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="发料单编号" prop="code" required>
            <el-input v-model="formData.code" placeholder="请输入发料单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发料单名称" prop="name" required>
            <el-input v-model="formData.name" placeholder="请输入发料单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发料日期" prop="issueDate">
            <el-date-picker
              v-model="formData.issueDate"
              type="date"
              value-format="x"
              placeholder="请选择发料日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="外协工单" prop="workOrderId">
            <!-- TODO @芋艿：【未来需要增加，过滤条件】 -->
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isHeaderReadonly" />
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
    <!-- 非新建模式展示行项目信息（发料物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <OutsourceIssueLineList :issue-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行拣货
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmOutsourceIssueApi, WmOutsourceIssueVO } from '@/api/mes/wm/outsourceissue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import OutsourceIssueLineList from './OutsourceIssueLineList.vue'

defineOptions({ name: 'OutsourceIssueForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create - 新增；update - 修改；stock - 拣货；detail - 详情
const isUpdate = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为拣货模式
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增外协发料单',
    update: '修改外协发料单',
    stock: '执行拣货',
    detail: '查看外协发料单'
  }
  return titles[formType.value] || t('action.' + formType.value)
})
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  vendorId: undefined,
  workOrderId: undefined,
  issueDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '发料单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '发料单名称不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成发料单编号 */
const generateCode = () => {
  formData.value.code = 'WOS' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceIssueApi.getOutsourceIssue(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmOutsourceIssueVO
    if (formType.value === 'create') {
      const res = await WmOutsourceIssueApi.createOutsourceIssue(data)
      message.success(t('common.createSuccess'))
      // 新增成功后，切换到修改模式，设置 id
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmOutsourceIssueApi.updateOutsourceIssue(data)
      message.success(t('common.updateSuccess'))
      dialogVisible.value = false
      emit('success')
    }
  } finally {
    formLoading.value = false
  }
}

/** 执行拣货 */
const handleStock = async () => {
  try {
    await message.confirm('确认执行拣货吗？执行后将进入待执行出库状态。')
    formLoading.value = true
    await WmOutsourceIssueApi.stockOutsourceIssue(formData.value.id!)
    message.success('拣货成功')
    dialogVisible.value = false
    emit('success')
  } catch {
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
    vendorId: undefined,
    workOrderId: undefined,
    issueDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

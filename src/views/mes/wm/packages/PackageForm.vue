<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="装箱单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入装箱单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="装箱日期" prop="packageDate">
            <el-date-picker
              v-model="formData.packageDate"
              type="date"
              value-format="x"
              placeholder="请选择装箱日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检查员" prop="inspectorUserId">
            <UserSelect v-model="formData.inspectorUserId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input
              v-model="formData.salesOrderCode"
              placeholder="请输入销售订单编号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发票编号" prop="invoiceCode">
            <el-input
              v-model="formData.invoiceCode"
              placeholder="请输入发票编号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="尺寸单位" prop="sizeUnitId">
            <MdUnitMeasureSelect v-model="formData.sizeUnitId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="箱长度" prop="length">
            <el-input-number
              v-model="formData.length"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="箱宽度" prop="width">
            <el-input-number
              v-model="formData.width"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="箱高度" prop="height">
            <el-input-number
              v-model="formData.height"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="重量单位" prop="weightUnitId">
            <MdUnitMeasureSelect v-model="formData.weightUnitId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="净重" prop="netWeight">
            <el-input-number
              v-model="formData.netWeight"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="毛重" prop="grossWeight">
            <el-input-number
              v-model="formData.grossWeight"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示子表信息 -->
    <template v-if="formData.id">
      <el-tabs v-model="activeTab" class="mt-15px">
        <el-tab-pane label="子箱" name="subPackage">
          <SubPackageList :package-id="formData.id" :form-type="formType" />
        </el-tab-pane>
        <el-tab-pane label="装箱清单" name="packageLine">
          <PackageLineList :package-id="formData.id" :form-type="formType" />
        </el-tab-pane>
      </el-tabs>
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmPackageStatusEnum.PREPARE"
        @click="handleFinish"
        type="warning"
        :disabled="formLoading"
      >
        完 成
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        完 成
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { WmPackageApi, WmPackageVO } from '@/api/mes/wm/packages'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import SubPackageList from './SubPackageList.vue'
import PackageLineList from './PackageLineList.vue'
import { MesAutoCodeRuleCode, MesWmPackageStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'PackageForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isFinish = computed(() => formType.value === 'finish') // 是否为完成模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['finish', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增装箱单',
    update: '修改装箱单',
    finish: '完成装箱单',
    detail: '查看装箱单'
  }
  return titles[formType.value] || formType.value
})
const activeTab = ref('subPackage')
const formData = ref({
  id: undefined as number | undefined,
  code: undefined as string | undefined,
  status: undefined as number | undefined,
  packageDate: undefined as number | undefined,
  salesOrderCode: undefined as string | undefined,
  invoiceCode: undefined as string | undefined,
  clientId: undefined as number | undefined,
  length: undefined as number | undefined,
  width: undefined as number | undefined,
  height: undefined as number | undefined,
  sizeUnitId: undefined as number | undefined,
  netWeight: undefined as number | undefined,
  grossWeight: undefined as number | undefined,
  weightUnitId: undefined as number | undefined,
  inspectorUserId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  code: [{ required: true, message: '装箱单编号不能为空', trigger: 'blur' }],
  packageDate: [{ required: true, message: '请选择装箱日期', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成装箱单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_PACKAGE_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'subPackage'
  resetForm()
  // 修改/完成/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = (await WmPackageApi.getPackage(id)) as any
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmPackageVO
    if (formType.value === 'create') {
      const res = await WmPackageApi.createPackage(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmPackageStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmPackageApi.updatePackage(data)
      message.success('修改成功')
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 完成操作：编辑模式下表单修改过则先保存，再完成 */
const handleFinish = async () => {
  try {
    await message.confirm('确认完成该装箱单？完成后将不可编辑。')
    formLoading.value = true
    // 编辑模式下，表单有修改时先保存
    if (isEditable.value && JSON.stringify(formData.value) !== originalFormData.value) {
      await formRef.value.validate()
      const data = formData.value as unknown as WmPackageVO
      await WmPackageApi.updatePackage(data)
    }
    await WmPackageApi.finishPackage(formData.value.id!)
    message.success('完成成功')
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
    status: undefined,
    packageDate: undefined,
    salesOrderCode: undefined,
    invoiceCode: undefined,
    clientId: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    sizeUnitId: undefined,
    netWeight: undefined,
    grossWeight: undefined,
    weightUnitId: undefined,
    inspectorUserId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

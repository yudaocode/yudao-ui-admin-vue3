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
            <el-input v-model="formData.code" placeholder="请输入装箱单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
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
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检查员" prop="inspectorUserId">
            <UserSelect v-model="formData.inspectorUserId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发票编号" prop="invoiceCode">
            <el-input v-model="formData.invoiceCode" placeholder="请输入发票编号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="尺寸单位" prop="sizeUnitId">
            <MdUnitMeasureSelect v-model="formData.sizeUnitId" :disabled="isDetail" />
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
            <MdUnitMeasureSelect v-model="formData.weightUnitId" :disabled="isDetail" />
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
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 编辑/详情时展示子表信息 -->
    <template v-if="formType !== 'create' && formData.id">
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
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!isDetail">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
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
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'

defineOptions({ name: 'PackageForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail')
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增装箱单',
    update: '修改装箱单',
    detail: '查看装箱单'
  }
  return titles[formType.value] || t('action.' + formType.value)
})
const activeTab = ref('subPackage')
const formData = ref({
  id: undefined as number | undefined,
  code: undefined as string | undefined,
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
const formRef = ref()

/** 生成装箱单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.WM_PACKAGE_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'subPackage'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = (await WmPackageApi.getPackage(id)) as any
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmPackageVO
    if (formType.value === 'create') {
      const res = await WmPackageApi.createPackage(data)
      message.success(t('common.createSuccess'))
      // 新增成功后，切换到修改模式，设置 id
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmPackageApi.updatePackage(data)
      message.success(t('common.updateSuccess'))
      dialogVisible.value = false
    }
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
</script>

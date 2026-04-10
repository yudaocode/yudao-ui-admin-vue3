<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="860px">
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
          <el-form-item label="库区编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入库区编码">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入库区名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所属仓库" prop="warehouseId">
            <el-select v-model="formData.warehouseId" placeholder="请选择仓库" class="!w-1/1">
              <el-option
                v-for="warehouse in warehouseList"
                :key="warehouse.id"
                :label="warehouse.name"
                :value="warehouse.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="面积" prop="area">
            <el-input-number
              v-model="formData.area"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否冻结" prop="frozen">
            <el-switch v-model="formData.frozen" />
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
      <!-- 编辑模式下，显示混放规则批量设置按钮 -->
      <template v-if="formType === 'update'">
        <el-divider content-position="left">库位混放规则（批量设置）</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="产品混放">
              <el-tooltip content="设置此库区下所有库位允许产品混放" placement="top">
                <el-button type="primary" plain size="small" @click="setProductMixing(true)">
                  允许
                </el-button>
              </el-tooltip>
              <el-tooltip content="设置此库区下所有库位不允许产品混放" placement="top">
                <el-button type="danger" plain size="small" @click="setProductMixing(false)">
                  不允许
                </el-button>
              </el-tooltip>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次混放">
              <el-tooltip content="设置此库区下所有库位允许批次混放" placement="top">
                <el-button type="primary" plain size="small" @click="setBatchMixing(true)">
                  允许
                </el-button>
              </el-tooltip>
              <el-tooltip content="设置此库区下所有库位不允许批次混放" placement="top">
                <el-button type="danger" plain size="small" @click="setBatchMixing(false)">
                  不允许
                </el-button>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>
    <template #footer>
      <el-button v-if="isDetail && formData.id" type="primary" plain @click="handleBarcode">
        查看条码
      </el-button>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">{{ isDetail ? '关 闭' : '取 消' }}</el-button>
    </template>
  </Dialog>
  <!-- 条码详情弹窗（详情模式下展示） -->
  <BarcodeDetail ref="barcodeDetailRef" />
</template>

<script setup lang="ts">
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode, BarcodeBizTypeEnum } from '@/views/mes/utils/constants'
import { BarcodeDetail } from '@/views/mes/wm/barcode/components'

defineOptions({ name: 'LocationForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增库区',
    update: '编辑库区',
    detail: '库区详情'
  }
  return titles[formType.value] || formType.value
})
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const warehouseList = ref<WmWarehouseVO[]>([]) // 仓库列表
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  warehouseId: undefined as number | undefined,
  area: undefined,
  frozen: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '库区名称不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '所属仓库不能为空', trigger: 'change' }],
  frozen: [{ required: true, message: '是否冻结不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const barcodeDetailRef = ref() // 条码详情弹窗 Ref

/** 查看条码 */
const handleBarcode = () => {
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id!, BarcodeBizTypeEnum.LOCATION, formData.value.code, formData.value.name
  )
}

/** 生成库区编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_LOCATION_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number, defaultWarehouseId?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  warehouseList.value = await WmWarehouseApi.getWarehouseSimpleList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmWarehouseLocationApi.getWarehouseLocation(id)
    } finally {
      formLoading.value = false
    }
    return
  }
  // 新增时，设置默认仓库（从列表页跳转过来时传入）
  if (defaultWarehouseId) {
    formData.value.warehouseId = defaultWarehouseId
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
    const data = formData.value as unknown as WmWarehouseLocationVO
    if (formType.value === 'create') {
      await WmWarehouseLocationApi.createWarehouseLocation(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmWarehouseLocationApi.updateWarehouseLocation(data)
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
    warehouseId: undefined as number | undefined,
    area: undefined,
    frozen: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 设置产品混放规则 */
const setProductMixing = async (allow: boolean) => {
  try {
    await ElMessageBox.confirm('确认要重置库区下所有库位的产品混放规则吗？', '提示', {
      type: 'warning'
    })
    await WmWarehouseLocationApi.updateAreaByLocationId(formData.value.id!, allow, undefined)
    message.success('设置成功')
  } catch {}
}

/** 设置批次混放规则 */
const setBatchMixing = async (allow: boolean) => {
  try {
    await ElMessageBox.confirm('确认要重置库区下所有库位的批次混放规则吗？', '提示', {
      type: 'warning'
    })
    await WmWarehouseLocationApi.updateAreaByLocationId(formData.value.id!, undefined, allow)
    message.success('设置成功')
  } catch {}
}
</script>

<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="860px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="库区编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入库区编码" />
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
      </el-row>
      <el-row>
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
    </el-form>
    <template #footer>
      <!-- TODO @芋艿：barcodeimg -->
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'LocationForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const warehouseList = ref<WmWarehouseVO[]>([]) // 仓库列表
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  warehouseId: undefined as number | undefined,
  area: undefined,
  areaStatus: CommonStatusEnum.ENABLE,
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

/** 打开弹窗 */
const open = async (type: string, id?: number, defaultWarehouseId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
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
    areaStatus: CommonStatusEnum.ENABLE,
    frozen: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

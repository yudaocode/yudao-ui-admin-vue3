<!-- ERP 仓库表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="仓库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入仓库名称" />
      </el-form-item>
      <el-form-item label="仓库地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入仓库地址" />
      </el-form-item>
      <el-form-item label="仓库状态" prop="status">
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
      <el-form-item label="仓储费" prop="warehousePrice">
        <el-input-number
          v-model="formData.warehousePrice"
          placeholder="请输入仓储费，单位：元/天/KG"
          :min="0"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="搬运费" prop="truckagePrice">
        <el-input-number
          v-model="formData.truckagePrice"
          placeholder="请输入搬运费，单位：元"
          :min="0"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="principal">
        <el-input v-model="formData.principal" placeholder="请输入负责人" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          placeholder="请输入排序"
          :precision="0"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { CommonStatusEnum } from '@/utils/constants'

/** ERP 仓库表单 */
defineOptions({ name: 'WarehouseForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  address: undefined,
  sort: undefined,
  remark: undefined,
  principal: undefined,
  warehousePrice: undefined,
  truckagePrice: undefined,
  status: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }]
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
      formData.value = await WarehouseApi.getWarehouse(id)
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
    const data = formData.value as unknown as WarehouseVO
    if (formType.value === 'create') {
      await WarehouseApi.createWarehouse(data)
      message.success(t('common.createSuccess'))
    } else {
      await WarehouseApi.updateWarehouse(data)
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
    address: undefined,
    sort: undefined,
    remark: undefined,
    principal: undefined,
    warehousePrice: undefined,
    truckagePrice: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>

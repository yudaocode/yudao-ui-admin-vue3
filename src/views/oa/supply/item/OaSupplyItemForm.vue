<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <DeptSelect v-model="formData.deptId" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物品名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入物品名称" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物品编码" prop="no">
            <el-input v-model="formData.no" placeholder="请输入物品编码" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类别" prop="category">
            <el-select v-model="formData.category" placeholder="请选择类别" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_CATEGORY)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="管理类型" prop="manageType">
            <el-select v-model="formData.manageType" placeholder="请选择管理类型" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规格型号" prop="model">
            <el-input v-model="formData.model" placeholder="请输入规格型号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计量单位" prop="unit">
            <el-input v-model="formData.unit" placeholder="请输入计量单位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="参考单价" prop="referencePrice">
            <el-input-number
              v-model="formData.referencePrice"
              placeholder="请输入参考单价"
              :min="0"
              :precision="2"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库存数量" prop="stockQuantity">
            <el-input-number
              v-model="formData.stockQuantity"
              placeholder="请输入库存数量"
              :min="0"
              :precision="0"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最低库存预警" prop="minStockQuantity">
            <el-input-number
              v-model="formData.minStockQuantity"
              placeholder="请输入最低库存预警值"
              :min="0"
              :precision="0"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物品图片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :value="0">正常</el-radio>
              <el-radio :value="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              placeholder="请输入排序"
              :precision="0"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
              maxlength="500"
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
import { CommonStatusEnum } from '@/utils/constants'
import type { FormRules } from 'element-plus'
import * as SupplyItemApi from '@/api/oa/supply/item'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'

defineOptions({ name: 'OaSupplyItemForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：修改时加载数据，提交时禁用按钮
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<SupplyItemApi.SupplyItemVO>({}) // 表单数据
const formRules = reactive<FormRules>({
  stockQuantity: [{ required: true, message: '库存数量不能为空', trigger: 'change' }],
  minStockQuantity: [{ required: true, message: '最低库存预警不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'change' }],
  deptId: [{ required: true, message: '所属部门不能为空', trigger: 'change' }],
  name: [{ required: true, message: '物品名称不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '类别不能为空', trigger: 'change' }],
  manageType: [{ required: true, message: '管理类型不能为空', trigger: 'change' }]
}) // 表单校验
const formRef = ref() // 表单引用

/** 打开弹窗 */
async function open(type: string, id?: number, category?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.category = category
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await SupplyItemApi.getSupplyItem(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 操作成功

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await SupplyItemApi.createSupplyItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await SupplyItemApi.updateSupplyItem(data)
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
    stockQuantity: 0,
    minStockQuantity: 0,
    status: CommonStatusEnum.ENABLE,
    sort: 0
  }
  formRef.value?.resetFields()
}
</script>

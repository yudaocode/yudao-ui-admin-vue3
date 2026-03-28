<!-- MES 物料产品的新增/修改 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="物料编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入物料编码">
              <template #append>
                <el-button @click="generateCode" :disabled="isDetail || formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入物料名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="规格型号" prop="specification">
            <el-input v-model="formData.specification" placeholder="请输入规格型号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位" prop="unitMeasureId">
            <MdUnitMeasureSelect v-model="formData.unitMeasureId" placeholder="请选择计量单位" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料分类" prop="itemTypeId">
            <MdItemTypeSelect v-model="formData.itemTypeId" @change="handleItemTypeChange" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status" disabled>
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
        <el-col :span="8">
          <el-form-item label="高值物料" prop="highValue">
            <el-switch v-model="formData.highValue" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次管理" prop="batchFlag">
            <el-switch v-model="formData.batchFlag" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="安全库存" prop="safeStockFlag">
            <el-switch v-model="formData.safeStockFlag" />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.safeStockFlag">
          <el-form-item label="最低库存量" prop="minStock">
            <el-input-number
              v-model="formData.minStock"
              placeholder="请输入最低库存量"
              :min="0"
              :precision="2"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.safeStockFlag">
          <el-form-item label="最高库存量" prop="maxStock">
            <el-input-number
              v-model="formData.maxStock"
              placeholder="请输入最高库存量"
              :min="0"
              :precision="2"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 底部 Tab：修改/详情时展示 -->
    <el-tabs v-model="activeTab" v-if="formType !== 'create' && formData.id">
      <el-tab-pane label="BOM 组成" name="bom" lazy>
        <MdProductBomForm :itemId="formData.id!" :formType="formType" />
      </el-tab-pane>
      <el-tab-pane label="批次属性" name="batch" lazy v-if="formData.batchFlag">
        <MdItemBatchConfigForm
          :itemId="formData.id!"
          :itemOrProduct="currentItemOrProduct"
          :formType="formType"
        />
      </el-tab-pane>
      <!-- TODO @芋艿：【对齐】替代品，目前没这个，可忽略 -->
      <el-tab-pane label="替代品" name="substitute" lazy>
        <el-empty description="替代品（待实现）" />
      </el-tab-pane>
      <el-tab-pane label="SIP" name="sip" lazy>
        <MdProductSipForm :itemId="formData.id!" :formType="formType" />
      </el-tab-pane>
      <el-tab-pane label="SOP" name="sop" lazy>
        <MdProductSopForm :itemId="formData.id!" :formType="formType" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MdItemBatchConfigForm from './MdItemBatchConfigForm.vue'
import MdProductBomForm from './MdProductBomForm.vue'
import MdProductSopForm from './MdProductSopForm.vue'
import MdProductSipForm from './MdProductSipForm.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'
import MdItemTypeSelect from '@/views/mes/md/item/type/components/MdItemTypeSelect.vue'
import { CommonStatusEnum } from '@/utils/constants'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'

/** MES 物料产品 表单 */
defineOptions({ name: 'MdItemForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增物料/产品',
    update: '修改物料/产品',
    detail: '查看物料/产品'
  }
  return titles[formType.value] || formType.value
}) // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const activeTab = ref('bom') // 当前激活的 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  specification: undefined,
  unitMeasureId: undefined,
  itemTypeId: undefined,
  status: CommonStatusEnum.DISABLE,
  safeStockFlag: false,
  minStock: 0,
  maxStock: 0,
  highValue: false,
  batchFlag: true,
  remark: undefined,
  itemOrProduct: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
  unitMeasureId: [{ required: true, message: '计量单位不能为空', trigger: 'change' }],
  itemTypeId: [{ required: true, message: '物料分类不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const currentItemOrProduct = computed(() => formData.value.itemOrProduct || '') // 物料/产品的标签

/** 生成物料编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.ITEM_CODE)
}

/** 分类变更时，同步更新 itemOrProduct */
const handleItemTypeChange = (type: any) => {
  formData.value.itemOrProduct = type?.itemOrProduct
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'bom'
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdItemApi.getItem(id)
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
    const data = formData.value as unknown as MdItemVO
    if (formType.value === 'create') {
      const id = await MdItemApi.createItem(data)
      message.success(t('common.createSuccess'))
      // 新增成功后，切换为修改模式（留在弹窗内，可继续编辑子 Tab）
      formData.value.id = id
      formType.value = 'update'
    } else {
      await MdItemApi.updateItem(data)
      message.success(t('common.updateSuccess'))
    }
    // 发送操作成功的事件，刷新列表
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
    specification: undefined,
    unitMeasureId: undefined,
    itemTypeId: undefined,
    status: CommonStatusEnum.DISABLE,
    safeStockFlag: false,
    minStock: 0,
    maxStock: 0,
    highValue: false,
    batchFlag: true,
    remark: undefined,
    itemOrProduct: undefined
  }
  formRef.value?.resetFields()
}
</script>

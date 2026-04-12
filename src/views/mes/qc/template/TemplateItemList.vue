<!-- MES 质检方案-产品关联 子列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button
        type="primary"
        plain
        size="small"
        @click="openForm('create')"
        v-hasPermi="['mes:qc-template:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增产品关联
      </el-button>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" width="130" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="130" />
      <el-table-column label="计量单位" align="center" prop="unitMeasureName" width="100" />
      <el-table-column label="最低检测数" align="center" prop="quantityCheck" width="110" />
      <el-table-column label="最大不合格数" align="center" prop="quantityUnqualified" width="120">
        <template #default="scope">
          {{ scope.row.quantityUnqualified === 0 ? '不启用' : scope.row.quantityUnqualified }}
        </template>
      </el-table-column>
      <el-table-column label="最大致命缺陷率(%)" align="center" prop="criticalRate" width="150" />
      <el-table-column label="最大严重缺陷率(%)" align="center" prop="majorRate" width="150" />
      <el-table-column label="最大轻微缺陷率(%)" align="center" prop="minorRate" width="150" />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-template:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-template:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        v-loading="formLoading"
      >
        <el-row>
          <el-col :span="24">
            <el-form-item label="产品物料" prop="itemId">
              <MdItemSelect v-model="formData.itemId" placeholder="请选择产品物料" class="!w-1/1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最低检测数" prop="quantityCheck">
              <el-input-number
                v-model="formData.quantityCheck"
                placeholder="请输入最低检测数"
                :min="1"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大不合格数" prop="quantityUnqualified">
              <el-tooltip content="超出最大不合格数后整批判定不合格，0表示不启用" placement="top">
                <el-input-number
                  v-model="formData.quantityUnqualified"
                  placeholder="0表示不启用"
                  :min="0"
                  class="!w-1/1"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="致命缺陷率(%)" prop="criticalRate">
              <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
                <el-input-number
                  v-model="formData.criticalRate"
                  placeholder="0表示不允许"
                  :min="0"
                  :max="100"
                  :precision="2"
                  class="!w-1/1"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="严重缺陷率(%)" prop="majorRate">
              <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
                <el-input-number
                  v-model="formData.majorRate"
                  placeholder="0表示不允许"
                  :min="0"
                  :max="100"
                  :precision="2"
                  class="!w-1/1"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="轻微缺陷率(%)" prop="minorRate">
              <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
                <el-input-number
                  v-model="formData.minorRate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  class="!w-1/1"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { QcTemplateItemApi, QcTemplateItemVO } from '@/api/mes/qc/template/item/index'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'TemplateItemList' })

const props = defineProps<{ templateId: number }>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<QcTemplateItemVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  if (!props.templateId) return
  loading.value = true
  try {
    const data = await QcTemplateItemApi.getTemplateItemPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  itemId: undefined,
  quantityCheck: 1,
  quantityUnqualified: 0,
  criticalRate: 0,
  majorRate: 0,
  minorRate: 100,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  quantityCheck: [{ required: true, message: '最低检测数不能为空', trigger: 'blur' }]
})

/** 添加/修改操作 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = props.templateId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateItemApi.getTemplateItem(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcTemplateItemVO
    if (formType.value === 'create') {
      await QcTemplateItemApi.createTemplateItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateItemApi.updateTemplateItem(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    templateId: undefined,
    itemId: undefined,
    quantityCheck: 1,
    quantityUnqualified: 0,
    criticalRate: 0,
    majorRate: 0,
    minorRate: 100,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcTemplateItemApi.deleteTemplateItem(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 监听 templateId 变化，重新加载列表 */
watch(
  () => props.templateId,
  () => getList(),
  { immediate: true }
)
</script>

<!-- MES 质检方案-产品关联 子列表 -->
<template>
  <div>
    <!-- 操作按钮 -->
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
      <!-- TODO @AI：去掉「产品物料ID」，替换成产品物料编码、产品物料名称、规格型号； -->
      <el-table-column label="产品物料ID" align="center" prop="itemId" width="120" />
      <el-table-column label="最低检测数" align="center" prop="quantityCheck" width="110" />
      <!-- TODO @AI：单位 -->
      <el-table-column label="最大不合格数" align="center" prop="quantityUnqualified" width="120">
        <template #default="scope">
          {{ scope.row.quantityUnqualified === 0 ? '不启用' : scope.row.quantityUnqualified }}
        </template>
      </el-table-column>
      <el-table-column label="最大致命缺陷率(%)" align="center" prop="criticalRate" width="150" />
      <el-table-column label="最大严重缺陷率(%)" align="center" prop="majorRate" width="150" />
      <el-table-column label="最大轻微缺陷率(%)" align="center" prop="minorRate" width="150" />
      <!-- TODO @AI:备注，去掉 -->
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
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

    <!-- 表单弹窗 -->
    <TemplateItemForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { QcTemplateApi, QcTemplateItemVO } from '@/api/mes/qc/template'
import TemplateItemForm from './TemplateItemForm.vue'

defineOptions({ name: 'TemplateItemList' })

const props = defineProps<{ templateId: number }>()

const message = useMessage()
const { t } = useI18n()

const loading = ref(false)
const list = ref<QcTemplateItemVO[]>([])

/** 查询列表 */
const getList = async () => {
  if (!props.templateId) return
  loading.value = true
  try {
    const data = await QcTemplateApi.getTemplateItemPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开表单 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.templateId)
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QcTemplateApi.deleteTemplateItem(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 监听 templateId 变化，重新加载 */
watch(
  () => props.templateId,
  () => getList(),
  { immediate: true }
)
</script>

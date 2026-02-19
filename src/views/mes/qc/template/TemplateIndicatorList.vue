<!-- MES 质检方案-检测指标项 子列表 -->
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
        <Icon icon="ep:plus" class="mr-5px" /> 新增指标项
      </el-button>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="检测项编码" align="center" prop="indicatorCode" width="140" />
      <el-table-column label="检测项名称" align="center" prop="indicatorName" min-width="150" />
      <el-table-column label="检测项类型" align="center" prop="indicatorType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_INDEX_TYPE" :value="scope.row.indicatorType" />
        </template>
      </el-table-column>
      <el-table-column label="检测工具" align="center" prop="indicatorTool" width="120" />
      <el-table-column label="检测方法" align="center" prop="checkMethod" min-width="180" />
      <el-table-column label="标准值" align="center" prop="standardValue" width="100" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="误差上限" align="center" prop="thresholdMax" width="100" />
      <el-table-column label="误差下限" align="center" prop="thresholdMin" width="100" />
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
    <TemplateIndicatorForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { QcTemplateIndicatorApi, QcTemplateIndicatorVO } from '@/api/mes/qc/template/indicator'
import TemplateIndicatorForm from './TemplateIndicatorForm.vue'

defineOptions({ name: 'TemplateIndicatorList' })

const props = defineProps<{ templateId: number }>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<QcTemplateIndicatorVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  if (!props.templateId) return
  loading.value = true
  try {
    const data = await QcTemplateIndicatorApi.getTemplateIndicatorPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.templateId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcTemplateIndicatorApi.deleteTemplateIndicator(id)
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

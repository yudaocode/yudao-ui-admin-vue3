<!-- MES 生产工序内容（操作步骤）列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="openForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加步骤
      </el-button>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" align="center" prop="sort" width="80" />
      <el-table-column label="步骤说明" align="center" prop="content" min-width="200" />
      <el-table-column label="辅助设备" align="center" prop="device" width="150" />
      <el-table-column label="辅助材料" align="center" prop="material" width="150" />
      <el-table-column label="材料文档" align="center" prop="docUrl" width="150" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <ProProcessContentForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { ProProcessContentApi, ProProcessContentVO } from '@/api/mes/pro/process/content'
import ProProcessContentForm from './ProProcessContentForm.vue'

defineOptions({ name: 'ProProcessContentList' })

const props = defineProps<{
  processId: number // 工序编号
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<ProProcessContentVO[]>([]) // 列表的数据
const formRef = ref<InstanceType<typeof ProProcessContentForm>>() // 表单 Ref

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await ProProcessContentApi.getProcessContentListByProcessId(props.processId)
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const openForm = (type: string, row?: ProProcessContentVO) => {
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formRef.value!.open(type, props.processId, maxSort, row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProProcessContentApi.deleteProcessContent(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 监听工序编号变化，自动刷新列表 */
watch(
  () => props.processId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>

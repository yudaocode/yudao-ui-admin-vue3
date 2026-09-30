<template>
  <!-- 笔记目录列表 -->
  <Dialog v-model="dialogVisible" title="管理笔记目录" width="640px">
    <div class="mb-12px flex justify-end">
      <el-button type="primary" @click="openForm('create')">
        <Icon icon="ep:plus" /> 新增目录
      </el-button>
    </div>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="目录名称" prop="name" min-width="180" />
      <el-table-column label="排序" prop="sort" width="100" />
      <el-table-column label="操作" align="center" width="140">
        <template #default="scope">
          <el-button type="primary" link @click="openForm('update', scope.row.id)">
            修改
          </el-button>
          <el-button type="danger" link @click="handleDelete(scope.row.id)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>

  <!-- 独立目录表单 -->
  <OaNoteCategoryForm ref="formRef" @success="handleSuccess" />
</template>

<script setup lang="ts">
import * as NoteCategoryApi from '@/api/oa/note/category'
import OaNoteCategoryForm from './OaNoteCategoryForm.vue'

defineOptions({ name: 'OaNoteCategoryList' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 列表弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<NoteCategoryApi.OaNoteCategoryVO[]>([]) // 目录列表
const formRef = ref<InstanceType<typeof OaNoteCategoryForm>>() // 表单 Ref
const emit = defineEmits<{ success: [] }>() // 目录变更通知

/** 打开目录管理 */
function open() {
  dialogVisible.value = true
  getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询目录列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await NoteCategoryApi.getNoteCategoryList()
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 目录保存成功 */
async function handleSuccess() {
  await getList()
  emit('success')
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm(
      '删除目录会同时删除目录内的笔记，所有共享接收人也将无法查看，是否继续？'
    )
    // 发起删除
    await NoteCategoryApi.deleteNoteCategory(id)
    message.success(t('common.delSuccess'))
    // 刷新目录列表并通知父组件
    await getList()
    emit('success')
  } catch {}
}
</script>

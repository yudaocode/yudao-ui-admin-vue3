<template>
  <!-- 联系人分类列表 -->
  <Dialog v-model="dialogVisible" title="管理联系人分类" width="640px">
    <div class="mb-12px flex justify-end">
      <el-button type="primary" @click="openForm('create')">
        <Icon icon="ep:plus" /> 新增分类
      </el-button>
    </div>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="分类名称" prop="name" min-width="180" />
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

  <!-- 独立分类表单 -->
  <OaContactCategoryForm ref="formRef" @success="handleSuccess" />
</template>

<script setup lang="ts">
import * as ContactCategoryApi from '@/api/oa/contact/category'
import OaContactCategoryForm from './OaContactCategoryForm.vue'

defineOptions({ name: 'OaContactCategoryList' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 列表弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<ContactCategoryApi.OaContactCategoryVO[]>([]) // 分类列表
const formRef = ref<InstanceType<typeof OaContactCategoryForm>>() // 表单 Ref
const emit = defineEmits<{ success: [] }>() // 分类变更通知

/** 打开分类管理 */
function open() {
  dialogVisible.value = true
  getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询分类列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await ContactCategoryApi.getContactCategoryList()
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 分类保存成功 */
async function handleSuccess() {
  await getList()
  emit('success')
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm('删除分类后，原分类下的联系人将变为未分类，是否继续？')
    // 发起删除
    await ContactCategoryApi.deleteContactCategory(id)
    message.success(t('common.delSuccess'))
    // 刷新分类列表并通知父组件
    await getList()
    emit('success')
  } catch {}
}
</script>

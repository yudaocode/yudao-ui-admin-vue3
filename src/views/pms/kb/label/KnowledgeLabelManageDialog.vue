<template>
  <Dialog v-model="dialogVisible" title="管理文档标签" width="720px">
    <div class="mb-16px flex items-center justify-between">
      <span class="text-13px text-[var(--el-text-color-secondary)]">
        文档标签可用于归类和快速筛选知识文档
      </span>
      <el-button
        v-hasPermi="['pms:kb:library:update']"
        type="primary"
        @click="labelFormRef?.open('create')"
      >
        新增标签
      </el-button>
    </div>
    <!-- 标签列表 -->
    <el-table v-loading="loading" :data="labelList" :show-overflow-tooltip="true">
      <el-table-column label="标签" min-width="220">
        <template #default="scope">
          <el-tag :color="scope.row.color" effect="dark">{{ scope.row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="颜色" prop="color" width="140" />
      <el-table-column align="center" label="操作" width="160">
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:kb:library:update']"
            link
            type="primary"
            @click="labelFormRef?.open('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-popconfirm
            v-hasPermi="['pms:kb:library:delete']"
            cancel-button-text="取消"
            confirm-button-text="确定"
            :title="`确认删除标签“${scope.row.name}”吗？`"
            width="240"
            @confirm="handleDelete(scope.row)"
          >
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>

  <!-- 新增或修改文档标签 -->
  <KnowledgeLabelForm ref="labelFormRef" @success="handleLabelChanged" />
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentLabelApi from '@/api/pms/kb/content/document/label'
import KnowledgeLabelForm from './KnowledgeLabelForm.vue'

defineOptions({ name: 'PmsKnowledgeLabelManageDialog' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const loading = ref(false) // 列表加载中
const labelList = ref<KnowledgeDocumentLabelApi.PmsKnowledgeDocumentLabelVO[]>([]) // 标签列表
const labelFormRef = ref<InstanceType<typeof KnowledgeLabelForm>>() // 标签表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open() {
  dialogVisible.value = true
  await getLabelList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
async function getLabelList() {
  loading.value = true
  try {
    labelList.value = await KnowledgeDocumentLabelApi.getKnowledgeDocumentLabelList()
  } finally {
    loading.value = false
  }
}

/** 删除文档标签 */
async function handleDelete(label: KnowledgeDocumentLabelApi.PmsKnowledgeDocumentLabelVO) {
  // 发起删除
  await KnowledgeDocumentLabelApi.deleteKnowledgeDocumentLabel(label.id)
  message.success('删除成功')
  await handleLabelChanged()
}

/** 处理标签数据变化 */
async function handleLabelChanged() {
  await getLabelList()
  emit('success')
}
</script>

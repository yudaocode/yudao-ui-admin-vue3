<!-- MES 生产工序内容（操作步骤）子组件 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="openContentForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加步骤
      </el-button>
    </el-row>
    <!-- 步骤列表 -->
    <el-table v-loading="loading" :data="contentList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" align="center" prop="sort" width="80" />
      <el-table-column label="步骤说明" align="center" prop="content" min-width="200" />
      <el-table-column label="辅助设备" align="center" prop="device" width="150" />
      <el-table-column label="辅助材料" align="center" prop="material" width="150" />
      <el-table-column label="材料文档" align="center" prop="docUrl" width="150" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130">
        <template #default="scope">
          <el-button link type="primary" @click="openContentForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteContent(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 步骤表单弹窗 -->
    <Dialog :title="contentDialogTitle" v-model="contentDialogVisible" width="600px">
      <el-form
        ref="contentFormRef"
        :model="contentFormData"
        :rules="contentFormRules"
        label-width="100px"
        v-loading="contentFormLoading"
      >
        <el-form-item label="序号" prop="sort">
          <el-input-number
            v-model="contentFormData.sort"
            :min="1"
            :max="999"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="步骤说明" prop="content">
          <el-input
            v-model="contentFormData.content"
            type="textarea"
            :rows="3"
            placeholder="请输入步骤说明"
          />
        </el-form-item>
        <el-form-item label="辅助设备" prop="device">
          <el-input v-model="contentFormData.device" placeholder="请输入辅助设备" />
        </el-form-item>
        <el-form-item label="辅助材料" prop="material">
          <el-input v-model="contentFormData.material" placeholder="请输入辅助材料" />
        </el-form-item>
        <el-form-item label="材料文档 URL" prop="docUrl">
          <el-input v-model="contentFormData.docUrl" placeholder="请输入材料文档 URL" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="contentFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitContentForm" type="primary" :loading="contentFormLoading">确 定</el-button>
        <el-button @click="contentDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProProcessContentApi, ProProcessContentVO } from '@/api/mes/pro/process/content'

defineOptions({ name: 'ProProcessContentTable' })

const props = defineProps<{
  processId: number
}>()

const message = useMessage()
const { t } = useI18n()

// ==================== 步骤列表 ====================
const loading = ref(false)
const contentList = ref<ProProcessContentVO[]>([])

/** 查询步骤列表 */
const getContentList = async () => {
  loading.value = true
  try {
    contentList.value = await ProProcessContentApi.getProcessContentListByProcessId(props.processId)
  } finally {
    loading.value = false
  }
}

/** 删除步骤 */
const handleDeleteContent = async (id: number) => {
  try {
    await message.delConfirm()
    await ProProcessContentApi.deleteProcessContent(id)
    message.success(t('common.delSuccess'))
    await getContentList()
  } catch {}
}

// ==================== 步骤表单 ====================
const contentDialogVisible = ref(false)
const contentDialogTitle = ref('')
const contentFormLoading = ref(false)
const contentFormType = ref('')
const contentFormData = ref<Partial<ProProcessContentVO>>({
  id: undefined,
  processId: undefined,
  sort: 1,
  content: '',
  device: '',
  material: '',
  docUrl: '',
  remark: ''
})
const contentFormRules = reactive({
  sort: [{ required: true, message: '序号不能为空', trigger: 'blur' }]
})
const contentFormRef = ref()

/** 打开步骤表单弹窗 */
const openContentForm = async (type: string, row?: ProProcessContentVO) => {
  contentDialogVisible.value = true
  contentDialogTitle.value = type === 'create' ? '添加操作步骤' : '编辑操作步骤'
  contentFormType.value = type
  // 重置表单
  const maxSort = contentList.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  contentFormData.value = {
    id: undefined,
    processId: props.processId,
    sort: maxSort + 1,
    content: '',
    device: '',
    material: '',
    docUrl: '',
    remark: ''
  }
  // 编辑时设置数据
  if (row) {
    contentFormData.value = { ...row }
  }
}

/** 提交步骤表单 */
const submitContentForm = async () => {
  await contentFormRef.value.validate()
  contentFormLoading.value = true
  try {
    const data = contentFormData.value as ProProcessContentVO
    if (contentFormType.value === 'create') {
      await ProProcessContentApi.createProcessContent(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProProcessContentApi.updateProcessContent(data)
      message.success(t('common.updateSuccess'))
    }
    contentDialogVisible.value = false
    await getContentList()
  } finally {
    contentFormLoading.value = false
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getContentList()
})
</script>

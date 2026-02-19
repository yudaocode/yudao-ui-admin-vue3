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
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        v-loading="formLoading"
      >
        <el-form-item label="序号" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="1"
            :max="999"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="步骤说明" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="3"
            placeholder="请输入步骤说明"
          />
        </el-form-item>
        <el-form-item label="辅助设备" prop="device">
          <el-input v-model="formData.device" placeholder="请输入辅助设备" />
        </el-form-item>
        <el-form-item label="辅助材料" prop="material">
          <el-input v-model="formData.material" placeholder="请输入辅助材料" />
        </el-form-item>
        <el-form-item label="材料文档 URL" prop="docUrl">
          <el-input v-model="formData.docUrl" placeholder="请输入材料文档 URL" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProProcessContentApi, ProProcessContentVO } from '@/api/mes/pro/process/content'

defineOptions({ name: 'ProProcessContentList' })

const props = defineProps<{
  processId: number // 工序编号
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<ProProcessContentVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await ProProcessContentApi.getProcessContentListByProcessId(props.processId)
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
const formData = ref<Partial<ProProcessContentVO>>({
  id: undefined,
  processId: undefined,
  sort: 1,
  content: '',
  device: '',
  material: '',
  docUrl: '',
  remark: ''
})
const formRules = reactive({
  sort: [{ required: true, message: '序号不能为空', trigger: 'blur' }]
})

/** 添加/修改操作 */
const openForm = (type: string, row?: ProProcessContentVO) => {
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加操作步骤' : '编辑操作步骤'
  formType.value = type
  resetForm(props.processId, maxSort)
  // 修改时，设置数据
  if (row) {
    formData.value = { ...row }
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
    const data = formData.value as ProProcessContentVO
    if (formType.value === 'create') {
      await ProProcessContentApi.createProcessContent(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProProcessContentApi.updateProcessContent(data)
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
const resetForm = (processId: number, maxSort: number) => {
  formData.value = {
    id: undefined,
    processId,
    sort: maxSort + 1,
    content: '',
    device: '',
    material: '',
    docUrl: '',
    remark: ''
  }
  formRef.value?.resetFields()
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

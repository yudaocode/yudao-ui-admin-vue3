<!-- MES 工作站-人力资源 列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
      v-if="!isDetail"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加人员
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="岗位编号" align="center" prop="postId" />
      <el-table-column label="岗位名称" align="center" prop="postName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120" v-if="!isDetail">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <el-form-item label="岗位" prop="postId">
          <el-select v-model="formData.postId" placeholder="请选择岗位" class="!w-1/1">
            <el-option
              v-for="post in postList"
              :key="post.id"
              :label="post.name"
              :value="post.id!"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdWorkstationWorkerApi, MdWorkstationWorkerVO } from '@/api/mes/md/workstation/worker'
import * as PostApi from '@/api/system/post'

defineOptions({ name: 'WorkstationWorkerList' })

const props = defineProps<{
  workstationId: number // 工作站编号
  formType: string // 业务表单的类型
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const isDetail = computed(() => props.formType === 'detail') // 是否详情模式（只读）

const loading = ref(false) // 列表的加载中
const list = ref<MdWorkstationWorkerVO[]>([]) // 列表的数据
const postList = ref<PostApi.PostVO[]>([]) // 岗位下拉列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationWorkerApi.getWorkstationWorkerList(props.workstationId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const dialogFormType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  postId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
})
const formRules = reactive({
  postId: [{ required: true, message: '岗位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = async (type: string, row?: MdWorkstationWorkerVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  dialogFormType.value = type
  resetForm()
  // 加载岗位列表
  postList.value = await PostApi.getSimplePostList()
  // 修改时，设置数据
  if (type === 'update' && row) {
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
    const data = formData.value as unknown as MdWorkstationWorkerVO
    if (dialogFormType.value === 'create') {
      await MdWorkstationWorkerApi.createWorkstationWorker(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdWorkstationWorkerApi.updateWorkstationWorker(data)
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
    workstationId: props.workstationId,
    postId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdWorkstationWorkerApi.deleteWorkstationWorker(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 workstationId 变化，加载列表 */
watch(
  () => props.workstationId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <el-button type="primary" plain size="small" @click="openAddForm" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加人员
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="岗位编号" align="center" prop="postId" />
      <el-table-column label="岗位名称" align="center" prop="postName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openEditForm(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑弹窗 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="岗位" prop="postId">
          <el-select
            v-model="formData.postId"
            placeholder="请选择岗位"
            class="!w-1/1"
            :disabled="formType === 'update'"
          >
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
        <el-button @click="submitForm" type="primary">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdWorkstationWorkerApi, MdWorkstationWorkerVO } from '@/api/mes/md/workstation/worker'
import * as PostApi from '@/api/system/post'

const props = defineProps<{
  workstationId: number // 工作站编号
}>()

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表加载中
const list = ref<MdWorkstationWorkerVO[]>([]) // 人力资源列表
const postList = ref<PostApi.PostVO[]>([]) // 岗位下拉列表

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationWorkerApi.getWorkstationWorkerList(props.workstationId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/编辑人员 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  postId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  postId: [{ required: true, message: '岗位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
}) // 表单校验规则

// TODO @AI：是不是 openForm、resetForm 更好？因为编辑和添加其实是同一个表单，区别只是 formType 不同；这样和别的模块，更统一；

/** 打开添加弹窗 */
const openAddForm = async () => {
  dialogVisible.value = true
  dialogTitle.value = '添加人员'
  formType.value = 'create'
  // 加载岗位列表
  postList.value = await PostApi.getSimplePostList()
  formData.value = {
    id: undefined,
    workstationId: props.workstationId,
    postId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 打开编辑弹窗 */
const openEditForm = async (row: MdWorkstationWorkerVO) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑人员'
  formType.value = 'update'
  // 加载岗位列表
  postList.value = await PostApi.getSimplePostList()
  formData.value = { ...row }
}

/** 提交表单 */
const submitForm = async () => {
  // TODO @AI：和别的模块保持一致；类似 loading 啥的
  await formRef.value.validate()
  if (formType.value === 'update') {
    await MdWorkstationWorkerApi.updateWorkstationWorker(
      formData.value as unknown as MdWorkstationWorkerVO
    )
    message.success('编辑成功')
  } else {
    await MdWorkstationWorkerApi.createWorkstationWorker(
      formData.value as unknown as MdWorkstationWorkerVO
    )
    message.success('添加成功')
  }
  dialogVisible.value = false
  await getList()
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

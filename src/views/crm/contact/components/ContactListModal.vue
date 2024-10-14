<template>
  <Dialog v-model="dialogVisible" title="关联联系人">
    <!-- 搜索工作栏 -->
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="90px"
      >
        <el-form-item label="联系人名称" prop="name">
          <el-input
            v-model="queryParams.name"
            class="!w-240px"
            clearable
            placeholder="请输入联系人名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
          <el-button v-hasPermi="['crm:business:create']" type="primary" @click="openForm()">
            <Icon class="mr-5px" icon="ep:plus" />
            新增
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap class="mt-10px">
      <el-table
        ref="contactRef"
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
        :stripe="true"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column align="center" fixed="left" label="姓名" prop="name">
          <template #default="scope">
            <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column align="center" label="手机号" prop="mobile" />
        <el-table-column align="center" label="职位" prop="post" />
        <el-table-column align="center" label="直属上级" prop="parentName" />
        <el-table-column align="center" label="是否关键决策人" min-width="100" prop="master">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <!-- 表单弹窗：添加 -->
    <ContactForm ref="formRef" @success="getList" />
  </Dialog>
</template>
<script lang="ts" setup>
import * as ContactApi from '@/api/crm/contact'
import ContactForm from '../ContactForm.vue'
import { DICT_TYPE } from '@/utils/dict'

const message = useMessage() // 消息弹窗
const props = defineProps<{
  customerId: number
}>()
defineOptions({ name: 'ContactListModal' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryFormRef = ref() // 搜索的表单
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  customerId: props.customerId
})

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  queryParams.customerId = props.customerId // 解决 props.customerId 没更新到 queryParams 上的问题
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ContactApi.getContactPageByCustomer(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加操作 */
const formRef = ref()
const openForm = () => {
  formRef.value.open('create')
}

/** 关联联系人提交 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const contactRef = ref()
const submitForm = async () => {
  const contactIds = contactRef.value.getSelectionRows().map((row: ContactApi.ContactVO) => row.id)
  if (contactIds.length === 0) {
    return message.error('未选择联系人')
  }
  dialogVisible.value = false
  emit('success', contactIds, contactRef.value.getSelectionRows())
}

/** 打开联系人详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}
</script>

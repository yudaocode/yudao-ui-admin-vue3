<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button>
      <Icon class="mr-5px" icon="system-uicons:contacts" />
      创建联系人
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="姓名" fixed="left" align="center" prop="name">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="mobile" />
      <el-table-column label="职位" align="center" prop="post" />
      <el-table-column label="直属上级" align="center" prop="parentName" />
      <el-table-column label="是否关键决策人" align="center" prop="master">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="200">
        <template #default="scope">
          <el-button
            plain
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['crm:contact:update']"
          >
            编辑
          </el-button>
          <el-button
            plain
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['crm:contact:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ContactForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import * as ContactApi from '@/api/crm/contact'
import ContactForm from './../ContactForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { BizTypeEnum } from '@/api/crm/permission'

defineOptions({ name: 'CrmContactList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown // 允许 undefined + number
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 置空参数
    queryParams.customerId = undefined
    // 执行查询
    let data = { list: [], total: 0 }
    switch (props.bizType) {
      case BizTypeEnum.CRM_CUSTOMER:
        queryParams.customerId = props.bizId
        data = await ContactApi.getContactPageByCustomer(queryParams)
        break
      default:
        return
    }
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ContactApi.deleteContact(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 打开客户详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 监听打开的 bizId + bizType，从而加载最新的列表 */
watch(
  () => [props.bizId, props.bizType],
  () => {
    handleQuery()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <!-- 搜索 -->
  <content-wrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="公众号" prop="accountId">
        <el-select v-model="queryParams.accountId" placeholder="请选择公众号">
          <el-option
            v-for="item in accounts"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标签名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入标签名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="openModal('create')" v-hasPermi="['mp:tag:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="info" @click="handleSync" v-hasPermi="['mp:tag:sync']">
          <Icon icon="ep:refresh" class="mr-5px" /> 同步
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mp:tag:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="标签名称" align="center" prop="name" />
      <el-table-column label="粉丝数" align="center" prop="count" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['mp:tag:update']"
            ><Icon icon="ep:edit" class="mr-5px" />修改
          </el-button>
          <el-button
            link
            size="small"
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mp:tag:delete']"
          >
            <Icon icon="ep:delete" class="mr-5px" />删除
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
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <mpTagForm ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="MpTag">
import { dateFormatter } from '@/utils/formatTime'
// import download from '@/utils/download'
import * as MpTagApi from '@/api/mp/tag'
import * as MpAccountAPI from '@/api/mp/account'
import mpTagForm from './form.vue'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: '',
  name: null
})

interface accountsType {
  id?: string | number | any
  name?: string | any
}
let accounts = [] as accountsType // 公众号账号列表
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询参数列表 */
const getList = async () => {
  // 如果没有选中公众号账号，则进行提示。
  try {
    if (!queryParams.accountId) {
      await message.error('未选中公众号，无法查询标签')
      return false
    }
    loading.value = true

    const data = await MpTagApi.getTagPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/**同步 */
const handleSync = async () => {
  try {
    await message.confirm('是否确认同步标签？') //未做国际化处理
    await MpTagApi.syncTag(queryParams.accountId)
    message.success('同步标签成功') //未做国际化处理
    getList()
  } catch {}
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 默认选中第一个
  if (accounts.length > 0) {
    queryParams.accountId = accounts[0].id
  }
  handleQuery()
}

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm('是否确认删除公众号标签编号为"' + id + '"的数据项?') //未做国际化处理
    // 发起删除
    await MpTagApi.deleteTag(id)

    // 刷新列表
    await getList()
    message.success(t('common.delSuccess'))
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    message.info('功能不支持')
    // const data = await MpTagApi.exportConfigApi(queryParams)
    // download.excel(data, '参数配置.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  accounts = await MpAccountAPI.getSimpleAccounts()
  if (accounts.length > 0) {
    queryParams.accountId = accounts[0].id
  }
  await getList()
})
</script>

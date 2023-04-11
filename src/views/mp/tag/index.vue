<template>
  <doc-alert title="公众号标签" url="https://doc.iocoder.cn/mp/tag/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <!-- TODO @芋艿：调整成 el-form 和 WxAccountSelect  -->
    <WxAccountSelect @change="accountChanged">
      <template #actions>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['mp:tag:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="success" plain @click="handleSync" v-hasPermi="['mp:tag:sync']">
          <Icon icon="ep:refresh" class="mr-5px" /> 同步
        </el-button>
      </template>
    </WxAccountSelect>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
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
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mp:tag:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mp:tag:delete']"
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
  <TagForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts" name="MpTag">
import { dateFormatter } from '@/utils/formatTime'
import WxAccountSelect from '@/views/mp/components/wx-account-select/main.vue'
import * as MpTagApi from '@/api/mp/tag'
import TagForm from './TagForm.vue'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined
})

/** 侦听公众号变化 **/
const accountChanged = (accountId) => {
  queryParams.pageNo = 1
  queryParams.accountId = accountId
  getList()
}

/** 查询列表 */
const getList = async () => {
  try {
    loading.value = true
    const data = await MpTagApi.getTagPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, queryParams.accountId, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MpTagApi.deleteTag(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 同步操作 */
const handleSync = async () => {
  try {
    await message.confirm('是否确认同步标签？')
    // @ts-ignore
    await MpTagApi.syncTag(queryParams.accountId)
    message.success('同步标签成功')
    await getList()
  } catch {}
}
</script>

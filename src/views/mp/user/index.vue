<template>
  <doc-alert title="公众号粉丝" url="https://doc.iocoder.cn/mp/user/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <!-- TODO @芋艿：调整成 el-form 和 WxAccountSelect  -->
    <WxAccountSelect @change="(accountId) => accountChanged(accountId)">
      <template #actions>
        <el-button type="success" plain @click="handleSync" v-hasPermi="['mp:user:sync']">
          <Icon icon="ep:refresh" class="mr-5px" /> 同步
        </el-button>
      </template>
    </WxAccountSelect>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="用户标识" align="center" prop="openid" width="260" />
      <el-table-column label="昵称" align="center" prop="nickname" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="标签" align="center" prop="tagIds" width="200">
        <template #default="scope">
          <span v-for="(tagId, index) in scope.row.tagIds" :key="index">
            <el-tag>{{ tagList.find((tag) => tag.tagId === tagId)?.name }} </el-tag>&nbsp;
          </span>
        </template>
      </el-table-column>
      <el-table-column label="订阅状态" align="center" prop="subscribeStatus">
        <template #default="scope">
          <el-tag v-if="scope.row.subscribeStatus === 0" type="success">已订阅</el-tag>
          <el-tag v-else type="danger">未订阅</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="订阅时间"
        align="center"
        prop="subscribeTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            type="primary"
            link
            @click="openForm(scope.row.id)"
            v-hasPermi="['mp:user:update']"
          >
            修改
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

  <!-- 表单弹窗：修改 -->
  <UserForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup name="MpUser">
import WxAccountSelect from '@/views/mp/components/wx-account-select/main.vue'
import { dateFormatter } from '@/utils/formatTime'
import * as MpUserApi from '@/api/mp/user'
import * as MpTagApi from '@/api/mp/tag'
import UserForm from './UserForm.vue'

const message = useMessage() // 消息

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: null,
  openid: null,
  nickname: null
})
const tagList = ref([]) // 公众号标签列表

/** 初始化 */
onMounted(async () => {
  tagList.value = await MpTagApi.getSimpleTagList()
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
    const data = await MpUserApi.getUserPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (id: number) => {
  formRef.value.open(id)
}

/** 同步标签 */
const handleSync = async () => {
  const accountId = queryParams.accountId
  try {
    await message.confirm('是否确认同步粉丝？')
    await MpUserApi.syncUser(accountId)
    message.success('开始从微信公众号同步粉丝信息，同步需要一段时间，建议稍后再查询')
    await getList()
  } catch {}
}
</script>

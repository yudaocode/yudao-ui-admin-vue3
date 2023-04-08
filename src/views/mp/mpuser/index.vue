<template>
  <div class="app-container">
    <doc-alert title="公众号粉丝" url="https://doc.iocoder.cn/mp/user/" />

    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      size="small"
      :inline="true"
      v-show="showSearch"
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
      <el-form-item label="用户标识" prop="openid">
        <el-input
          v-model="queryParams.openid"
          placeholder="请输入用户标识"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入昵称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh"
          size="small"
          @click="handleSync"
          v-hasPermi="['mp:user:sync']"
          >同步
        </el-button>
      </el-col>
      <!-- <right-toolbar :showSearch="showSearch" @query-table="getList" /> -->
    </el-row>

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
              <el-tag>{{ tags.find((tag) => tag.tagId === tagId)?.name }} </el-tag>&nbsp;
            </span>
          </template>
        </el-table-column>
        <el-table-column label="订阅状态" align="center" prop="subscribeStatus">
          <template #default="scope">
            <el-tag v-if="scope.row.subscribeStatus === 0" type="success">已订阅</el-tag>
            <el-tag v-else type="danger">未订阅</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订阅时间" align="center" prop="subscribeTime" width="180">
          <template #default="scope">
            <span>{{ formatDate(scope.row.subscribeTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <div class="flex justify-center items-center">
              <el-button
                type="primary"
                link
                @click="handleUpdate(scope.row)"
                v-hasPermi="['mp:user:update']"
              >
                <Icon icon="ep:edit" />修改
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>

    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 对话框(添加 / 修改) -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="标签" prop="tagIds">
          <el-select v-model="form.tagIds" multiple clearable placeholder="请选择标签">
            <el-option
              v-for="item in tags"
              :key="parseInt(item.tagId)"
              :label="item.name"
              :value="parseInt(item.tagId)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="MpUser">
import { ref, reactive } from 'vue'
import { updateUser, getUser, getUserPage, syncUser } from '@/api/mp/mpuser'
import { getSimpleAccountList } from '@/api/mp/account'
import { getSimpleTagList } from '@/api/mp/tag'
import { formatDate } from '@/utils/formatTime'

const message = useMessage()

const formRef = ref()
const queryFormRef = ref()

// 遮罩层
const loading = ref(true)
// 显示搜索条件
const showSearch = ref(true)
// 总条数
const total = ref(0)
// 微信公众号粉丝列表
const list = ref([])
// 弹出层标题
const title = ref('')
// 是否显示弹出层
const open = ref(false)
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: null,
  openid: null,
  nickname: null
})
// 表单参数
const form = ref({})
// 表单校验
const rules = ref({})

// 公众号账号列表
const accounts = ref([])
// 公众号标签列表
const tags = ref([])

onMounted(() => {
  getSimpleAccountList().then((data) => {
    accounts.value = data
    // 默认选中第一个
    if (accounts.value.length > 0) {
      queryParams.accountId = accounts.value[0].id
    }
    // 加载数据
    getList()
  })

  // 加载标签
  getSimpleTagList().then((data) => {
    tags.value = data
  })
})

/** 查询列表 */
const getList = () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!queryParams.accountId) {
    message.error('未选中公众号，无法查询用户')
    return false
  }

  loading.value = true
  // 处理查询参数
  let params = { ...queryParams }
  // 执行查询
  getUserPage(params)
    .then((data) => {
      list.value = data.list
      total.value = data.total
    })
    .finally(() => {
      loading.value = false
    })
}

/** 取消按钮 */
const cancel = () => {
  open.value = false
  reset()
}

/** 表单重置 */
const reset = () => {
  form.value = {
    id: undefined,
    nickname: undefined,
    remark: undefined,
    tagIds: []
  }
  formRef.value?.resetFields()
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
  if (accounts.value.length > 0) {
    queryParams.accountId = accounts.value[0].id
  }
  handleQuery()
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  getUser(row.id).then((data) => {
    form.value = data
    open.value = true
    title.value = '修改公众号粉丝'
  })
}

/** 提交按钮 */
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return
    }
    // 修改的提交
    if (form.value.id != null) {
      updateUser(form.value).then(() => {
        message.success('修改成功')
        open.value = false
        getList()
      })
    }
  })
}

/** 同步标签 */
const handleSync = async () => {
  const accountId = queryParams.accountId
  try {
    await message.confirm('是否确认同步粉丝？')
    await syncUser(accountId)
    message.success('开始从微信公众号同步粉丝信息，同步需要一段时间，建议稍后再查询')
  } catch {}
}
</script>

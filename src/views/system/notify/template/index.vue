<template>
  <doc-alert title="站内信配置" url="https://doc.iocoder.cn/notify/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模板名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模板编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入模版编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择开启状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:notify-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="模板编码"
        align="center"
        prop="code"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="模板名称"
        align="center"
        prop="name"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="发送人名称" align="center" prop="nickname" />
      <el-table-column
        label="模板内容"
        align="center"
        prop="content"
        width="200"
        :show-overflow-tooltip="true"
      />

      <el-table-column label="开启状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="210" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:notify-template:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="primary"
            @click="openSendForm(scope.row)"
            v-hasPermi="['system:notify-template:send-notify']"
          >
            测试
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:notify-template:delete']"
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

  <Dialog v-model="dialogFormVisible" title="测试发送" :max-height="500">
    <el-form
      ref="sendFormRef"
      :model="sendFormData"
      :rules="sendFormRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-form-item label="模板内容" prop="content">
        <el-input v-model="sendFormData.content" readonly />
      </el-form-item>
      <el-form-item label="接收人" prop="userId">
        <el-select v-model="sendFormData.userId" placeholder="请选择接收人">
          <el-option
            v-for="item in userOption"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-for="param in sendFormData.params"
        :key="param"
        :label="'参数 {' + param + '}'"
        :prop="'templateParams.' + param"
      >
        <el-input
          v-model="sendFormData.templateParams[param]"
          :placeholder="'请输入 ' + param + ' 参数'"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm"> 确定 </el-button>
      </span>
    </template>
  </Dialog>

  <!-- 表单弹窗：添加/修改 -->
  <NotifyTemplateForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts" name="NotifySmsTemplate">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyTemplateApi from '@/api/system/notify/template'
import { getSimpleUserList, UserVO } from '@/api/system/user'
import NotifyTemplateForm from './NotifyTemplateForm.vue'

const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryFormRef = ref() // 搜索的表单

const formLoading = ref(false)
const dialogFormVisible = ref(false)
const sendFormRef = ref() // 表单 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
  code: undefined,
  createTime: []
})

const sendFormData = ref({
  content: '',
  params: {},
  userId: null,
  templateCode: '',
  templateParams: {}
})

const sendFormRules = ref({
  userId: [{ required: true, message: '用户编号不能为空', trigger: 'change' }],
  templateCode: [{ required: true, message: '模版编号不能为空', trigger: 'blur' }],
  templateParams: {}
})

const userOption = ref<UserVO[]>([])

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NotifyTemplateApi.getNotifyTemplatePageApi(queryParams)
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
    await NotifyTemplateApi.deleteNotifyTemplateApi(id)
    message.success('删除成功')
    // 刷新列表
    await getList()
  } catch {}
}

const openSendForm = (row: any) => {
  sendFormData.value.content = row.content
  sendFormData.value.params = row.params
  sendFormData.value.templateCode = row.code
  sendFormData.value.templateParams = row.params.reduce(function (obj, item) {
    obj[item] = undefined
    return obj
  }, {})
  sendFormRules.value.templateParams = row.params.reduce(function (obj, item) {
    obj[item] = { required: true, message: '参数 ' + item + ' 不能为空', trigger: 'change' }
    return obj
  }, {})
  dialogFormVisible.value = true
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!sendFormRef) return
  const valid = await sendFormRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data: NotifyTemplateApi.NotifySendReqVO = {
      userId: sendFormData.value.userId,
      templateCode: sendFormData.value.templateCode,
      templateParams: sendFormData.value.templateParams as unknown as Map<string, Object>
    }
    const res = await NotifyTemplateApi.sendNotifyApi(data)
    if (res) {
      message.success('提交发送成功！发送结果，见消息记录编号：' + res)
    }
    dialogFormVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
  getSimpleUserList().then((data) => {
    userOption.value = data
  })
})
</script>

<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" @click="openModal('create')" v-hasPermi="['mp:account:create']"
          ><Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="名称" align="center" prop="name" />
      <el-table-column label="微信号" align="center" prop="account" width="180" />
      <el-table-column label="appId" align="center" prop="appId" width="180" />
      <el-table-column label="服务器地址(URL)" align="center" prop="appId" width="360">
        <template #default="scope">
          {{ 'http://服务端地址/mp/open/' + scope.row.appId }}
        </template>
      </el-table-column>
      <el-table-column label="二维码" align="center" prop="qrCodeUrl">
        <template #default="scope">
          <img
            v-if="scope.row.qrCodeUrl"
            :src="scope.row.qrCodeUrl"
            alt="二维码"
            style="height: 100px; display: inline-block"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['mp:account:update']"
            >编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mp:account:delete']"
            >删除
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleGenerateQrCode(scope.row)"
            v-hasPermi="['mp:account:qr-code']"
            >生成二维码
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCleanQuota(scope.row)"
            v-hasPermi="['mp:account:clear-quota']"
            >清空 API 配额
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>
  <!-- 对话框(添加 / 修改) -->
  <account-form ref="modalRef" @success="getList" />
</template>

<script setup lang="ts" name="MpAccount">
import * as AccountApi from '@/api/mp/account'
import AccountForm from './form.vue'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
// 遮罩层
const loading = ref(true)
// 总条数
const total = ref(0)
// 公众号账号列表
const list = ref([])
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  account: null,
  appId: null
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  // 处理查询参数
  let params = { ...queryParams }
  // 执行查询
  const data = await AccountApi.getAccountPage(params)
  list.value = data.list
  total.value = data.total
  loading.value = false
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
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await AccountApi.deleteAccount(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}
/** 生成二维码的按钮操作 */
const handleGenerateQrCode = async (row) => {
  try {
    // 生成二维码的二次确认
    await message.confirm('是否确认生成公众号账号编号为"' + row.name + '"的二维码?')
    // 发起生成二维码
    await AccountApi.generateAccountQrCode(row.id)
    message.success('生成二维码成功')
    // 刷新列表
    await getList()
  } catch {}
}
/** 清空二维码 API 配额的按钮操作 */
const handleCleanQuota = async (row) => {
  try {
    // 清空 API 配额的二次确认
    await message.confirm('是否确认清空生成公众号账号编号为"' + row.name + '"的 API 配额?')
    // 发起清空 API 配额
    await AccountApi.clearAccountQuota(row.id)
    message.success('清空 API 配额成功')
  } catch {}
}

onMounted(() => {
  getList()
})
</script>

<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="应用名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入应用名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="商户名称" prop="contactName">
        <el-input
          v-model="queryParams.contactName"
          placeholder="请输入商户名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
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
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:tenant:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:tenant:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="应用编号" align="center" prop="id" />
      <el-table-column label="应用名" align="center" prop="name" />
      <el-table-column label="开启状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="商户名称" align="center" prop="payMerchant.name" />
      <el-table-column label="支付宝配置" align="center">
        <el-table-column :label="PayChannelEnum.ALIPAY_APP.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.ALIPAY_APP.code)"
              @click="
                handleUpdateChannel(scope.row, PayChannelEnum.ALIPAY_APP.code, PayType.ALIPAY)
              "
              circle
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="
                handleCreateChannel(scope.row, PayChannelEnum.ALIPAY_APP.code, PayType.ALIPAY)
              "
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.ALIPAY_PC.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.ALIPAY_PC.code)"
              @click="handleUpdateChannel(scope.row, PayChannelEnum.ALIPAY_PC.code, PayType.ALIPAY)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="handleCreateChannel(scope.row, PayChannelEnum.ALIPAY_PC.code, PayType.ALIPAY)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.ALIPAY_WAP.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.ALIPAY_WAP.code)"
              @click="
                handleUpdateChannel(scope.row, PayChannelEnum.ALIPAY_WAP.code, PayType.ALIPAY)
              "
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="
                handleCreateChannel(scope.row, PayChannelEnum.ALIPAY_WAP.code, PayType.ALIPAY)
              "
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.ALIPAY_QR.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.ALIPAY_QR.code)"
              @click="handleUpdateChannel(scope.row, PayChannelEnum.ALIPAY_QR.code, PayType.ALIPAY)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="handleCreateChannel(scope.row, PayChannelEnum.ALIPAY_QR.code, PayType.ALIPAY)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.ALIPAY_BAR.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.ALIPAY_BAR.code)"
              @click="
                handleUpdateChannel(scope.row, PayChannelEnum.ALIPAY_BAR.code, PayType.ALIPAY)
              "
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="
                handleCreateChannel(scope.row, PayChannelEnum.ALIPAY_BAR.code, PayType.ALIPAY)
              "
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="微信配置" align="center">
        <el-table-column :label="PayChannelEnum.WX_LITE.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.WX_LITE.code)"
              @click="handleUpdateChannel(scope.row, PayChannelEnum.WX_LITE.code, PayType.WECHAT)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="handleCreateChannel(scope.row, PayChannelEnum.WX_LITE.code, PayType.WECHAT)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.WX_PUB.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.WX_PUB.code)"
              @click="handleUpdateChannel(scope.row, PayChannelEnum.WX_PUB.code, PayType.WECHAT)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="handleCreateChannel(scope.row, PayChannelEnum.WX_PUB.code, PayType.WECHAT)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="PayChannelEnum.WX_APP.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.WX_APP.code)"
              @click="handleUpdateChannel(scope.row, PayChannelEnum.WX_APP.code, PayType.WECHAT)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="handleCreateChannel(scope.row, PayChannelEnum.WX_APP.code, PayType.WECHAT)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" min-width="110" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:tenant:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:tenant:delete']"
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
  <AppForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts" name="PayApp">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as AppApi from '@/api/pay/app'
import AppForm from '@/views/pay/app/AppForm.vue'
import { PayChannelEnum, PayType } from '@/utils/constants'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
  remark: undefined,
  payNotifyUrl: undefined,
  refundNotifyUrl: undefined,
  merchantName: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const channelParam = reactive({
  loading: false,
  edit: false, // 是否修改
  wechatOpen: false, // 微信是否显示
  aliPayOpen: false, // 支付宝是否显示
  appId: null, // 应用 ID
  payCode: null, // 渠道编码
  // 商户对象
  payMerchant: {
    id: null, // 编号
    name: null // 名称
  }
}) // 微信组件传参参数

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AppApi.getAppPage(queryParams)
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
    await AppApi.deleteApp(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await AppApi.exportApp(queryParams)
    download.excel(data, '支付应用信息.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/**
 * 根据渠道编码判断渠道列表中是否存在
 *
 * @param channels 渠道列表
 * @param channelCode 渠道编码
 */
const isChannelExists = (channels, channelCode) => {
  if (!channels) {
    return false
  }
  return channels.indexOf(channelCode) !== -1
}

// TODO @芋艿：handleUpdateChannel 和 handleCreateChannel 合并，成为 openChannelForm
/**
 * 修改支付渠道信息
 *
 * @param row 行记录
 * @param payCode 支付编码
 * @param type 支付类型
 */
const handleUpdateChannel = async (row, payCode, type) => {
  // TODO @芋艿：表单未实现
  message.alert('待实现')
  await settingChannelParam(row, payCode, type)
  channelParam.edit = true
  channelParam.loading = true
}

/**
 * 新增支付渠道信息
 */
const handleCreateChannel = async (row, payCode, type) => {
  message.alert('待实现')
  await settingChannelParam(row, payCode, type)
  channelParam.edit = false
  channelParam.loading = false
}

const settingChannelParam = async (row, payCode, type) => {
  if (type === PayType.WECHAT) {
    channelParam.wechatOpen = true
    channelParam.aliPayOpen = false
  }
  if (type === PayType.ALIPAY) {
    channelParam.aliPayOpen = true
    channelParam.wechatOpen = false
  }
  channelParam.edit = false
  channelParam.loading = false
  channelParam.appId = row.id
  channelParam.payCode = payCode
  channelParam.payMerchant = row.payMerchant
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>

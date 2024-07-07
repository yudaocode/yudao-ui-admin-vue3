<template>
  <doc-alert title="支付功能开启" url="https://doc.iocoder.cn/pay/build/" />
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
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['pay:app:create']">
          <Icon icon="ep:plus" class="mr-5px" />
          新增
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
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="支付宝配置" align="center">
        <el-table-column
          :label="channel.name"
          align="center"
          v-for="channel in alipayChannels"
          :key="channel.code"
        >
          <template #default="scope">
            <el-button
              type="success"
              v-if="isChannelExists(scope.row.channelCodes, channel.code)"
              @click="openChannelForm(scope.row, channel.code)"
              circle
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="openChannelForm(scope.row, channel.code)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="微信配置" align="center">
        <el-table-column
          :label="channel.name"
          align="center"
          v-for="channel in wxChannels"
          :key="channel.code"
        >
          <template #default="scope">
            <el-button
              type="success"
              v-if="isChannelExists(scope.row.channelCodes, channel.code)"
              @click="openChannelForm(scope.row, channel.code)"
              circle
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="openChannelForm(scope.row, channel.code)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="钱包支付配置" align="center">
        <el-table-column :label="PayChannelEnum.WALLET.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.WALLET.code)"
              @click="openChannelForm(scope.row, PayChannelEnum.WALLET.code)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="openChannelForm(scope.row, PayChannelEnum.WALLET.code)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="模拟支付配置" align="center">
        <el-table-column :label="PayChannelEnum.MOCK.name" align="center">
          <template #default="scope">
            <el-button
              type="success"
              circle
              v-if="isChannelExists(scope.row.channelCodes, PayChannelEnum.MOCK.code)"
              @click="openChannelForm(scope.row, PayChannelEnum.MOCK.code)"
            >
              <Icon icon="ep:check" />
            </el-button>
            <el-button
              v-else
              type="danger"
              circle
              @click="openChannelForm(scope.row, PayChannelEnum.MOCK.code)"
            >
              <Icon icon="ep:close" />
            </el-button>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="110" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['pay:app:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['pay:app:delete']"
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
  <AlipayChannelForm ref="alipayFormRef" @success="getList" />
  <WeixinChannelForm ref="weixinFormRef" @success="getList" />
  <MockChannelForm ref="mockFormRef" @success="getList" />
  <WalletChannelForm ref="walletFormRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as AppApi from '@/api/pay/app'
import AppForm from './components/AppForm.vue'
import { CommonStatusEnum, PayChannelEnum } from '@/utils/constants'
import AlipayChannelForm from './components/channel/AlipayChannelForm.vue'
import WeixinChannelForm from './components/channel/WeixinChannelForm.vue'
import MockChannelForm from './components/channel/MockChannelForm.vue'
import WalletChannelForm from './components/channel/WalletChannelForm.vue'

defineOptions({ name: 'PayApp' })

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
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

const alipayChannels = [
  PayChannelEnum.ALIPAY_APP,
  PayChannelEnum.ALIPAY_PC,
  PayChannelEnum.ALIPAY_WAP,
  PayChannelEnum.ALIPAY_QR,
  PayChannelEnum.ALIPAY_BAR
]

const wxChannels = [
  PayChannelEnum.WX_LITE,
  PayChannelEnum.WX_PUB,
  PayChannelEnum.WX_APP,
  PayChannelEnum.WX_NATIVE,
  PayChannelEnum.WX_WAP,
  PayChannelEnum.WX_BAR,
]

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

/** 应用状态修改 */
const handleStatusChange = async (row: any) => {
  let text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await message.confirm('确认要"' + text + '""' + row.name + '"应用吗?')
    await AppApi.changeAppStatus({ id: row.id, status: row.status })
    message.success(text + '成功')
  } catch {
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
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

/**
 * 新增支付渠道信息
 */
const alipayFormRef = ref()
const weixinFormRef = ref()
const mockFormRef = ref()
const walletFormRef = ref()
const channelParam = reactive({
  appId: null, // 应用 ID
  payCode: null // 渠道编码
})
const openChannelForm = async (row, payCode) => {
  channelParam.appId = row.id
  channelParam.payCode = payCode
  if (payCode.indexOf('alipay_') === 0) {
    alipayFormRef.value.open(row.id, payCode)
    return
  }
  if (payCode.indexOf('wx_') === 0) {
    weixinFormRef.value.open(row.id, payCode)
    return
  }
  if (payCode.indexOf('mock') === 0) {
    mockFormRef.value.open(row.id, payCode)
  }
  if (payCode.indexOf('wallet') === 0) {
    mockFormRef.value.open(row.id, payCode)
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>

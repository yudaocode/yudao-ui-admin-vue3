<template>
  <doc-alert title="【交易】快递发货" url="https://doc.iocoder.cn/mall/trade-delivery-express/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="门店手机" prop="phone">
        <el-input
          v-model="queryParams.phone"
          class="!w-240px"
          clearable
          placeholder="请输门店手机"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="门店名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输门店名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="门店状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="门店状态">
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
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
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
        <el-button
          v-hasPermi="['trade:delivery:pick-up-store:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" min-width="80" prop="id" />
      <el-table-column label="门店 logo" min-width="100" prop="logo">
        <template #default="scope">
          <img v-if="scope.row.logo" :src="scope.row.logo" alt="门店 logo" class="h-50px" />
        </template>
      </el-table-column>
      <el-table-column label="门店名称" min-width="150" prop="name" />
      <el-table-column label="门店手机" min-width="100" prop="phone" />
      <el-table-column label="地址" min-width="100" prop="detailAddress" />
      <el-table-column label="营业时间" min-width="180">
        <template #default="scope">
          {{ scope.row.openingTime }} ~ {{ scope.row.closingTime }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="开启状态" min-width="100" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" label="操作" min-width="110">
        <template #default="scope">
          <el-button
            v-hasPermi="['trade:delivery:pick-up-store:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['trade:delivery:pick-up-store:update']"
            link
            type="primary"
            @click="openFormBind(scope.row.id)"
          >
            绑定店员
          </el-button>
          <el-button
            v-hasPermi="['trade:delivery:pick-up-store:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DeliveryPickUpStoreForm ref="formRef" @success="getList" />
  <!-- 表单弹窗：绑定店员 -->
  <DeliveryPickUpStoreBindForm ref="formBindRef" />
</template>
<script lang="ts" name="DeliveryPickUpStore" setup>
import * as DeliveryPickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import DeliveryPickUpStoreForm from './PickUpStoreForm.vue'
import DeliveryPickUpStoreBindForm from './DeliveryPickUpStoreBindForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const total = ref(0) // 列表的总页数
const loading = ref(true) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  status: undefined,
  phone: undefined,
  name: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const formBindRef = ref()
const openFormBind = (id?: number) => {
  formBindRef.value.open(id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeliveryPickUpStoreApi.deleteDeliveryPickUpStore(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeliveryPickUpStoreApi.getDeliveryPickUpStorePage(queryParams)
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

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

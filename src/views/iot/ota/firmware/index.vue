<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="固件名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入固件名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="queryParams.productId"
          placeholder="请选择产品"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        >
          <el-option
            v-for="product in productList"
            :key="product.id"
            :label="product.name"
            :value="product.id"
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
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['iot:ota-firmware:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="固件编号" align="center" prop="id" />
      <el-table-column label="固件名称" align="center" prop="name" />
      <el-table-column label="固件版本" align="center" prop="description" />
      <el-table-column label="版本号" align="center" prop="version" />
      <el-table-column label="所属产品" align="center" prop="productId">
        <template #default="scope">
          <el-link
            @click="openProductDetail(scope.row.productId)"
            v-if="getProductName(scope.row.productId)"
          >
            {{ getProductName(scope.row.productId) }}
          </el-link>
          <span v-else>加载中...</span>
        </template>
      </el-table-column>
      <el-table-column label="固件文件" align="center" prop="fileUrl">
        <template #default="scope">
          <el-link :href="scope.row.fileUrl" target="_blank" download>
            <Icon icon="ep:download" class="mr-5px" />
            下载固件
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="180px">
        <template #default="scope">
          <el-button
            link
            @click="openFirmwareDetail(scope.row.id)"
            v-hasPermi="['iot:ota-firmware:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['iot:ota-firmware:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['iot:ota-firmware:delete']"
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
  <OtaFirmwareForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { IoTOtaFirmwareApi, IoTOtaFirmware } from '@/api/iot/ota/firmware'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import OtaFirmwareForm from './OtaFirmwareForm.vue'

/** IoT OTA 固件列表 */
defineOptions({ name: 'IoTOtaFirmware' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const list = ref<IoTOtaFirmware[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const productList = ref<ProductVO[]>([]) // 产品列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  productId: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await IoTOtaFirmwareApi.getOtaFirmwarePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 根据产品编号，获取产品名称 */
const getProductName = (productId: number) => {
  const product = productList.value.find((p) => p.id === productId)
  return product?.name || ''
}

/** 打开产品详情 */
const openProductDetail = (productId: number) => {
  push({ name: 'IoTProductDetail', params: { id: productId } })
}

/** 打开固件详情 */
const openFirmwareDetail = (firmwareId: number) => {
  push({ name: 'IoTOtaFirmwareDetail', params: { id: firmwareId } })
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
    await IoTOtaFirmwareApi.deleteOtaFirmware(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  productList.value = await ProductApi.getSimpleProductList()
  getList()
})
</script>

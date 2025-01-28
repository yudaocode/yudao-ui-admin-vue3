<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="产品名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入产品名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="ProductKey" prop="productKey">
        <el-input
          v-model="queryParams.productKey"
          class="!w-240px"
          clearable
          placeholder="请输入产品标识"
          @keyup.enter="handleQuery"
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
          v-hasPermi="['iot:product:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['iot:product:export']"
          :loading="exportLoading"
          plain
          type="success"
          @click="handleExport"
        >
          <Icon class="mr-5px" icon="ep:download" />
          导出
        </el-button>
      </el-form-item>
      <!-- 视图切换按钮 -->
      <el-form-item class="float-right !mr-0 !mb-0">
        <el-button-group>
          <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
            <Icon icon="ep:grid" />
          </el-button>
          <el-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
            <Icon icon="ep:list" />
          </el-button>
        </el-button-group>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 卡片视图 -->
  <ContentWrap>
    <el-row v-if="viewMode === 'card'" :gutter="16">
      <el-col v-for="item in list" :key="item.id" :lg="6" :md="12" :sm="12" :xs="24" class="mb-4">
        <el-card :body-style="{ padding: '0' }" class="h-full transition-colors">
          <!-- 内容区域 -->
          <div class="p-4">
            <!-- 标题区域 -->
            <div class="flex items-center mb-3">
              <div class="mr-2.5 flex items-center">
                <el-image :src="item.icon || defaultIconUrl" class="w-[35px] h-[35px]" />
              </div>
              <div class="text-[16px] font-600">{{ item.name }}</div>
            </div>

            <!-- 信息区域 -->
            <div class="flex items-center text-[14px]">
              <div class="flex-1">
                <div class="mb-2.5 last:mb-0">
                  <span class="text-[#717c8e] mr-2.5">产品分类</span>
                  <span class="text-[#0070ff]">{{ item.categoryName }}</span>
                </div>
                <div class="mb-2.5 last:mb-0">
                  <span class="text-[#717c8e] mr-2.5">产品类型</span>
                  <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="item.deviceType" />
                </div>
                <div class="mb-2.5 last:mb-0">
                  <span class="text-[#717c8e] mr-2.5">产品标识</span>
                  <span class="text-[#0b1d30] inline-block align-middle overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
                    {{ item.productKey }}
                  </span>
                </div>
              </div>
              <div class="w-[100px] h-[100px]">
                <el-image :src="item.picUrl || defaultPicUrl" class="w-full h-full" />
              </div>
            </div>

            <!-- 分隔线 -->
            <el-divider class="!my-3" />

            <!-- 按钮组 -->
            <div class="flex items-center px-0">
              <el-button
                v-hasPermi="['iot:product:update']"
                class="flex-1 !px-2 !h-[32px] text-[13px]"
                plain
                type="primary"
                @click="openForm('update', item.id)"
              >
                <Icon class="mr-1" icon="ep:edit-pen" />
                编辑
              </el-button>
              <el-button
                class="flex-1 !px-2 !h-[32px] !ml-[10px] text-[13px]"
                plain
                type="warning"
                @click="openDetail(item.id)"
              >
                <Icon class="mr-1" icon="ep:view" />
                详情
              </el-button>
              <el-button
                class="flex-1 !px-2 !h-[32px] !ml-[10px] text-[13px]"
                plain
                type="success"
                @click="openObjectModel(item)"
              >
                <Icon class="mr-1" icon="ep:scale-to-original" />
                物模型
              </el-button>
              <div class="mx-[10px] h-[20px] w-[1px] bg-[#dcdfe6]"></div>
              <el-button
                v-hasPermi="['iot:product:delete']"
                :disabled="item.status === 1"
                class="!px-2 !h-[32px] text-[13px]"
                plain
                type="danger"
                @click="handleDelete(item.id)"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 列表视图 -->
    <el-table v-else v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="ID" prop="id" />
      <el-table-column align="center" label="ProductKey" prop="productKey" />
      <el-table-column align="center" label="品类" prop="categoryName" />
      <el-table-column align="center" label="设备类型" prop="deviceType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="scope.row.deviceType" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="产品图标" prop="icon">
        <template #default="scope">
          <el-image
            v-if="scope.row.icon"
            :preview-src-list="[scope.row.icon]"
            :src="scope.row.icon"
            class="w-40px h-40px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="产品图片" prop="picture">
        <template #default="scope">
          <el-image
            v-if="scope.row.picUrl"
            :preview-src-list="[scope.row.picture]"
            :src="scope.row.picUrl"
            class="w-40px h-40px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="操作">
        <template #default="scope">
          <el-button
            v-hasPermi="['iot:product:query']"
            link
            type="primary"
            @click="openDetail(scope.row.id)"
          >
            查看
          </el-button>
          <el-button
            v-hasPermi="['iot:product:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['iot:product:delete']"
            :disabled="scope.row.status === 1"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ProductForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import ProductForm from './ProductForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import defaultPicUrl from '@/assets/imgs/iot/device.png'
import defaultIconUrl from '@/assets/svgs/iot/cube.svg'

/** iot 产品列表 */
defineOptions({ name: 'IoTProduct' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter()
const route = useRoute()

const loading = ref(true) // 列表的加载中
const activeName = ref('info') // 当前激活的标签页
const list = ref<ProductVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  productKey: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出加载中
const viewMode = ref<'card' | 'list'>('card') // 视图模式状态

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductApi.getProductPage(queryParams)
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

/** 打开详情 */
const openDetail = (id: number) => {
  push({ name: 'IoTProductDetail', params: { id } })
}

/** 打开物模型 */
const openObjectModel = (item: ProductVO) => {
  push({
    name: 'IoTProductDetail',
    params: { id: item.id },
    query: { tab: 'thingModel' }
  })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProductApi.deleteProduct(id)
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
    const data = await ProductApi.exportProduct(queryParams)
    download.excel(data, '物联网产品.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
  // 处理 tab 参数
  const { tab } = route.query
  if (tab) {
    activeName.value = tab as string
  }
})
</script>

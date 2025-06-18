<!-- 设备属性管理 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
      @submit.prevent
    >
      <el-form-item label="" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入属性名称、标志符"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-switch
          size="large"
          width="80"
          v-model="autoRefresh"
          class="-ml-15px"
          inline-prompt
          active-text="定时刷新"
          inactive-text="定时刷新"
          style="--el-switch-on-color: #13ce66"
        />
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="属性标识符" align="center" prop="property.identifier" />
      <el-table-column label="属性名称" align="center" prop="property.name" />
      <el-table-column label="数据类型" align="center" prop="property.dataType" />
      <el-table-column label="属性值" align="center" prop="value" />
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(props.device.id, scope.row.property.identifier)"
          >
            查看数据
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <DeviceDataDetail ref="detailRef" :device="device" :product="product" />
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceDataVO, DeviceVO } from '@/api/iot/device/device'
import { dateFormatter } from '@/utils/formatTime'
import DeviceDataDetail from './DeviceDataDetail.vue'

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

const loading = ref(true) // 列表的加载中
const list = ref<DeviceDataVO[]>([]) // 显示的列表数据
const allList = ref<DeviceDataVO[]>([]) // 完整的数据列表
const queryParams = reactive({
  keyword: '' as string
})
const autoRefresh = ref(false) // 自动刷新开关
let autoRefreshTimer: any = null // 定时器

const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = {
      deviceId: props.device.id,
      identifier: undefined as string | undefined,
      name: undefined as string | undefined
    }
    allList.value = await DeviceApi.getLatestDeviceProperties(params)
    filterData()
  } finally {
    loading.value = false
  }
}

/** 前端筛选数据 */
const filterData = () => {
  if (!queryParams.keyword.trim()) {
    list.value = allList.value
  } else {
    const keyword = queryParams.keyword.toLowerCase()
    list.value = allList.value.filter(
      (item) =>
        item.property?.identifier?.toLowerCase().includes(keyword) ||
        item.property?.name?.toLowerCase().includes(keyword)
    )
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  filterData()
}

/** 添加/修改操作 */
const detailRef = ref()
const openDetail = (deviceId: number, identifier: string) => {
  detailRef.value.open(deviceId, identifier)
}

/** 监听自动刷新 */
watch(autoRefresh, (newValue) => {
  if (newValue) {
    autoRefreshTimer = setInterval(() => {
      getList()
    }, 5000) // 每5秒刷新一次
  } else {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 组件卸载时清除定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<!-- 设备消息列表 -->
<template>
  <ContentWrap>
    <!-- 搜索区域 -->
    <el-form :model="queryParams" inline>
      <el-form-item>
        <el-select v-model="queryParams.method" placeholder="所有方法" class="!w-160px" clearable>
          <el-option
            v-for="item in methodOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select
          v-model="queryParams.upstream"
          placeholder="上行/下行"
          class="!w-160px"
          clearable
        >
          <el-option label="上行" value="true" />
          <el-option label="下行" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-switch
          size="large"
          width="80"
          v-model="autoRefresh"
          class="ml-20px"
          inline-prompt
          active-text="定时刷新"
          inactive-text="定时刷新"
          style="--el-switch-on-color: #13ce66"
        />
      </el-form-item>
    </el-form>

    <!-- 消息列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" class="whitespace-nowrap">
      <el-table-column label="时间" align="center" prop="ts" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.ts) }}
        </template>
      </el-table-column>
      <el-table-column label="上行/下行" align="center" prop="upstream" width="140">
        <template #default="scope">
          <el-tag :type="scope.row.upstream ? 'primary' : 'success'">
            {{ scope.row.upstream ? '上行' : '下行' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否回复" align="center" prop="reply" width="140">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.reply" />
        </template>
      </el-table-column>
      <el-table-column label="请求编号" align="center" prop="requestId" width="300" />
      <el-table-column label="请求方法" align="center" prop="method" width="140">
        <template #default="scope">
          {{ methodOptions.find((item) => item.value === scope.row.method)?.label }}
        </template>
      </el-table-column>
      <el-table-column
        label="请求/响应数据"
        align="center"
        prop="params"
        :show-overflow-tooltip="true"
      >
        <template #default="scope">
          <span v-if="scope.row.reply">
            {{ `{"code":${scope.row.code},"msg":"${scope.row.msg}","data":${scope.row.data}\}` }}
          </span>
          <span v-else>{{ scope.row.params }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-10px flex justify-end">
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getMessageList"
      />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { DeviceApi } from '@/api/iot/device/device'
import { formatDate } from '@/utils/formatTime'
import { IotDeviceMessageMethodEnum } from '@/views/iot/utils/constants'

const props = defineProps<{
  deviceId: number
}>()

// 查询参数
const queryParams = reactive({
  deviceId: props.deviceId,
  method: undefined,
  upstream: undefined,
  pageNo: 1,
  pageSize: 10
})

// 列表数据
const loading = ref(false)
const total = ref(0)
const list = ref([])
const autoRefresh = ref(false) // 自动刷新开关
let autoRefreshTimer: any = null // 自动刷新定时器

// 消息方法选项
const methodOptions = computed(() => {
  return Object.values(IotDeviceMessageMethodEnum).map((item) => ({
    label: item.name,
    value: item.method
  }))
})

/** 查询消息列表 */
const getMessageList = async () => {
  if (!props.deviceId) return
  loading.value = true
  try {
    const data = await DeviceApi.getDeviceMessagePage(queryParams)
    total.value = data.total
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 搜索操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getMessageList()
}

/** 监听自动刷新 */
watch(autoRefresh, (newValue) => {
  if (newValue) {
    autoRefreshTimer = setInterval(() => {
      getMessageList()
    }, 5000)
  } else {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 监听设备标识变化 */
watch(
  () => props.deviceId,
  (newValue) => {
    if (newValue) {
      handleQuery()
    }
  }
)

/** 组件卸载时清除定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 初始化 */
onMounted(() => {
  if (props.deviceId) {
    getMessageList()
  }
})

/** 刷新消息列表 */
const refresh = (delay = 0) => {
  if (delay > 0) {
    setTimeout(() => {
      handleQuery()
    }, delay)
  } else {
    handleQuery()
  }
}

/** 暴露方法给父组件 */
defineExpose({
  refresh
})
</script>

<template>
  <OaHomePanel title="工作计划" v-loading="loading">
    <template #actions>
      <el-button link type="primary" @click="push('/oa/plan/list')">更多</el-button>
    </template>
    <div v-if="loadError" class="mb-12px text-13px text-[var(--el-color-danger)]">
      加载失败，
      <el-button link type="primary" @click="getList">重新加载</el-button>
    </div>
    <el-table :data="list" :show-overflow-tooltip="true">
      <el-table-column align="center" label="类型" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PLAN_TYPE" :value="scope.row.type ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="计划标题" min-width="260">
        <template #default="scope">
          <el-button link type="primary" @click="push('/oa/plan/list')">
            {{ scope.row.title }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="结束时间"
        prop="endTime"
        :formatter="dateFormatter"
        width="170"
      />
    </el-table>
  </OaHomePanel>
</template>

<script setup lang="ts">
import OaHomePanel from './OaHomePanel.vue'
import * as PlanApi from '@/api/oa/plan'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'OaHomePlan' })

const { push } = useRouter() // 路由跳转
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const list = ref<PlanApi.OaPlanVO[]>([]) // 计划列表

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    list.value = (await PlanApi.getPlanPage({ pageNo: 1, pageSize: 2 })).list
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

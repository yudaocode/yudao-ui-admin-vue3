<template>
  <ContentWrap>
    <!-- 页面头部 -->
    <div class="flex justify-between items-start mb-20px">
      <div class="flex-1">
        <h2 class="flex items-center m-0 mb-8px text-24px font-600 text-[#303133]">
          <Icon icon="ep:connection" class="ml-5px mr-12px text-[#409eff]" />
          场景联动规则
        </h2>
        <p class="m-0 text-[#606266] text-14px">
          通过配置触发条件和执行动作，实现设备间的智能联动控制
        </p>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">
          <Icon icon="ep:plus" />
          新增规则
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="mb-16px" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        @submit.prevent
      >
        <el-form-item label="规则名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入规则名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="规则状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
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
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <Icon icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-16px">
      <el-col :span="6">
        <el-card
          class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px"
          shadow="hover"
        >
          <div class="flex items-center">
            <div
              class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#667eea] to-[#764ba2]"
            >
              <Icon icon="ep:document" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">
                {{ statistics.total }}
              </div>
              <div class="text-14px text-[#909399] mt-4px">总规则数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px"
          shadow="hover"
        >
          <div class="flex items-center">
            <div
              class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#f093fb] to-[#f5576c]"
            >
              <Icon icon="ep:check" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">
                {{ statistics.enabled }}
              </div>
              <div class="text-14px text-[#909399] mt-4px">启用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px"
          shadow="hover"
        >
          <div class="flex items-center">
            <div
              class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#4facfe] to-[#00f2fe]"
            >
              <Icon icon="ep:close" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">
                {{ statistics.disabled }}
              </div>
              <div class="text-14px text-[#909399] mt-4px">禁用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card
          class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px"
          shadow="hover"
        >
          <div class="flex items-center">
            <div
              class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#43e97b] to-[#38f9d7]"
            >
              <Icon icon="ep:timer" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">
                {{ statistics.timerRules }}
              </div>
              <div class="text-14px text-[#909399] mt-4px">定时规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card class="mb-20px" shadow="never">
      <el-table v-loading="loading" :data="list" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="规则名称" prop="name" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8px">
              <span class="font-500 text-[#303133]">{{ row.name }}</span>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
            </div>
            <div v-if="row.description" class="text-12px text-[#909399] mt-4px">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>
        <!-- 触发条件列 -->
        <el-table-column label="触发条件" min-width="280">
          <template #default="{ row }">
            <div class="space-y-4px">
              <div class="flex flex-wrap gap-4px">
                <el-tag type="primary" size="small" class="m-0">
                  {{ getTriggerSummary(row) }}
                </el-tag>
              </div>
              <!-- 显示定时触发器的额外信息 -->
              <div v-if="hasTimerTrigger(row)" class="mt-4px">
                <el-tooltip :content="getCronExpression(row)" placement="top">
                  <el-tag size="small" type="info" class="mr-4px">
                    <Icon icon="ep:timer" class="mr-2px" />
                    {{ getCronFrequency(row) }}
                  </el-tag>
                </el-tooltip>
                <div v-if="getNextExecutionTime(row)" class="text-12px text-[#909399] mt-2px">
                  <Icon icon="ep:clock" class="mr-2px" />
                  下次执行: {{ formatDate(getNextExecutionTime(row)!) }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 执行动作列 -->
        <el-table-column label="执行动作" min-width="250">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-4px">
              <el-tag type="success" size="small" class="m-0">
                {{ getActionSummary(row) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最近触发" prop="lastTriggeredTime" width="180">
          <template #default="{ row }">
            <span v-if="row.lastTriggeredTime">
              {{ formatDate(row.lastTriggeredTime) }}
            </span>
            <span v-else class="text-gray-400">未触发</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <div>
              <el-button type="primary" link @click="handleEdit(row)">
                <Icon icon="ep:edit" />
                编辑
              </el-button>
              <el-button
                :type="row.status === 0 ? 'warning' : 'success'"
                link
                @click="handleToggleStatus(row)"
              >
                <Icon :icon="row.status === 0 ? 'ep:video-pause' : 'ep:video-play'" />
                {{ getDictLabel(DICT_TYPE.COMMON_STATUS, row.status) }}
              </el-button>
              <el-button type="danger" class="!mr-10px" link @click="handleDelete(row.id)">
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
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
    </el-card>

    <!-- 表单对话框 -->
    <RuleSceneForm v-model="formVisible" :rule-scene="currentRule" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { ContentWrap } from '@/components/ContentWrap'
import RuleSceneForm from './form/RuleSceneForm.vue'
import { IotSceneRule, RuleSceneApi } from '@/api/iot/rule/scene'
import {
  getActionTypeLabel,
  getTriggerTypeLabel,
  IotRuleSceneTriggerTypeEnum
} from '@/views/iot/utils/constants'
import { formatDate } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import { CronUtils } from '@/utils/cron'

/** 场景联动规则管理页面 */
defineOptions({ name: 'IoTSceneRule' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

/** 查询参数 */
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: undefined
})

const loading = ref(true) // 列表的加载中
const list = ref<IotSceneRule[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRows = ref<IotSceneRule[]>([]) // 选中的行数据
const queryFormRef = ref() // 搜索的表单

/** 表单状态 */
const formVisible = ref(false) // 是否可见
const currentRule = ref<IotSceneRule>() // 表单数据

/** 统计数据 */
const statistics = ref({
  total: 0,
  enabled: 0,
  disabled: 0,
  timerRules: 0 // 定时规则数量
})

/** 获取规则摘要信息 */
const getRuleSceneSummary = (rule: IotSceneRule) => {
  const triggerSummary =
    rule.triggers?.map((trigger: any) => {
      // 构建基础描述
      let description = getTriggerTypeLabel(trigger.type)
      switch (trigger.type) {
        case IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE:
          break
        case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST:
        case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST:
        case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE:
          if (trigger.identifier) {
            description += ` (${trigger.identifier})`
          }
          break
        case IotRuleSceneTriggerTypeEnum.TIMER:
          description = `${getTriggerTypeLabel(trigger.type)} (${CronUtils.format(trigger.cronExpression || '')})`
          break
        default:
          description = getTriggerTypeLabel(trigger.type)
      }
      // 添加设备信息（如果有）
      if (trigger.deviceId) {
        description += ` [设备 ID: ${trigger.deviceId}]`
      } else if (trigger.productId) {
        description += ` [产品 ID: ${trigger.productId}]`
      }
      return description
    }) || []

  const actionSummary =
    rule.actions?.map((action: any) => {
      // 构建基础描述
      let description = getActionTypeLabel(action.type)
      // 添加设备信息（如果有）
      if (action.deviceId) {
        description += ` [设备 ID: ${action.deviceId}]`
      } else if (action.productId) {
        description += ` [产品 ID: ${action.productId}]`
      }
      // 添加告警配置信息（如果有）
      if (action.alertConfigId) {
        description += ` [告警配置 ID: ${action.alertConfigId}]`
      }
      return description
    }) || []

  return {
    triggerSummary: triggerSummary.join(', ') || '无触发器',
    actionSummary: actionSummary.join(', ') || '无执行器'
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await RuleSceneApi.getRuleScenePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    // 更新统计数据
    updateStatistics()
    loading.value = false
  }
}

/** 更新统计数据 */
const updateStatistics = () => {
  statistics.value = {
    total: list.value.length,
    enabled: list.value.filter((item) => item.status === CommonStatusEnum.ENABLE).length,
    disabled: list.value.filter((item) => item.status === CommonStatusEnum.DISABLE).length,
    timerRules: list.value.filter((item) => hasTimerTrigger(item)).length
  }
}

/** 获取触发器摘要 */
const getTriggerSummary = (rule: IotSceneRule) => {
  return getRuleSceneSummary(rule).triggerSummary
}

/** 获取执行器摘要 */
const getActionSummary = (rule: IotSceneRule) => {
  return getRuleSceneSummary(rule).actionSummary
}

/** 检查规则是否包含定时触发器 */
const hasTimerTrigger = (rule: IotSceneRule): boolean => {
  return (
    rule.triggers?.some((trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) || false
  )
}

/** 获取 CRON 表达式的执行频率描述 */
const getCronFrequency = (rule: IotSceneRule): string => {
  const timerTrigger = rule.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER
  )
  if (timerTrigger?.cronExpression) {
    return CronUtils.getFrequencyDescription(timerTrigger.cronExpression)
  }
  return ''
}

/** 获取下次执行时间 */
const getNextExecutionTime = (rule: IotSceneRule): Date | null => {
  const timerTrigger = rule.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER
  )
  if (timerTrigger?.cronExpression) {
    return CronUtils.getNextExecutionTime(timerTrigger.cronExpression)
  }
  return null
}

/** 获取 CRON 表达式原始值 */
const getCronExpression = (rule: IotSceneRule): string => {
  const timerTrigger = rule.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER
  )
  return timerTrigger?.cronExpression || ''
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.name = ''
  queryParams.status = undefined
  handleQuery()
}

/** 添加操作 */
const handleAdd = () => {
  currentRule.value = undefined
  formVisible.value = true
}

/** 修改操作 */
const handleEdit = (row: IotSceneRule) => {
  currentRule.value = row
  formVisible.value = true
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await RuleSceneApi.deleteRuleScene(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch (error) {}
}

/** 修改状态 */
const handleToggleStatus = async (row: IotSceneRule) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '禁用' : '启用'
    await message.confirm('确认要' + text + '"' + row.name + '"吗?')
    // 发起修改状态
    await RuleSceneApi.updateRuleSceneStatus(
      row.id!,
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
    )
    message.success(text + '成功')
    // 刷新
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: IotSceneRule[]) => {
  selectedRows.value = selection
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

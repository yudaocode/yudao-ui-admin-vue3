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
              <div class="text-24px font-600 text-[#303133] leading-none">{{
                statistics.total
              }}</div>
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
              <div class="text-24px font-600 text-[#303133] leading-none">{{
                statistics.enabled
              }}</div>
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
              <div class="text-24px font-600 text-[#303133] leading-none">{{
                statistics.disabled
              }}</div>
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
              <Icon icon="ep:lightning" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">{{
                statistics.triggered
              }}</div>
              <div class="text-14px text-[#909399] mt-4px">今日触发</div>
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
        <!-- TODO puhui999：貌似展示不太对劲。。。一个字，一个 tab 哈了。 -->
        <el-table-column label="触发条件" min-width="250">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-4px">
              <el-tag
                v-for="(trigger, index) in getTriggerSummary(row)"
                :key="index"
                type="primary"
                size="small"
                class="m-0"
              >
                {{ trigger }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <!-- TODO puhui999：貌似展示不太对劲。。。一个字，一个 tab 哈了。 -->
        <el-table-column label="执行动作" min-width="250">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-4px">
              <el-tag
                v-for="(action, index) in getActionSummary(row)"
                :key="index"
                type="success"
                size="small"
                class="m-0"
              >
                {{ action }}
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
            <div class="flex gap-8px">
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
                <!-- TODO @puhui999：字典翻译 -->
                {{ row.status === 0 ? '禁用' : '启用' }}
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

    <!-- 批量操作 -->
    <div
      v-if="selectedRows.length > 0"
      class="fixed bottom-20px left-1/2 transform -translate-x-1/2 z-1000"
    >
      <el-card shadow="always">
        <div class="flex items-center gap-16px">
          <span class="font-500 text-[#303133]"> 已选择 {{ selectedRows.length }} 项 </span>
          <div class="flex gap-8px">
            <el-button @click="handleBatchEnable">
              <Icon icon="ep:video-play" />
              批量启用
            </el-button>
            <el-button @click="handleBatchDisable">
              <Icon icon="ep:video-pause" />
              批量禁用
            </el-button>
            <el-button type="danger" @click="handleBatchDelete">
              <Icon icon="ep:delete" />
              批量删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 表单对话框 -->
    <RuleSceneForm v-model="formVisible" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ContentWrap } from '@/components/ContentWrap'
import RuleSceneForm from './form/RuleSceneForm.vue'
import { IotRuleScene } from '@/api/iot/rule/scene/scene.types'
import { formatDate } from '@/utils/formatTime'

/** 场景联动规则管理页面 */
defineOptions({ name: 'IoTSceneRule' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: undefined as number | undefined
})

const loading = ref(true) // 列表的加载中
const list = ref<IotRuleScene[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRows = ref<IotRuleScene[]>([]) // 选中的行数据
const queryFormRef = ref() // 搜索的表单

// 表单状态
const formVisible = ref(false) // 是否可见
const currentRule = ref<IotRuleScene>() // 表单数据

// 统计数据
const statistics = ref({
  total: 0,
  enabled: 0,
  disabled: 0,
  triggered: 0
})

/** 格式化 CRON 表达式显示 */
// TODO @puhui999：这个能不能 cron 组件里翻译哈；
const formatCronExpression = (cron: string): string => {
  if (!cron) return ''

  // 简单的 CRON 表达式解析和格式化
  const parts = cron.trim().split(' ')
  if (parts.length < 5) return cron

  const [second, minute, hour] = parts

  // 构建可读的描述
  let description = ''

  if (second === '0' && minute === '0') {
    if (hour === '*') {
      description = '每小时'
    } else if (hour.includes('/')) {
      const interval = hour.split('/')[1]
      description = `每${interval}小时`
    } else {
      description = `每天${hour}点`
    }
  } else if (second === '0') {
    if (minute === '*') {
      description = '每分钟'
    } else if (minute.includes('/')) {
      const interval = minute.split('/')[1]
      description = `每${interval}分钟`
    } else {
      description = `每小时第${minute}分钟`
    }
  } else {
    if (second === '*') {
      description = '每秒'
    } else if (second.includes('/')) {
      const interval = second.split('/')[1]
      description = `每${interval}秒`
    }
  }

  return description || cron
}

/** 获取规则摘要信息 */
const getRuleSceneSummary = (rule: IotRuleScene) => {
  // TODO @puhui999：是不是可以使用字段，或者枚举？
  const triggerSummary =
    rule.triggers?.map((trigger) => {
      switch (trigger.type) {
        case 1:
          return `设备状态变更 (${trigger.deviceNames?.length || 0}个设备)`
        case 2:
          return `属性上报 (${trigger.deviceNames?.length || 0}个设备)`
        case 3:
          return `事件上报 (${trigger.deviceNames?.length || 0}个设备)`
        case 4:
          return `服务调用 (${trigger.deviceNames?.length || 0}个设备)`
        case 100:
          return `定时触发 (${formatCronExpression(trigger.cronExpression || '')})`
        default:
          return '未知触发类型'
      }
    }) || []

  // TODO @puhui999：是不是可以使用字段，或者枚举？
  const actionSummary =
    rule.actions?.map((action) => {
      switch (action.type) {
        case 1:
          return `设备属性设置 (${action.deviceControl?.deviceNames?.length || 0}个设备)`
        case 2:
          return `设备服务调用 (${action.deviceControl?.deviceNames?.length || 0}个设备)`
        case 100:
          return '发送告警通知'
        case 101:
          return '发送邮件通知'
        default:
          return '未知执行类型'
      }
    }) || []

  return {
    triggerSummary: triggerSummary.join(', ') || '无触发器',
    actionSummary: actionSummary.join(', ') || '无执行器'
  }
}

/** 查询列表 */
// TODO @puhui999：这里使用真实数据；
const getList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    const mockData = {
      list: [
        {
          id: 1,
          name: '温度过高自动降温',
          description: '当温度超过30度时自动开启空调',
          status: 0,
          triggers: [
            {
              type: 2,
              productKey: 'temp_sensor',
              deviceNames: ['sensor_001'],
              conditions: [
                {
                  type: 'property',
                  identifier: 'temperature',
                  parameters: [{ operator: '>', value: '30' }]
                }
              ]
            }
          ],
          actions: [
            {
              type: 1,
              deviceControl: {
                productKey: 'air_conditioner',
                deviceNames: ['ac_001'],
                type: 'property',
                identifier: 'power',
                params: { power: 1 }
              }
            }
          ],
          lastTriggeredTime: new Date().toISOString(),
          createTime: new Date().toISOString()
        },
        {
          id: 2,
          name: '设备离线告警',
          description: '设备离线时发送告警通知',
          status: 0,
          triggers: [
            { type: 1, productKey: 'smart_device', deviceNames: ['device_001', 'device_002'] }
          ],
          actions: [{ type: 100, alertConfigId: 1 }],
          createTime: new Date().toISOString()
        }
      ],
      total: 2
    }

    list.value = mockData.list
    total.value = mockData.total

    // 更新统计数据
    updateStatistics()
  } catch (error) {
    console.error('获取列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 更新统计数据 */
const updateStatistics = () => {
  statistics.value = {
    total: list.value.length,
    enabled: list.value.filter((item) => item.status === 0).length,
    disabled: list.value.filter((item) => item.status === 1).length,
    // TODO @puhui999：这里缺了 lastTriggeredTime 定义
    triggered: list.value.filter((item) => item.lastTriggeredTime).length
  }
}

// 获取触发器摘要
const getTriggerSummary = (rule: IotRuleScene) => {
  return getRuleSceneSummary(rule).triggerSummary
}

// 获取执行器摘要
const getActionSummary = (rule: IotRuleScene) => {
  return getRuleSceneSummary(rule).actionSummary
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
const handleEdit = (row: IotRuleScene) => {
  currentRule.value = row
  formVisible.value = true
}

/** 删除按钮操作 */
// TODO @puhui999：貌似 id 没用上
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    // await RuleSceneApi.deleteRuleScene(id)

    // 模拟删除操作
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 修改状态 */
const handleToggleStatus = async (row: IotRuleScene) => {
  try {
    // 修改状态的二次确认
    const text = row.status === 0 ? '禁用' : '启用'
    await message.confirm('确认要' + text + '"' + row.name + '"吗?')
    // 发起修改状态
    // TODO @puhui999：这里缺了
    // await RuleSceneApi.updateRuleSceneStatus(row.id, row.status === 0 ? 1 : 0)

    // 模拟状态切换
    row.status = row.status === 0 ? 1 : 0
    message.success(text + '成功')
    // 刷新统计
    updateStatistics()
  } catch {
    // 取消后，进行恢复按钮
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: IotRuleScene[]) => {
  selectedRows.value = selection
}

/** 批量启用操作 */
const handleBatchEnable = async () => {
  try {
    await message.confirm(`确定要启用选中的 ${selectedRows.value.length} 个规则吗？`)
    // 这里应该调用批量启用API
    // TODO @puhui999：这里缺了
    // await RuleSceneApi.updateRuleSceneStatusBatch(selectedRows.value.map(row => row.id), 0)

    // 模拟批量启用
    selectedRows.value.forEach((row) => {
      row.status = 0
    })
    message.success('批量启用成功')
    updateStatistics()
  } catch {}
}

/** 批量禁用操作 */
const handleBatchDisable = async () => {
  try {
    await message.confirm(`确定要禁用选中的 ${selectedRows.value.length} 个规则吗？`)
    // 这里应该调用批量禁用API
    // TODO @puhui999：这里缺了
    // await RuleSceneApi.updateRuleSceneStatusBatch(selectedRows.value.map(row => row.id), 1)

    // 模拟批量禁用
    selectedRows.value.forEach((row) => {
      row.status = 1
    })
    message.success('批量禁用成功')
    updateStatistics()
  } catch {}
}

/** 批量删除操作 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个规则吗？`, '提示', {
      type: 'warning'
    })

    // TODO @puhui999：这里缺了
    // 这里应该调用批量删除API
    message.success('批量删除成功')
    await getList()
  } catch (error) {}
}

// 初始化
onMounted(() => {
  getList()
})
</script>

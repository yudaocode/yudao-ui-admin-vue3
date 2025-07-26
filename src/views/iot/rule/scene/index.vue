<template>
  <ContentWrap>
    <!-- 页面头部 -->
    <div class="flex justify-between items-start mb-20px">
      <div class="flex-1">
        <h2 class="flex items-center m-0 mb-8px text-24px font-600 text-[#303133]">
          <Icon icon="ep:connection" class="mr-12px text-[#409eff]" />
          场景联动规则
        </h2>
        <p class="m-0 text-[#606266] text-14px"> 通过配置触发条件和执行动作，实现设备间的智能联动控制 </p>
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
        <!-- TODO @puhui999：字典 -->
        <el-form-item label="规则状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
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
    <!-- TODO @puhui999：这种需要服用的 stats-content、stats-info 的属性，到底 unocss 好，还是现有的 style css 好~ -->
    <el-row :gutter="16" class="mb-16px">
      <el-col :span="6">
        <el-card class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px" shadow="hover">
          <div class="flex items-center">
            <div class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#667eea] to-[#764ba2]">
              <Icon icon="ep:document" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">{{ statistics.total }}</div>
              <div class="text-14px text-[#909399] mt-4px">总规则数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px" shadow="hover">
          <div class="flex items-center">
            <div class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#f093fb] to-[#f5576c]">
              <Icon icon="ep:check" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">{{ statistics.enabled }}</div>
              <div class="text-14px text-[#909399] mt-4px">启用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px" shadow="hover">
          <div class="flex items-center">
            <div class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#4facfe] to-[#00f2fe]">
              <Icon icon="ep:close" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">{{ statistics.disabled }}</div>
              <div class="text-14px text-[#909399] mt-4px">禁用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2px" shadow="hover">
          <div class="flex items-center">
            <div class="w-48px h-48px rounded-8px flex items-center justify-center text-24px text-white mr-16px bg-gradient-to-br from-[#43e97b] to-[#38f9d7]">
              <Icon icon="ep:lightning" />
            </div>
            <div>
              <div class="text-24px font-600 text-[#303133] leading-none">{{ statistics.triggered }}</div>
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
              <!-- TODO @puhui999：字典 -->
              <el-tag
                :type="row.status === 0 ? 'success' : 'danger'"
                size="small"
                class="flex-shrink-0"
              >
                {{ row.status === 0 ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div v-if="row.description" class="text-12px text-[#909399] mt-4px">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>
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
        <!-- TODO @puhui999：貌似要新增一个字段？ -->
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- TODO @puhui999：间隙大了点 -->
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
                <!-- TODO @puhui999：翻译，字典 -->
                {{ row.status === 0 ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
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
    <div v-if="selectedRows.length > 0" class="fixed bottom-20px left-1/2 transform -translate-x-1/2 z-1000">
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
    <RuleSceneForm v-model="formVisible" :rule-scene="currentRule" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import RuleSceneForm from './form/RuleSceneForm.vue'
import { IotRuleScene } from '@/api/iot/rule/scene/scene.types'
import { getRuleSceneSummary } from './utils/transform'
import { formatDate } from '@/utils/formatTime'

/** 场景联动规则管理页面 */
defineOptions({ name: 'IoTSceneRule' })

const message = useMessage()
// const { t } = useI18n() // TODO @puhui999：可以删除

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: undefined as number | undefined
})

// 数据状态
// TODO @puhui999：变量名，和别的页面保持一致哈
const loading = ref(true)
const list = ref<IotRuleScene[]>([])
const total = ref(0)
const selectedRows = ref<IotRuleScene[]>([])

// 表单状态
const formVisible = ref(false)
const currentRule = ref<IotRuleScene>()

// 统计数据
const statistics = ref({
  total: 0,
  enabled: 0,
  disabled: 0,
  triggered: 0
})

// 获取列表数据
// TODO @puhui999：接入
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

// TODO @puhui999：方法注释，使用 /** */ 风格

// 更新统计数据
const updateStatistics = () => {
  statistics.value = {
    total: list.value.length,
    enabled: list.value.filter((item) => item.status === 0).length,
    disabled: list.value.filter((item) => item.status === 1).length,
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

// 事件处理
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.name = ''
  queryParams.status = undefined
  handleQuery()
}

// TODO @puhui999：这个要不还是使用 open 方式，只是弹出的右侧；
const handleAdd = () => {
  currentRule.value = undefined
  formVisible.value = true
}

const handleEdit = (row: IotRuleScene) => {
  currentRule.value = row
  formVisible.value = true
}

// TODO @puhui999：handleDelete、handleToggleStatus 保持和别的模块一致哇？
const handleDelete = async (row: IotRuleScene) => {
  try {
    await ElMessageBox.confirm('确定要删除这个规则吗？', '提示', {
      type: 'warning'
    })

    // 这里应该调用删除API
    message.success('删除成功')
    getList()
  } catch (error) {
    // 用户取消删除
  }
}

const handleToggleStatus = async (row: IotRuleScene) => {
  try {
    const newStatus = row.status === 0 ? 1 : 0
    const action = newStatus === 0 ? '启用' : '禁用'

    await ElMessageBox.confirm(`确定要${action}这个规则吗？`, '提示', {
      type: 'warning'
    })

    // 这里应该调用状态切换API
    row.status = newStatus
    message.success(`${action}成功`)
    updateStatistics()
  } catch (error) {
    // 用户取消操作
  }
}

const handleSelectionChange = (selection: IotRuleScene[]) => {
  selectedRows.value = selection
}

// TODO @puhui999：batch 操作的逻辑，要不和其它 UI 界面保持一致，或者相对一致哈；
const handleBatchEnable = async () => {
  try {
    await ElMessageBox.confirm(`确定要启用选中的 ${selectedRows.value.length} 个规则吗？`, '提示', {
      type: 'warning'
    })

    // 这里应该调用批量启用API
    selectedRows.value.forEach((row) => {
      row.status = 0
    })

    message.success('批量启用成功')
    updateStatistics()
  } catch (error) {
    // 用户取消操作
  }
}

const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确定要禁用选中的 ${selectedRows.value.length} 个规则吗？`, '提示', {
      type: 'warning'
    })

    // 这里应该调用批量禁用API
    selectedRows.value.forEach((row) => {
      row.status = 1
    })

    message.success('批量禁用成功')
    updateStatistics()
  } catch (error) {
    // 用户取消操作
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个规则吗？`, '提示', {
      type: 'warning'
    })

    // 这里应该调用批量删除API
    message.success('批量删除成功')
    getList()
  } catch (error) {
    // 用户取消操作
  }
}

// 初始化
onMounted(() => {
  getList()
})
</script>



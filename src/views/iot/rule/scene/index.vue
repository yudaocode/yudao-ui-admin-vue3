<!-- 改进的场景联动规则管理页面 -->
<template>
  <ContentWrap>
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <Icon icon="ep:connection" class="title-icon" />
          场景联动规则
        </h2>
        <p class="page-description"> 通过配置触发条件和执行动作，实现设备间的智能联动控制 </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <Icon icon="ep:plus" />
          新增规则
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
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
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon total">
              <Icon icon="ep:document" />
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.total }}</div>
              <div class="stats-label">总规则数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon enabled">
              <Icon icon="ep:check" />
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.enabled }}</div>
              <div class="stats-label">启用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon disabled">
              <Icon icon="ep:close" />
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.disabled }}</div>
              <div class="stats-label">禁用规则</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon active">
              <Icon icon="ep:lightning" />
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.triggered }}</div>
              <div class="stats-label">今日触发</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="list" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="规则名称" prop="name" min-width="200">
          <template #default="{ row }">
            <div class="rule-name-cell">
              <span class="rule-name">{{ row.name }}</span>
              <!-- TODO @puhui999：字典 -->
              <el-tag
                :type="row.status === 0 ? 'success' : 'danger'"
                size="small"
                class="status-tag"
              >
                {{ row.status === 0 ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div v-if="row.description" class="rule-description">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="250">
          <template #default="{ row }">
            <div class="trigger-summary">
              <el-tag
                v-for="(trigger, index) in getTriggerSummary(row)"
                :key="index"
                type="primary"
                size="small"
                class="trigger-tag"
              >
                {{ trigger }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="执行动作" min-width="250">
          <template #default="{ row }">
            <div class="action-summary">
              <el-tag
                v-for="(action, index) in getActionSummary(row)"
                :key="index"
                type="success"
                size="small"
                class="action-tag"
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
            <div class="action-buttons">
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
    <div v-if="selectedRows.length > 0" class="batch-actions">
      <el-card shadow="always">
        <div class="batch-content">
          <span class="batch-info"> 已选择 {{ selectedRows.length }} 项 </span>
          <div class="batch-buttons">
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
    <RuleSceneForm v-model="formVisible" :rule-scene="currentRule" @success="handleFormSuccess" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import RuleSceneForm from './components/RuleSceneForm.vue'
import { IotRuleScene } from '@/api/iot/rule/scene/scene.types'
import { getRuleSceneSummary } from './utils/transform'
import { formatDate } from '@/utils/formatTime'

/** 改进的场景联动规则管理页面 */
defineOptions({ name: 'ImprovedRuleSceneIndex' })

const message = useMessage()
// const { t } = useI18n()

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: undefined as number | undefined
})

// 数据状态
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

const handleAdd = () => {
  currentRule.value = undefined
  formVisible.value = true
}

const handleEdit = (row: IotRuleScene) => {
  currentRule.value = row
  formVisible.value = true
}

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

const handleFormSuccess = () => {
  getList()
}

// 初始化
onMounted(() => {
  getList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  margin-right: 12px;
  color: #409eff;
}

.page-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.search-card {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.stats-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-content {
  display: flex;
  align-items: center;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.stats-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.enabled {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.disabled {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.active {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.table-card {
  margin-bottom: 20px;
}

.rule-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-name {
  font-weight: 500;
  color: #303133;
}

.status-tag {
  flex-shrink: 0;
}

.rule-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.trigger-summary,
.action-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.trigger-tag,
.action-tag {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.batch-info {
  font-weight: 500;
  color: #303133;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}
</style>

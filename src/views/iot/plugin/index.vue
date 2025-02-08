<!-- TODO @haohao：搞到 config 目录，会不会更好哈 -->
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
      <el-form-item label="插件名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入插件名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          @change="handleQuery"
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PLUGIN_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['iot:plugin-config:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <template v-if="viewMode === 'list'">
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="插件名称" align="center" prop="name" />
        <el-table-column label="插件标识" align="center" prop="pluginKey" />
        <el-table-column label="jar 包" align="center" prop="fileName" />
        <el-table-column label="版本号" align="center" prop="version" />
        <el-table-column label="部署方式" align="center" prop="deployType">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_PLUGIN_DEPLOY_TYPE" :value="scope.row.deployType" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row.id, Number($event))"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" min-width="120px">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openDetail(scope.row.id)"
              v-hasPermi="['iot:product:query']"
            >
              查看
            </el-button>
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['iot:plugin-config:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['iot:plugin-config:delete']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template v-if="viewMode === 'card'">
      <el-row :gutter="16">
        <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="12" :lg="6" class="mb-4">
          <el-card
            class="h-full transition-colors relative overflow-hidden"
            :body-style="{ padding: '0' }"
          >
            <div class="p-4 relative">
              <!-- 标题区域 -->
              <div class="flex items-center mb-3">
                <div class="mr-2.5 flex items-center">
                  <el-image :src="defaultIconUrl" class="w-[18px] h-[18px]" />
                </div>
                <div class="text-[16px] font-600 flex-1">{{ item.name }}</div>
                <!-- 添加插件状态标签 -->
                <div class="inline-flex items-center">
                  <div
                    class="w-1 h-1 rounded-full mr-1.5"
                    :class="
                      item.status === 1
                        ? 'bg-[var(--el-color-success)]'
                        : 'bg-[var(--el-color-danger)]'
                    "
                  >
                  </div>
                  <el-text
                    class="!text-xs font-bold"
                    :type="item.status === 1 ? 'success' : 'danger'"
                  >
                    {{ item.status === 1 ? '开启' : '禁用' }}
                  </el-text>
                </div>
              </div>

              <!-- 信息区域 -->
              <div class="flex items-center text-[14px]">
                <div class="flex-1">
                  <div class="mb-2.5 last:mb-0">
                    <span class="text-[#717c8e] mr-2.5">插件标识</span>
                    <span class="text-[#0b1d30] whitespace-normal break-all">
                      {{ item.pluginKey }}
                    </span>
                  </div>
                  <div class="mb-2.5 last:mb-0">
                    <span class="text-[#717c8e] mr-2.5">jar 包</span>
                    <span class="text-[#0b1d30]">{{ item.fileName }}</span>
                  </div>
                  <div class="mb-2.5 last:mb-0">
                    <span class="text-[#717c8e] mr-2.5">版本号</span>
                    <span class="text-[#0b1d30]">{{ item.version }}</span>
                  </div>
                  <div class="mb-2.5 last:mb-0">
                    <span class="text-[#717c8e] mr-2.5">部署方式</span>
                    <dict-tag :type="DICT_TYPE.IOT_PLUGIN_DEPLOY_TYPE" :value="item.deployType" />
                  </div>
                </div>
              </div>

              <!-- 分隔线 -->
              <el-divider class="!my-3" />

              <!-- 按钮 -->
              <div class="flex items-center px-0">
                <el-button
                  class="flex-1 !px-2 !h-[32px] text-[13px]"
                  type="primary"
                  plain
                  @click="openForm('update', item.id)"
                  v-hasPermi="['iot:plugin-config:update']"
                >
                  <Icon icon="ep:edit-pen" class="mr-1" />
                  编辑
                </el-button>
                <el-button
                  class="flex-1 !px-2 !h-[32px] !ml-[10px] text-[13px]"
                  type="warning"
                  plain
                  @click="openDetail(item.id)"
                >
                  <Icon icon="ep:view" class="mr-1" />
                  详情
                </el-button>
                <div class="mx-[10px] h-[20px] w-[1px] bg-[#dcdfe6]"></div>
                <el-button
                  class="!px-2 !h-[32px] text-[13px]"
                  type="danger"
                  plain
                  @click="handleDelete(item.id)"
                  v-hasPermi="['iot:device:delete']"
                >
                  <Icon icon="ep:delete" />
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <PluginConfigForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { PluginConfigApi, PluginConfigVO } from '@/api/iot/plugin'
import PluginConfigForm from './PluginConfigForm.vue'

/** IoT 插件配置 列表 */
defineOptions({ name: 'IoTPlugin' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<PluginConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const defaultIconUrl = ref('/src/assets/svgs/iot/card-fill.svg') // 默认插件图标
const viewMode = ref<'card' | 'list'>('card') // 视图模式状态

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PluginConfigApi.getPluginConfigPage(queryParams)
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
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'IoTPluginDetail', params: { id } })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PluginConfigApi.deletePluginConfig(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 处理状态变更 */
const handleStatusChange = async (id: number, status: number) => {
  try {
    // 修改状态的二次确认
    const text = status === 1 ? '启用' : '停用'
    await message.confirm('确认要"' + text + '"插件吗?')
    await PluginConfigApi.updatePluginStatus({
      id: id,
      status
    })
    message.success('更新状态成功')
    getList()
  } catch (error) {
    message.error('更新状态失败')
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

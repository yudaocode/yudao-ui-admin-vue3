<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="参数名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入参数名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="参数键名" prop="key">
        <el-input
          v-model="queryParams.key"
          placeholder="请输入参数键名"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="系统内置" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择系统内置" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.INFRA_CONFIG_TYPE)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date(0, 0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59, 59)]"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <!-- TODO 间隔貌似有点问题 没发现 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          @click="openModal('create')"
          v-hasPermi="['infra:config:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['infra:config:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
        <el-button text @click="showSearch = !showSearch">
          <Icon :icon="showSearch ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </el-button>
      </el-col>
      <!-- TODO 芋艿：右侧导航 -->
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="参数主键" align="center" prop="id" />
      <el-table-column label="参数分类" align="center" prop="category" />
      <el-table-column label="参数名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="参数键名" align="center" prop="key" :show-overflow-tooltip="true" />
      <el-table-column label="参数键值" align="center" prop="value" />
      <el-table-column label="是否可见" align="center" prop="visible">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.visible" />
        </template>
      </el-table-column>
      <el-table-column label="系统内置" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_CONFIG_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <!-- TODO 芋艿：时间写的有点复杂 -->
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <!--          <span>{{ parseTime(scope.row.createTime) }}</span>-->
          <span>{{ dayjs(scope.row.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </template>
      </el-table-column>
      <!-- TODO 芋艿：宽度；里面的 css -->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['infra:config:update']"
          >
            <Icon icon="ep:edit" /> 修改
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['infra:config:delete']"
          >
            <Icon icon="ep:delete" /> 删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <config-form ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="Config">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as ConfigApi from '@/api/infra/config'
import ConfigForm from './form.vue'
import dayjs from 'dayjs'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const showSearch = ref(true) // 搜索框的是否展示
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  key: undefined,
  type: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ConfigApi.getConfigPage(queryParams)
    list.value = data.list
    total.value = data.value
  } finally {
    loading.value = false
  }
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 二次确认
    await message.delConfirm()
    // 发起删除
    await ConfigApi.deleteConfig(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryForm"
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
      <!--      <el-form-item label="系统内置" prop="type">-->
      <!--        <el-select v-model="queryParams.type" placeholder="系统内置" clearable>-->
      <!--          <el-option v-for="dict in this.getDictDatas(DICT_TYPE.INFRA_CONFIG_TYPE)" :key="parseInt(dict.value)"-->
      <!--                     :label="dict.label" :value="parseInt(dict.value)"/>-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
      <!-- TODO：时间无法设置 -->
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
        />
      </el-form-item>
      <el-form-item>
        <!-- TODO 按钮图标不对 -->
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="参数主键" align="center" prop="id" />
      <el-table-column label="参数分类" align="center" prop="category" />
      <el-table-column label="参数名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="参数键名" align="center" prop="key" :show-overflow-tooltip="true" />
      <el-table-column label="参数键值" align="center" prop="value" />
      <el-table-column label="系统内置" align="center" prop="type">
        <template v-slot="scope">
          <dict-tag :type="DICT_TYPE.INFRA_CONFIG_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
    </el-table>
  </content-wrap>
</template>
<script setup lang="ts" name="Config">
import * as ConfigApi from '@/api/infra/config'
import { DICT_TYPE } from '@/utils/dict'

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
const queryForm = ref() // 搜索的表单

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
  queryForm.value.resetFields()
  handleQuery()
}

// ========== 初始化 ==========
onMounted(() => {
  getList()
})
</script>

<!-- MES 工艺路线列表 -->
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
      <el-form-item label="路线编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工艺路线编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="路线名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工艺路线名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:pro-route:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-route:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="路线编码" align="center" prop="code" min-width="180">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="路线名称" align="center" prop="name" min-width="200" />
      <el-table-column label="路线说明" align="center" prop="description" min-width="200" />
      <!-- TODO @AI：改成 el-switch 形式 -->
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <!-- 停用状态：编辑、启用、删除 -->
          <!-- TODO @AI：禁用不可编辑、删除时，有个 tooltip disable 这样，不要直接隐藏； -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:pro-route:update']"
            v-if="scope.row.status === CommonStatusEnum.DISABLE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="openForm('enable', scope.row.id)"
            v-hasPermi="['mes:pro-route:update']"
            v-if="scope.row.status === CommonStatusEnum.DISABLE"
          >
            启用
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:pro-route:delete']"
            v-if="scope.row.status === CommonStatusEnum.DISABLE"
          >
            删除
          </el-button>
          <!-- 启用状态：禁用 -->
          <el-button
            link
            type="warning"
            @click="handleDisable(scope.row)"
            v-hasPermi="['mes:pro-route:update']"
            v-if="scope.row.status === CommonStatusEnum.ENABLE"
          >
            禁用
          </el-button>
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
  </ContentWrap>

  <!-- 表单弹窗：添加/修改/启用/详情 -->
  <RouteForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import download from '@/utils/download'
import { ProRouteApi, ProRouteVO } from '@/api/mes/pro/route'
import RouteForm from './RouteForm.vue'

defineOptions({ name: 'MesProRoute' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ProRouteVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProRouteApi.getRoutePage(queryParams)
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
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 禁用按钮操作 */
const handleDisable = async (row: ProRouteVO) => {
  try {
    await message.confirm('确认要停用"' + row.name + '"工艺路线吗?')
    await ProRouteApi.updateRouteStatus(row.id!, CommonStatusEnum.DISABLE)
    message.success('停用成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProRouteApi.deleteRoute(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProRouteApi.exportRoute(queryParams)
    download.excel(data, '工艺路线.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

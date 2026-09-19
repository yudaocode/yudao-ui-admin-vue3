<template>
  <doc-alert
    title="【行政】办公用品、用印管理"
    url="https://doc.iocoder.cn/oa/administration/supply-seal/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="80px"
      class="-mb-15px"
    >
      <el-form-item label="物品名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入物品名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="物品编码" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入物品编码"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类别" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择类别"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_CATEGORY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="管理类型" prop="manageType">
        <el-select
          v-model="queryParams.manageType"
          placeholder="请选择管理类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option label="正常" :value="0" />
          <el-option label="停用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:supply-item:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="物品名称" prop="name" min-width="140" />
      <el-table-column label="物品编码" prop="no" min-width="120" />
      <el-table-column label="类别" min-width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_CATEGORY" :value="row.category" />
        </template>
      </el-table-column>
      <el-table-column label="管理类型" min-width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
        </template>
      </el-table-column>
      <el-table-column label="规格型号" prop="model" min-width="100" />
      <el-table-column label="计量单位" prop="unit" width="80" />
      <el-table-column
        label="参考单价"
        prop="referencePrice"
        width="100"
        header-align="center"
        align="right"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column label="库存数量" width="100" align="center">
        <template #default="{ row }">
          <span
            :class="
              row.minStockQuantity > 0 && row.stockQuantity < row.minStockQuantity
                ? 'text-red-500'
                : ''
            "
          >
            {{ row.stockQuantity }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="最低库存" prop="minStockQuantity" width="80" align="center" />
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.picUrl"
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            preview-teleported
            fit="cover"
            class="h-40px w-40px"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'">
            {{ row.status === 0 ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所属部门" prop="deptName" min-width="120" />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="165">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['oa:supply-item:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['oa:supply-item:stock-in']"
            link
            type="primary"
            @click="stockFormRef.open(row)"
          >
            入库
          </el-button>
          <el-button
            v-hasPermi="['oa:supply-item:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 表单弹窗 -->
  <OaSupplyItemForm ref="formRef" @success="getList" />
  <OaSupplyStockForm ref="stockFormRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { erpPriceTableColumnFormatter } from '@/utils'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as SupplyItemApi from '@/api/oa/supply/item'
import OaSupplyItemForm from './OaSupplyItemForm.vue'
import OaSupplyStockForm from './OaSupplyStockForm.vue'

defineOptions({ name: 'OaSupplyItem' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表加载中
const list = ref<SupplyItemApi.SupplyItemVO[]>([]) // 列表数据
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  no: undefined,
  category: undefined as number | undefined,
  manageType: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索表单
const formRef = ref() // 物品表单
const stockFormRef = ref() // 入库表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SupplyItemApi.getSupplyItemPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增和修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id, queryParams.category)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SupplyItemApi.deleteSupplyItem(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

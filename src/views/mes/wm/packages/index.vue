<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="装箱单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入装箱单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售订单编号" prop="salesOrderCode">
        <el-input
          v-model="queryParams.salesOrderCode"
          placeholder="请输入销售订单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户" prop="clientId">
        <MdClientSelect v-model="queryParams.clientId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="检查员" prop="inspectorUserId">
        <UserSelect v-model="queryParams.inspectorUserId" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-package:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      default-expand-all
    >
      <!-- TODO @AI：编号需要 fixed，可以一直被看到，这个列表太长了 -->
      <el-table-column label="装箱单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        label="装箱日期"
        align="center"
        prop="packageDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" min-width="140" />
      <el-table-column label="发票编号" align="center" prop="invoiceCode" min-width="120" />
      <el-table-column label="客户编码" align="center" prop="clientCode" min-width="100" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
      <el-table-column label="箱长度" align="center" prop="length" width="80" />
      <el-table-column label="箱宽度" align="center" prop="width" width="80" />
      <el-table-column label="箱高度" align="center" prop="height" width="80" />
      <el-table-column label="尺寸单位" align="center" prop="sizeUnitName" width="90" />
      <el-table-column label="净重" align="center" prop="netWeight" width="80" />
      <el-table-column label="毛重" align="center" prop="grossWeight" width="80" />
      <el-table-column label="重量单位" align="center" prop="weightUnitName" width="90" />
      <el-table-column label="检查员" align="center" prop="inspectorName" min-width="100" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-package:update']"
            v-if="scope.row.status === MesWmPackageStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-package:update']"
            v-if="scope.row.status === MesWmPackageStatusEnum.PREPARE"
          >
            完成
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-package:delete']"
            v-if="scope.row.status === MesWmPackageStatusEnum.PREPARE"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <PackageForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import { WmPackageApi, WmPackageRespVO } from '@/api/mes/wm/packages'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import PackageForm from './PackageForm.vue'
import { MesWmPackageStatusEnum } from '@/views/mes/utils/constants'

// TODO @AI：注释风格，参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue

defineOptions({ name: 'MesWmPackages' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmPackageRespVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  inspectorUserId: undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmPackageApi.getPackagePage(queryParams)
    list.value = handleTree(data.list)
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增/修改/详情 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 完成 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认完成该装箱单？完成后将不可编辑。')
    await WmPackageApi.finishPackage(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmPackageApi.deletePackage(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>

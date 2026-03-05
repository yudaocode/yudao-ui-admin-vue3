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
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          placeholder="请选择业务类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_BARCODE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务编码" prop="bizCode">
        <el-input
          v-model="queryParams.bizCode"
          placeholder="请输入业务编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：前后端筛选，额外增加 bizName -->
      <el-form-item label="条码内容" prop="content">
        <el-input
          v-model="queryParams.content"
          placeholder="请输入条码内容"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-barcode:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleDelete()"
          :disabled="!selectedIds.length"
          v-hasPermi="['mes:wm-barcode:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 删除
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleConfig"
          v-hasPermi="['mes:wm-barcode-config:query']"
        >
          <Icon icon="ep:setting" class="mr-5px" /> 条码设置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="条码" align="center" width="150">
        <template #default="scope">
          <!-- TODO @AI：改成【操作】那，有个【查看】点击开； -->
          <div class="barcode-preview" @click="handleView(scope.row)">
            <Barcode
              v-if="scope.row.content"
              :content="scope.row.content"
              :format="scope.row.format"
              :width="120"
              :height="60"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="条码格式" align="center" prop="format">
        <template #default="scope">
          <!-- TODO @AI：MES_BARCODE_FORMAT => MES_WM_BARCODE_FORMAT -->
          <dict-tag :type="DICT_TYPE.MES_BARCODE_FORMAT" :value="scope.row.format" />
        </template>
      </el-table-column>
      <el-table-column label="业务类型" align="center" prop="bizType">
        <!-- TODO @AI：MES_BARCODE_BIZ_TYPE => MES_WM_BARCODE_BIZ_TYPE -->
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_BARCODE_BIZ_TYPE" :value="scope.row.bizType" />
        </template>
      </el-table-column>
      <el-table-column label="条码内容" align="center" prop="content" show-overflow-tooltip />
      <el-table-column label="业务编码" align="center" prop="bizCode" />
      <el-table-column label="业务名称" align="center" prop="bizName" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180px" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleView(scope.row)"
            v-hasPermi="['mes:wm-barcode:query']"
          >
            查看
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-barcode:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-barcode:delete']"
          >
            删除
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

  <!-- 表单弹窗：添加/修改 -->
  <BarcodeForm ref="formRef" @success="getList" />

  <!-- 查看弹窗 -->
  <BarcodeViewDialog ref="viewDialogRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { BarcodeApi } from '@/api/mes/wm/barcode'
import { Barcode } from './components'
import BarcodeForm from './BarcodeForm.vue'
import BarcodeViewDialog from './BarcodeViewDialog.vue'

defineOptions({ name: 'MesWmBarcode' })

const message = useMessage()
const { t } = useI18n()
const { push } = useRouter()

const loading = ref(true)
const list = ref([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  bizType: undefined,
  bizCode: undefined,
  content: undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BarcodeApi.getBarcodePage(queryParams)
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

/** 多选框选中数据 */
const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id?: number) => {
  const ids = id ? [id] : selectedIds.value
  try {
    await message.delConfirm()
    await Promise.all(ids.map((id) => BarcodeApi.deleteBarcode(id)))
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 查看条码 */
const viewDialogRef = ref()
const handleView = (row: any) => {
  viewDialogRef.value.open(row)
}

/** 条码设置 */
const handleConfig = () => {
  // TODO @AI：后续改成 name，方便路由调整！
  push('/mes/wm/barcode/config')
}

onMounted(() => {
  getList()
})
// TODO @AI：下面的 scss 尽量使用 unocss；
</script>

<style scoped lang="scss">
.barcode-preview {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
}
</style>

<template>
  <!-- 头部 -->
  <ContentWrap>
    <el-page-header @back="close">
      <template #content>
        <span class="text-16px font-600">模型管理</span>
        <span class="ml-12px text-14px text-[var(--el-text-color-secondary)]">
          模型供应商：{{ provider?.name || '-' }}
          <span v-if="provider?.baseUrl" class="ml-8px">（{{ provider.baseUrl }}）</span>
        </span>
      </template>
    </el-page-header>
  </ContentWrap>

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="模型名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模型名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模型类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择模型类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI1_MODEL_TYPE)"
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
          v-hasPermi="['ai1:model:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="warning" plain @click="openImport" v-hasPermi="['ai1:model:import']">
          <Icon icon="ep:download" class="mr-5px" /> 导入
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['ai1:model:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="模型名称" align="center" prop="name" min-width="160" />
      <el-table-column label="模型标识" align="center" prop="model" min-width="200" />
      <el-table-column label="模型类型" align="center" prop="type" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI1_MODEL_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="140px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai1:model:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai1:model:delete']"
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
  <ModelForm ref="formRef" @success="getList" />
  <!-- 导入弹窗 -->
  <ModelImportForm ref="importRef" @success="handleQuery" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { ModelApi, Model } from '@/api/ai1/model'
import { ProviderApi, Provider } from '@/api/ai1/model/provider'
import ModelForm from './ModelForm.vue'
import ModelImportForm from './ModelImportForm.vue'

/** AI1 模型列表 */
defineOptions({ name: 'Ai1ProviderModel' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { params } = useRoute() // 路由参数

const providerId = Number(params.providerId) // 模型供应商编号
const provider = ref<Provider>() // 模型供应商信息
const loading = ref(true) // 列表的加载中
const list = ref<Model[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  providerId,
  name: undefined,
  type: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ModelApi.getModelPage(queryParams)
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
  formRef.value.open(type, providerId, id)
}

/** 导入操作 */
const importRef = ref()
const openImport = () => {
  importRef.value.open(providerId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ModelApi.deleteModel(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起批量删除
    await ModelApi.deleteModelList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([]) // 表格勾选的编号
const handleRowCheckboxChange = (records: Model[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'Ai1Provider' })
}

/** 初始化 **/
onMounted(async () => {
  if (!providerId) {
    message.warning('参数错误，模型供应商不能为空！')
    close()
    return
  }
  getList()
  provider.value = await ProviderApi.getProvider(providerId)
})
</script>

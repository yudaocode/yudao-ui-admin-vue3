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
      label-width="68px"
      class="-mb-15px"
    >
      <el-form-item label="编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="印章分类" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择印章分类"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_CATEGORY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" placeholder="请选择所属部门" class="!w-240px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="印章类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择印章类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="保管人" prop="keeperUserId">
        <UserSelectV2
          v-model="queryParams.keeperUserId"
          placeholder="请选择保管人"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="购买时间" prop="purchaseTime">
        <el-date-picker
          v-model="queryParams.purchaseTime"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="启用时间" prop="enableTime">
        <el-date-picker
          v-model="queryParams.enableTime"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="停用时间" prop="disableTime">
        <el-date-picker
          v-model="queryParams.disableTime"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button v-hasPermi="['oa:seal:create']" type="primary" plain @click="openForm('create')">
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="所属部门" prop="deptName" min-width="150" />
      <el-table-column label="印章编号" prop="no" min-width="180" />
      <el-table-column label="印章名称" min-width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.name }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="印章照片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.picUrl"
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            preview-teleported
            fit="contain"
            class="h-50px w-50px"
          />
        </template>
      </el-table-column>
      <el-table-column label="印章类型" min-width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="分类" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_CATEGORY" :value="row.category" />
        </template>
      </el-table-column>
      <el-table-column label="保管人" prop="keeperName" min-width="120" />
      <el-table-column label="保管部门" prop="keeperDeptName" min-width="150" />
      <el-table-column
        label="购买日期"
        prop="purchaseTime"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="启用日期" prop="enableTime" :formatter="dateFormatter2" width="120" />
      <el-table-column
        label="停用日期"
        prop="disableTime"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="显示顺序" prop="sort" width="100" />
      <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="140">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['oa:seal:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['oa:seal:delete']"
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
  <!-- 添加或修改印章弹窗 -->
  <OaSealForm ref="formRef" @success="getList" />
  <!-- 印章详情弹窗 -->
  <OaSealDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import OaSealDetail from './OaSealDetail.vue'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as SealApi from '@/api/oa/seal'
import OaSealForm from './OaSealForm.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'OaSeal' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<SealApi.SealVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: '',
  name: '',
  category: undefined as number | undefined,
  deptId: undefined,
  status: undefined,
  type: undefined,
  keeperUserId: undefined,
  purchaseTime: [],
  enableTime: [],
  disableTime: []
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 添加、修改表单 Ref
const detailRef = ref() // 印章详情 Ref

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SealApi.getSealPage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 查看详情操作 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SealApi.deleteSeal(id)
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

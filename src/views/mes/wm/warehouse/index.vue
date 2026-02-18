<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="仓库编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入仓库编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="仓库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入仓库名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否冻结" prop="frozen">
        <el-select v-model="queryParams.frozen" placeholder="请选择" clearable class="!w-240px">
          <el-option :value="true" label="是" />
          <el-option :value="false" label="否" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-warehouse:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="仓库编码" align="center" prop="code" min-width="120" />
      <el-table-column label="仓库名称" align="center" prop="name" min-width="140" />
      <el-table-column label="仓库地址" align="center" prop="address" min-width="150" />
      <el-table-column label="面积（㎡）" align="center" prop="area" min-width="100" />
      <el-table-column label="负责人" align="center" prop="chargeUserId" min-width="100">
        <template #default="scope">
          {{
            scope.row.chargeUserId
              ? userList.find((user) => user.id === scope.row.chargeUserId)?.nickname || '-'
              : '-'
          }}
        </template>
      </el-table-column>
      <el-table-column label="冻结" align="center" prop="frozen" min-width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.frozen" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="180" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="220">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openLocation(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:query']"
          >
            库区
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:delete']"
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

  <WarehouseForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import * as UserApi from '@/api/system/user'
import WarehouseForm from './WarehouseForm.vue'

defineOptions({ name: 'MesWmWarehouse' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter()

const loading = ref(true) // 列表的加载中
const list = ref<WmWarehouseVO[]>([]) // 列表的数据
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  frozen: undefined
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref

/** 加载用户列表 */
const loadUserList = async () => {
  userList.value = await UserApi.getSimpleUserList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmWarehouseApi.getWarehousePage(queryParams)
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
const formRef = ref() // 表单 Ref
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开库区页面 */
const openLocation = (warehouseId: number) => {
  router.push({
    name: 'MesWmLocation',
    query: { warehouseId: String(warehouseId) }
  })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmWarehouseApi.deleteWarehouse(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([loadUserList(), getList()])
})
</script>

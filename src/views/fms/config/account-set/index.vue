<template>
  <doc-alert
    title="【设置】账套管理、财务参数、财务指标"
    url="https://doc.iocoder.cn/fms/config/account-set/"
  />
  <!-- 操作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true">
      <el-form-item>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['fms:config:account-set:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="账套名称" min-width="220" prop="companyName" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.companyName }}</span>
          <el-tag v-if="scope.row.defaultStatus" class="ml-8px" effect="plain" size="small">
            默认
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="公司编码" align="center" min-width="140" prop="companyCode" />
      <el-table-column label="联系人" align="center" min-width="120" prop="contactName" />
      <el-table-column label="手机号码" align="center" width="140" prop="mobile" />
      <el-table-column
        label="启用期间"
        align="center"
        width="120"
        prop="startTime"
        :formatter="dateFormatter2"
      />
      <el-table-column label="账套状态" align="center" width="100" prop="initialized">
        <template #default="scope">
          <el-tag v-if="scope.row.initialized" type="success">已启用</el-tag>
          <el-tag v-else type="info">待初始化</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" fixed="right" width="200">
        <template #default="scope">
          <el-button
            v-if="scope.row.level === FmsAccountUserLevelEnum.OWNER"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['fms:config:account-set:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.level === FmsAccountUserLevelEnum.OWNER"
            link
            type="primary"
            @click="openMemberForm(scope.row)"
            v-hasPermi="['fms:config:account-set:authorize']"
          >
            授权
          </el-button>
          <el-button
            v-if="!scope.row.initialized && scope.row.level !== FmsAccountUserLevelEnum.READ"
            link
            type="primary"
            @click="openInitializeForm(scope.row)"
            v-hasPermi="['fms:config:account-set:initialize']"
          >
            开始记账
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加或修改账套 -->
  <FmsAccountSetForm ref="formRef" @success="getList" />
  <!-- 初始化账套 -->
  <FmsAccountSetInitializeForm ref="initializeFormRef" @success="handleInitializeSuccess" />
  <!-- 账套成员授权 -->
  <FmsAccountSetMemberForm ref="memberFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import { useFmsStore } from '@/views/fms/store/fms'
import { FmsAccountSetApi } from '@/api/fms/config/account-set'
import type { FmsAccountSetVO } from '@/api/fms/config/account-set'
import { FmsAccountUserLevelEnum } from '@/api/fms/config/account-user'
import FmsAccountSetForm from './FmsAccountSetForm.vue'
import FmsAccountSetInitializeForm from './FmsAccountSetInitializeForm.vue'
import FmsAccountSetMemberForm from './FmsAccountSetMemberForm.vue'

defineOptions({ name: 'FmsAccountSet' })

const fmsStore = useFmsStore() // FMS 状态

const loading = ref(true) // 列表的加载中
const list = ref<FmsAccountSetVO[]>([]) // 账套列表

/** 查询账套列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await FmsAccountSetApi.getAccountSetList()
    // 清除已删除或无权访问的当前账套
    if (
      fmsStore.getAccountSetId &&
      !list.value.some((item) => item.id === fmsStore.getAccountSetId)
    ) {
      fmsStore.clearAccountSet()
    }
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref<InstanceType<typeof FmsAccountSetForm>>() // 账套表单 Ref
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 初始化账套操作 */
const initializeFormRef = ref<InstanceType<typeof FmsAccountSetInitializeForm>>() // 初始化表单 Ref
function openInitializeForm(accountSet: FmsAccountSetVO) {
  initializeFormRef.value?.open(accountSet)
}

/** 账套授权操作 */
const memberFormRef = ref<InstanceType<typeof FmsAccountSetMemberForm>>() // 授权表单 Ref
function openMemberForm(accountSet: FmsAccountSetVO) {
  memberFormRef.value?.open(accountSet)
}

/** 账套初始化成功 */
async function handleInitializeSuccess() {
  await getList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

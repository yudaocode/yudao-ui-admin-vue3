<template>
  <doc-alert
    title="【设置】币别、科目、辅助核算、初始余额"
    url="https://doc.iocoder.cn/fms/config/accounting/"
  />
  <div class="grid grid-cols-[260px_minmax(0,1fr)] gap-16px">
    <!-- 核算类别 -->
    <ContentWrap>
      <div class="mb-16px flex items-center justify-between">
        <span class="text-16px font-bold">核算类别</span>
        <el-button
          v-hasPermi="['fms:config:auxiliary:create']"
          plain
          type="primary"
          @click="openForm()"
          v-if="fmsStore.isAccountSetWritable"
        >
          <Icon class="mr-5px" icon="ep:plus" /> 新增
        </el-button>
      </div>
      <el-table
        ref="typeTableRef"
        v-loading="loading"
        :data="list"
        :show-header="false"
        highlight-current-row
        row-key="id"
        @row-click="handleTypeChange"
      >
        <el-table-column min-width="170">
          <template #default="scope">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex items-center">
                <span class="truncate">{{ scope.row.name }}</span>
                <el-tag v-if="!scope.row.systemPreset" class="ml-6px" size="small"> 自定义 </el-tag>
              </div>
              <div v-if="!scope.row.systemPreset" class="ml-4px flex shrink-0">
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    v-hasPermi="['fms:config:auxiliary:update']"
                    link
                    type="primary"
                    @click.stop="openForm(scope.row)"
                    v-if="fmsStore.isAccountSetWritable"
                  >
                    <Icon icon="ep:edit" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    v-hasPermi="['fms:config:auxiliary:delete']"
                    link
                    type="danger"
                    @click.stop="handleDelete(scope.row)"
                    v-if="fmsStore.isAccountSetWritable"
                  >
                    <Icon icon="ep:delete" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>

    <!-- 核算项目 -->
    <ContentWrap class="min-w-0">
      <FmsAuxiliaryItemPanel
        :account-set-id="accountSetId"
        :auxiliary-type="currentAuxiliaryType"
      />
    </ContentWrap>
  </div>

  <!-- 类别表单弹窗：添加/修改 -->
  <FmsAuxiliaryTypeForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsAuxiliaryTypeApi } from '@/api/fms/config/auxiliary/type'
import type { FmsAuxiliaryTypeVO } from '@/api/fms/config/auxiliary/type'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsAuxiliaryItemPanel from './FmsAuxiliaryItemPanel.vue'
import FmsAuxiliaryTypeForm from './FmsAuxiliaryTypeForm.vue'

defineOptions({ name: 'FmsAuxiliary' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute() // 路由
const fmsStore = useFmsStore() // FMS 状态

const loading = ref(true) // 列表的加载中
const list = ref<FmsAuxiliaryTypeVO[]>([]) // 辅助核算类别列表
const currentAuxiliaryType = ref<FmsAuxiliaryTypeVO>() // 当前辅助核算类别
const typeTableRef = ref() // 类别表格 Ref
const formRef = ref<InstanceType<typeof FmsAuxiliaryTypeForm>>() // 表单 Ref

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号

/** 查询辅助核算类别列表 */
async function getList() {
  if (!accountSetId.value) {
    list.value = []
    currentAuxiliaryType.value = undefined
    loading.value = false
    return
  }
  loading.value = true
  try {
    list.value = await FmsAuxiliaryTypeApi.getAuxiliaryTypeList(accountSetId.value)
    const routeAuxiliaryTypeId = Number(route.query.auxiliaryTypeId)
    currentAuxiliaryType.value =
      list.value.find((item) => item.id === currentAuxiliaryType.value?.id) ||
      list.value.find((item) => item.id === routeAuxiliaryTypeId) ||
      list.value[0]
    // 等待表格渲染完成后，再设置当前辅助核算类别
    await nextTick()
    typeTableRef.value?.setCurrentRow(currentAuxiliaryType.value)
  } finally {
    loading.value = false
  }
}

/** 切换辅助核算类别 */
function handleTypeChange(row: FmsAuxiliaryTypeVO) {
  currentAuxiliaryType.value = row
}

/** 打开类别表单 */
function openForm(row?: FmsAuxiliaryTypeVO) {
  formRef.value?.open(row)
}

/** 删除辅助核算类别 */
async function handleDelete(item: FmsAuxiliaryTypeVO) {
  if (!accountSetId.value) return
  try {
    await message.delConfirm(`确认删除辅助核算类别“${item.name}”吗？`)
    await FmsAuxiliaryTypeApi.deleteAuxiliaryType(accountSetId.value, item.id!)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化并监听账套切换 */
watch(
  accountSetId,
  async () => {
    // 先清空旧账套的类别，避免子组件使用新账套编号查询旧类别
    list.value = []
    currentAuxiliaryType.value = undefined
    await getList()
  },
  { immediate: true }
)
</script>

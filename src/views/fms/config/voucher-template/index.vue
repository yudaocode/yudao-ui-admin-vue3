<template>
  <doc-alert
    title="【设置】凭证字、常用摘要、凭证模板"
    url="https://doc.iocoder.cn/fms/config/voucher/"
  />
  <div class="grid grid-cols-[320px_minmax(0,1fr)] gap-16px">
    <!-- 凭证模板分类 -->
    <ContentWrap>
      <div class="mb-16px flex items-center justify-between">
        <span class="text-16px font-bold">凭证模板分类</span>
        <el-button
          v-hasPermi="['fms:config:voucher-template-category:create']"
          plain
          type="primary"
          @click="openCategoryForm('create')"
          v-if="fmsStore.isAccountSetWritable"
        >
          <Icon class="mr-5px" icon="ep:plus" /> 新增
        </el-button>
      </div>
      <el-table
        ref="categoryTableRef"
        v-loading="loading"
        :data="categories"
        :show-header="false"
        highlight-current-row
        row-key="id"
        @row-click="handleCategoryChange"
      >
        <el-table-column min-width="230">
          <template #default="scope">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex items-center">
                <span class="truncate">{{ scope.row.name }}</span>
                <el-tag class="ml-6px" size="small">
                  {{ getCategoryTemplateCount(scope.row.id) }}
                </el-tag>
              </div>
              <div class="ml-4px flex shrink-0">
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    v-hasPermi="['fms:config:voucher-template-category:update']"
                    link
                    type="primary"
                    @click.stop="openCategoryForm('update', scope.row)"
                    v-if="fmsStore.isAccountSetWritable"
                  >
                    <Icon icon="ep:edit" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    v-hasPermi="['fms:config:voucher-template-category:delete']"
                    link
                    type="danger"
                    @click.stop="handleDeleteCategory(scope.row)"
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

    <!-- 凭证模板 -->
    <ContentWrap class="min-w-0">
      <div class="mb-16px text-16px font-bold">凭证模板</div>
      <el-table
        v-loading="loading"
        :data="currentTemplates"
        :empty-text="currentCategory ? '暂无凭证模板' : '请选择凭证模板分类'"
        :show-overflow-tooltip="true"
        stripe
      >
        <el-table-column label="模板名称" prop="name" min-width="260" />
        <el-table-column label="分录数" align="center" width="100">
          <template #default="scope">{{ scope.row.entries.length }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120">
          <template #default="scope">
            <el-button
              v-hasPermi="['fms:config:voucher-template:delete']"
              link
              type="danger"
              @click="handleDeleteTemplate(scope.row)"
              v-if="fmsStore.isAccountSetWritable"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>
  </div>

  <!-- 模板分类表单弹窗：添加/修改 -->
  <FmsVoucherTemplateCategoryForm ref="categoryFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsVoucherTemplateApi } from '@/api/fms/config/voucher-template'
import type { FmsVoucherTemplateVO } from '@/api/fms/config/voucher-template'
import {
  FmsVoucherTemplateCategoryApi,
  type FmsVoucherTemplateCategoryVO
} from '@/api/fms/config/voucher-template-category'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsVoucherTemplateCategoryForm from './FmsVoucherTemplateCategoryForm.vue'

defineOptions({ name: 'FmsVoucherTemplate' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const fmsStore = useFmsStore() // FMS 状态

const loading = ref(true) // 列表的加载中
const templates = ref<FmsVoucherTemplateVO[]>([]) // 凭证模板列表
const categories = ref<FmsVoucherTemplateCategoryVO[]>([]) // 凭证模板分类列表
const currentCategory = ref<FmsVoucherTemplateCategoryVO>() // 当前凭证模板分类
const categoryTableRef = ref() // 分类表格 Ref
const categoryFormRef = ref<InstanceType<typeof FmsVoucherTemplateCategoryForm>>() // 分类表单 Ref

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const currentTemplates = computed(() =>
  templates.value.filter((item) => item.categoryId === currentCategory.value?.id)
) // 当前分类的凭证模板列表

/** 查询列表 */
async function getList() {
  if (!accountSetId.value) {
    templates.value = []
    categories.value = []
    currentCategory.value = undefined
    loading.value = false
    return
  }
  loading.value = true
  try {
    ;[templates.value, categories.value] = await Promise.all([
      FmsVoucherTemplateApi.getVoucherTemplateList(accountSetId.value),
      FmsVoucherTemplateCategoryApi.getVoucherTemplateCategoryList(accountSetId.value)
    ])
    currentCategory.value =
      categories.value.find((item) => item.id === currentCategory.value?.id) || categories.value[0]
    // 等待表格渲染完成后，再设置当前凭证模板分类
    await nextTick()
    categoryTableRef.value?.setCurrentRow(currentCategory.value)
  } finally {
    loading.value = false
  }
}

/** 统计分类下的模板数 */
function getCategoryTemplateCount(categoryId?: number) {
  return templates.value.filter((item) => item.categoryId === categoryId).length
}

/** 切换凭证模板分类 */
function handleCategoryChange(row: FmsVoucherTemplateCategoryVO) {
  currentCategory.value = row
}

/** 打开模板分类表单 */
function openCategoryForm(type: string, row?: FmsVoucherTemplateCategoryVO) {
  if (!accountSetId.value) {
    return
  }
  categoryFormRef.value?.open(type, accountSetId.value, row)
}

/** 删除模板分类 */
async function handleDeleteCategory(row: FmsVoucherTemplateCategoryVO) {
  if (!accountSetId.value) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除凭证模板分类“${row.name}”吗？`)
    // 发起删除
    await FmsVoucherTemplateCategoryApi.deleteVoucherTemplateCategory(accountSetId.value, row.id!)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 删除凭证模板 */
async function handleDeleteTemplate(row: FmsVoucherTemplateVO) {
  if (!accountSetId.value) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除凭证模板“${row.name}”吗？`)
    // 发起删除
    await FmsVoucherTemplateApi.deleteVoucherTemplate(accountSetId.value, row.id!)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化并监听账套切换 */
watch(accountSetId, getList, { immediate: true })
</script>

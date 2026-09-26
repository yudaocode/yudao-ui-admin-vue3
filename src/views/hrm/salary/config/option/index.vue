<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 列表 -->
  <ContentWrap>
    <div class="flex items-start justify-between">
      <el-tabs v-model="activeTab" class="flex-1">
        <el-tab-pane label="企业可选项" name="enterprise" />
        <el-tab-pane label="系统默认项" name="system" />
      </el-tabs>
      <el-button
        v-hasPermi="['hrm:salary:option:update']"
        class="ml-16px"
        title="补齐并更新标准薪资项，保留已有项的启用和显示设置"
        @click="handleSync"
      >
        <Icon class="mr-5px" icon="ep:refresh" />同步标准薪资项
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="activeList"
      :tree-props="{ children: 'children' }"
      default-expand-all
      row-key="id"
    >
      <el-table-column label="薪资项" min-width="220" prop="name" show-overflow-tooltip />
      <el-table-column align="center" label="类型" width="100">
        <template #default="scope">
          <el-tag v-if="isCategory(scope.row)" type="info">分类</el-tag>
          <el-tag v-else-if="scope.row.templateId" type="warning">标准项</el-tag>
          <el-tag v-else>自定义项</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="加减类型" prop="type" width="100">
        <template #default="scope">
          <dict-tag
            v-if="!isCategory(scope.row) && scope.row.type !== HrmSalaryOptionType.CALCULATED"
            :type="DICT_TYPE.HRM_SALARY_OPTION_TYPE"
            :value="scope.row.type"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="计税" prop="taxEnabled" width="90">
        <template #default="scope">
          <dict-tag
            v-if="!isCategory(scope.row)"
            :type="DICT_TYPE.HRM_SALARY_YES_NO"
            :value="scope.row.taxEnabled ? 1 : 0"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        :label="activeTab === 'enterprise' ? '分类状态' : '显示状态'"
        width="100"
      >
        <template #default="scope">
          <el-switch
            v-if="activeTab === 'enterprise' && isOptionalCategory(scope.row)"
            v-model="scope.row.enabled"
            @change="handleUpdateEnabled(scope.row)"
          />
          <el-switch
            v-else-if="activeTab === 'system' && isSystemStandardOption(scope.row)"
            v-model="scope.row.visible"
            @change="handleUpdateVisible(scope.row)"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="180" prop="remark" show-overflow-tooltip />
      <el-table-column
        v-if="activeTab === 'enterprise'"
        align="center"
        fixed="right"
        label="操作"
        width="150"
      >
        <template #default="scope">
          <template v-if="isOptionalCategory(scope.row)">
            <el-dropdown
              v-if="scope.row.enabled"
              v-hasPermi="['hrm:salary:option:create']"
              trigger="click"
              @command="handleAddOption($event, scope.row)"
            >
              <el-button link type="primary">
                <Icon class="mr-5px" icon="ep:plus" />添加薪资项
                <Icon class="ml-5px" icon="ep:arrow-down" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="option in getInactiveStandardOptions(scope.row)"
                    :key="option.code"
                    :command="option.code"
                  >
                    {{ option.name }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="custom"
                    :divided="getInactiveStandardOptions(scope.row).length > 0"
                  >
                    自定义薪资项
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <span v-else>-</span>
          </template>
          <el-button
            v-else-if="isEnterpriseOption(scope.row)"
            v-hasPermi="['hrm:salary:option:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：新增 -->
  <SalaryOptionForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as SalaryOptionApi from '@/api/hrm/salary/config/option'
import { HrmSalaryOptionType } from '@/views/hrm/utils/constants'
import SalaryOptionForm from './SalaryOptionForm.vue'

defineOptions({ name: 'HrmSalaryOption' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 列表加载中
const list = ref<SalaryOptionApi.SalaryOptionVO[]>([]) // 工资项树
const activeTab = ref('enterprise') // 当前工资项类型
const enterpriseOptionList = computed(
  () =>
    list.value
      .filter((item) => !item.systemFlag)
      .map((item) => ({
        ...item,
        children: item.enabled ? (item.children || []).filter((child) => child.enabled) : []
      })) // 企业可选项
)
const systemOptionList = computed(() => list.value.filter((item) => item.systemFlag)) // 系统默认项
const activeList = computed(() =>
  activeTab.value === 'enterprise' ? enterpriseOptionList.value : systemOptionList.value
) // 当前工资项树
const formRef = ref<InstanceType<typeof SalaryOptionForm>>() // 工资项表单

/** 是否为工资项分类 */
function isCategory(option: SalaryOptionApi.SalaryOptionVO) {
  return !option.parentCode
}

/** 是否为可选分类 */
function isOptionalCategory(option: SalaryOptionApi.SalaryOptionVO) {
  return isCategory(option) && !!option.templateId && !option.systemFlag
}

/** 是否为企业可选薪资项 */
function isEnterpriseOption(option: SalaryOptionApi.SalaryOptionVO) {
  return !isCategory(option) && !option.systemFlag
}

/** 是否为系统标准薪资项 */
function isSystemStandardOption(option: SalaryOptionApi.SalaryOptionVO) {
  return !isCategory(option) && !!option.templateId && option.systemFlag
}

/** 获得分类下已移除的标准薪资项 */
function getInactiveStandardOptions(category: SalaryOptionApi.SalaryOptionVO) {
  const sourceCategory = list.value.find((item) => item.id === category.id)
  return (sourceCategory?.children || []).filter((item) => item.templateId && !item.enabled)
}

/** 查询工资表薪资项树 */
async function getList() {
  loading.value = true
  try {
    const data = await SalaryOptionApi.getSalaryOptionList()
    list.value = handleTree(data, 'code', 'parentCode')
  } finally {
    loading.value = false
  }
}

/** 打开新增表单 */
function openForm(parentCode: number) {
  formRef.value?.open(parentCode)
}

/** 添加薪资项 */
async function handleAddOption(command: number | string, category: SalaryOptionApi.SalaryOptionVO) {
  // 1. 添加自定义薪资项
  if (command === 'custom') {
    openForm(category.code)
    return
  }
  // 2. 重新启用已移除的标准薪资项
  const option = getInactiveStandardOptions(category).find((item) => item.code === command)
  if (!option) {
    return
  }
  await SalaryOptionApi.updateSalaryOptionEnabled(option.id, true)
  message.success(t('common.createSuccess'))
  await getList()
}

/** 更新薪资项启用状态 */
async function handleUpdateEnabled(option: SalaryOptionApi.SalaryOptionVO) {
  try {
    // 更新启用状态
    await SalaryOptionApi.updateSalaryOptionEnabled(option.id, option.enabled)
    message.success(t('common.updateSuccess'))
    await getList()
  } catch {
    // 更新失败时，恢复列表状态
    await getList()
  }
}

/** 更新薪资项显示状态 */
async function handleUpdateVisible(option: SalaryOptionApi.SalaryOptionVO) {
  try {
    // 更新显示状态
    await SalaryOptionApi.updateSalaryOptionVisible(option.id, option.visible)
    message.success(t('common.updateSuccess'))
    await getList()
  } catch {
    // 更新失败时，恢复列表状态
    await getList()
  }
}

/** 同步标准薪资项 */
async function handleSync() {
  // 同步标准薪资项
  await SalaryOptionApi.syncSalaryOption()
  message.success('同步完成，已保留启用和显示设置；已移除的标准项可通过「添加薪资项」恢复')
  // 刷新列表
  await getList()
}

/** 删除企业可选薪资项 */
async function handleDelete(option: SalaryOptionApi.SalaryOptionVO) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 标准薪资项仅停用，企业自定义薪资项直接删除
    if (option.templateId) {
      await SalaryOptionApi.updateSalaryOptionEnabled(option.id, false)
    } else {
      // 发起删除
      await SalaryOptionApi.deleteSalaryOption(option.id)
    }
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

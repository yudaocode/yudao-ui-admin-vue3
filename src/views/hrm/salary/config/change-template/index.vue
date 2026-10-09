<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 操作栏和调薪模板列表 -->
  <ContentWrap>
    <el-button
      v-hasPermi="['hrm:salary:change-template:create']"
      type="primary"
      @click="openForm('create')"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 新增
    </el-button>

    <el-table v-loading="loading" :data="list" class="mt-16px">
      <el-table-column label="模板名称" prop="name" min-width="180" />
      <el-table-column label="默认模板" align="center" prop="defaultStatus" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.defaultStatus ? 'success' : 'info'">
            {{ scope.row.defaultStatus ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="调薪项" min-width="260">
        <template #default="scope">
          <el-space wrap>
            <el-tag v-for="item in scope.row.options || []" :key="item.code" type="primary">
              {{ item.name }}
            </el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="scope">
          <el-button
            v-hasPermi="['hrm:salary:change-template:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['hrm:salary:change-template:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 调薪模板表单 -->
  <SalaryChangeTemplateForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as SalaryChangeTemplateApi from '@/api/hrm/salary/config/change-template'
import SalaryChangeTemplateForm from './SalaryChangeTemplateForm.vue'

defineOptions({ name: 'HrmSalaryChangeTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 列表的加载中
const list = ref<SalaryChangeTemplateApi.HrmSalaryChangeTemplateVO[]>([]) // 列表的数据
const formRef = ref<InstanceType<typeof SalaryChangeTemplateForm>>() // 表单 Ref

/** 查询调薪模板列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await SalaryChangeTemplateApi.getSalaryChangeTemplateList()
  } finally {
    loading.value = false
  }
}

/** 打开调薪模板表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除调薪模板 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SalaryChangeTemplateApi.deleteSalaryChangeTemplate(id)
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

<!-- MES 点检保养方案-项目清单 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button type="primary" plain size="small" @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加项目
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="项目编码" align="center" prop="subjectCode" min-width="120" />
      <el-table-column label="项目名称" align="center" prop="subjectName" min-width="150" />
      <el-table-column label="项目类型" align="center" prop="subjectType" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="scope.row.subjectType" />
        </template>
      </el-table-column>
      <el-table-column label="项目内容" align="center" prop="subjectContent" min-width="150" />
      <el-table-column label="标准" align="center" prop="subjectStandard" min-width="120" />
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <el-form-item label="项目" prop="subjectId">
          <!-- TODO @AI：使用组件的 machinery select，如果没有，就封装一个！另外，现在 {{ item.machineryCode }} - {{ item.machineryName }} 都展示不出来； -->
          <el-select
            v-model="formData.subjectId"
            placeholder="请选择项目"
            class="!w-1/1"
            filterable
          >
            <el-option
              v-for="item in subjectList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <span>{{ item.code }} - {{ item.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { DvCheckPlanSubjectApi, DvCheckPlanSubjectVO } from '@/api/mes/dv/checkplan/subject'
import { DvSubjectApi } from '@/api/mes/dv/subject'

defineOptions({ name: 'CheckPlanSubjectList' })

const props = defineProps<{
  planId: number // 方案编号
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<DvCheckPlanSubjectVO[]>([]) // 列表的数据
const subjectList = ref<any[]>([]) // 项目下拉列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await DvCheckPlanSubjectApi.getListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  planId: undefined as number | undefined,
  subjectId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  subjectId: [{ required: true, message: '项目不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = async (type: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  resetForm()
  // 加载项目下拉列表
  subjectList.value = await DvSubjectApi.getSimpleList()
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DvCheckPlanSubjectVO
    await DvCheckPlanSubjectApi.create(data)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: props.planId,
    subjectId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvCheckPlanSubjectApi.delete(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 planId 变化，加载列表 */
watch(
  () => props.planId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>

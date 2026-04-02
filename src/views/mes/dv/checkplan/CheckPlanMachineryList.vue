<!-- MES 点检保养方案-设备清单 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      v-if="!readonly"
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加设备
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="设备编码" align="center" prop="machineryCode" min-width="120" />
      <el-table-column label="设备名称" align="center" prop="machineryName" min-width="150" />
      <el-table-column label="品牌" align="center" prop="machineryBrand" min-width="100" />
      <el-table-column label="规格型号" align="center" prop="machinerySpec" min-width="120" />
      <!-- TODO @AI：【备注】展示下； -->
      <el-table-column v-if="!readonly" label="操作" align="center" width="80">
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
        <el-form-item label="设备" prop="machineryId">
          <DvMachinerySelect v-model="formData.machineryId" />
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
import { DvCheckPlanMachineryApi, DvCheckPlanMachineryVO } from '@/api/mes/dv/checkplan/machinery'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'

defineOptions({ name: 'CheckPlanMachineryList' })

const props = defineProps<{
  planId: number // 方案编号
  readonly?: boolean // 是否只读模式 TODO @AI：【听我的】，参考别的模块，基于 formType 做判断；你参考下；
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<DvCheckPlanMachineryVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await DvCheckPlanMachineryApi.getListByPlan(props.planId)
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
  machineryId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = async (type: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  resetForm()
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
    const data = formData.value as unknown as DvCheckPlanMachineryVO
    await DvCheckPlanMachineryApi.create(data)
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
    machineryId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvCheckPlanMachineryApi.delete(id)
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

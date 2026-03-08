<!-- MES 子箱列表子组件 -->
<template>
  <div>
    <el-button v-if="isEditable" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加子箱
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="装箱单编号" align="center" prop="code" min-width="160" fixed="left">
        <template #default="scope">
          <el-link type="primary" @click="handleView(scope.row.id)">
            {{ scope.row.code }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        label="装箱日期"
        align="center"
        prop="packageDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" min-width="140" />
      <el-table-column label="发票编号" align="center" prop="invoiceCode" min-width="120" />
      <el-table-column label="客户编码" align="center" prop="clientCode" min-width="100" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
      <el-table-column label="箱长度" align="center" prop="length" width="80" />
      <el-table-column label="箱宽度" align="center" prop="width" width="80" />
      <el-table-column label="箱高度" align="center" prop="height" width="80" />
      <el-table-column label="尺寸单位" align="center" prop="sizeUnitName" width="90" />
      <el-table-column label="净重" align="center" prop="netWeight" width="80" />
      <el-table-column label="毛重" align="center" prop="grossWeight" width="80" />
      <el-table-column label="重量单位" align="center" prop="weightUnitName" width="90" />
      <el-table-column label="检查员" align="center" prop="inspectorName" min-width="100" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column v-if="isEditable" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button
            link
            type="danger"
            @click="handleRemoveChild(scope.row.id)"
            v-if="scope.row.status === MesWmPackageStatusEnum.PREPARE"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 添加子箱弹窗：选择已有装箱单作为子箱 -->
  <Dialog title="添加子箱" v-model="dialogVisible" width="500px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="选择装箱单" prop="childId">
        <WmPackageSelect
          v-model="formData.childId"
          :exclude-id="props.packageId"
          placeholder="请选择要作为子箱的装箱单"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmPackageApi, WmPackageVO } from '@/api/mes/wm/packages'
import { MesWmPackageStatusEnum } from '@/views/mes/utils/constants'
import WmPackageSelect from './components/WmPackageSelect.vue'

defineOptions({ name: 'SubPackageList' })

const props = defineProps<{
  packageId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isEditable = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 子箱列表 ====================
const loading = ref(false)
const list = ref<WmPackageVO[]>([])

/** 查询子箱列表 */
const getList = async () => {
  loading.value = true
  try {
    // 通过分页查询，筛选 parentId 为当前装箱单的记录
    // TODO @AI：这个列表的展示，就是使用分页的，所以正常搞就行了；
    const data = await WmPackageApi.getPackagePage({
      pageNo: 1,
      pageSize: 100,
      parentId: props.packageId
    })
    list.value = data.list || []
  } finally {
    loading.value = false
  }
}

/** 查看子箱详情（打开新弹窗） */
const handleView = (id: number) => {
  // 通过打开详情弹窗查看
  // TODO @AI：不用支持查看详情；移除掉
  window.open(`/mes/wm/packages?id=${id}`, '_blank')
}

/** 移除子箱：将子箱的 parentId 清空 */
const handleRemoveChild = async (childId: number) => {
  try {
    await message.confirm('确认将该装箱单从子箱列表中移除？')
    await WmPackageApi.removeChildPackage(childId)
    message.success('移除成功')
    await getList()
  } catch {}
}

// ==================== 添加子箱表单 ====================
const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref({
  childId: undefined as number | undefined
})
const formRules = reactive({
  childId: [{ required: true, message: '请选择装箱单', trigger: 'change' }]
})
const formRef = ref()

/** 打开添加子箱弹窗 */
const openForm = async (_type: string) => {
  dialogVisible.value = true
  formData.value.childId = undefined
  formRef.value?.resetFields()
}

/** 提交：将选中的装箱单设为当前装箱单的子箱 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await WmPackageApi.addChildPackage(props.packageId, formData.value.childId!)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>

<!-- MES 工艺路线产品 BOM 列表 -->
<template>
  <div>
    <el-tabs v-model="activeProcessId" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="item in processList"
        :key="item.processId"
        :label="item.processName"
        :name="String(item.processId)"
      />
    </el-tabs>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="openForm('create')" :disabled="!activeProcessId">
        <Icon icon="ep:plus" class="mr-5px" /> 添加 BOM 物料
      </el-button>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" width="150" />
      <el-table-column label="物料名称" align="center" prop="itemName" width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" width="150" />
      <el-table-column label="单位" align="center" prop="unitName" width="80" />
      <el-table-column label="用料比例" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗 -->
    <Dialog :title="formTitle" v-model="formVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="BOM 物料" prop="itemId">
          <el-select v-model="formData.itemId" placeholder="请选择 BOM 物料" filterable>
            <el-option
              v-for="item in itemList"
              :key="item.id"
              :label="item.name + (item.code ? ' (' + item.code + ')' : '')"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用料比例" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="0"
            :precision="2"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProRouteProductBomApi, ProRouteProductBomVO } from '@/api/mes/pro/route/productbom'
import { ProRouteProcessApi } from '@/api/mes/pro/route/process'
import { MdItemApi } from '@/api/mes/md/item'

defineOptions({ name: 'RouteProductBomList' })

const props = defineProps<{
  routeId: number
  productId: number
  productName?: string
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const bomList = ref<ProRouteProductBomVO[]>([]) // BOM 列表的数据
const processList = ref<any[]>([]) // 工序列表（用于 Tab）
const activeProcessId = ref('') // 当前选中的工序 Tab
const itemList = ref<any[]>([]) // 物料下拉列表

// 表单相关
const formVisible = ref(false) // 表单弹窗的是否展示
const formTitle = ref('') // 表单弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref<any>({}) // 表单数据
const formRules = reactive({
  itemId: [{ required: true, message: 'BOM 物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '用料比例不能为空', trigger: 'blur' }]
})

/** 查询工序列表 */
const loadProcessList = async () => {
  const list = await ProRouteProcessApi.getRouteProcessListByRoute(props.routeId)
  processList.value = list
  if (list.length > 0) {
    activeProcessId.value = String(list[0].processId)
    await getBomList()
  }
}

/** 查询 BOM 列表 */
const getBomList = async () => {
  if (!activeProcessId.value) return
  loading.value = true
  try {
    // TODO @AI：linter 报错；
    bomList.value = await ProRouteProductBomApi.getRouteProductBomList({
      routeId: props.routeId,
      processId: activeProcessId.value,
      productId: props.productId
    })
  } finally {
    loading.value = false
  }
}

/** 切换工序 Tab */
const handleTabChange = () => {
  getBomList()
}

/** 加载物料列表 */
const loadItemList = async () => {
  itemList.value = await MdItemApi.getItemSimpleList()
}

/** 添加/修改操作 */
const openForm = (type: string, row?: ProRouteProductBomVO) => {
  formVisible.value = true
  formTitle.value = type === 'create' ? '添加 BOM 物料' : '编辑 BOM 物料'
  formType.value = type
  if (type === 'create') {
    formData.value = {
      routeId: props.routeId,
      processId: Number(activeProcessId.value),
      productId: props.productId,
      quantity: 1
    }
  } else {
    formData.value = { ...row }
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ProRouteProductBomApi.createRouteProductBom(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProRouteProductBomApi.updateRouteProductBom(formData.value)
      message.success(t('common.updateSuccess'))
    }
    formVisible.value = false
    await getBomList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProRouteProductBomApi.deleteRouteProductBom(id)
    message.success(t('common.delSuccess'))
    await getBomList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  loadProcessList()
  loadItemList()
})
</script>

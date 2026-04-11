<!-- IoT 产品选择，使用弹窗展示 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" :appendToBody="true" width="60%">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="68px"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input
            v-model="queryParams.name"
            class="!w-240px"
            clearable
            placeholder="请输入产品名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="ProductKey" prop="productKey">
          <el-input
            v-model="queryParams.productKey"
            class="!w-240px"
            clearable
            placeholder="请输入产品标识"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
        :stripe="true"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="multiple" type="selection" width="55" />
        <el-table-column v-else width="55">
          <template #default="scope">
            <el-radio
              v-model="selectedId"
              :value="scope.row.id"
              @change="() => handleRadioChange(scope.row)"
            >
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column align="center" label="名称" prop="name" />
        <el-table-column align="center" label="ProductKey" prop="productKey" />
        <el-table-column align="center" label="品类" prop="categoryName" />
        <el-table-column align="center" label="设备类型" prop="deviceType">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="产品图标" prop="icon">
          <template #default="scope">
            <el-image
              v-if="scope.row.icon"
              :preview-src-list="[scope.row.icon]"
              :src="scope.row.icon"
              class="w-40px h-40px"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="产品图片" prop="picture">
          <template #default="scope">
            <el-image
              v-if="scope.row.picUrl"
              :preview-src-list="[scope.row.picture]"
              :src="scope.row.picUrl"
              class="w-40px h-40px"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="创建时间"
          prop="createTime"
          width="180px"
        />
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ProductApi, ProductVO } from '@/api/iot/product/product'

defineOptions({ name: 'IoTProductTableSelect' })

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  }
})

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('产品选择器')
const formLoading = ref(false)
const loading = ref(true) // 列表的加载中
const list = ref<ProductVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedProducts = ref<ProductVO[]>([]) // 选中的产品列表
const selectedId = ref<number>() // 单选模式下选中的ID
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  productKey: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductApi.getProductPage(queryParams)
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

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  // 重置选择状态
  selectedProducts.value = []
  selectedId.value = undefined
  await getList()
}
defineExpose({ open })

/** 处理行点击事件 */
const tableRef = ref()
const handleRowClick = (row: ProductVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
  } else {
    selectedId.value = row.id
    selectedProducts.value = [row]
  }
}

/** 处理单选变更事件 */
const handleRadioChange = (row: ProductVO) => {
  selectedProducts.value = [row]
}

/** 处理选择变更事件 */
const handleSelectionChange = (selection: ProductVO[]) => {
  if (props.multiple) {
    selectedProducts.value = selection
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (selectedProducts.value.length === 0) {
    message.warning(props.multiple ? '请至少选择一个产品' : '请选择一个产品')
    return
  }
  emit('success', props.multiple ? selectedProducts.value : selectedProducts.value[0])
  dialogVisible.value = false
}
</script>

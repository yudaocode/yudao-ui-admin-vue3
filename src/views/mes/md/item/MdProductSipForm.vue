<!-- MES 产品SIP 列表 -->
<template>
  <div>
    <el-button type="primary" plain size="small" @click="openForm(undefined)" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加 SIP
    </el-button>
    <!-- SIP 卡片列表 -->
    <el-row :gutter="12" v-loading="loading">
      <el-col :span="6" v-for="item in list" :key="item.id" class="mb-12px">
        <el-card shadow="hover" :body-style="{ padding: '0px' }">
          <!-- 图片区域 -->
          <div class="cursor-pointer" @click="handlePreview(item.url)">
            <el-image v-if="item.url" :src="item.url" fit="cover" class="w-full h-160px block" />
            <div
              v-else
              class="w-full h-160px flex items-center justify-center bg-#f5f7fa color-#c0c4cc"
            >
              <Icon icon="ep:picture" :size="32" />
            </div>
          </div>
          <!-- 信息区域 -->
          <div class="p-10px">
            <div class="font-bold text-14px mb-4px truncate">{{ item.title }}</div>
            <div class="text-12px color-gray mb-4px">序号：{{ item.orderNumber }}</div>
            <div v-if="item.processName" class="text-12px color-gray mb-4px">
              工序：{{ item.processName }}
            </div>
            <div v-if="item.description" class="text-12px color-gray truncate">
              {{ item.description }}
            </div>
            <!-- 操作按钮 -->
            <div class="flex justify-end mt-8px">
              <el-button link type="primary" size="small" @click="openForm(item)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(item.id!)"
                >删除</el-button
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- 空状态 -->
      <el-col :span="24" v-if="!loading && list.length === 0">
        <el-empty description="暂无 SIP 数据" />
      </el-col>
    </el-row>

    <!-- 新增/编辑弹窗 -->
    <Dialog :title="formDialogTitle" v-model="formDialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="排列顺序" prop="orderNumber">
          <el-input-number
            v-model="formData.orderNumber"
            :min="0"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <!-- TODO @芋艿：工序选择，等工序（pro_process）模块实现后对接下拉选择 -->
        <el-form-item label="详细描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细描述"
          />
        </el-form-item>
        <el-form-item label="图片" prop="url">
          <UploadImg v-model="formData.url" :limit="1" :is-show-tip="false" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary">确 定</el-button>
        <el-button @click="formDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdProductSipApi, MdProductSipVO } from '@/api/mes/md/item/productSip'
import { UploadImg } from '@/components/UploadFile'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'MdProductSipForm' })

const props = defineProps<{
  itemId: number // 物料产品编号
}>()

const message = useMessage()
const loading = ref(false) // 列表的加载中
const list = ref<MdProductSipVO[]>([]) // SIP 列表

/** 加载 SIP 列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdProductSipApi.getProductSipListByItemId(props.itemId)
  } finally {
    loading.value = false
  }
}

// ==================== 图片预览 ====================

/** 预览图片 */
const handlePreview = (url?: string) => {
  if (!url) {
    return
  }
  createImageViewer({ urlList: [url] })
}

// ==================== 新增/编辑 ====================
const formDialogVisible = ref(false) // 弹窗是否可见
const formDialogTitle = ref('') // 弹窗标题
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  itemId: undefined as number | undefined,
  orderNumber: 0,
  processId: undefined as number | undefined,
  title: undefined as string | undefined,
  description: undefined as string | undefined,
  url: undefined as string | undefined,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  orderNumber: [{ required: true, message: '排列顺序不能为空', trigger: 'blur' }]
}) // 表单校验规则

/** 打开新增/编辑表单 */
const openForm = (row?: MdProductSipVO) => {
  formDialogVisible.value = true
  if (row) {
    formDialogTitle.value = '编辑 SIP'
    formData.value = {
      id: row.id,
      itemId: row.itemId,
      orderNumber: row.orderNumber,
      processId: row.processId,
      title: row.title,
      description: row.description,
      url: row.url,
      remark: row.remark
    }
  } else {
    formDialogTitle.value = '添加 SIP'
    formData.value = {
      id: undefined,
      itemId: props.itemId,
      orderNumber: 0,
      processId: undefined,
      title: undefined,
      description: undefined,
      url: undefined,
      remark: undefined
    }
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  if (formData.value.id) {
    await MdProductSipApi.updateProductSip(formData.value as unknown as MdProductSipVO)
    message.success('编辑成功')
  } else {
    await MdProductSipApi.createProductSip(formData.value as unknown as MdProductSipVO)
    message.success('添加成功')
  }
  formDialogVisible.value = false
  await getList()
}

// ==================== 删除 ====================

/** 删除 SIP */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdProductSipApi.deleteProductSip(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 itemId 变化 */
watch(
  () => props.itemId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>

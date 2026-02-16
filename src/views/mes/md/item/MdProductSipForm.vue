<!-- MES 产品SIP 列表 -->
<template>
  <div>
    <el-button type="primary" plain size="small" @click="openForm('create')" class="mb-10px">
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
            <div v-if="item.description" class="text-12px color-gray truncate">
              {{ item.description }}
            </div>
            <!-- 操作按钮 -->
            <div class="flex justify-end mt-8px">
              <el-button link type="primary" size="small" @click="openForm('update', item)">
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(item.id!)">
                删除
              </el-button>
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
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="展示顺序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="内容说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细描述"
          />
        </el-form-item>
        <!-- TODO @芋艿：所属工序，等工序模块完成后改为下拉选择 -->
        <el-form-item label="所属工序" prop="processId">
          <el-input v-model="formData.processId" placeholder="请输入工序编号" />
        </el-form-item>
        <el-form-item label="图片" prop="url">
          <UploadImg v-model="formData.url" :limit="1" :is-show-tip="false" />
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
import { MdProductSipApi, MdProductSipVO } from '@/api/mes/md/item/productSip'
import { UploadImg } from '@/components/UploadFile'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'MdProductSipForm' })

const props = defineProps<{
  itemId: number // 物料产品编号
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
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
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  itemId: undefined as number | undefined,
  sort: 0,
  processId: undefined as number | undefined,
  title: undefined as string | undefined,
  description: undefined as string | undefined,
  url: undefined as string | undefined,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排列顺序不能为空', trigger: 'blur' }]
}) // 表单校验规则

/** 打开表单弹窗 */
const openForm = (type: string, row?: MdProductSipVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && row) {
    formData.value = {
      id: row.id,
      itemId: row.itemId,
      sort: row.sort,
      processId: row.processId,
      title: row.title,
      description: row.description,
      url: row.url,
      remark: row.remark
    }
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    itemId: props.itemId,
    sort: 0,
    processId: undefined,
    title: undefined,
    description: undefined,
    url: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
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
    const data = formData.value as unknown as MdProductSipVO
    if (formType.value === 'create') {
      await MdProductSipApi.createProductSip(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdProductSipApi.updateProductSip(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
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

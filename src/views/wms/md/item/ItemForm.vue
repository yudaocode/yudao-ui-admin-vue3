<!-- WMS 商品表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1200px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="88px"
    >
      <!-- 基础信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="formData.name" maxlength="60" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="categoryId">
            <ItemCategorySelect v-model="formData.categoryId" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品编号" prop="code">
            <el-input v-model="formData.code" maxlength="20" placeholder="请输入商品编号">
              <template #append>
                <el-button @click="formData.code = generateWmsCode('I')">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品单位" prop="unit">
            <el-input v-model="formData.unit" maxlength="20" placeholder="请输入单位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品品牌" prop="brandId">
            <ItemBrandSelect v-model="formData.brandId" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" maxlength="255" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 规格信息 -->
      <div class="mb-12px flex items-center justify-between">
        <span class="text-14px font-bold">规格</span>
        <el-button plain type="primary" @click="handleAddSku">
          <Icon class="mr-5px" icon="ep:plus" />
          新增规格
        </el-button>
      </div>
      <el-table :data="formData.skus" border>
        <el-table-column label="规格名称" min-width="150">
          <template #default="scope">
            <el-form-item
              :prop="'skus.' + scope.$index + '.name'"
              :rules="skuNameRules"
              class="!mb-0 !w-1/1"
              label-width="0"
            >
              <el-input
                v-model="scope.row.name"
                maxlength="255"
                class="!w-1/1"
                placeholder="请输入规格名称"
              />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="编号/条码" width="260">
          <template #default="scope">
            <el-input v-model="scope.row.code" maxlength="64" class="!w-1/1" placeholder="编号">
              <template #append>
                <el-button @click="scope.row.code = generateWmsCode('S')">生成</el-button>
              </template>
            </el-input>
            <el-input
              v-model="scope.row.barCode"
              maxlength="64"
              class="!w-1/1 mt-5px"
              placeholder="条码"
            >
              <template #append>
                <el-button @click="scope.row.barCode = generateWmsCode()">生成</el-button>
              </template>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="长/宽/高(cm)" width="210">
          <template #default="scope">
            <div class="flex w-1/1 gap-5px">
              <el-input-number
                v-model="scope.row.length"
                :controls="false"
                :min="0"
                :precision="DIMENSION_PRECISION"
                class="!w-1/3"
                placeholder="长"
              />
              <el-input-number
                v-model="scope.row.width"
                :controls="false"
                :min="0"
                :precision="DIMENSION_PRECISION"
                class="!w-1/3"
                placeholder="宽"
              />
              <el-input-number
                v-model="scope.row.height"
                :controls="false"
                :min="0"
                :precision="DIMENSION_PRECISION"
                class="!w-1/3"
                placeholder="高"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="净重/毛重(kg)" width="180">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.netWeight"
              :controls="false"
              :min="0"
              :precision="WEIGHT_PRECISION"
              class="!w-1/1"
              placeholder="净重"
            />
            <el-input-number
              v-model="scope.row.grossWeight"
              :controls="false"
              :min="0"
              :precision="WEIGHT_PRECISION"
              class="!w-1/1 mt-5px"
              placeholder="毛重"
            />
          </template>
        </el-table-column>
        <el-table-column label="成本价/销售价" width="180">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.costPrice"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="成本价"
            />
            <el-input-number
              v-model="scope.row.sellingPrice"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1 mt-5px"
              placeholder="销售价"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="scope">
            <el-button link type="danger" @click="handleDeleteSku(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { FormRules } from 'element-plus'
import { ItemApi, ItemVO } from '@/api/wms/md/item'
import { ItemSkuVO } from '@/api/wms/md/item/sku'
import { DIMENSION_PRECISION, PRICE_PRECISION, WEIGHT_PRECISION } from '@/views/wms/utils/format'
import { generateWmsCode } from '@/views/wms/utils/constants'
import ItemBrandSelect from './brand/components/ItemBrandSelect.vue'
import ItemCategorySelect from './category/components/ItemCategorySelect.vue'

/** WMS 商品表单 */
defineOptions({ name: 'WmsItemForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ItemVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  categoryId: undefined,
  unit: undefined,
  brandId: undefined,
  remark: undefined,
  skus: []
})
const formRules = reactive<FormRules>({
  code: [{ required: true, message: '商品编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '商品分类不能为空', trigger: 'change' }],
  skus: [{ required: true, message: '至少包含一个商品规格', trigger: 'change' }]
})
const skuNameRules = [{ required: true, message: '规格名称不能为空', trigger: 'blur' }]
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const item = await ItemApi.getItem(id)
      formData.value = {
        ...item,
        skus: item.skus?.length ? item.skus : [buildEmptySku()]
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 构建空规格 */
function buildEmptySku(): ItemSkuVO {
  return {
    id: undefined,
    name: undefined,
    barCode: undefined,
    code: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    grossWeight: undefined,
    netWeight: undefined,
    costPrice: undefined,
    sellingPrice: undefined
  }
}

/** 添加规格 */
const handleAddSku = () => {
  formData.value.skus?.push(buildEmptySku())
}

/** 删除规格 */
const handleDeleteSku = (index: number) => {
  if (!formData.value.skus || formData.value.skus.length <= 1) {
    message.error('至少包含一个商品规格')
    return
  }
  formData.value.skus.splice(index, 1)
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ItemVO
    if (formType.value === 'create') {
      await ItemApi.createItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await ItemApi.updateItem(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    categoryId: undefined,
    unit: undefined,
    brandId: undefined,
    remark: undefined,
    skus: [buildEmptySku()]
  }
  formRef.value?.resetFields()
}
</script>

<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1300px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="计费方式" prop="chargeMode">
        <el-radio-group v-model="formData.chargeMode" @change="changeChargeMode">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.EXPRESS_CHARGE_MODE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="运费" prop="charges">
        <el-table border style="width: 100%" :data="formData.charges">
          <el-table-column align="center" label="区域" width="360">
            <template #default="{ row }">
              <el-cascader
                v-model="row.areaIds"
                :options="areaTree"
                :props="defaultProps2"
                class="w-1/1"
                clearable
                placeholder="请选择地区"
                filterable
                collapse-tags
              />
            </template>
          </el-table-column>
          <el-table-column
            align="center"
            :label="columnTitle.startCountTitle"
            width="180"
            prop="startCount"
          >
            <template #default="{ row }">
              <el-input-number v-model="row.startCount" :min="1" />
            </template>
          </el-table-column>
          <el-table-column width="180" align="center" label="运费(元)" prop="startPrice">
            <template #default="{ row }">
              <el-input-number v-model="row.startPrice" :min="1" />
            </template>
          </el-table-column>
          <el-table-column
            width="180"
            align="center"
            :label="columnTitle.extraCountTitle"
            prop="extraCount"
          >
            <template #default="{ row }">
              <el-input-number v-model="row.extraCount" :min="1" />
            </template>
          </el-table-column>
          <el-table-column width="180" align="center" label="续费(元)" prop="extraPrice">
            <template #default="{ row }">
              <el-input-number v-model="row.extraPrice" :min="1" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center">
            <template #default="scope">
              <el-button link type="danger" @click="deleteChargeArea(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" plain @click="addChargeArea()">
          <Icon icon="ep:plus" class="mr-5px" /> 添加区域
        </el-button>
      </el-form-item>
      <el-form-item label="包邮区域" prop="frees">
        <el-table border style="width: 100%" :data="formData.frees">
          <el-table-column align="center" label="区域" width="360">
            <template #default="{ row }">
              <el-cascader
                v-model="row.areaIds"
                :options="areaTree"
                :props="defaultProps2"
                class="w-1/1"
                clearable
                placeholder="请选择商品分类"
                filterable
                collapse-tags
              />
            </template>
          </el-table-column>
          <el-table-column align="center" :label="columnTitle.freeCountTitle" prop="freeCount">
            <template #default="{ row }">
              <el-input-number v-model="row.freeCount" :min="1" />
            </template>
          </el-table-column>
          <el-table-column align="center" label="包邮金额（元）" prop="freePrice">
            <template #default="{ row }">
              <el-input-number v-model="row.freePrice" :min="1" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center">
            <template #default="scope">
              <el-button link type="danger" @click="deleteFreeArea(scope.$index)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" plain @click="addFreeArea()">
          <Icon icon="ep:plus" class="mr-5px" /> 添加区域
        </el-button>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" controls-position="right" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as DeliveryExpressTemplateApi from '@/api/mall/trade/delivery/expressTemplate'
import * as AreaApi from '@/api/system/area'
import { defaultProps } from '@/utils/tree'
import { yuanToFen, fenToYuan } from '@/utils'
import { cloneDeep } from 'lodash-es'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const defaultProps2 = {
  ...defaultProps,
  multiple: true
}

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  chargeMode: 1,
  sort: 0,
  charges: [],
  frees: []
})
const columnTitleMap = new Map()
const columnTitle = ref({
  startCountTitle: '首件',
  extraCountTitle: '续件',
  freeCountTitle: '包邮件数'
})
const formRules = reactive({
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  chargeMode: [{ required: true, message: '配送计费方式不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '分类排序不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  try {
    // 修改时，设置数据
    if (id) {
      formLoading.value = true
      formData.value = await DeliveryExpressTemplateApi.getDeliveryExpressTemplate(id)
      columnTitle.value = columnTitleMap.get(formData.value.chargeMode)
      formData.value.charges.forEach((item) => {
        // 前端价格以元展示
        item.startPrice = fenToYuan(item.startPrice)
        item.extraPrice = fenToYuan(item.extraPrice)
      })
      formData.value.frees.forEach((item) => {
        item.freePrice = fenToYuan(item.freePrice)
      })
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = cloneDeep(formData.value) as DeliveryExpressTemplateApi.DeliveryExpressTemplateVO
    // 前端价格以元展示，提交到后端。用分计算
    data.charges.forEach((item) => {
      item.startPrice = yuanToFen(item.startPrice)
      item.extraPrice = yuanToFen(item.extraPrice)
    })
    data.frees.forEach((item) => {
      item.freePrice = yuanToFen(item.freePrice)
    })
    if (formType.value === 'create') {
      await DeliveryExpressTemplateApi.createDeliveryExpressTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await DeliveryExpressTemplateApi.updateDeliveryExpressTemplate(data)
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
    name: '',
    chargeMode: 1,
    charges: [
      {
        areaIds: [1],
        startCount: 2,
        startPrice: 5,
        extraCount: 5,
        extraPrice: 10
      }
    ],
    frees: [],
    sort: 0
  }
  columnTitle.value = columnTitleMap.get(1)
  formRef.value?.resetFields()
}

/** 配送计费方法改变 */
const changeChargeMode = (chargeMode: number) => {
  columnTitle.value = columnTitleMap.get(chargeMode)
}

/** 初始化数据 */
const areaTree = ref([])
const initData = async () => {
  // 表头标题和计费方式的映射
  columnTitleMap.set(1, {
    startCountTitle: '首件',
    extraCountTitle: '续件',
    freeCountTitle: '包邮件数'
  })
  columnTitleMap.set(2, {
    startCountTitle: '首件重量(kg)',
    extraCountTitle: '续件重量(kg)',
    freeCountTitle: '包邮重量(kg)'
  })
  columnTitleMap.set(3, {
    startCountTitle: '首件体积(m³)',
    extraCountTitle: '续件体积(m³)',
    freeCountTitle: '包邮体积(m³)'
  })
  // 加载区域数据
  areaTree.value = await AreaApi.getAreaTree()
}

/** 添加计费区域 */
const addChargeArea = () => {
  const data = formData.value
  data.charges.push({
    areaIds: [],
    startCount: 1,
    startPrice: 1,
    extraCount: 1,
    extraPrice: 1
  })
}

/** 删除计费区域 */
const deleteChargeArea = (index) => {
  const data = formData.value
  data.charges.splice(index, 1)
}

/** 添加包邮区域 */
const addFreeArea = () => {
  const data = formData.value
  data.frees.push({
    areaIds: [],
    freeCount: 1,
    freePrice: 1
  })
}

/** 删除包邮区域 */
const deleteFreeArea = (index) => {
  const data = formData.value
  data.frees.splice(index, 1)
}

/** 初始化 **/
onMounted(() => {
  initData()
})
</script>

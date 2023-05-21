<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="85%">
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
          <el-radio :label="1">按件数</el-radio>
          <el-radio :label="2">按重量</el-radio>
          <el-radio :label="3">按体积</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="运费" prop="templateCharge">
        <el-table border style="width: 100%" :data="formData.templateCharge">
          <el-table-column align="center" label="区域">
            <template #default="{ row }">
              <!--   @芋艿 TODO 数据多，性能有问题 , 如何解决 -->
              <el-tree-select
                v-model="row.areaId"
                :data="areaList"
                :props="defaultProps"
                node-key="id"
                check-strictly
                show-checkbox
                check-on-click-node
                :render-after-expand="false"
              />
            </template>
          </el-table-column>
          <el-table-column :label="columnTitle.startCountTitle" prop="startCount">
            <template #default="{ row }">
              <el-input-number v-model="row.startCount" :min="1" />
            </template>
          </el-table-column>
          <!--   TODO 元转换 分       -->
          <el-table-column label="运费(元)" prop="startPrice">
            <template #default="{ row }">
              <el-input-number v-model="row.startPrice" :min="1" />
            </template>
          </el-table-column>
          <el-table-column :label="columnTitle.extraCountTitle" prop="extraCount">
            <template #default="{ row }">
              <el-input-number v-model="row.extraCount" :min="1" />
            </template>
          </el-table-column>
          <el-table-column label="续费(元)" prop="extraPrice">
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
      <el-form-item label="包邮区域" prop="templateFree">
        <el-table border style="width: 100%" :data="formData.templateFree">
          <el-table-column label="区域">
            <template #default="{ row }">
              <!--   @芋艿 TODO 数据多，性能有问题 , 如何解决 -->
              <el-tree-select
                v-model="row.areaId"
                :data="areaList"
                :props="defaultProps"
                node-key="id"
                check-strictly
                show-checkbox
                check-on-click-node
                :render-after-expand="false"
              />
            </template>
          </el-table-column>
          <el-table-column :label="columnTitle.freeCountTitle" prop="freeCount">
            <template #default="{ row }">
              <el-input-number v-model="row.freeCount" :min="1" />
            </template>
          </el-table-column>
          <el-table-column label="包邮金额（元）" prop="freePrice">
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
<script setup lang="ts">
import * as DeliveryExpressTemplateApi from '@/api/mall/trade/delivery/expressTemplate'
import { defaultProps } from '@/utils/tree'
import { getAreaTree } from '@/api/system/area'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  chargeMode: 1,
  sort: 0,
  templateCharge: [],
  templateFree: []
})
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
const areaList = ref([]) //区域数据
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
    const data = formData.value as DeliveryExpressTemplateApi.DeliveryExpressTemplateVO
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
    templateCharge: [
      {
        areaId: 1,
        startCount: 2,
        startPrice: 5,
        extraCount: 5,
        extraPrice: 10
      }
    ],
    templateFree: [],
    sort: 0
  }
  columnTitle.value = {
    startCountTitle: '首件',
    extraCountTitle: '续件',
    freeCountTitle: '包邮件数'
  }
  formRef.value?.resetFields()
}
/** 配送计费方法改变 */
const changeChargeMode = (chargeMod: number) => {
  if (chargeMod === 1) {
    columnTitle.value = {
      startCountTitle: '首件',
      extraCountTitle: '续件',
      freeCountTitle: '包邮件数'
    }
  }
  if (chargeMod === 2) {
    columnTitle.value = {
      startCountTitle: '首件重量(kg)',
      extraCountTitle: '续件重量(kg)',
      freeCountTitle: '包邮重量(kg)'
    }
  }
  if (chargeMod === 3) {
    columnTitle.value = {
      startCountTitle: '首件体积(m³)',
      extraCountTitle: '续件体积(m³)',
      freeCountTitle: '包邮体积(m³)'
    }
  }
}

/** 初始化区域数据 */
const initAreaData = async () => {
  formLoading.value = true
  try {
    const data = await getAreaTree(1)
    areaList.value = data
  } finally {
    formLoading.value = false
  }
}
/** 添加计费区域 */
const addChargeArea = () => {
  const data = formData.value
  data.templateCharge.push({
    areaId: undefined,
    startCount: 1,
    startPrice: 1,
    extraCount: 1,
    extraPrice: 1
  })
}
/** 删除计费区域 */
const deleteChargeArea = (index) => {
  const data = formData.value
  data.templateCharge.splice(index, 1)
}
/** 添加包邮区域 */
const addFreeArea = () => {
  const data = formData.value
  data.templateFree.push({
    areaId: undefined,
    freeCount: 1,
    freePrice: 1
  })
}
/** 删除包邮区域 */
const deleteFreeArea = (index) => {
  const data = formData.value
  data.templateFree.splice(index, 1)
}

/** 初始化 **/
onMounted(() => {
  initAreaData()
})
</script>

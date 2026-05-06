<!-- MES 工艺路线表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入编码" :disabled="isHeaderReadonly">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="说明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入工艺路线说明"
          :disabled="isHeaderReadonly"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :disabled="isHeaderReadonly"
        />
      </el-form-item>
      <!-- 编辑/启用/详情时展示 Tab -->
      <template v-if="formData.id">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="组成工序" name="process">
            <RouteProcessList :routeId="formData.id" :form-type="formType" />
          </el-tab-pane>
          <el-tab-pane label="关联产品" name="product">
            <RouteProductList :routeId="formData.id" :form-type="formType" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-form>
    <template #footer>
      <el-button v-if="isEditable" type="primary" @click="submitForm" :disabled="formLoading">
        保 存
      </el-button>
      <el-button v-if="isEnable" type="success" @click="handleEnable" :disabled="formLoading">
        确认启用
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { CommonStatusEnum } from '@/utils/constants'
import { ProRouteApi, ProRouteVO } from '@/api/mes/pro/route'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import RouteProcessList from './RouteProcessList.vue'
import RouteProductList from './RouteProductList.vue'

defineOptions({ name: 'RouteForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / enable / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isEnable = computed(() => formType.value === 'enable') // 是否为启用模式
const isDetail = computed(() => ['detail', 'enable'].includes(formType.value)) // 是否为详情模式（只读）
const isHeaderReadonly = computed(() => ['enable', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增工艺路线',
    update: '编辑工艺路线',
    enable: '启用工艺路线',
    detail: '工艺路线详情'
  }
  return titles[formType.value] || formType.value
})
const activeTab = ref('process') // 子表当前激活的 Tab
const formData = ref<ProRouteVO>({
  id: undefined,
  code: '',
  name: '',
  description: '',
  remark: ''
})
const formRules = reactive({
  code: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 生成编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.PRO_ROUTE_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'process'
  resetForm()
  // 修改/启用/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProRouteApi.getRoute(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (formType.value === 'create') {
      const res = await ProRouteApi.createRoute(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formType.value = 'update'
    } else {
      await ProRouteApi.updateRoute(data)
      message.success('修改成功')
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 确认启用 */
const handleEnable = async () => {
  try {
    await message.confirm(
      '确认启用"' + formData.value.name + '"工艺路线吗？启用前请确认工序和产品 BOM 配置完整。'
    )
    formLoading.value = true
    await ProRouteApi.updateRouteStatus(formData.value.id!, CommonStatusEnum.ENABLE)
    message.success('启用成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: '',
    name: '',
    description: '',
    remark: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

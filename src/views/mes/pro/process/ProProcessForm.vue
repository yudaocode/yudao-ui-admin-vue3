<!-- MES 生产工序表单 -->
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
        <el-col :span="8">
          <el-form-item label="工序编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工序编码">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工序名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工序名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="工序说明" prop="attention">
        <el-input
          v-model="formData.attention"
          type="textarea"
          :rows="3"
          placeholder="请输入工序说明"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
      <!-- 编辑时展示操作步骤 -->
      <template v-if="formData.id">
        <el-divider content-position="left">操作步骤</el-divider>
        <ProProcessContentList :processId="formData.id" />
      </template>
    </el-form>
    <template #footer>
      <el-button v-if="!isDetail" type="primary" @click="submitForm" :loading="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">{{ isDetail ? '关 闭' : '取 消' }}</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProProcessApi, ProProcessVO } from '@/api/mes/pro/process'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import ProProcessContentList from './ProProcessContentList.vue'

defineOptions({ name: 'ProProcessForm' })
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式
const formData = ref<ProProcessVO>({
  id: undefined,
  code: '',
  name: '',
  attention: '',
  status: 0,
  remark: ''
})
const formRules = reactive({
  code: [{ required: true, message: '工序编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工序名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成工序编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.PRO_PROCESS_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  const titles: Record<string, string> = {
    create: '新增生产工序',
    update: '编辑生产工序',
    detail: '生产工序详情'
  }
  dialogTitle.value = titles[type] || type
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProProcessApi.getProcess(id)
    } finally {
      formLoading.value = false
    }
  }
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
    const data = { ...formData.value }
    if (formType.value === 'create') {
      await ProProcessApi.createProcess(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProProcessApi.updateProcess(data)
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
    code: '',
    name: '',
    attention: '',
    status: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

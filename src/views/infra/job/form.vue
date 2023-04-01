<template>
  <!-- 添加或修改定时任务对话框 -->
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="处理器的名字" prop="handlerName">
        <el-input
          :readonly="formData.id !== undefined"
          v-model="formData.handlerName"
          placeholder="请输入处理器的名字"
        />
      </el-form-item>
      <el-form-item label="处理器的参数" prop="handlerParam">
        <el-input v-model="formData.handlerParam" placeholder="请输入处理器的参数" />
      </el-form-item>
      <el-form-item label="CRON 表达式" prop="cronExpression">
        <el-input v-model="formData.cronExpression" placeholder="请输入CRON 表达式">
          <template #append>
            <el-button type="primary" @click="handleShowCron">
              生成表达式
              <i class="el-icon-time el-icon--right"></i>
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="重试次数" prop="retryCount">
        <el-input
          v-model="formData.retryCount"
          placeholder="请输入重试次数。设置为 0 时，不进行重试"
        />
      </el-form-item>
      <el-form-item label="重试间隔" prop="retryInterval">
        <el-input
          v-model="formData.retryInterval"
          placeholder="请输入重试间隔，单位：毫秒。设置为 0 时，无需间隔"
        />
      </el-form-item>
      <el-form-item label="监控超时时间" prop="monitorTimeout">
        <el-input v-model="formData.monitorTimeout" placeholder="请输入监控超时时间，单位：毫秒" />
      </el-form-item>
    </el-form>
    <!-- 操作按钮 -->
    <template #footer>
      <!-- 按钮：保存 -->
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
  <el-dialog
    title="Cron表达式生成器"
    v-model="openCron"
    append-to-body
    class="scrollbar"
    destroy-on-close
  >
    <crontab @hide="openCron = false" @fill="crontabFill" :expression="expression" />
  </el-dialog>
</template>
<script setup lang="ts" name="JobForm">
import * as JobApi from '@/api/infra/job'

const emit = defineEmits(['success', 'crontabFill']) // 定义 success 事件，用于操作成功后的回调

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const defaultFormData = {
  id: undefined,
  name: '',
  status: 0,
  handlerName: '',
  handlerParam: '',
  cronExpression: '',
  retryCount: 0,
  retryInterval: 0,
  monitorTimeout: 0,
  createTime: new Date()
}
const formData = ref({ ...defaultFormData })

// 是否显示Cron表达式弹出层
const openCron = ref(false)
// 传入的表达式
const expression = ref('')
// 表单校验
const formRules = reactive({
  name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  handlerName: [{ required: true, message: '处理器的名字不能为空', trigger: 'blur' }],
  cronExpression: [{ required: true, message: 'CRON 表达式不能为空', trigger: 'blur' }],
  retryCount: [{ required: true, message: '重试次数不能为空', trigger: 'blur' }],
  retryInterval: [{ required: true, message: '重试间隔不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await JobApi.getJobApi(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** cron表达式按钮操作 */
const handleShowCron = () => {
  console.info(123333333333)
  expression.value = formData.value.cronExpression
  openCron.value = true
}

// cron表达式填充
const crontabFill = (expression: string) => {
  formData.value.cronExpression = expression
  emit('crontabFill', expression)
}

// 提交按钮
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as JobApi.JobVO
    if (formType.value === 'create') {
      await JobApi.createJobApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await JobApi.updateJobApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    ...defaultFormData
  }
  formRef.value?.resetFields()
}
</script>

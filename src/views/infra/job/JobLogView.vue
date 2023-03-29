<template>
  <!-- 调度日志详细 -->
  <Dialog title="调度日志详细" v-model="modelVisible" width="700px" append-to-body>
    <el-form ref="form" :model="formData" label-width="120px" size="mini">
      <el-row>
        <el-col :span="12">
          <el-form-item label="日志编号：">{{ formData.id }}</el-form-item>
          <el-form-item label="任务编号：">{{ formData.jobId }}</el-form-item>
          <el-form-item label="处理器的名字：">{{ formData.handlerName }}</el-form-item>
          <el-form-item label="处理器的参数：">{{ formData.handlerParam }}</el-form-item>
          <el-form-item label="第几次执行：">{{ formData.executeIndex }}</el-form-item>
          <el-form-item label="执行时间：">{{
            parseTime(formData.beginTime) + ' ~ ' + parseTime(formData.endTime)
          }}</el-form-item>
          <el-form-item label="执行时长：">{{ formData.duration + ' 毫秒' }}</el-form-item>
          <el-form-item label="任务状态：">
            <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="formData.status" />
          </el-form-item>
          <el-form-item label="执行结果：">{{ formData.result }}</el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">关 闭</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts" name="JobView">
import * as JobLogApi from '@/api/infra/jobLog'
import { DICT_TYPE } from '@/utils/dict'
import { parseTime } from './utils'

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const { t } = useI18n() // 国际化

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  jobId: undefined,
  handlerParam: '',
  handlerName: '',
  executeIndex: '',
  beginTime: undefined,
  endTime: undefined,
  duration: true,
  result: '',
  status: undefined
})

/** 打开弹窗 */
const openModal = async (id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.detail')
  // 查看，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await JobLogApi.getJobLogApi(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

const close = () => {
  emit('success')
}
</script>

<template>
  <!-- 任务详细 -->
  <Dialog title="任务详细" v-model="modelVisible" width="700px" append-to-body>
    <el-form ref="formRef" :model="formData" label-width="200px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="任务编号：">{{ formData.id }}</el-form-item>
          <el-form-item label="任务名称：">{{ formData.name }}</el-form-item>
          <el-form-item label="任务名称：">
            <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="formData.status" />
          </el-form-item>
          <el-form-item label="处理器的名字：">{{ formData.handlerName }}</el-form-item>
          <el-form-item label="处理器的参数：">{{ formData.handlerParam }}</el-form-item>
          <el-form-item label="cron表达式：">{{ formData.cronExpression }}</el-form-item>
          <el-form-item label="重试次数：">{{ formData.retryCount }}</el-form-item>
          <el-form-item label="重试间隔：">{{ formData.retryInterval + ' 毫秒' }}</el-form-item>
          <el-form-item label="监控超时时间：">{{
            formData.monitorTimeout > 0 ? formData.monitorTimeout + ' 毫秒' : '未开启'
          }}</el-form-item>
          <el-form-item label="后续执行时间：">
            <el-timeline class="pt-3">
              <el-timeline-item
                v-for="(activity, index) in nextTimes"
                :key="index"
                :timestamp="parseTime(activity)"
              >
                第{{ index + 1 }}次
              </el-timeline-item>
            </el-timeline>
          </el-form-item>
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
import * as JobApi from '@/api/infra/job'
import { parseTime } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const { t } = useI18n() // 国际化

const formRef = ref() // 表单 Ref
const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  name: '',
  handlerParam: '',
  handlerName: '',
  cronExpression: '',
  retryCount: true,
  retryInterval: '',
  monitorTimeout: 0,
  status: 0
})
const nextTimes = ref([])

/** 打开弹窗 */
const openModal = async (id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.detail')
  // 查看，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await JobApi.getJobApi(id)
      // 获取下一次执行时间
      nextTimes.value = await JobApi.getJobNextTimesApi(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

const close = () => {
  modelVisible.value = false
  emit('success')
}
</script>

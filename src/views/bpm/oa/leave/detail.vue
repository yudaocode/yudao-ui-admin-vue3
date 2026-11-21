<template>
  <ContentWrap>
    <!-- 编辑：是否可以修改由后端校验（审批中），保存后再在流程详情中审批 -->
    <div v-if="updatable" class="mb-10px flex justify-end">
      <el-button type="primary" plain @click="handleUpdate">
        <Icon icon="ep:edit" class="mr-5px" /> 编辑
      </el-button>
    </div>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="请假类型">
        <dict-tag :type="DICT_TYPE.BPM_OA_LEAVE_TYPE" :value="detailData.type" />
      </el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(detailData.startTime, 'YYYY-MM-DD') }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatDate(detailData.endTime, 'YYYY-MM-DD') }}
      </el-descriptions-item>
      <el-descriptions-item label="原因">
        {{ detailData.reason }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { parseId } from '@/utils/id'
import { checkPermi } from '@/utils/permission'
import * as LeaveApi from '@/api/bpm/leave'

defineOptions({ name: 'BpmOALeaveDetail' })

const { query } = useRoute() // 查询参数
const { push } = useRouter() // 路由

const props = defineProps({
  id: {
    type: [String, Number], // 流程详情传递的是 businessKey 字符串，由 parseId 解析
    default: undefined
  },
  readonly: {
    type: Boolean, // 只读，例如说：打印时
    default: false
  }
})
const detailLoading = ref(false) // 表单的加载中
const detailData = ref<any>({}) // 详情数据

/** 是否展示编辑：非只读，并且有请假的业务权限 */
const updatable = computed(() => !props.readonly && checkPermi(['bpm:oa-leave:create']))

/** 编辑：跳转到 create.vue 的编辑模式，只传递业务编号 */
const handleUpdate = () => {
  push({ name: 'OALeaveCreate', query: { id: parseId(props.id || query.id), type: 'update' } })
}

/** 获得数据 */
const getInfo = async () => {
  detailLoading.value = true
  try {
    detailData.value = await LeaveApi.getLeave(parseId(props.id || query.id)!)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open: getInfo }) // 提供 open 方法，用于打开弹窗

/** 初始化 **/
onMounted(() => {
  getInfo()
})
</script>

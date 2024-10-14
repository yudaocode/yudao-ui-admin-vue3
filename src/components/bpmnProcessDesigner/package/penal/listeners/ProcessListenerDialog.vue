<!-- 执行器选择 -->
<template>
  <Dialog title="请选择监听器" v-model="dialogVisible" width="1024px">
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="名字" align="center" prop="name" />
        <el-table-column label="类型" align="center" prop="type">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.BPM_PROCESS_LISTENER_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column label="事件" align="center" prop="event" />
        <el-table-column label="值类型" align="center" prop="valueType">
          <template #default="scope">
            <dict-tag
              :type="DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE"
              :value="scope.row.valueType"
            />
          </template>
        </el-table-column>
        <el-table-column label="值" align="center" prop="value" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="select(scope.row)"> 选择 </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>
<script setup lang="ts">
import { ProcessListenerApi, ProcessListenerVO } from '@/api/bpm/processListener'
import { DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'

/** BPM 流程 表单 */
defineOptions({ name: 'ProcessListenerDialog' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(true) // 列表的加载中
const list = ref<ProcessListenerVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: '',
  status: CommonStatusEnum.ENABLE
})

/** 打开弹窗 */
const open = async (type: string) => {
  queryParams.pageNo = 1
  queryParams.type = type
  getList()
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProcessListenerApi.getProcessListenerPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const select = async (row) => {
  dialogVisible.value = false
  // 发送操作成功的事件
  emit('select', row)
}
</script>

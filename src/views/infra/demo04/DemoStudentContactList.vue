<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-button type="primary" plain @click="openForm('create')">
      <Icon icon="ep:plus" class="mr-5px" /> 新增
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="手机" align="center" prop="mobile" />
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DemoStudentContactForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import DemoStudentContactForm from './DemoStudentContactForm.vue'

const props = defineProps<{
  studentId: undefined // 学生编号
}>()
const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  studentId: undefined
})

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  (val) => {
    queryParams.studentId = val
    handleQuery()
  },
  { immediate: false }
)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // const data = await DemoStudentApi.getDemoStudentPage(queryParams)
    list.value = [
      {
        id: props.studentId,
        mobile: '15601691300'
      }
    ]
    total.value = 10
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
</script>

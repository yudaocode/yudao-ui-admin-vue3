<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="手机" align="center" prop="mobile" />
    </el-table>
  </ContentWrap>
</template>

<script setup lang="ts">
const props = defineProps<{
  studentId: undefined // 学生编号
}>()
const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据

// TODO 芋艿：暂时没改
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // const data = await DemoStudentApi.getDemoStudentPage(queryParams)
    list.value = [
      {
        id: props.studentId,
        mobile: '88888'
      }
    ]
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

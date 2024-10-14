<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          placeholder="请选择业务类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="150px" />
      <el-table-column
        label="获得时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
      />
      <el-table-column label="经验" align="center" prop="experience" width="150px">
        <template #default="scope">
          <el-tag v-if="scope.row.experience > 0" class="ml-2" type="success" effect="dark">
            +{{ scope.row.experience }}
          </el-tag>
          <el-tag v-else class="ml-2" type="danger" effect="dark">
            {{ scope.row.experience }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总经验" align="center" prop="totalExperience" width="150px">
        <template #default="scope">
          <el-tag class="ml-2" effect="dark">
            {{ scope.row.totalExperience }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" align="center" prop="title" width="150px" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="业务编号" align="center" prop="bizId" width="150px" />
      <el-table-column label="业务类型" align="center" prop="bizType" width="150px">
        <!--   TODO 芋艿：此处应创建对应的字典 -->
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE" :value="scope.row.bizType" />
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
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as ExperienceRecordApi from '@/api/member/experience-record/index'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'UserExperienceRecordList' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: null,
  bizId: null,
  bizType: null,
  title: null,
  description: null,
  experience: null,
  totalExperience: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ExperienceRecordApi.getExperienceRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const { userId } = defineProps({
  userId: {
    type: Number,
    required: true
  }
})
/** 初始化 **/
onMounted(() => {
  queryParams.userId = userId
  getList()
})
</script>

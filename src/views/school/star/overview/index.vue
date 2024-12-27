<template>

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="年级" prop="grade">
        <el-input
          v-model="queryParams.grade"
          class="!w-240px"
          clearable
          placeholder="请输入年级"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="getStarTime">
        <el-date-picker
          v-model="queryParams.getStarTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="星章次数" prop="times">
        <el-input
          v-model="queryParams.times"
          class="!w-240px"
          clearable
          placeholder="请输入星章次数"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <el-row :gutter="20" justify="space-between">
    <el-col :span="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="4" animated>
          <Echart :height="500" :options="allTypeGotOptionData" />
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :span="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" animated>
          <Echart :height="500" :options="splitTypeStudentOptionData" />
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :span="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" animated>
          <Echart :height="500" :options="maxStarStudentOptionData" />
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
</template>
<script lang="ts" setup>
import { set } from 'lodash-es'
import * as SchoolApi from '@/api/school/star'
import { EChartsOption } from 'echarts'
import { allTypeGotOption, splitTypeStudentOption, maxStarStudentOption } from './echarts-data'

defineOptions({ name: 'SchoolStarOverview' })
const allTypeGotOptionData = reactive<EChartsOption>(allTypeGotOption) as EChartsOption
const splitTypeStudentOptionData = reactive<EChartsOption>(splitTypeStudentOption) as EChartsOption
const maxStarStudentOptionData = reactive<EChartsOption>(maxStarStudentOption) as EChartsOption
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表的加载中
const queryFormRef = ref() // 搜索的表单
const queryParams = reactive({
  grade: undefined,
  getStarTime: [],
  times: undefined
})

const result = ref()

const getOverviewData = async () => {
  // 请求
  result.value = await SchoolApi.getStarOverview(queryParams);
  handleAllTypeGot(result.value.allTypeStudent)
  handleMaxStartStudent(result.value.maxStarStudent)
  handleSplitTypeStudent(result.value.splitTypeStudent)
  loading.value = false
}

// grade => classs => studentName(count) => starType(count)
const handleAllTypeGot = (result) => {
  result.name = t('analysis.' + result.name)
  const series=[
    {
      type: 'tree',
      data: [result],
      left: '2%',
      right: '2%',
      top: '20%',
      bottom: '8%',
      symbol: 'emptyCircle',
      orient: 'vertical',
      expandAndCollapse: true,
      initialTreeDepth: 2,
      label: {
        position: 'top',
        rotate: 0,
        verticalAlign: 'middle',
        align: 'right'
      },
      leaves: {
        label: {
          position: 'top',
          rotate: 0,
          verticalAlign: 'middle',
          align: 'right'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      animationDurationUpdate: 750
    }
  ]
  set(
    allTypeGotOptionData,
    'series',
    series
  )
}

const handleMaxStartStudent = (result) => {
  result.name = t('analysis.' + result.name)
  const series=[
    {
      type: 'tree',
      data: [result],
      left: '2%',
      right: '2%',
      top: '20%',
      bottom: '8%',
      symbol: 'emptyCircle',
      orient: 'vertical',
      expandAndCollapse: true,
      initialTreeDepth: 2,
      label: {
        position: 'top',
        rotate: 0,
        verticalAlign: 'middle',
        align: 'right'
      },
      leaves: {
        label: {
          position: 'top',
          rotate: 0,
          verticalAlign: 'middle',
          align: 'right'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      animationDurationUpdate: 750
    }
  ]
  set(
    maxStarStudentOptionData,
    'series',
    series
  )
}

const handleSplitTypeStudent = (result) => {
  result.name = t('analysis.' + result.name)
  const series=[
    {
      type: 'tree',
      data: [result],
      left: '2%',
      right: '2%',
      top: '20%',
      bottom: '8%',
      symbol: 'emptyCircle',
      orient: 'vertical',
      expandAndCollapse: true,
      initialTreeDepth: 2,
      label: {
        position: 'top',
        rotate: 0,
        verticalAlign: 'middle',
        align: 'right'
      },
      leaves: {
        label: {
          position: 'top',
          rotate: 90,
          verticalAlign: 'middle',
          align: 'right'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      animationDurationUpdate: 750
    }
  ]
  set(
    splitTypeStudentOptionData,
    'series',
    series
  )
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getOverviewData()
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 初始化 **/
onMounted(() => {
  getOverviewData()
})
</script>


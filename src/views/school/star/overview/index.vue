<template>
  <div>
    <el-card shadow="never">
      <el-skeleton :loading="loading" animated>
        <el-row :gutter="16" justify="space-between">
          <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
            <div class="flex items-center">
              <div>
                <div class="text-15px">
                  使用说明：1、年级为入学年份，如现在的1年级为24级，默认搜索1-6年级 
                  2、如需指定时间范围，结束日期1和结束日期2均可填，两者都填写为对比
                  <!-- {{ t('workplace.welcome') }} {{ username }} {{ t('workplace.happyDay') }} -->
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-skeleton>
    </el-card>
  </div>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      class="-mb-15px"
      label-width="100px"
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
      <el-form-item label="开始日期" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          :default-time="new Date('1 18:00:00')"
          class="!w-240px"
          placeholder="数据开始日期"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="结束日期1" prop="endTime1">
        <el-date-picker
          v-model="queryParams.endTime1"
          :default-time="new Date('1 18:00:00')"
          class="!w-240px"
          placeholder="数据结束日期"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="结束日期2" prop="endTime2">
        <el-date-picker
          v-model="queryParams.endTime2"
          :default-time="new Date('1 18:00:00')"
          class="!w-240px"
          placeholder="两个结束日期之间比较新增"
          type="date"
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
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['school:star:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
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
import download from '@/utils/download'
import { EChartsOption } from 'echarts'
import { allTypeGotOption, splitTypeStudentOption, maxStarStudentOption } from './echarts-data'

defineOptions({ name: 'SchoolStarOverview' })
const allTypeGotOptionData = reactive<EChartsOption>(allTypeGotOption) as EChartsOption
const splitTypeStudentOptionData = reactive<EChartsOption>(splitTypeStudentOption) as EChartsOption
const maxStarStudentOptionData = reactive<EChartsOption>(maxStarStudentOption) as EChartsOption
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表的加载中
const exportLoading = ref(false) // 导出的加载中
const queryFormRef = ref() // 搜索的表单
const queryParams = reactive({
  grade: undefined,
  startTime: undefined,
  endTime1: undefined,
  endTime2: undefined,
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

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await SchoolApi.exportSixStarOverview(queryParams)
    console.log(data)
    download.excel(data , '六星数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}


/** 初始化 **/
onMounted(() => {
  getOverviewData()
})
</script>


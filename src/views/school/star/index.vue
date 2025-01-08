<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      :rules="formRules"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="学生名称" prop="stuName">
        <el-input
          v-model="queryParams.stuName"
          class="!w-240px"
          clearable
          placeholder="请输入学生名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="六星名称" prop="type">
        <el-input
          v-model="queryParams.type"
          class="!w-240px"
          clearable
          placeholder="请输入六星名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-input
          v-model="queryParams.grade"
          class="!w-240px"
          clearable
          placeholder="例：24年入学一年级，输入24"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="开始日期" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          :default-time="new Date('1 00:00:00')"
          class="!w-240px"
          placeholder="开始日期"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="结束日期" prop="endTime1">
        <el-date-picker
          v-model="queryParams.endTime1"
          :default-time="new Date('1 00:00:00')"
          class="!w-240px"
          placeholder="结束日期"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery(queryFormRef)">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button type="primary" 
          plain 
          @click="openImportForm()"
          v-hasPermi = "['school:star:import']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 导入文件
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="学生姓名" prop="stuName" />
      <el-table-column label="六星类型" align="center" prop="type">
        <template #default="scope">
          <el-tag>{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="获得期数" align="center" prop="item">
        <template #default="scope">
          <el-tag>第{{ scope.row.item }}期</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="年级" align="center" prop="grade">
        <template #default="scope">
          {{ scope.row.grade }}级
          {{
            new Date().getFullYear() + (Math.floor(new Date().getMonth() / 9)) - scope.row.grade - 2000 < 7 ? '-' + (new Date().getFullYear() + (Math.floor(new Date().getMonth() / 9)) - scope.row.grade - 2000) + '年级' : ''
          }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="创建时间"
        prop="getStarTime"
        width="180"
      />
      <el-table-column :width="300" align="center" label="操作">
        <template #default="scope">
          <el-button
            v-hasPermi="['school:star:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['school:star:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：导入 -->
  <FileForm ref="importFormRef" @success="getList" />
  <!-- 表单弹窗：编辑 -->
  <SixStarForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter2 } from '@/utils/formatTime'
import * as SchoolApi from '@/api/school/star'
import FileForm from './FileForm.vue'
import SixStarForm from './SixStarForm.vue'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({ name: 'SchoolStar' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  type: '',
  stuName: '',
  grade: undefined,
  startTime: undefined,
  endTime1: undefined
})
const queryFormRef = ref<FormInstance>() // 搜索的表单
const limitNumber = (rule: any, _value: any, callback: any) => {
  if (_value && !Number.isInteger(+_value)) {
    callback(new Error('请输入整数'))
    return
  }
  callback()
}
const formRules = reactive<FormRules<queryParams>>({
  grade : [{ required: false, message: '请输入整数', trigger: 'change', validator: limitNumber}],
})

/** 查询角色列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SchoolApi.getStarPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid, fields) => {
    if (valid) {
      queryParams.pageNo = 1
      getList()
    }
    return
  })

}

/** 重置按钮操作 */
const resetQuery = () => {
  // queryFormRef.value.resetFields()
  // handleQuery(queryFormRef)
}

/** 导入操作 */
const importFormRef = ref()
const openImportForm = (type?: string, id?: number) => {
  formRef.value.open(type, id)
}

// 更新操作
const formRef = ref()
const openForm = (type?: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SchoolApi.deleteStar(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

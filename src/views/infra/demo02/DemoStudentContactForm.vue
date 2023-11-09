<template>
  <!--  <el-row :gutter="10" class="mb2">-->
  <!--    <el-col :span="1.5">-->
  <!--      <el-button type="primary" @click="handleAdd">添加</el-button>-->
  <!--    </el-col>-->
  <!--    <el-col :span="1.5">-->
  <!--      <el-button type="danger">删除</el-button>-->
  <!--    </el-col>-->
  <!--  </el-row>-->
  <el-table
    :data="formData"
    @selection-change="handleDemoStudentContactSelectionChange"
    ref="demoStudentContactRef"
    :stripe="true"
  >
    <el-table-column label="序号" type="index" width="100" />
    <el-table-column label="名字" prop="name" width="300">
      <template #default="scope">
        <el-form-item label-width="0px" :inline-message="true">
          <el-input v-model="scope.row.name" placeholder="请输入名字" />
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column label="手机号码">
      <template #default="{ row, $index }">
        <el-form-item
          label-width="0px"
          :prop="`formData.${$index}.mobile`"
          :rules="formRules.mobile"
          :inline-message="true"
        >
          <el-input type="number" placeholder="输入手机号码" v-model="row.mobile" />
        </el-form-item>
      </template>
    </el-table-column>
  </el-table>
  <el-button @click="handleAdd" class="w-1/1">+ 添加客户信息</el-button>
</template>
<script setup lang="ts">
const formData = ref([
  {
    name: '芋艿'
  },
  {
    name: '土豆'
  }
])
const formRules = reactive({
  mobile: [required]
})

const handleDemoStudentContactSelectionChange = (val) => {
  demoStudentContactList.value = val
}

const demoStudentContactRef = ref()

/** 新增按钮操作 */
const handleAdd = () => {
  formData.value.push({
    name: '测试'
  })
}

/** 删除按钮操作 */
const handleRemove = () => {
  formData.value.push({
    name: '测试'
  })
}
</script>

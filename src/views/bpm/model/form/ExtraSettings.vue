<template>
  <el-form ref="formRef" :model="modelData" label-width="120px" class="mt-20px">
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">提交人权限</el-text>
      </template>
      <el-checkbox v-model="modelData.allowCancelRunningProcess" label="允许撤销审批中的申请" />
      <div class="ml-22px">
        <el-text type="info"> 第一个审批节点通过后，提交人仍可撤销申请 </el-text>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const modelData = defineModel<any>()
</script>

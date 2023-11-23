<!--
 * @Author: zyna
 * @Date: 2023-11-11 14:50:11
 * @LastEditTime: 2023-11-11 14:52:47
 * @FilePath: \yudao-ui-admin-vue3\src\views\crm\contact\detail\ContactBasicInfo.vue
 * @Description:
-->
<template>
  <el-col>
    <el-row>
      <span class="text-xl font-bold">{{ contact.name }}</span>
    </el-row>
  </el-col>
  <el-col class="mt-10px">
    <!-- TODO 标签 -->
    <!--    <Icon icon="ant-design:tag-filled" />-->
  </el-col>
</template>
<script setup lang="ts">
// TODO 芋艿：后面在 review 么？
import * as ContactApi from '@/api/crm/contact'

const { contact } = defineProps<{ contact: ContactApi.ContactVO }>()
</script>

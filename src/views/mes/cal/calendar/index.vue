<!-- MES 排班日历 -->
<template>
  <doc-alert title="【排班】排班计划、排班日历" url="https://doc.iocoder.cn/mes/cal/calendar/" />

  <ContentWrap>
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="按分类" name="type">
        <TypeView />
      </el-tab-pane>
      <el-tab-pane label="按班组" name="team">
        <TeamView />
      </el-tab-pane>
      <el-tab-pane label="按个人" name="user">
        <UserView />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import TypeView from './TypeView.vue'
import TeamView from './TeamView.vue'
import UserView from './UserView.vue'

defineOptions({ name: 'MesCalCalendar' })

const activeTab = ref('type')
</script>

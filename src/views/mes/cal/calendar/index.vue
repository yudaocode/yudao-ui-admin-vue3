<!-- MES 排班日历 -->
<template>
  <ContentWrap>
    <el-tabs v-model="activeTab" type="border-card">
      <!-- TODO @AI：下面三个组件，都有日历，是不是可以复用下； -->
      <el-tab-pane label="按分类" name="type">
        <CalendarTypeView />
      </el-tab-pane>
      <el-tab-pane label="按班组" name="team">
        <TeamView />
      </el-tab-pane>
      <el-tab-pane label="按个人" name="user">
        <PersonView />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import CalendarTypeView from './CalendarTypeView.vue'
import TeamView from './TeamView.vue'
import PersonView from './PersonView.vue'

defineOptions({ name: 'MesCalCalendar' })

const activeTab = ref('type')
</script>

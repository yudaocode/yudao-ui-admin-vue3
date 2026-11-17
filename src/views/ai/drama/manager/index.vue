<!-- AI 短剧制作管理：项目、生成任务 -->
<template>
  <doc-alert title="AI 短剧制作" url="https://doc.iocoder.cn/ai/drama/" />

  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="项目管理" name="project" />
      <el-tab-pane label="生成任务" name="task" />
    </el-tabs>
  </ContentWrap>
  <ProjectList v-if="activeTab === 'project'" />
  <TaskList v-else />
</template>

<script setup lang="ts">
import ProjectList from './ProjectList.vue'
import TaskList from './TaskList.vue'

/** AI 短剧制作管理 */
defineOptions({ name: 'AiDramaManager' })

const activeTab = ref('project')
</script>

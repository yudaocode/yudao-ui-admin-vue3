<template>
  <div>
    <!-- 基本信息标题与操作 -->
    <div class="mb-16px flex items-center justify-between gap-16px">
      <h3 class="m-0 text-18px font-600">项目基本信息</h3>
      <el-button
        v-if="project.adminStatus && editable"
        v-hasPermi="['pms:pm:project:update']"
        type="primary"
        @click="projectFormRef?.open('update', project.id)"
      >
        编辑项目
      </el-button>
    </div>

    <!-- 项目基础字段 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
      <el-descriptions-item label="项目类型">
        {{ formatProjectType(project.type) }}
      </el-descriptions-item>
      <el-descriptions-item label="项目周期">
        {{ formatDate(project.startTime, 'YYYY-MM-DD') || '未设置' }} 至
        {{ formatDate(project.endTime, 'YYYY-MM-DD') || '未设置' }}
      </el-descriptions-item>
      <el-descriptions-item label="可见范围">
        {{ formatProjectOpenStatus(project.openStatus) }}
      </el-descriptions-item>
      <el-descriptions-item label="项目描述" :span="2">
        {{ project.description || '暂无项目描述' }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 项目生命周期管理 -->
    <template v-if="project.adminStatus && editable">
      <el-divider content-position="left">项目管理</el-divider>
      <div class="flex items-center justify-between gap-16px">
        <div>
          <div class="font-600">归档项目</div>
          <div class="mt-4px text-13px leading-20px text-[var(--el-text-color-secondary)]">
            归档后项目只允许查看，不能继续维护项目中的迭代和工作项。
          </div>
        </div>
        <el-button @click="handleArchive">归档</el-button>
      </div>
      <el-divider />
      <div class="flex items-center justify-between gap-16px">
        <div>
          <div class="font-600">移入回收站</div>
          <div class="mt-4px text-13px leading-20px text-[var(--el-text-color-secondary)]">
            项目进入回收站后不可访问；只有项目拥有者可以在回收站彻底删除。
          </div>
        </div>
        <el-button type="danger" @click="handleRecycle">移入回收站</el-button>
      </div>
    </template>

    <!-- 项目表单 -->
    <ProjectForm ref="projectFormRef" @success="emit('success')" />
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as ProjectApi from '@/api/pms/pm/project'
import { formatProjectOpenStatus, formatProjectType } from '@/views/pms/pm/utils/format'
import ProjectForm from '../components/ProjectForm.vue'

defineOptions({ name: 'PmsProjectBasicInfo' })

const props = defineProps<{
  project: ProjectApi.PmsProjectVO
  editable: boolean
}>()
const emit = defineEmits<{ success: [] }>() // 项目更新成功事件

const message = useMessage() // 消息弹窗
const { push } = useRouter() // 路由操作
const projectFormRef = ref<InstanceType<typeof ProjectForm>>() // 项目表单 Ref

/** 归档项目 */
async function handleArchive() {
  try {
    // 归档的二次确认
    await message.confirm('归档后将不能继续操作项目中的数据，确认归档该项目吗？')
    // 执行项目归档
    await ProjectApi.archiveProject(props.project.id)
    // 提示结果并进入归档项目列表
    message.success('项目已归档')
    await push({ name: 'PmsProjectArchive' })
  } catch {}
}

/** 将项目移入回收站 */
async function handleRecycle() {
  try {
    // 移入回收站的二次确认
    await message.delConfirm('确认将该项目移入回收站吗？')
    // 将项目移入回收站
    await ProjectApi.recycleProject(props.project.id)
    // 提示结果并进入项目回收站
    message.success('项目已移入回收站')
    await push({ name: 'PmsProjectRecycle' })
  } catch {}
}
</script>

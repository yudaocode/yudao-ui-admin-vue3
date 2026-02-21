<!-- dhtmlx-gantt Vue 3 封装组件：基于 dhtmlx-gantt 实现甘特图展示和拖拽编辑 -->
<template>
  <div ref="ganttContainer" :style="{ width: '100%', height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

/**
 * GanttChart - 甘特图组件
 *
 * 功能：
 * 1. 按工单分组展示生产任务，工单为 project 行，任务为子行
 * 2. 支持只读预览和拖拽编辑两种模式
 * 3. 拖拽后触发 task-update 事件，通知父组件批量保存
 * 4. 时间刻度：周 → 日，工作日单位（1 工作日 = 8 小时）
 */

defineOptions({ name: 'GanttChart' })

const props = withDefaults(
  defineProps<{
    tasks: any[] // 甘特图任务数据
    readonly?: boolean // 是否只读
    height?: number // 甘特图高度
  }>(),
  {
    tasks: () => [],
    readonly: false,
    height: 350
  }
)

const emit = defineEmits<{
  'task-update': [task: any]
  'task-click': [id: string | number]
}>()

const ganttContainer = ref<HTMLElement>()
const ganttInited = ref(false)

/** 初始化甘特图配置 */
const initGantt = () => {
  if (!ganttContainer.value) return

  // 中文 locale
  gantt.locale = {
    date: {
      month_full: [
        '一月',
        '二月',
        '三月',
        '四月',
        '五月',
        '六月',
        '七月',
        '八月',
        '九月',
        '十月',
        '十一月',
        '十二月'
      ],
      month_short: [
        '1月',
        '2月',
        '3月',
        '4月',
        '5月',
        '6月',
        '7月',
        '8月',
        '9月',
        '10月',
        '11月',
        '12月'
      ],
      day_full: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      day_short: ['日', '一', '二', '三', '四', '五', '六']
    },
    labels: {
      new_task: '新任务',
      icon_save: '保存',
      icon_cancel: '取消',
      icon_details: '详情',
      icon_edit: '编辑',
      icon_delete: '删除',
      confirm_closing: '',
      confirm_deleting: '确认删除？',
      section_description: '描述',
      section_time: '时间',
      section_type: '类型',
      column_wbs: 'WBS',
      column_text: '任务名称',
      column_start_date: '开始时间',
      column_duration: '时长',
      column_add: '',
      link: '关联',
      confirm_link_deleting: '将被删除',
      link_start: '(开始)',
      link_end: '(结束)',
      type_task: '任务',
      type_project: '项目',
      type_milestone: '里程碑',
      minutes: '分钟',
      hours: '小时',
      days: '天',
      weeks: '周',
      months: '月',
      years: '年'
    }
  }

  // 基础配置
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s'
  gantt.config.duration_unit = 'hour'
  gantt.config.duration_step = 8 // 1工作日 = 8小时
  gantt.config.row_height = 36
  gantt.config.bar_height = 24
  gantt.config.fit_tasks = true
  gantt.config.auto_scheduling = false
  gantt.config.drag_links = false
  gantt.config.details_on_create = false
  gantt.config.details_on_dblclick = false
  gantt.config.show_progress = true

  // 只读模式
  if (props.readonly) {
    gantt.config.drag_move = false
    gantt.config.drag_resize = false
    gantt.config.drag_progress = false
  } else {
    gantt.config.drag_move = true
    gantt.config.drag_resize = true
    gantt.config.drag_progress = false
  }

  // 时间刻度：周 > 日
  gantt.config.scales = [
    { unit: 'week', step: 1, format: '%Y年 第%W周' },
    { unit: 'day', step: 1, format: '%m/%d %D' }
  ]

  // 左侧列配置
  gantt.config.columns = [
    { name: 'text', label: '任务名称', tree: true, width: 200, resize: true },
    { name: 'start_date', label: '开始时间', align: 'center', width: 100 },
    { name: 'duration', label: '时长(天)', align: 'center', width: 60 }
  ]

  // 今天标记线
  gantt.plugins({ marker: true })
  gantt.addMarker({
    start_date: new Date(),
    css: 'today',
    text: '今天'
  })

  // 任务颜色模板
  gantt.templates.task_class = (_start: any, _end: any, task: any) => {
    if (task.type === gantt.config.types.project) return 'gantt-project-bar'
    return ''
  }
  gantt.templates.task_cell_class = () => ''
  gantt.templates.task_row_class = () => ''

  // 事件监听
  if (!props.readonly) {
    gantt.attachEvent('onAfterTaskDrag', (id: string | number) => {
      const task = gantt.getTask(id)
      emit('task-update', {
        id: task.taskId || id,
        startTime: task.start_date,
        endTime: task.end_date,
        duration: (task.duration as number) / 8 // 转回工作日
      })
    })
  }

  gantt.attachEvent('onTaskClick', (id: string | number) => {
    emit('task-click', id)
    return true
  })

  gantt.init(ganttContainer.value)
  ganttInited.value = true
}

/** 转换数据为甘特图格式 */
const convertToGanttData = (tasks: any[]) => {
  const data: any[] = []
  // 按工单分组
  const workOrderMap = new Map<number, any[]>()
  tasks.forEach((task) => {
    const woId = task.workOrderId
    if (!workOrderMap.has(woId)) {
      workOrderMap.set(woId, [])
    }
    workOrderMap.get(woId)!.push(task)
  })

  workOrderMap.forEach((woTasks, woId) => {
    const firstTask = woTasks[0]
    // 工单作为 project 行
    data.push({
      id: 'wo_' + woId,
      text: firstTask.workOrderCode + ' ' + firstTask.workOrderName,
      type: gantt.config.types.project,
      open: true
    })
    // 任务行
    woTasks.forEach((t) => {
      data.push({
        id: 'task_' + t.id,
        taskId: t.id,
        text: t.name,
        start_date: t.startTime ? new Date(t.startTime) : new Date(),
        duration: (t.duration || 1) * 8, // 工作日→小时
        parent: 'wo_' + woId,
        progress: t.quantity > 0 ? t.producedQuantity / t.quantity : 0,
        color: t.colorCode || '#00AEF3'
      })
    })
  })

  return { data, links: [] }
}

/** 加载数据到甘特图 */
const loadData = (tasks: any[]) => {
  if (!ganttInited.value) return
  gantt.clearAll()
  const ganttData = convertToGanttData(tasks)
  gantt.parse(ganttData)
}

// 监听 tasks 变化
watch(
  () => props.tasks,
  (val) => {
    if (val && ganttInited.value) {
      loadData(val)
    }
  },
  { deep: true }
)

onMounted(() => {
  initGantt()
  if (props.tasks?.length) {
    loadData(props.tasks)
  }
})

onBeforeUnmount(() => {
  if (ganttInited.value) {
    gantt.clearAll()
  }
})

defineExpose({ loadData })
</script>

<style>
/* 今天标记线 */
.gantt_marker.today {
  background-color: #ff4444;
  opacity: 0.4;
}
.gantt_marker.today .gantt_marker_content {
  color: #ff4444;
  font-size: 12px;
}
/* 工单（project）行样式 */
.gantt-project-bar .gantt_task_progress {
  background: #7b68ee;
}
</style>

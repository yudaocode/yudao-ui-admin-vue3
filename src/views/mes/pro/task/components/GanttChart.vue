<!-- dhtmlx-gantt Vue 3 封装组件：基于 dhtmlx-gantt 实现甘特图展示和拖拽编辑 -->
<template>
  <div ref="ganttContainer" :style="{ width: '100%', height: height + 'px' }"></div>
</template>

<script setup lang="ts">
// TODO @AI：生产工单：绿色；生产任务：蓝色；然后，根据进度（progress）将，已已完成比例的蓝色、绿色加深（这个你调研下，看看是不是这个逻辑；）
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
  if (!ganttContainer.value) {
    return
  }

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
    // TODO @AI：linter 报错；
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
  gantt.config.duration_step = 8 // 1 工作日 = 8 小时
  gantt.config.row_height = 36
  gantt.config.bar_height = 24
  gantt.config.fit_tasks = true
  gantt.config.auto_scheduling = false
  gantt.config.drag_links = false
  gantt.config.details_on_create = false
  gantt.config.details_on_dblclick = false
  gantt.config.show_progress = true
  gantt.config.open_tree_initially = true

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

  // 时间刻度：周 > 日 > 8小时（对齐 KTG）
  const weekScaleTemplate = (date: Date) => {
    const dateToStr = gantt.date.date_to_str('%M %d')
    const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day')
    return dateToStr(date) + ' - ' + dateToStr(endDate)
  }
  const dayTemplate = (date: Date) => {
    return gantt.date.date_to_str('%M %d')(date)
  }
  const daysStyle = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6 ? 'weekend' : ''
  }
  gantt.config.scales = [
    { unit: 'week', step: 1, format: weekScaleTemplate },
    { unit: 'day', step: 1, format: dayTemplate, css: daysStyle },
    { unit: 'hour', step: 8, format: '%H:%i' }
  ]
  gantt.config.scale_height = 50
  gantt.config.show_task_cells = true

  // 左侧列配置
  gantt.config.columns = [
    { name: 'text', label: '任务名称', tree: true, width: 180, resize: true },
    { name: 'workstation', label: '工作站', align: 'center', width: 100, resize: true },
    { name: 'process', label: '工序', align: 'center', width: 100, resize: true },
    { name: 'start_date', label: '开始时间', align: 'center', width: 130 },
    { name: 'end_date', label: '结束时间', align: 'center', width: 130 }
  ]

  // 今天标记线 + tooltip 插件
  gantt.plugins({ marker: true, tooltip: true })
  gantt.addMarker({
    start_date: new Date(),
    css: 'today',
    text: '今天'
  })

  // 甘特条上的文本
  gantt.templates.task_text = (_start: any, _end: any, task: any) => {
    const percent = Math.round((task.progress || 0) * 100)
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例：${percent}%</span>`
    }
    return `<b>生产任务:</b> ${task.process || ''} ${task.text} <span>完成比例：${percent}%</span>`
  }

  // 鼠标悬浮提示
  gantt.templates.tooltip_text = (_start: any, _end: any, task: any) => {
    const percent = Math.round((task.progress || 0) * 100)
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例：${percent}%</span>`
    }
    return `<b>生产任务:</b> ${task.process || ''} ${task.text} <span>完成比例：${percent}%</span>`
  }

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
        id: task.originalId || id,
        startTime: task.start_date,
        endTime: task.end_date,
        duration: (task.duration as number) / 8 // 转回工作日
      })
    })
  }

  // TODO @AI：注释
  gantt.attachEvent('onTaskClick', (id: string | number) => {
    emit('task-click', id)
    return true
  })

  // 初始化
  gantt.init(ganttContainer.value)
  ganttInited.value = true
}

/** 加载数据到甘特图 */
const loadData = (tasks: any[]) => {
  if (!ganttInited.value) {
    return
  }
  gantt.clearAll()
  // TODO @AI：使用下枚举，mes utils 下有的；
  // 后端 type: 301=工单(project), 303=任务(task)
  const TYPE_MAP: Record<number, string> = { 301: 'project', 303: 'task' }
  const transformed = {
    data: tasks.map((item: any) => ({
      ...item,
      // TODO @AI：是不是用枚举，就可以么？不用 TYPE_MAP?
      type: TYPE_MAP[item.type] || item.type,
      start_date: item.startDate ? new Date(item.startDate) : undefined,
      end_date: item.endDate ? new Date(item.endDate) : undefined
    })),
    links: []
  }
  gantt.parse(transformed)
}

/** 监听 tasks 变化 */
watch(
  () => props.tasks,
  (val) => {
    if (val?.length && ganttInited.value) {
      loadData(val)
    }
  },
  { deep: true }
)

// TODO @AI：注释
onMounted(() => {
  initGantt()
  if (props.tasks?.length) {
    loadData(props.tasks)
  }
})

// TODO @AI：注释
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

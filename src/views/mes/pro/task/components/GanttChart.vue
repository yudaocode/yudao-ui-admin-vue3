<!-- dhtmlx-gantt Vue 3 封装组件：基于 dhtmlx-gantt 实现甘特图展示和拖拽编辑 -->
<template>
  <div ref="ganttContainer" :style="{ width: '100%', height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { BarcodeBizTypeEnum } from '@/views/mes/utils/constants'

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

  // 中文国际化
  gantt.i18n.setLocale('cn')

  // 基础配置
  gantt.config.readonly = props.readonly
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s'
  gantt.config.duration_unit = 'hour' // 使用小时作为持续时间单位，配合 duration_step 实现工作日单位
  gantt.config.duration_step = 8 // 1 工作日 = 8 小时
  gantt.config.row_height = 36 // 显式声明更清晰
  gantt.config.bar_height = 24 // 让条更紧凑美观
  gantt.config.fit_tasks = true // 时间范围自动适应
  gantt.config.auto_scheduling = false // 显式关闭防意外
  gantt.config.drag_links = false // 禁止拖动任务关系
  gantt.config.details_on_create = true // 单击显示添加详情
  gantt.config.details_on_dblclick = true // 双击显示明细
  gantt.config.show_progress = true // 确保进度条显示
  gantt.config.open_tree_initially = true // 初始展开树结构
  gantt.config.auto_types = false // 禁止自动升级为 project
  gantt.config.drag_move = !props.readonly // 编辑态允许直接拖动任务
  gantt.config.drag_resize = !props.readonly // 编辑态允许直接调整任务持续时间
  gantt.config.drag_progress = false // 禁止拖动进度条

  // lightbox 弹窗配置：只保留时间编辑，去掉描述编辑和删除按钮
  gantt.config.lightbox.sections = [{ name: 'time', type: 'duration', map_to: 'auto' }]
  gantt.config.buttons_left = ['gantt_save_btn']
  gantt.config.buttons_right = ['gantt_cancel_btn']

  // 时间刻度：周 > 日 > 8小时
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
  gantt.config.show_task_cells = true // 显示任务单元格边框

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
    if (task.type === gantt.config.types.project) {
      return 'gantt-project-bar'
    }
    return ''
  }
  gantt.templates.timeline_cell_class = () => '' // 防止 gantt 添加默认样式类
  gantt.templates.task_row_class = () => '' // 防止 gantt 添加默认样式类

  // 编辑事件监听（通过 lightbox 弹窗编辑后触发）
  if (!props.readonly) {
    gantt.attachEvent('onAfterTaskUpdate', (id: string | number) => {
      const task = gantt.getTask(id)
      // 生产排产只允许回写 task 节点，避免把工单(project)节点当成任务保存
      if (task.type !== gantt.config.types.task || !task.originalId) {
        return
      }
      // 触发 task-update 事件，通知父组件保存修改
      emit('task-update', {
        id: task.originalId,
        startTime: task.start_date,
        endTime: task.end_date,
        duration: task.duration
      })
    })
  }

  // 点击任务事件
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
  // 后端 type 使用 MesBizTypeConstants 整数，需映射为 gantt 类型字符串
  const TYPE_MAP: Record<number, string> = {
    [BarcodeBizTypeEnum.WORKORDER]: 'project',
    [BarcodeBizTypeEnum.TASK]: 'task'
  }
  const transformed = {
    data: tasks.map((item: any) => ({
      ...item,
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

/** 组件挂载后初始化甘特图 */
onMounted(() => {
  initGantt()
  if (props.tasks?.length) {
    loadData(props.tasks)
  }
})

/** 组件卸载前清理甘特图 */
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
/* 甘特条圆角 */
.gantt_task_line {
  border-radius: 8px;
}
/* 周末背景色 */
.weekend {
  background: #f0f0f0 !important;
}
/* 行悬浮高亮 */
.gantt_grid_data .gantt_row:hover,
.gantt_grid_data .gantt_row.odd:hover {
  background-color: #f3f1fe !important;
}
/* 选中行高亮 */
.gantt_grid_data .gantt_row.gantt_selected,
.gantt_grid_data .gantt_row.odd.gantt_selected,
.gantt_task_row.gantt_selected {
  background-color: #f3f1fe !important;
}
</style>

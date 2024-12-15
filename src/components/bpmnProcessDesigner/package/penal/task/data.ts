import UserTask from './task-components/UserTask.vue'
import ServiceTask from './task-components/ServiceTask.vue'
import ScriptTask from './task-components/ScriptTask.vue'
import ReceiveTask from './task-components/ReceiveTask.vue'
import CallActivity from './task-components/CallActivity.vue'

export const installedComponent = {
  UserTask: {
    name: '用户任务',
    component: UserTask
  },
  ServiceTask: {
    name: '服务任务',
    component: ServiceTask
  },
  ScriptTask: {
    name: '脚本任务',
    component: ScriptTask
  },
  ReceiveTask: {
    name: '接收任务',
    component: ReceiveTask
  },
  CallActivity: {
    name: '调用活动',
    component: CallActivity
  }
}

export const getTaskCollapseItemName = (elementType) => {
  return installedComponent[elementType].name
}

export const isTaskCollapseItemShow = (elementType) => {
  return installedComponent[elementType]
}

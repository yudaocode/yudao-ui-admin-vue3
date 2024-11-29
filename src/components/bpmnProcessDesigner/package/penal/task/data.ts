import UserTask from './task-components/UserTask.vue'
import ServiceTask from './task-components/ServiceTask.vue'
import ScriptTask from './task-components/ScriptTask.vue'
import ReceiveTask from './task-components/ReceiveTask.vue'

export const installedComponent = {
  UserTask: {
    name: '用户任务',
    componet: UserTask
  },
  ServiceTask: {
    name: '服务任务',
    componet: ServiceTask
  },
  ScriptTask: {
    name: '脚本任务',
    componet: ScriptTask
  },
  ReceiveTask: {
    name: '接收任务',
    componet: ReceiveTask
  }
}

export const getTaskCollapseItemName = (elementType) => {
  return installedComponent[elementType].name
}

export const isTaskCollapseItemShow = (elementType) => {
  return installedComponent[elementType]
}

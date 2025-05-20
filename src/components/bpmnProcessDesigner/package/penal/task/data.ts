import UserTask from './task-components/UserTask.vue'
import ServiceTask from './task-components/ServiceTask.vue'
import ScriptTask from './task-components/ScriptTask.vue'
import ReceiveTask from './task-components/ReceiveTask.vue'
import CallActivity from './task-components/CallActivity.vue'

export const installedComponent = {
  UserTask: {
    name: 'User Task',
    component: UserTask
  },
  ServiceTask: {
    name: 'ServiceTask',
    component: ServiceTask
  },
  ScriptTask: {
    name: 'ScriptTask',
    component: ScriptTask
  },
  ReceiveTask: {
    name: 'ReceiveTask',
    component: ReceiveTask
  },
  CallActivity: {
    name: 'CallActivity',
    component: CallActivity
  }
}

export const getTaskCollapseItemName = (elementType) => {
  return installedComponent[elementType].name
}

export const isTaskCollapseItemShow = (elementType) => {
  return installedComponent[elementType]
}

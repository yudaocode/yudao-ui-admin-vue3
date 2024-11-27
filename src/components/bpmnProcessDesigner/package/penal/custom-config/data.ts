import UserTask from './components/UserTask.vue'
import BoundaryEventTimer from './components/BoundaryEventTimer.vue'

export const CustomConfigMap = {
  UserTask: {
    name: '用户任务',
    componet: UserTask
  },
  BoundaryEventTimerEventDefinition: {
    name: '定时边界事件(非中断)',
    componet: BoundaryEventTimer
  }
}

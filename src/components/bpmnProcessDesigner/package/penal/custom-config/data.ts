import UserTaskCustomConfig from './components/UserTaskCustomConfig.vue'
import BoundaryEventTimer from './components/BoundaryEventTimer.vue'

export const CustomConfigMap = {
  UserTask: {
    name: '用户任务',
    componet: UserTaskCustomConfig
  },
  BoundaryEventTimerEventDefinition: {
    name: '定时边界事件(非中断)',
    componet: BoundaryEventTimer
  }
}

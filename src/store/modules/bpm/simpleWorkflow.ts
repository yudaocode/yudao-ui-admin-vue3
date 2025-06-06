import { store } from '../../index'
import { defineStore } from 'pinia'

export const useWorkFlowStore = defineStore('simpleWorkflow', {
  state: () => ({
    tableId: '',
    isTried: false,
    promoterDrawer: false,
    approverDrawer: false,
    approverConfig1: {},
    copyerDrawer: false,
    copyerConfig: {},
    conditionDrawer: false,
    conditionsConfig1: {
      conditionNodes: []
    },
    userTaskConfig: {}
  }),
  actions: {
    setTableId(payload) {
      this.tableId = payload
    },
    setIsTried(payload) {
      this.isTried = payload
    },
    setPromoter(payload) {
      this.promoterDrawer = payload
    },
    setApproverDrawer(payload) {
      this.approverDrawer = payload
    },
    setApproverConfig(payload) {
      this.approverConfig1 = payload
    },
    setCopyerDrawer(payload) {
      this.copyerDrawer = payload
    },
    setCopyerConfig(payload) {
      this.copyerConfig = payload
    },
    setCondition(payload) {
      this.conditionDrawer = payload
    },
    setConditionsConfig(payload) {
      this.conditionsConfig1 = payload
    },
    setUserTaskConfig(payload) {
      this.userTaskConfig = payload
    }
  }
})

export const useWorkFlowStoreWithOut = () => {
  return useWorkFlowStore(store)
}

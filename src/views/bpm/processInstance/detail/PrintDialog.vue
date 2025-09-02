<script setup lang="ts">
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'

const userStore = useUserStore()

const visible = ref(false)
const loading = ref(false)

const printData = ref()
const userName = computed(() => userStore.user.nickname ?? '')
const printTime = ref(formatDate(new Date(), 'YYYY-MM-DD HH:mm'))

const open = async (id) => {
  loading.value = true
  try {
    printData.value = await ProcessInstanceApi.getProcessInstancePrintData(id)
    console.log(printData.value)
  } finally {
    loading.value = false
  }
  visible.value = true
}
defineExpose({ open })

const printObj = ref({
  id: 'printDivTag',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})
</script>

<template>
  <el-dialog v-loading="loading" v-model="visible" :show-close="false">
    <div id="printDivTag">
      <div v-if="printData.printTemplateEnable" v-html="printData.printTemplateHtml"></div>
      <div v-else>
        <h2 class="text-center">{{ printData.processName }}</h2>
        <div class="text-right text-15px">{{ '打印人员: ' + userName }}</div>
        <div class="flex justify-between">
          <div class="text-15px">{{ '流程编号: ' + printData.processInstanceId }}</div>
          <div class="text-15px">{{ '打印时间: ' + printTime }}</div>
        </div>
        <table class="mt-20px w-100%" border="1" style="border-collapse: collapse">
          <tbody>
            <tr>
              <td class="p-5px w-25%">发起人</td>
              <td class="p-5px w-25%">{{ printData.startUser }}</td>
              <td class="p-5px w-25%">发起时间</td>
              <td class="p-5px w-25%">{{ printData.startTime }}</td>
            </tr>
            <tr>
              <td class="p-5px w-25%">所属部门</td>
              <td class="p-5px w-25%">{{ printData.startUserDept }}</td>
              <td class="p-5px w-25%">流程状态</td>
              <td class="p-5px w-25%">{{ printData.processStatusShow }}</td>
            </tr>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>表单内容</h4>
              </td>
            </tr>
            <tr v-for="item in printData.formFields" :key="item.formId">
              <td class="p-5px w-20%">
                {{ item.formName }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                <div v-html="item.formValueShow"></div>
              </td>
            </tr>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>流程节点</h4>
              </td>
            </tr>
            <tr v-for="item in printData.approveNodes" :key="item.nodeId">
              <td class="p-5px w-20%">
                {{ item.nodeName }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                {{ item.nodeDesc }}
                <div v-if="item.signUrl !== ''">
                  <img class="w-90px h-40px" :src="item.signUrl" alt="" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" v-print="printObj"> 打 印</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss">
table {
  border-collapse: collapse;
}
</style>

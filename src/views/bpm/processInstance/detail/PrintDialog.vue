<script setup lang="ts">
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { decodeFields } from '@/utils/formCreate'

const userStore = useUserStore()

const visible = ref(false)
const loading = ref(false)

const printData = ref()
const userName = computed(() => userStore.user.nickname ?? '')
const printTime = ref(formatDate(new Date(), 'YYYY-MM-DD HH:mm'))
const formFields = ref()
const printDataMap = ref({})

const open = async (id: string) => {
  loading.value = true
  try {
    printData.value = await ProcessInstanceApi.getProcessInstancePrintData(id)
    initPrintDataMap()
    parseFormFields()
  } finally {
    loading.value = false
  }
  visible.value = true
}
defineExpose({ open })

const parseFormFields = () => {
  // TODO @lesan：form field 有可能基于 form-create 什么 api 生成么？好像也挺难的 = =
  // TODO @芋艿：默认打印可以直接用form-create的预览表单模式，但是自定义模板打印就没法这么做
  const formFieldsObj = decodeFields(printData.value.processInstance.processDefinition.formFields)
  const processVariables = printData.value.processInstance.formVariables
  let res: any = []
  for (const item of formFieldsObj) {
    const id = item['field']
    const name = item['title']
    let html = '暂不支持此类型的表单展示'
    // TODO 完善各类型表单的展示
    // TODO @lesan：要不 UploadImg、UploadFile 特殊处理下，其它就 else processVariables[item['field']]？
    // TODO @芋艿：感觉很多都要处理一下，select那些都要转为可读的label，还有子表单那些，都需要处理一下...
    // TODO @lesan：有办法基于 form-create api 来读取值么？如果不行，就兜底让大模型生成一些常用的。子表单可以往后放；
    if (item['type'] === 'input') {
      html = processVariables[item['field']]
    } else if (item['type'] === 'UploadImg') {
      html = `<img src="${processVariables[item['field']]}" style="max-width: 600px" />`
    }
    printDataMap.value[item['field']] = html
    res.push({ id, name, html })
  }
  formFields.value = res
}

const initPrintDataMap = () => {
  printDataMap.value['startUser'] = printData.value.processInstance.startUser.nickname
  printDataMap.value['startUserDept'] = printData.value.processInstance.startUser.deptName
  printDataMap.value['processName'] = printData.value.processInstance.name
  printDataMap.value['processNum'] = printData.value.processInstance.id
  printDataMap.value['startTime'] = formatDate(printData.value.processInstance.startTime)
  printDataMap.value['endTime'] = formatDate(printData.value.processInstance.endTime)
  printDataMap.value['processStatus'] = getDictLabel(
    DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
    printData.value.processInstance.status
  )
  printDataMap.value['printUser'] = userName.value
  printDataMap.value['printTime'] = printTime.value
}

const getPrintTemplateHTML = () => {
  const parser = new DOMParser()
  let doc = parser.parseFromString(printData.value.printTemplateHtml, 'text/html')
  // table 添加border
  let tables = doc.querySelectorAll('table')
  tables.forEach((item) => {
    item.setAttribute('border', '1')
    item.setAttribute('style', (item.getAttribute('style') || '') + 'border-collapse:collapse;')
  })
  // 替换 mentions
  let mentions = doc.querySelectorAll('[data-w-e-type="mention"]')
  mentions.forEach((item) => {
    const mentionId = JSON.parse(decodeURIComponent(item.getAttribute('data-info') ?? ''))['id']
    item.innerHTML = printDataMap.value[mentionId] ?? ''
  })
  // 替换流程记录
  let processRecords = doc.querySelectorAll('[data-w-e-type="process-record"]')
  let processRecordTable: Element = document.createElement('table')
  if (processRecords.length > 0) {
    // 构建流程记录html
    processRecordTable.setAttribute('border', '1')
    processRecordTable.setAttribute('style', 'width:100%;border-collapse:collapse;')
    const headTr = document.createElement('tr')
    const headTd = document.createElement('td')
    headTd.setAttribute('colspan', '2')
    headTd.setAttribute('width', 'auto')
    headTd.setAttribute('style', 'text-align: center;')
    headTd.innerHTML = '流程节点'
    headTr.appendChild(headTd)
    processRecordTable.appendChild(headTr)
    printData.value.tasks.forEach((item) => {
      const tr = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.innerHTML = item.name
      const td2 = document.createElement('td')
      td2.innerHTML = item.description
      tr.appendChild(td1)
      tr.appendChild(td2)
      processRecordTable.appendChild(tr)
    })
  }
  processRecords.forEach((item) => {
    item.innerHTML = processRecordTable.outerHTML
  })
  // 返回 html
  return doc.body.innerHTML
}

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
      <div v-if="printData.printTemplateEnable" v-html="getPrintTemplateHTML()"></div>
      <div v-else>
        <h2 class="text-center">{{ printData.processInstance.name }}</h2>
        <div class="text-right text-15px">{{ '打印人员: ' + userName }}</div>
        <div class="flex justify-between">
          <div class="text-15px">{{ '流程编号: ' + printData.processInstance.id }}</div>
          <div class="text-15px">{{ '打印时间: ' + printTime }}</div>
        </div>
        <table class="mt-20px w-100%" border="1" style="border-collapse: collapse">
          <tbody>
            <tr>
              <td class="p-5px w-25%">发起人</td>
              <td class="p-5px w-25%">{{ printData.processInstance.startUser.nickname }}</td>
              <td class="p-5px w-25%">发起时间</td>
              <td class="p-5px w-25%">{{ formatDate(printData.processInstance.startTime) }}</td>
            </tr>
            <tr>
              <td class="p-5px w-25%">所属部门</td>
              <td class="p-5px w-25%">{{ printData.processInstance.startUser.deptName }}</td>
              <td class="p-5px w-25%">流程状态</td>
              <td class="p-5px w-25%">
                {{
                  getDictLabel(
                    DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
                    printData.processInstance.status
                  )
                }}
              </td>
            </tr>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>表单内容</h4>
              </td>
            </tr>
            <!--            <tr>-->
            <!--              <td class="p-5px w-100% text-center" colspan="4">-->
            <!--                <form-create-->
            <!--                  v-model="detailForm.value"-->
            <!--                  v-model:api="fApi"-->
            <!--                  :option="detailForm.option"-->
            <!--                  :rule="detailForm.rule"-->
            <!--                />-->
            <!--              </td>-->
            <!--            </tr>-->
            <tr v-for="item in formFields" :key="item.id">
              <td class="p-5px w-20%">
                {{ item.name }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                <div v-html="item.html"></div>
              </td>
            </tr>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>流程节点</h4>
              </td>
            </tr>
            <tr v-for="item in printData.tasks" :key="item.id">
              <td class="p-5px w-20%">
                {{ item.name }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                {{ item.description }}
                <div v-if="item.signPicUrl && item.signPicUrl.length > 0">
                  <img class="w-90px h-40px" :src="item.signPicUrl" alt="" />
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

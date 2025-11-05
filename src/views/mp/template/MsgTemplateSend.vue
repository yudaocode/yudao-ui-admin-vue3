<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <div style="font-size: 16px;margin: 10px 0;">已选择{{
        multipleSelection.length > 0 ? multipleSelection
            .length : total
      }}个用户
    </div>
    <mpUser ref="mpUserRef" @change="mpUserChange"/>
    <template #footer>
      <el-button type="primary" @click="submit" :disabled="multipleSelection.length==0&&total==0" :loading="loading">推 送</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import {ref, nextTick} from "vue";
import mpUser from '@/views/mp/user/index.vue'
import {MsgTemplateApi} from "@/api/mp/template";

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const multipleSelection = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

let dataForm = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: -1,
  openid: '',
  nickname: '',
  unionId: '',
  openidList: [] as string[],
  appId: '',
  templateId: ''
})

/** 打开mpUser弹窗 */
const mpUserRef = ref()
const open = async (accountId: number, appId: string, templateId: string) => {
  // 清空dataForm
  Object.keys(dataForm).forEach((key) => {
    dataForm[key] = ''
  })
  loading.value = false
  dialogVisible.value = true
  dialogTitle.value = "批量推送消息"
  await nextTick()
  mpUserRef.value.open(accountId)
  dataForm.accountId = accountId
  dataForm.appId = appId
  dataForm.templateId = templateId
}
defineExpose({open}) // 暴露open方法

const submit = async () => {
  try {
    await message.confirm(`已选择${multipleSelection.value.length > 0 ? multipleSelection.value.length : total.value}个用户,请确认是否推送？`)
    loading.value = true
    await MsgTemplateApi.sendMsgBatch(dataForm)
    message.success('推送成功')
    dialogVisible.value = false
    loading.value = false
  } catch (e) {
    console.error(e);
  }
}

const mpUserChange = (changeEventData: any) => {
  total.value = changeEventData.total;
  multipleSelection.value = changeEventData.multipleSelection;
  dataForm = {...dataForm, ...changeEventData.queryParams};
  dataForm.openidList = changeEventData.multipleSelection.map((item: any) => item.openid);
}

</script>

<style scoped lang="scss"></style>

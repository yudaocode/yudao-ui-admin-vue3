<template>
  <div v-loading="loading">
    <el-button
      v-if="
        detail.status === BpmProcessInstanceStatus.NOT_START &&
        detail.creator === String(userStore.getUser.id)
      "
      v-hasPermi="['oa:officialdoc-send:update']"
      class="mb-16px"
      type="primary"
      @click="formRef?.open('update', detail.id)"
    >
      编辑公文
    </el-button>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="公文标题">{{ detail.title }}</el-descriptions-item>
      <el-descriptions-item label="字号">{{ detail.noPrefix }}</el-descriptions-item>
      <el-descriptions-item label="年份">{{ detail.year }}</el-descriptions-item>
      <el-descriptions-item label="第几号文">{{ detail.sequence }}</el-descriptions-item>
      <el-descriptions-item label="密级">
        <DictTag
          :type="DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL"
          :value="detail.secrecyLevel ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="紧急程度">
        <DictTag
          :type="DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL"
          :value="detail.urgencyLevel ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="公开类别">
        <DictTag
          :type="DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY"
          :value="detail.disclosureType ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="发文日期">
        {{ detail.issueTime ? formatDate(detail.issueTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="附注">{{ detail.remark }}</el-descriptions-item>
      <el-descriptions-item label="单据编号">{{ detail.no }}</el-descriptions-item>
      <el-descriptions-item label="公文文号">{{ detail.documentNo }}</el-descriptions-item>
      <el-descriptions-item label="签发人">{{ detail.signerName }}</el-descriptions-item>
      <el-descriptions-item label="发文部门">{{ detail.sendDeptName }}</el-descriptions-item>
      <el-descriptions-item label="主送部门">
        {{ detail.mainDeptNames?.join('、') }}
      </el-descriptions-item>
      <el-descriptions-item label="抄送部门">
        {{ detail.copyDeptNames?.join('、') }}
      </el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <el-tag v-if="detail.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detail.status ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail.createTime ? formatDate(detail.createTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detail.fileUrls || []" disabled :is-show-tip="false" />
      </el-descriptions-item>
      <el-descriptions-item label="正式公文" :span="2">
        <UploadFile :model-value="detail.formalFileUrl || ''" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
    <OaOfficialDocPreview v-if="detail.id" :document="detail" :template="template" />
  </div>
  <OaOfficialDocSendForm ref="formRef" @success="getInfo" />
</template>
<script setup lang="ts">
import OaOfficialDocSendForm from '../OaOfficialDocSendForm.vue'
import { useUserStore } from '@/store/modules/user'
import * as SendApi from '@/api/oa/officialdoc/send'
import { DICT_TYPE } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import * as TemplateApi from '@/api/oa/officialdoc/template'
import OaOfficialDocPreview from '../../components/OaOfficialDocPreview.vue'

defineOptions({ name: 'OaOfficialDocSendBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const userStore = useUserStore() // 当前用户
const formRef = ref<InstanceType<typeof OaOfficialDocSendForm>>() // 草稿编辑表单
const route = useRoute() // 路由参数
const loading = ref(false) // 详情加载状态
const detail = ref<SendApi.OfficialDocSendVO>({}) // 公文详情
const template = ref<TemplateApi.OfficialDocTemplateVO>() // 套红模板

/** 查询详情 */
async function getInfo() {
  const id = Number(props.id || route.query.id)
  if (!id) return
  loading.value = true
  try {
    detail.value = await SendApi.getSend(id)
    template.value = detail.value.templateId
      ? await TemplateApi.getTemplate(detail.value.templateId)
      : undefined
  } finally {
    loading.value = false
  }
}

/** 初始化及切换公文 */
watch(
  () => props.id || route.query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>

<template>
  <div v-loading="loading">
    <!-- 公文信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="收文类型">
        <DictTag :type="DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE" :value="detail.receiveType ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="收文时间">
        {{ detail.receiveTime ? formatDate(detail.receiveTime) : '' }}
      </el-descriptions-item>
      <!-- 关联发文信息 -->
      <template v-if="detail.sendId">
        <el-descriptions-item label="发文单位">{{ detail.sendDeptName }}</el-descriptions-item>
        <el-descriptions-item label="发文日期">
          {{ detail.issueTime ? formatDate(detail.issueTime, 'YYYY-MM-DD') : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="签发人">{{ detail.signerName }}</el-descriptions-item>
        <el-descriptions-item label="公开类别">
          <DictTag
            :type="DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY"
            :value="detail.disclosureType ?? ''"
          />
        </el-descriptions-item>
      </template>
      <el-descriptions-item label="领导批示">{{ detail.instruction }}</el-descriptions-item>
      <el-descriptions-item label="办理结果">{{ detail.result }}</el-descriptions-item>
      <el-descriptions-item label="办理期限">
        {{ detail.deadlineTime ? formatDate(detail.deadlineTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="内容摘要">{{ detail.summary }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
      <el-descriptions-item label="单据编号">{{ detail.no }}</el-descriptions-item>
      <el-descriptions-item label="公文标题">{{ detail.title }}</el-descriptions-item>
      <el-descriptions-item label="来文字号">{{ detail.documentNo }}</el-descriptions-item>
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
      <el-descriptions-item label="收文部门">{{ detail.receiveDeptName }}</el-descriptions-item>
      <el-descriptions-item label="主办人">{{ detail.handlerName }}</el-descriptions-item>
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
      <el-descriptions-item label="办理状态">
        <DictTag
          :type="DICT_TYPE.OA_OFFICIAL_DOC_HANDLE_STATUS"
          :value="detail.handleStatus ?? ''"
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
      <el-descriptions-item v-if="detail.sendId" label="关联发文" :span="2">
        <el-button type="primary" link @click="openSendDetail">查看关联发文</el-button>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 正式公文预览 -->
    <FilePreview
      v-if="detail.formalFileUrl"
      class="mt-16px"
      :url="detail.formalFileUrl"
      downloadable
    />
    <!-- 关联发文详情弹窗 -->
    <OaOfficialDocSendDetail ref="sendDetailRef" />
  </div>
</template>
<script setup lang="ts">
import * as ReceiveApi from '@/api/oa/officialdoc/receive'
import { DICT_TYPE } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import OaOfficialDocSendDetail from '../../send/OaOfficialDocSendDetail.vue'
import { FilePreview } from '@/components/FilePreview'

defineOptions({ name: 'OaOfficialDocReceiveBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const route = useRoute() // 路由参数
const loading = ref(false) // 详情加载状态
const detail = ref<ReceiveApi.OfficialDocReceiveVO>({}) // 公文详情

/** 查询详情 */
async function getInfo() {
  const id = Number(props.id || route.query.id)
  if (!id) return
  loading.value = true
  try {
    detail.value = await ReceiveApi.getReceive(id)
  } finally {
    loading.value = false
  }
}

/** 查看关联发文 */
const sendDetailRef = ref() // 关联发文详情 Ref
function openSendDetail() {
  sendDetailRef.value.open(detail.value.sendId)
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

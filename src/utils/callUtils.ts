import * as CallCenterApi from '@/api/crm/callcenter'


const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const calldata = ref({
    manufacturerId: 1,
    callId: 0,
    callType: 1
  })

const makercall = async (callid: number,callType: number) => {
    calldata.value.callId = callid
    calldata.value.callType = callType
    const data = calldata.value as unknown as CallCenterApi.CallVo
    const respdata = await CallCenterApi.callCenterCall(data)
    console.log(respdata)
    message.success(t('callcenter.callSuccess') + '请观注外呼手机状态')
}

export default makercall
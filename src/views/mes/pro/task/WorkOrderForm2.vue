<!-- MES 生产排产 - 工单排产对话框（表单布局与 WorkOrderForm 保持一致，全部 disabled） -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form ref="formRef" :model="formData" label-width="120px" v-loading="formLoading">
      <el-row>
        <el-col :span="12">
          <el-form-item label="工单编码" prop="code">
            <el-input v-model="formData.code" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工单名称" prop="name">
            <el-input v-model="formData.name" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="工单来源" prop="orderSourceType">
            <el-select v-model="formData.orderSourceType" class="!w-1/1" disabled>
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER">
          <el-form-item label="来源单据编号" prop="orderSourceCode">
            <el-input v-model="formData.orderSourceCode" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单类型" prop="type">
            <el-select v-model="formData.type" class="!w-1/1" disabled>
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品" prop="productId">
            <MdItemSelect v-model="formData.productId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col
          :span="8"
          v-if="
            formData.type === MesProWorkOrderTypeEnum.OUTSOURCE ||
            formData.type === MesProWorkOrderTypeEnum.PURCHASE
          "
        >
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求日期" prop="requestDate">
            <el-date-picker
              v-model="formData.requestDate"
              type="date"
              value-format="x"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单状态" prop="status">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- TODO @AI：都展示，不只 isSchedule -->
    <!-- 工序步骤导航（仅排产模式显示） -->
    <el-steps
      v-if="isSchedule && routeProcessList.length && formData.id"
      :active="activeProcessStep"
      align-center
      simple
      class="my-10px"
    >
      <!-- TODO @AI：style 改成 unocss -->
      <el-step
        v-for="(rp, index) in routeProcessList"
        :key="rp.processId"
        :title="rp.processName"
        style="cursor: pointer"
        @click="activeProcessStep = index"
      />
    </el-steps>

    <!-- 当前工序的任务列表（仅排产模式显示） -->
    <el-card
      v-for="(rp, index) in routeProcessList"
      v-show="isSchedule && activeProcessStep === index && formData.id"
      :key="rp.processId"
      shadow="never"
    >
      <ProTaskList
        :work-order-id="formData.id!"
        :work-order-code="formData.code!"
        :work-order-name="formData.name!"
        :route-id="currentRouteId"
        :process-id="rp.processId"
        :item-id="formData.productId!"
        :unit-measure-id="(formData as any).unitMeasureId"
        :process-list="routeProcessList"
      />
    </el-card>
    <!-- TODO @AI：完成拿到 index.vue 里；这里不放 -->
    <template #footer>
      <!-- TODO @芋艿：完成排产的逻辑，需要后端提供对应接口 -->
      <el-button
        v-if="isSchedule && formData.status === MesProWorkOrderStatusEnum.CONFIRMED && formData.id"
        type="success"
        @click="handleFinish"
      >
        完成
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProWorkOrderApi } from '@/api/mes/pro/workorder'
import { ProRouteProcessApi, ProRouteProcessVO } from '@/api/mes/pro/route/process'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import {
  MesProWorkOrderSourceTypeEnum,
  MesProWorkOrderTypeEnum,
  MesProWorkOrderStatusEnum
} from '@/views/mes/utils/constants'
import ProTaskList from './ProTaskList.vue'

defineOptions({ name: 'WorkOrderForm2' })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('') // 'detail' - 详情；'schedule' - 排产
const formData = ref<any>({})
const formRef = ref()

/** 是否为排产模式 */
const isSchedule = computed(() => formType.value === 'schedule')

// ==================== 工序步骤 ====================
const routeProcessList = ref<ProRouteProcessVO[]>([])
const activeProcessStep = ref(0)
const currentRouteId = ref(0)

/**
 * 打开对话框
 *
 * @param type 'detail' - 工单详情；'schedule' - 生产排产
 * @param id 工单 ID
 */
const open = async (type: string, id: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'schedule' ? '生产排产' : '工单详情'
  formType.value = type
  formLoading.value = true
  formData.value = {}
  routeProcessList.value = []
  activeProcessStep.value = 0

  try {
    // 加载工单详情
    formData.value = await ProWorkOrderApi.getWorkOrder(id)

    // 加载工艺路线工序列表
    if (formData.value.productId) {
      await loadRouteProcesses(formData.value.productId)
    }
  } finally {
    formLoading.value = false
  }
}

/** 加载工艺路线工序列表（通过产品查找关联的工艺路线） */
const message = useMessage()
const loadRouteProcesses = async (productId: number) => {
  try {
    const processes = await ProRouteProcessApi.getRouteProcessListByProduct(productId)
    if (processes && processes.length > 0) {
      currentRouteId.value = processes[0].routeId
      routeProcessList.value = processes.sort((a: any, b: any) => a.sort - b.sort)
    } else {
      message.warning('当前产品未配置工艺路线，请先在工艺路线中维护')
    }
  } catch (e) {
    console.warn('加载工艺路线工序失败', e)
  }
}

/** 完成排产（对齐 KTG 的 handleFinish） */
const handleFinish = async () => {
  try {
    await message.confirm('是否完成工单排产？【完成后将不能更改】')
    // TODO @芋艿：调用后端接口，更新工单状态为已完成
    // await ProWorkOrderApi.updateWorkOrderStatus(formData.value.id, MesProWorkOrderStatusEnum.FINISHED)
    message.success('排产完成')
    dialogVisible.value = false
  } catch {}
}

defineExpose({ open })
</script>

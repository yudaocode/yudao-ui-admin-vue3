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

    <!-- 工序步骤导航 -->
    <el-steps
      v-if="routeProcessList.length && formData.id"
      :active="activeProcessStep"
      align-center
      simple
      class="my-10px"
    >
      <el-step
        v-for="(rp, index) in routeProcessList"
        :key="rp.processId"
        :title="rp.processName"
        class="cursor-pointer"
        @click="activeProcessStep = index"
      />
    </el-steps>

    <!-- 当前工序的任务列表 -->
    <el-card
      v-for="(rp, index) in routeProcessList"
      v-show="activeProcessStep === index && formData.id"
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
    <template #footer>
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
import { MesProWorkOrderSourceTypeEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'
import ProTaskList from './ProTaskList.vue'

defineOptions({ name: 'WorkOrderForm2' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：detail - 详情；schedule - 排产
const formData = ref<any>({})
const formRef = ref() // 表单 Ref

const routeProcessList = ref<ProRouteProcessVO[]>([]) // 工艺路线工序列表
const activeProcessStep = ref(0) // 当前工序步骤索引
const currentRouteId = ref(0) // 当前工艺路线编号

/** 打开弹窗 */
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
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 加载工艺路线工序列表 */
const loadRouteProcesses = async (productId: number) => {
  try {
    const processes = await ProRouteProcessApi.getRouteProcessListByProduct(productId)
    if (!processes || processes.length === 0) {
      message.warning('当前产品未配置工艺路线，请先在工艺路线中维护')
      return
    }
    currentRouteId.value = processes[0].routeId
    routeProcessList.value = processes.sort((a: any, b: any) => a.sort - b.sort)
  } catch (e) {
    console.warn('加载工艺路线工序失败', e)
  }
}
</script>

<!-- TODO @AI：参考别的模块，/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/qc/ipqc/IpqcLineList.vue -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="物料" prop="itemId">
            <el-select
              v-model="formData.itemId"
              placeholder="请选择物料"
              filterable
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="item in itemList"
                :key="item.id"
                :label="`${item.code} - ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="到货数量" prop="arrivalQuantity">
            <el-input-number
              v-model="formData.arrivalQuantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="合格数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="来料检验" prop="iqcCheckFlag">
            <el-switch v-model="formData.iqcCheckFlag" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmArrivalNoticeLineApi, WmArrivalNoticeLineVO } from '@/api/mes/wm/arrivalnotice/line'
import { MdItemApi } from '@/api/mes/md/item'

defineOptions({ name: 'ArrivalNoticeLineForm' })

const props = defineProps<{ noticeId: number }>()
const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const itemList = ref<any[]>([])
const formData = ref({
  id: undefined,
  noticeId: undefined as number | undefined,
  itemId: undefined,
  arrivalQuantity: undefined,
  qualifiedQuantity: undefined,
  iqcCheckFlag: false,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  arrivalQuantity: [{ required: true, message: '到货数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  itemList.value = await MdItemApi.getItemSimpleList()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmArrivalNoticeLineApi.getArrivalNoticeLine(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value, noticeId: props.noticeId } as unknown as WmArrivalNoticeLineVO
    if (formType.value === 'create') {
      await WmArrivalNoticeLineApi.createArrivalNoticeLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmArrivalNoticeLineApi.updateArrivalNoticeLine(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    noticeId: undefined,
    itemId: undefined,
    arrivalQuantity: undefined,
    qualifiedQuantity: undefined,
    iqcCheckFlag: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

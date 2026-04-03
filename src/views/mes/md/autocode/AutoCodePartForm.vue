<!-- MES 编码规则分段的新增/修改 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="分段排序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              placeholder="请输入分段排序"
              :min="1"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="分段长度" prop="length">
            <el-input-number
              v-model="formData.length"
              placeholder="请输入分段长度"
              :min="1"
              :max="50"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="分段类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择分段类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <!-- 当前日期类型 -->
        <template v-if="formData.type === MesAutoCodePartTypeEnum.DATE">
          <el-col :span="24">
            <el-form-item label="日期格式" prop="dateFormat">
              <el-select v-model="formData.dateFormat" placeholder="请选择日期格式" class="!w-1/1">
                <el-option label="yyyy" value="yyyy" />
                <el-option label="yyyyMM" value="yyyyMM" />
                <el-option label="yyyyMMdd" value="yyyyMMdd" />
                <el-option label="yyyyMMddHH" value="yyyyMMddHH" />
                <el-option label="yyyyMMddHHmm" value="yyyyMMddHHmm" />
              </el-select>
            </el-form-item>
          </el-col>
        </template>
        <!-- 固定字符类型 -->
        <template v-if="formData.type === MesAutoCodePartTypeEnum.FIX">
          <el-col :span="24">
            <el-form-item label="固定字符" prop="fixCharacter">
              <el-input v-model="formData.fixCharacter" placeholder="请输入固定字符" />
            </el-form-item>
          </el-col>
        </template>
        <!-- 流水号类型 -->
        <template v-if="formData.type === MesAutoCodePartTypeEnum.SERIAL">
          <el-col :span="24">
            <el-form-item label="流水号起始值" prop="serialStartNo">
              <el-input-number
                v-model="formData.serialStartNo"
                placeholder="请输入流水号起始值"
                :min="1"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="流水号步长" prop="serialStep">
              <el-input-number
                v-model="formData.serialStep"
                placeholder="请输入流水号步长"
                :min="1"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="是否循环" prop="cycleFlag">
              <el-switch v-model="formData.cycleFlag" />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="formData.cycleFlag">
            <el-form-item label="循环方式" prop="cycleMethod">
              <el-select v-model="formData.cycleMethod" placeholder="请选择循环方式" class="!w-1/1">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </template>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
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
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { AutoCodePartApi, AutoCodePartVO } from '@/api/mes/md/autocode/part'
import { MesAutoCodePartTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'AutoCodePartForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  ruleId: undefined as number | undefined,
  sort: 1,
  type: undefined,
  length: undefined,
  dateFormat: undefined,
  fixCharacter: undefined,
  serialStartNo: undefined,
  serialStep: undefined,
  cycleFlag: false,
  cycleMethod: undefined,
  remark: undefined
})
const formRules = reactive({
  sort: [{ required: true, message: '分段排序不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '分段类型不能为空', trigger: 'change' }],
  length: [{ required: true, message: '分段长度不能为空', trigger: 'blur' }],
  dateFormat: [{ required: true, message: '日期格式不能为空', trigger: 'change' }],
  fixCharacter: [{ required: true, message: '固定字符不能为空', trigger: 'blur' }],
  serialStartNo: [{ required: true, message: '流水号起始值不能为空', trigger: 'blur' }],
  serialStep: [{ required: true, message: '流水号步长不能为空', trigger: 'blur' }],
  cycleMethod: [{ required: true, message: '循环方式不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number, ruleId?: number, maxSort?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.ruleId = ruleId
  // 如果是新增，且传入了 maxSort，则设置默认的排序为 maxSort + 1
  if (maxSort) {
    formData.value.sort = maxSort + 1
  }
  // 如果是修改，直接通过 id 查询
  if (id) {
    formLoading.value = true
    try {
      formData.value = await AutoCodePartApi.getAutoCodePart(id)
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
    const data = formData.value as unknown as AutoCodePartVO
    if (formType.value === 'create') {
      await AutoCodePartApi.createAutoCodePart(data)
      message.success(t('common.createSuccess'))
    } else {
      await AutoCodePartApi.updateAutoCodePart(data)
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
    ruleId: undefined as number | undefined,
    sort: 1,
    type: undefined,
    length: undefined,
    dateFormat: undefined,
    fixCharacter: undefined,
    serialStartNo: undefined,
    serialStep: undefined,
    cycleFlag: false,
    cycleMethod: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

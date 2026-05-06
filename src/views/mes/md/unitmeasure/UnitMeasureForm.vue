<!-- MES 计量单位表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="单位编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入单位编码" />
      </el-form-item>
      <el-form-item label="单位名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入单位名称" />
      </el-form-item>
      <el-form-item label="是否主单位" prop="primaryFlag">
        <el-radio-group v-model="formData.primaryFlag">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="主单位" prop="primaryId" v-if="formData.primaryFlag === false">
        <el-select v-model="formData.primaryId" placeholder="请选择主单位" class="w-1/1">
          <el-option
            v-for="item in primaryUnitList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="与主单位换算比例"
        prop="changeRate"
        v-if="formData.primaryFlag === false"
      >
        <el-input-number
          v-model="formData.changeRate"
          :step="1"
          :precision="4"
          :min="0"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getBoolDictOptions, getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdUnitMeasureApi, MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'UnitMeasureForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as unknown as number,
  code: undefined as unknown as string,
  name: undefined as unknown as string,
  primaryFlag: true as boolean,
  primaryId: undefined as unknown as number,
  changeRate: undefined as unknown as number,
  status: CommonStatusEnum.ENABLE,
  remark: undefined as unknown as string
})
const formRules = reactive({
  code: [{ required: true, message: '单位编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '单位名称不能为空', trigger: 'blur' }],
  primaryFlag: [{ required: true, message: '是否主单位不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const primaryUnitList = ref<MdUnitMeasureVO[]>([]) // 主单位列表

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载主单位列表（用于辅单位选择主单位）
  await getPrimaryUnitList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdUnitMeasureApi.getUnitMeasure(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 获取主单位列表 */
const getPrimaryUnitList = async () => {
  const list = await MdUnitMeasureApi.getUnitMeasureSimpleList()
  // 过滤出主单位
  primaryUnitList.value = list.filter((item: MdUnitMeasureVO) => item.primaryFlag === true)
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 如果是主单位，清空主单位和换算比例
  if (formData.value.primaryFlag) {
    formData.value.primaryId = undefined as unknown as number
    formData.value.changeRate = undefined as unknown as number
  }
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as MdUnitMeasureVO
    if (formType.value === 'create') {
      await MdUnitMeasureApi.createUnitMeasure(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdUnitMeasureApi.updateUnitMeasure(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    primaryFlag: true,
    primaryId: undefined,
    changeRate: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

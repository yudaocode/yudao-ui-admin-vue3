<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    v-loading="formLoading"
  >
    <el-form-item label="名字" prop="name">
      <el-input v-model="formData.name" placeholder="请输入名字" />
    </el-form-item>
    <el-form-item label="个人简介">
      <Editor v-model="formData.description" height="150px" />
    </el-form-item>
    <el-form-item label="性别 1" prop="sex1">
      <el-select v-model="formData.sex1" placeholder="请选择性别 1">
        <el-option
          v-for="dict in getStrDictOptions(DICT_TYPE.SYSTEM_SEX1)"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="性别 2" prop="sex2">
      <el-checkbox-group v-model="formData.sex2">
        <el-checkbox
          v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SEX2)"
          :key="dict.value"
          :label="dict.value"
        >
          {{ dict.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="性别 3" prop="sex3">
      <el-radio-group v-model="formData.sex3">
        <el-radio
          v-for="dict in getBoolDictOptions(DICT_TYPE.SYSTEM_SEX3)"
          :key="dict.value"
          :label="dict.value"
        >
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="出生日期" prop="birthday">
      <el-date-picker
        v-model="formData.birthday"
        type="date"
        value-format="x"
        placeholder="选择出生日期"
      />
    </el-form-item>
    <el-form-item label="备注" prop="memo">
      <el-input v-model="formData.memo" type="textarea" placeholder="请输入备注" />
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import * as DemoStudentApi from '@/api/infra/demo02'

const props = defineProps<{
  studentId: undefined // 学生编号（主表的关联字段）
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref([])
const formRules = reactive({
  studentId: [{ required: true, message: '学生编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '名字不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '头像不能为空', trigger: 'blur' }],
  video: [{ required: true, message: '视频不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '个人简介不能为空', trigger: 'blur' }],
  sex1: [{ required: true, message: '性别 1不能为空', trigger: 'change' }],
  sex2: [{ required: true, message: '性别 2不能为空', trigger: 'blur' }],
  sex3: [{ required: true, message: '性别 3不能为空', trigger: 'blur' }],
  birthday: [{ required: true, message: '出生日期不能为空', trigger: 'blur' }],
  memo: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    // 情况一：val 为空，说明是新增，则置空
    if (!val) {
      formData.value = {
        id: undefined,
        studentId: undefined,
        name: undefined,
        avatar: undefined,
        video: undefined,
        description: undefined,
        sex1: undefined,
        sex2: [],
        sex3: undefined,
        birthday: undefined,
        memo: undefined
      }
      return
    }
    // 情况二：val 非空，说明是修改，则加载数据
    try {
      formLoading.value = true
      formData.value = await DemoStudentApi.getDemoStudentAddressByStudentId(val)
    } finally {
      formLoading.value = false
    }
  },
  { immediate: true }
)

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 表单值 */
const getData = () => {
  return formData.value
}

defineExpose({ validate, getData })
</script>

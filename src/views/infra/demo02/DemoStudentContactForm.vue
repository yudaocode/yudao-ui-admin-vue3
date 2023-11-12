<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    v-loading="formLoading"
    label-width="0px"
    :inline-message="true"
  >
    <el-table :data="formData" class="-mt-10px">
      <el-table-column label="序号" type="index" width="100" />
      <el-table-column label="名字" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.name`" :rules="formRules.name" class="mb-0px!">
            <el-input v-model="row.name" placeholder="请输入名字" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="个人简介" width="400">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.description`"
            :rules="formRules.description"
            class="mb-0px!"
          >
            <Editor v-model="row.description" height="150px" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="性别 1" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sex1`" :rules="formRules.sex1" class="mb-0px!">
            <el-select v-model="row.sex1" placeholder="请选择性别 1">
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.SYSTEM_SEX1)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="性别 2" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sex2`" :rules="formRules.sex2" class="mb-0px!">
            <el-checkbox-group v-model="row.sex2">
              <el-checkbox
                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SEX2)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="性别 3" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sex3`" :rules="formRules.sex3" class="mb-0px!">
            <el-radio-group v-model="row.sex3">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.SYSTEM_SEX3)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="出生日期" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.birthday`" :rules="formRules.birthday" class="mb-0px!">
            <el-date-picker
              v-model="row.birthday"
              type="date"
              value-format="x"
              placeholder="选择出生日期"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.memo`" :rules="formRules.memo" class="mb-0px!">
            <el-input v-model="row.memo" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加联系人</el-button>
  </el-row>
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
      formData.value = []
      return
    }
    // 情况二：val 非空，说明是修改，则加载数据
    try {
      formLoading.value = true
      formData.value = await DemoStudentApi.getDemoStudentContactListByStudentId(val)
    } finally {
      formLoading.value = false
    }
  },
  { immediate: true }
)

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
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
  row.studentId = props.studentId
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

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

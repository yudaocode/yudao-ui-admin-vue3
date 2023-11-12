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
      <el-table-column label="简介" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.description`" :rules="formRules.description" class="mb-0px!">
            <el-input v-model="row.description" type="textarea" placeholder="请输入简介" />
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
      <el-table-column label="性别" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sex`" :rules="formRules.sex" class="mb-0px!">
            <el-select v-model="row.sex" placeholder="请选择性别">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="是否有效" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.enabled`" :rules="formRules.enabled" class="mb-0px!">
            <el-radio-group v-model="row.enabled">
                <el-radio
                  v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                  :key="dict.value"
                  :label="dict.value"
                >
                  {{ dict.label }}
                </el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.avatar`" :rules="formRules.avatar" class="mb-0px!">
            <UploadImg v-model="row.avatar" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="附件" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.video`" :rules="formRules.video" class="mb-0px!">
            <UploadFile v-model="row.video" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" width="400">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.memo`" :rules="formRules.memo" class="mb-0px!">
            <Editor v-model="row.memo" height="150px" />
          </el-form-item>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加学生联系人</el-button>
  </el-row>
</template>
<script setup lang="ts">
import { getIntDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import * as Demo11StudentApi from '@/api/infra/demo11'

const props = defineProps<{
  studentId: undefined // 学生编号（主表的关联字段）
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref([])
const formRules = reactive({
  studentId: [{ required: true, message: '学生编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '名字不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '简介不能为空', trigger: 'blur' }],
  birthday: [{ required: true, message: '出生日期不能为空', trigger: 'blur' }],
  sex: [{ required: true, message: '性别不能为空', trigger: 'change' }],
  enabled: [{ required: true, message: '是否有效不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '头像不能为空', trigger: 'blur' }],
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
      return;
    }
    // 情况二：val 非空，说明是修改，则加载数据
    try {
      formLoading.value = true
      formData.value = await Demo11StudentApi.getDemo11StudentContactListByStudentId(val)
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
    description: undefined,
    birthday: undefined,
    sex: undefined,
    enabled: undefined,
    avatar: undefined,
    video: undefined,
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
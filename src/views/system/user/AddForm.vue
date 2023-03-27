<template>
  <!-- 添加或修改参数配置对话框 -->
  <el-dialog
    :title="title"
    :modelValue="modelValue"
    width="600px"
    append-to-body
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickname">
            <el-input v-model="formData.nickname" placeholder="请输入用户昵称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="归属部门" prop="deptId">
            <el-tree-select
              node-key="id"
              v-model="formData.deptId"
              :data="deptOptions"
              :props="defaultProps"
              check-strictly
              placeholder="请选择归属部门"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="手机号码" prop="mobile">
            <el-input v-model="formData.mobile" placeholder="请输入手机号码" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item v-if="formData.id === undefined" label="用户名称" prop="username">
            <el-input v-model="formData.username" placeholder="请输入用户名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formData.id === undefined" label="用户密码" prop="password">
            <el-input
              v-model="formData.password"
              placeholder="请输入用户密码"
              type="password"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="用户性别">
            <el-select v-model="formData.sex" placeholder="请选择">
              <el-option
                v-for="dict in sexDictDatas"
                :key="parseInt(dict.value)"
                :label="dict.label"
                :value="parseInt(dict.value)"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位">
            <el-select v-model="formData.postIds" multiple placeholder="请选择">
              <el-option
                v-for="item in postOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { PostVO } from '@/api/system/post'
import { createUserApi, updateUserApi } from '@/api/system/user'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { defaultProps } from '@/utils/tree'
import { ElForm, FormItemRule } from 'element-plus'
import { Arrayable } from 'element-plus/es/utils'

type Form = InstanceType<typeof ElForm>
interface Props {
  deptOptions?: Tree[]
  postOptions?: PostVO[] //岗位列表
  modelValue: boolean
  formInitValue?: Recordable & Partial<typeof initParams>
}

const props = withDefaults(defineProps<Props>(), {
  deptOptions: () => [],
  postOptions: () => [],
  modelValue: false,
  formInitValue: () => ({})
})
const emits = defineEmits(['update:modelValue', 'success'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
// 弹出层标题
const title = computed(() => {
  return formData.value?.id ? '修改用户' : '添加用户'
})

// 性别字典
const sexDictDatas = getDictOptions(DICT_TYPE.SYSTEM_USER_SEX)

// 表单初始化参数
const initParams = {
  nickname: '',
  deptId: '',
  mobile: '',
  email: '',
  id: undefined,
  username: '',
  password: '',
  sex: 1,
  postIds: [],
  remark: '',
  status: '0',
  roleIds: []
}

// 校验规则
const rules = {
  username: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }],
  email: [
    {
      type: 'email',
      message: "'请输入正确的邮箱地址",
      trigger: ['blur', 'change']
    }
  ],
  mobile: [
    {
      pattern: /^(?:(?:\+|00)86)?1(?:3[\d]|4[5-79]|5[0-35-9]|6[5-7]|7[0-8]|8[\d]|9[189])\d{8}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur'
    }
  ]
} as Partial<Record<string, Arrayable<FormItemRule>>>
const formRef = ref<Form | null>()
const formData = ref<Recordable>({ ...initParams })
watch(
  () => props.formInitValue,
  (val) => {
    formData.value = { ...val }
  },
  { deep: true }
)

const resetForm = () => {
  let form = formRef?.value
  if (!form) return
  formData.value = { ...initParams }
  form && (form as Form).resetFields()
}
const closeDialog = () => {
  emits('update:modelValue', false)
}
// 操作成功
const operateOk = () => {
  emits('success', true)
  closeDialog()
}
const submitForm = () => {
  let form = formRef.value as Form
  form.validate(async (valid) => {
    let data = formData.value
    if (valid) {
      try {
        if (data?.id !== undefined) {
          await updateUserApi(data)
          message.success(t('common.updateSuccess'))
          operateOk()
        } else {
          await createUserApi(data)
          message.success(t('common.createSuccess'))
          operateOk()
        }
      } catch (err) {
        console.error(err)
      }
    }
  })
}
const cancel = () => {
  closeDialog()
}

defineExpose({
  resetForm
})
</script>

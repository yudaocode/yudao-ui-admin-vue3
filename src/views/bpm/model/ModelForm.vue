<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="流程标识" prop="key">
        <el-input v-model="formData.key" :disabled="!!formData.id" placeholder="请输入流标标识" />
        <el-tooltip
          v-if="!formData.id"
          class="item"
          content="新建后，流程标识不可修改！"
          effect="light"
          placement="top"
        >
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
        <el-tooltip v-else class="item" content="流程标识不可修改！" effect="light" placement="top">
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="流程名称" prop="name">
        <el-input
          v-model="formData.name"
          :disabled="!!formData.id"
          clearable
          placeholder="请输入流程名称"
        />
      </el-form-item>
      <el-form-item label="流程分类" prop="category">
        <el-select
          v-model="formData.category"
          clearable
          placeholder="请选择流程分类"
          style="width: 100%"
        >
          <el-option
            v-for="category in categoryList"
            :key="category.code"
            :label="category.name"
            :value="category.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="流程图标" prop="icon">
        <UploadImg v-model="formData.icon" :limit="1" height="64px" width="64px" />
      </el-form-item>
      <el-form-item label="流程描述" prop="description">
        <el-input v-model="formData.description" clearable type="textarea" />
      </el-form-item>
      <el-form-item label="流程类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="表单类型" prop="formType">
        <el-radio-group v-model="formData.formType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.formType === 10" label="流程表单" prop="formId">
        <el-select v-model="formData.formId" clearable style="width: 100%">
          <el-option v-for="form in formList" :key="form.id" :label="form.name" :value="form.id" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="formData.formType === 20"
        label="表单提交路由"
        prop="formCustomCreatePath"
      >
        <el-input
          v-model="formData.formCustomCreatePath"
          placeholder="请输入表单提交路由"
          style="width: 330px"
        />
        <el-tooltip
          class="item"
          content="自定义表单的提交路径，使用 Vue 的路由地址，例如说：bpm/oa/leave/create.vue"
          effect="light"
          placement="top"
        >
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item v-if="formData.formType === 20" label="表单查看地址" prop="formCustomViewPath">
        <el-input
          v-model="formData.formCustomViewPath"
          placeholder="请输入表单查看的组件地址"
          style="width: 330px"
        />
        <el-tooltip
          class="item"
          content="自定义表单的查看组件地址，使用 Vue 的组件地址，例如说：bpm/oa/leave/detail.vue"
          effect="light"
          placement="top"
        >
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="是否可见" prop="visible">
        <el-radio-group v-model="formData.visible">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value as string"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="谁可以发起" prop="startUserIds">
        <el-select
          v-model="formData.startUserIds"
          multiple
          placeholder="请选择可发起人，默认（不选择）则所有人都可以发起"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="流程管理员" prop="managerUserIds">
        <el-select v-model="formData.managerUserIds" multiple placeholder="请选择流程管理员">
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { ElMessageBox } from 'element-plus'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi } from '@/api/bpm/category'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import { UserVO } from '@/api/system/user'
import * as UserApi from '@/api/system/user'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'ModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userStore = useUserStoreWithOut() // 用户信息缓存

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  key: '',
  category: undefined,
  icon: undefined,
  description: '',
  type: BpmModelType.BPMN,
  formType: BpmModelFormType.NORMAL,
  formId: '',
  formCustomCreatePath: '',
  formCustomViewPath: '',
  visible: true,
  startUserIds: [],
  managerUserIds: []
})
const formRules = reactive({
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
  key: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '流程分类不能为空', trigger: 'blur' }],
  icon: [{ required: true, message: '流程图标不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  formType: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  formId: [{ required: true, message: '流程表单不能为空', trigger: 'blur' }],
  formCustomCreatePath: [{ required: true, message: '表单提交路由不能为空', trigger: 'blur' }],
  formCustomViewPath: [{ required: true, message: '表单查看地址不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  managerUserIds: [{ required: true, message: '流程管理员不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const formList = ref([]) // 流程表单的下拉框的数据
const categoryList = ref([]) // 流程分类列表
const userList = ref<UserVO[]>([]) // 用户列表

/** 打开弹窗 */
const open = async (type: string, id?: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ModelApi.getModel(id)
    } finally {
      formLoading.value = false
    }
  } else {
    formData.value.managerUserIds.push(userStore.getUser.id)
  }
  // 获得流程表单的下拉框的数据
  formList.value = await FormApi.getFormSimpleList()
  // 查询流程分类列表
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 查询用户列表
  userList.value = await UserApi.getSimpleUserList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ModelApi.ModelVO
    if (formType.value === 'create') {
      await ModelApi.createModel(data)
      // 提示，引导用户做后续的操作
      await ElMessageBox.alert(
        '<strong>新建模型成功！</strong>后续需要执行如下 2 个步骤：' +
          '<div>1. 点击【设计流程】按钮，绘制流程图</div>' +
          '<div>2. 点击【发布流程】按钮，完成流程的最终发布</div>' +
          '另外，每次流程修改后，都需要点击【发布流程】按钮，才能正式生效！！！',
        '重要提示',
        {
          dangerouslyUseHTMLString: true,
          type: 'success'
        }
      )
    } else {
      await ModelApi.updateModel(data)
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
    name: '',
    key: '',
    category: undefined,
    icon: undefined,
    description: '',
    type: BpmModelType.BPMN,
    formType: BpmModelFormType.NORMAL,
    formId: '',
    formCustomCreatePath: '',
    formCustomViewPath: '',
    visible: true,
    startUserIds: [],
    managerUserIds: []
  }
  formRef.value?.resetFields()
}
</script>

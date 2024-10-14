<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="线索名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入线索名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户来源" prop="source">
            <el-select v-model="formData.source" placeholder="请选择客户来源" class="w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="手机" prop="mobile">
            <el-input v-model="formData.mobile" placeholder="请输入手机" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="ownerUserId">
            <el-select
              v-model="formData.ownerUserId"
              :disabled="formType !== 'create'"
              class="w-1/1"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="电话" prop="telephone">
            <el-input v-model="formData.telephone" placeholder="请输入电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="微信" prop="wechat">
            <el-input v-model="formData.wechat" placeholder="请输入微信" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="QQ" prop="qq">
            <el-input v-model="formData.qq" placeholder="请输入 QQ" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户行业" prop="industryId">
            <el-select v-model="formData.industryId" placeholder="请选择客户行业" class="w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户级别" prop="level">
            <el-select v-model="formData.level" placeholder="请选择客户级别" class="w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="地址" prop="areaId">
            <el-cascader
              v-model="formData.areaId"
              :options="areaList"
              :props="defaultProps"
              class="w-1/1"
              clearable
              filterable
              placeholder="请选择城市"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="详细地址" prop="detailAddress">
            <el-input v-model="formData.detailAddress" placeholder="请输入详细地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="下次联系时间" prop="contactNextTime">
            <el-date-picker
              v-model="formData.contactNextTime"
              placeholder="选择下次联系时间"
              type="datetime"
              value-format="x"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ClueApi from '@/api/crm/clue'
import * as AreaApi from '@/api/system/area'
import { defaultProps } from '@/utils/tree'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const areaList = ref([]) // 地区列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const formData = ref({
  id: undefined,
  name: undefined,
  contactNextTime: undefined,
  ownerUserId: 0,
  mobile: undefined,
  telephone: undefined,
  qq: undefined,
  wechat: undefined,
  email: undefined,
  areaId: undefined,
  detailAddress: undefined,
  industryId: undefined,
  level: undefined,
  source: undefined,
  remark: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '线索名称不能为空', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '负责人不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ClueApi.getClue(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得地区列表
  areaList.value = await AreaApi.getAreaTree()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 默认新建时选中自己
  if (formType.value === 'create') {
    formData.value.ownerUserId = useUserStore().getUser.id
  }
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
    const data = formData.value as unknown as ClueApi.ClueVO
    if (formType.value === 'create') {
      await ClueApi.createClue(data)
      message.success(t('common.createSuccess'))
    } else {
      await ClueApi.updateClue(data)
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
    name: undefined,
    contactNextTime: undefined,
    ownerUserId: 0,
    mobile: undefined,
    telephone: undefined,
    qq: undefined,
    wechat: undefined,
    email: undefined,
    areaId: undefined,
    detailAddress: undefined,
    industryId: undefined,
    level: undefined,
    source: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>

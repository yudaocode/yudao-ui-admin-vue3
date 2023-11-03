<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入客户名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属行业" prop="industryId">
            <el-select v-model="formData.industryId" placeholder="请选择所属行业">
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)"
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
          <el-form-item label="客户来源" prop="source">
            <el-select v-model="formData.source" placeholder="请选择客户来源">
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户等级" prop="level">
            <el-select v-model="formData.level" placeholder="请选择客户等级">
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)"
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
          <el-form-item label="电话" prop="telephone">
            <el-input v-model="formData.telephone" placeholder="请输入电话" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="QQ" prop="qq">
            <el-input v-model="formData.qq" placeholder="请输入QQ" />
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
          <el-form-item label="网址" prop="website">
            <el-input v-model="formData.website" placeholder="请输入网址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="所在地" prop="areaId">
            <el-tree-select
              v-model="formData.areaId"
              :data="areaList"
              :props="defaultProps"
              :render-after-expand="true"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="详细地址" prop="detailAddress">
            <el-input v-model="formData.detailAddress" placeholder="请输入详细地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item v-if="formType === 'create'" label="负责人" prop="userIds" span="24">
        <el-select v-model="formData.ownerUserId">
          <el-option
            v-for="item in userOptions"
            :key="parseInt(item.id)"
            :label="item.nickname"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="下次联系时间" prop="contactNextTime">
            <el-date-picker
              v-model="formData.contactNextTime"
              type="date"
              value-format="x"
              placeholder="选择下次联系时间"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-col :span="24">
        <el-form-item label="客户描述" prop="description">
          <el-input v-model="formData.description" placeholder="请输入客户描述" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-col>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'
import * as AreaApi from '@/api/system/area'
import { defaultProps } from '@/utils/tree'
import * as UserApi from '@/api/system/user'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

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
  mobile: undefined,
  industryId: undefined,
  level: undefined,
  source: undefined,
  telephone: undefined,
  website: undefined,
  qq: undefined,
  wechat: undefined,
  email: undefined,
  description: undefined,
  remark: undefined,
  areaId: undefined,
  detailAddress: undefined,
  contactNextTime: undefined,
  ownerUserId: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
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
      formData.value = await CustomerApi.getCustomer(id)
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
    const { wsCache } = useCache()
    const user = wsCache.get(CACHE_KEY.USER).user
    formData.value.ownerUserId = user.id
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
    const data = formData.value as unknown as CustomerApi.CustomerVO
    if (formType.value === 'create') {
      await CustomerApi.createCustomer(data)
      message.success(t('common.createSuccess'))
    } else {
      await CustomerApi.updateCustomer(data)
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
    mobile: undefined,
    industryId: undefined,
    level: undefined,
    source: undefined,
    telephone: undefined,
    website: undefined,
    qq: undefined,
    wechat: undefined,
    email: undefined,
    description: undefined,
    remark: undefined,
    areaId: undefined,
    detailAddress: undefined,
    contactNextTime: undefined,
    ownerUserId: undefined
  }
  formRef.value?.resetFields()
}
</script>

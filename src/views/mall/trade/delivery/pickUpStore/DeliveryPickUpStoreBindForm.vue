<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="20%">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="门店名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入门店名称" :disabled="true"/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="门店店员" prop="storeStaffIds">
            <el-button type="primary" @click="storeStaffTableSelect.open()">选择店员</el-button>
          </el-form-item>
          <!-- 店员列表 -->
          <ContentWrap v-if="usersList.length > 0">
            <el-table :data="usersList">
              <el-table-column label="编号" align="center" prop="id" />
              <el-table-column
                label="用户昵称"
                align="center"
                prop="nickname"
                :show-overflow-tooltip="true"
              />
              <el-table-column label="状态" align="center" key="status">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
                </template>
              </el-table-column>
              <el-table-column align="center" label="操作">
                <template #default="scope">
                  <el-button
                    v-hasPermi="['trade:delivery:pick-up-store:delete']"
                    link
                    type="danger"
                    @click="handleDelete(scope.row.id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </ContentWrap>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <StoreStaffTableSelect ref="storeStaffTableSelect" @change="changeStoreStaff"/>
</template>
<script setup lang="ts">
import * as DeliveryPickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import StoreStaffTableSelect from './components/StoreStaffTableSelect.vue'
import {DICT_TYPE} from "@/utils/dict";

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  name: '',
  storeStaffIds: [],
  storeStaffs: [],
})
const formRules = reactive({
  name: [{ required: true, message: '门店名称不能为空', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref
const storeStaffTableSelect = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  dialogTitle.value = '绑定自提门店员工'
  resetForm()
  formLoading.value = true
  try {
    await getList(id)
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  formData.value.storeStaffIds = usersList.value.map(item => item.id) as [];
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    await DeliveryPickUpStoreApi.bindStoreStaffId(data)
    message.success("绑定成功")
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    const index = usersList.value.findIndex(item => {
      if (item.id == id){
        return true;
      }
    })
    usersList.value.splice(index, 1);
    //await DeliveryPickUpStoreStaffApi.deleteDeliveryPickUpStoreStaff(id,formData.value.id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    //await getList(formData.value.id)
  } catch {}
}

/**
 * 查询自提点员工绑定关系
 */
const getList = async (id: number) => {
  formData.value = await DeliveryPickUpStoreApi.getDeliveryPickUpStoreStaff(id)
  if(formData.value.storeStaffs){
    usersList.value = formData.value.storeStaffs;
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    storeStaffIds: [],
    storeStaffs: [],
  }
  formRef.value?.resetFields()
}

const usersList = ref([])
const changeStoreStaff = (checkedUsers : []) => {
  usersList.value = checkedUsers
}
</script>

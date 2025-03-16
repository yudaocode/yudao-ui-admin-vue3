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
            <el-input v-model="formData.name" placeholder="请输入门店名称" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="门店店员" prop="verifyUserIds">
            <el-button type="primary" @click="storeStaffTableSelect.open()">选择店员</el-button>
          </el-form-item>
          <!-- 店员列表 -->
          <ContentWrap v-if="formData.verifyUsers?.length > 0">
            <el-table :data="formData.verifyUsers">
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

  <!-- 选择员工弹窗 -->
  <StoreStaffTableSelect ref="storeStaffTableSelect" @change="handleSelect" />
</template>
<script setup lang="ts">
import * as DeliveryPickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import StoreStaffTableSelect from './components/StoreStaffTableSelect.vue'
import { DICT_TYPE } from '@/utils/dict'

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  name: '',
  verifyUserIds: [],
  verifyUsers: []
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref
const storeStaffTableSelect = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  dialogTitle.value = '绑定自提门店员工'
  resetForm()
  formLoading.value = true
  try {
    formData.value = await DeliveryPickUpStoreApi.getDeliveryPickUpStore(id)
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      id: formData.value.id,
      verifyUserIds: formData.value.verifyUsers.map((item: any) => item.id)
    }
    await DeliveryPickUpStoreApi.bindStoreStaffId(data)
    message.success('绑定成功')
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 处理选择员工操作 */
const handleSelect = (checkedUsers: []) => {
  formData.value.verifyUsers = checkedUsers
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  const index = formData.value.verifyUsers.findIndex((item: any) => {
    if (item.id == id) {
      return true
    }
  })
  formData.value.verifyUsers.splice(index, 1)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    verifyUserIds: [],
    verifyUsers: []
  }
  formRef.value?.resetFields()
}
</script>

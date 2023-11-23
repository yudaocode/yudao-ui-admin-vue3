<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-transfer
      v-model="value"
      :data="data"
      :titles="transferTitles"
      :props="transferDataProp"
      :right-default-checked="[1]"
    />
    <el-row justify="end">
      <el-col :span="4">
        <el-button type="primary" @click="confirmOwerSelect">确认</el-button>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="confirmOwerSelect">取消</el-button>
      </el-col>
    </el-row>
  </Dialog>
</template>
<script setup lang="ts">
// TODO 芋艿：统一选择框。
import * as UserApi from '@/api/system/user'
import { parseBigInt } from 'jsencrypt/lib/lib/jsbn/jsbn'
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('选择') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('')
const transferTitles = ref(['待选择', '已选择'])
const transferDataProp = ref({
  key: 'id',
  label: 'nickname'
})
const emit = defineEmits(['confirmOwerSelect'])
const data = ref<UserApi.UserVO[]>([])
const value = ref<any[]>([])
const rightDefaultChecked = ref<any[]>([])
/** 打开弹窗 */
const open = async (type: string, ownerUserList: any[]) => {
  dialogVisible.value = true
  formType.value = type
  // 修改时，设置数据
  if (ownerUserList) {
    formLoading.value = true
    try {
      ownerUserList.forEach((item) => {
        value.value.push(item.id)
      })
    } finally {
      formLoading.value = false
    }
  }
  rightDefaultChecked.value = []
  data.value = await UserApi.getSimpleUserList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
const confirmOwerSelect = () => {
  const returnData = ref<any[]>([])
  data.value.forEach((item) => {
    if (value.value.indexOf(item.id) > -1) {
      returnData.value.push(item)
    }
  })
  emit('confirmOwerSelect', returnData)
  dialogVisible.value = false
  value.value = []
}
</script>
<style>
.el-row {
  margin-top: 20px;
}
</style>

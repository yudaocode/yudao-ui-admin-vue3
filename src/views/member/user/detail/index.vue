<template>
  <div v-loading="loading">
    <el-row :gutter="10">
      <!-- 左上角：基本信息 -->
      <el-col :span="14" class="detail-info-item">
        <UserBasicInfo :user="user">
          <template #header>
            <div class="card-header">
              <CardTitle title="基本信息" />
              <el-button
                v-if="user.id"
                type="primary"
                size="small"
                text
                @click="openForm('update', user.id)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </UserBasicInfo>
      </el-col>
      <!-- 右上角：账户信息 -->
      <el-col :span="10" class="detail-info-item">
        <el-card shadow="never">
          <template #header>
            <CardTitle title="账户信息" />
          </template>
          <AccountInfo />
        </el-card>
      </el-col>
      <!-- 下边：账户明细 -->
      <!-- TODO 芋艿：【收货地址】【订单管理】【售后管理】【收藏记录】【优惠劵】 -->
      <el-card header="账户明细" style="width: 100%; margin-top: 20px" shadow="never">
        <template #header>
          <CardTitle title="账户明细" />
        </template>
        <el-tabs v-model="activeName">
          <el-tab-pane label="积分" name="point">
            <PointList v-if="user.id" :user-id="user.id" />
          </el-tab-pane>
          <el-tab-pane label="签到" name="sign">
            <SignList v-if="user.id" :user-id="user.id" />
          </el-tab-pane>
          <el-tab-pane label="成长值" name="third">成长值(WIP)</el-tab-pane>
          <el-tab-pane label="余额" name="fourth">余额(WIP)</el-tab-pane>
          <el-tab-pane label="收货地址" name="address">
            <AddressList v-if="user.id" :user-id="user.id" />
          </el-tab-pane>
          <el-tab-pane label="订单管理" name="fourth">订单管理(WIP)</el-tab-pane>
          <el-tab-pane label="售后管理" name="fourth">售后管理(WIP)</el-tab-pane>
          <el-tab-pane label="收藏记录" name="fourth">收藏记录(WIP)</el-tab-pane>
          <el-tab-pane label="优惠劵" name="fourth">优惠劵(WIP)</el-tab-pane>
        </el-tabs>
      </el-card>
    </el-row>
  </div>
  <!-- 表单弹窗：添加/修改 -->
  <UserForm ref="formRef" v-if="user.id" @success="getUserData(user.id)" />
</template>
<script setup lang="ts">
import PointList from '@/views/member/user/components/PointList.vue'
import SignList from '@/views/member/user/components/SignList.vue'
import CardTitle from '@/views/member/user/components/CardTitle.vue'
import * as UserApi from '@/api/member/user'
import UserForm from '@/views/member/user/UserForm.vue'
import AccountInfo from '@/views/member/user/components/AccountInfo.vue'
import UserBasicInfo from '@/views/member/user/components/UserBasicInfo.vue'
import AddressList from '@/views/member/user/components/AddressList.vue'

defineOptions({ name: 'MemberDetail' })

const activeName = ref('point') // 账户明细 选中的 tabs
const loading = ref(true) // 加载中
let user = ref<UserApi.UserVO>({
  areaId: undefined,
  avatar: undefined,
  birthday: undefined,
  createTime: undefined,
  id: NaN,
  loginDate: undefined,
  loginIp: '',
  mark: '',
  mobile: '',
  name: '',
  nickname: '',
  registerIp: '',
  sex: 0,
  status: 0,
  areaName: ''
})
/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
/** 获得用户 */
const getUserData = async (id: number) => {
  loading.value = true
  try {
    user.value = await UserApi.getUser(id)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
const route = useRoute()
const router = useRouter()
const member_id = Number(route.params.userId as string)
onMounted(() => {
  if (!member_id) {
    // TODO
    ElMessage.warning('参数错误，会员编号不能为空！')
    router.back()
    return
  }
  getUserData(member_id)
})
</script>
<style scoped lang="css">
/** TODO 这 3 个 css 貌似没用？ */
.detail-info-item:first-child {
  padding-left: 0 !important;
}
/* first-child 不生效有没有大佬给看下q.q */
.detail-info-item:nth-child(2) {
  padding-right: 0 !important;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<template>
  <div v-loading="loading">
    <el-row :gutter="10">
      <!-- 左上角：基本信息 -->
      <el-col :span="14" class="detail-info-item">
        <UserBasicInfo :user="user">
          <template #header>
            <div class="card-header">
              <CardTitle title="基本信息" />
              <el-button type="primary" size="small" text @click="openForm('update')">
                编辑
              </el-button>
            </div>
          </template>
        </UserBasicInfo>
      </el-col>
      <!-- 右上角：账户信息 -->
      <el-col :span="10" class="detail-info-item">
        <el-card shadow="never" class="h-full">
          <template #header>
            <CardTitle title="账户信息" />
          </template>
          <UserAccountInfo :user="user" />
        </el-card>
      </el-col>
      <!-- 下边：账户明细 -->
      <!-- TODO 芋艿：【订单管理】【售后管理】【收藏记录】-->
      <el-card header="账户明细" style="width: 100%; margin-top: 20px" shadow="never">
        <template #header>
          <CardTitle title="账户明细" />
        </template>
        <el-tabs>
          <el-tab-pane label="积分">
            <UserPointList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="签到" lazy>
            <UserSignList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="成长值" lazy>
            <UserExperienceRecordList :user-id="id" />
          </el-tab-pane>
          <!-- TODO @jason：增加一个余额变化； -->
          <el-tab-pane label="余额" lazy>余额(WIP)</el-tab-pane>
          <el-tab-pane label="收货地址" lazy>
            <UserAddressList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="订单管理" lazy>
            <UserOrderList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="售后管理" lazy>售后管理(WIP)</el-tab-pane>
          <el-tab-pane label="收藏记录" lazy>
            <UserFavoriteList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="优惠劵" lazy>
            <UserCouponList :user-id="id" />
          </el-tab-pane>
          <el-tab-pane label="推广用户" lazy>
            <UserBrokerageList :bind-user-id="id" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-row>
  </div>

  <!-- 表单弹窗：添加/修改 -->
  <UserForm ref="formRef" @success="getUserData(id)" />
</template>
<script setup lang="ts">
import * as UserApi from '@/api/member/user'
import { useTagsViewStore } from '@/store/modules/tagsView'
import UserForm from '@/views/member/user/UserForm.vue'
import UserAccountInfo from './UserAccountInfo.vue'
import UserAddressList from './UserAddressList.vue'
import UserBasicInfo from './UserBasicInfo.vue'
import UserBrokerageList from './UserBrokerageList.vue'
import UserCouponList from './UserCouponList.vue'
import UserExperienceRecordList from './UserExperienceRecordList.vue'
import UserOrderList from './UserOrderList.vue'
import UserPointList from './UserPointList.vue'
import UserSignList from './UserSignList.vue'
import UserFavoriteList from './UserFavoriteList.vue'
import { CardTitle } from '@/components/Card/index'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'MemberDetail' })

const loading = ref(true) // 加载中
const user = ref<UserApi.UserVO>({} as UserApi.UserVO)

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string) => {
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
const { currentRoute } = useRouter() // 路由
const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const id = Number(route.params.id)
onMounted(() => {
  if (!id) {
    ElMessage.warning('参数错误，会员编号不能为空！')
    delView(unref(currentRoute))
    return
  }
  getUserData(id)
})
</script>
<style scoped lang="css">
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

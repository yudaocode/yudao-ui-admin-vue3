<template>
  <div v-loading="loading">
    <el-row :gutter="10" class="detail-info-warp">
      <!-- 左上角：基本信息 -->
      <el-col :span="14" class="detail-info-item">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <!-- TODO @梦：如果不要小蓝线，是不是直接用 el-card 自带的 title 即可？ -->
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
          <el-row>
            <el-col :span="4">
              <ElAvatar shape="square" :size="140" :src="user.avatar || undefined" />
            </el-col>
            <el-col :span="20">
              <el-descriptions :column="2">
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:user" />
                      用户名
                    </div>
                  </template>
                  {{ user.name || '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:user" />
                      昵称
                    </div>
                  </template>
                  {{ user.nickname }}
                </el-descriptions-item>
                <el-descriptions-item label="手机号">
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:phone" />
                      手机号
                    </div>
                  </template>
                  {{ user.mobile }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="fa:mars-double" />
                      性别
                    </div>
                  </template>
                  <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="user.sex" />
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:location" />
                      所在地
                    </div>
                  </template>
                  <!-- TODO @梦：这里后端返回的时候，要返回 areaName -->
                  {{ user.areaId }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:position" />
                      注册 IP
                    </div>
                  </template>
                  {{ user.registerIp }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="fa:birthday-cake" />
                      生日
                    </div>
                  </template>
                  {{ user.birthday ? formatDate(user.birthday) : '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:calendar" />
                      注册时间
                    </div>
                  </template>
                  {{ user.createTime ? formatDate(user.createTime) : '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:calendar" />
                      最后登录时间
                    </div>
                  </template>
                  {{ user.loginDate ? formatDate(user.loginDate) : '空' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </el-card>
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
            <PointList v-if="user.id" :member-id="user.id" />
          </el-tab-pane>
          <el-tab-pane label="签到" name="sign">
            <SignList v-if="user.id" :member-id="user.id" />
          </el-tab-pane>
          <el-tab-pane label="成长值" name="third">成长值(WIP)</el-tab-pane>
          <el-tab-pane label="余额" name="fourth">余额(WIP)</el-tab-pane>
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
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import UserForm from '@/views/member/user/UserForm.vue'
// TODO @梦：把用户信息，也抽成一个组件，类似 AccountInfo
import AccountInfo from '@/views/member/user/components/AccountInfo.vue'

defineOptions({ name: 'MemberDetail' })

const activeName = ref('point') // 账户明细 选中的 tabs
const loading = ref(true) // 加载中
let user = ref<UserApi.UserBaseInfoVO>({
  areaId: undefined,
  avatar: undefined,
  birthday: undefined,
  createTime: undefined,
  id: undefined,
  loginDate: undefined,
  loginIp: '',
  mark: '',
  mobile: '',
  name: '',
  nickname: '',
  password: null,
  registerIp: undefined,
  sex: 0,
  status: 0
})

/** 获得用户 */
const getUserData = async (id: number) => {
  loading.value = true
  try {
    user.value = await UserApi.getUser(id)
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 初始化 */
const route = useRoute()
const router = useRouter()
const member_id = route.params.member_id as number
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
.cell-item {
  display: inline;
}
/** TODO 下面 css 貌似没啥用？ */
.cell-item::after {
  content: ':';
}
</style>

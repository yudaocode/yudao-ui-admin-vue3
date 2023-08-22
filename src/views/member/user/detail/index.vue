<template>
  <div v-loading="loading">
    <el-row :gutter="10" class="detail-info-warp">
      <el-col :span="14" class="detail-info-item">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <CardTitle title="基本信息" />
              <el-button
                v-if="userInfo.id"
                type="primary"
                text
                @click="openForm('update', userInfo.id)"
                >编辑</el-button
              >
            </div>
          </template>
          <el-row>
            <el-col :span="4">
              <ElAvatar shape="square" :size="140" :src="userInfo.avatar || undefined" />
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
                  {{ userInfo.name || '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:user" />
                      昵称
                    </div>
                  </template>
                  {{ userInfo.nickname }}</el-descriptions-item
                >
                <el-descriptions-item label="手机号">
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:phone" />
                      手机号
                    </div>
                  </template>
                  {{ userInfo.mobile }}</el-descriptions-item
                >
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="fa:mars-double" />
                      性别
                    </div>
                  </template>
                  <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="userInfo.sex" />
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:location" />
                      所在地
                    </div>
                  </template>
                  {{ userInfo.areaId }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:position" />
                      注册IP
                    </div>
                  </template>
                  {{ userInfo.registerIp }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="fa:birthday-cake" />
                      生日
                    </div>
                  </template>
                  {{ userInfo.birthday ? formatDate(userInfo.birthday) : '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:calendar" />
                      注册时间
                    </div>
                  </template>
                  {{ userInfo.createTime ? formatDate(userInfo.createTime) : '空' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>
                    <div class="cell-item">
                      <Icon icon="ep:calendar" />
                      最后登录时间
                    </div>
                  </template>
                  {{ userInfo.loginDate ? formatDate(userInfo.loginDate) : '空' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="10" class="detail-info-item">
        <el-card shadow="never">
          <template #header>
            <CardTitle title="账户信息(WIP)" />
          </template>
          <AccountInfo />
        </el-card>
      </el-col>
      <el-card header="账户明细" style="width: 100%; margin-top: 20px" shadow="never">
        <template #header>
          <CardTitle title="账户明细" />
        </template>
        <el-tabs v-model="activeName" class="demo-tabs">
          <el-tab-pane label="积分" name="point">
            <PointList v-if="userInfo.id" :member-id="userInfo.id" />
          </el-tab-pane>
          <el-tab-pane label="签到" name="sign">
            <SignList v-if="userInfo.id" :member-id="userInfo.id" />
          </el-tab-pane>
          <el-tab-pane label="成长值" name="third">成长值(WIP)</el-tab-pane>
          <el-tab-pane label="余额" name="fourth">余额(WIP)</el-tab-pane>
        </el-tabs>
      </el-card>
    </el-row>
  </div>
  <!-- 表单弹窗：添加/修改 -->
  <UserForm ref="formRef" @success="getUserData(userInfo.id)" />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PointList from '@/views/member/user/components/point-list.vue'
import SignList from '@/views/member/user/components/sign-list.vue'
import CardTitle from '@/views/member/user/components/card-title.vue'
import { ElMessage } from 'element-plus'
import { getUser, UserBaseInfoVO } from '@/api/member/user'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import UserForm from '@/views/member/user/UserForm.vue'
import AccountInfo from '@/views/member/user/components/account-info.vue'
defineOptions({ name: 'MemberDetail' })

const activeName = ref('point')
const loading = ref(true)
/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
let userInfo = ref<UserBaseInfoVO>({
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

const getUserData = async (id: any) => {
  loading.value = true
  try {
    // userInfo.value = Object.assign(userInfo, await getUser(parseInt(id as string)))
    userInfo.value = await getUser(parseInt(id as string))
  } finally {
    loading.value = false
  }
}
const route = useRoute()
let router = useRouter()
const { member_id } = route.query
onMounted(() => {
  if (!member_id) {
    ElMessage.warning('会员id 未携带！')
    router.back()
    return
  }
  getUserData(member_id)
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
.cell-item {
  display: inline;
}
.cell-item::after {
  content: ':';
}
</style>

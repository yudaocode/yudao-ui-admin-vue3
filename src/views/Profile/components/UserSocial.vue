<template>
  <el-table :data="socialUsers" :show-header="false">
    <el-table-column fixed="left" title="序号" type="seq" width="60" />
    <el-table-column align="left" label="社交平台" width="120">
      <template #default="{ row }">
        <img :src="row.img" alt="" class="h-5 align-middle" />
        <p class="mr-5">{{ row.title }}</p>
      </template>
    </el-table-column>
    <el-table-column align="center" label="操作">
      <template #default="{ row }">
        <template v-if="row.openid">
          已绑定
          <XTextButton class="mr-5" title="(解绑)" type="primary" @click="unbind(row)" />
        </template>
        <template v-else>
          未绑定
          <XTextButton class="mr-5" title="(绑定)" type="primary" @click="bind(row)" />
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts" name="UserSocial" setup>
import { SystemUserSocialTypeEnum } from '@/utils/constants'
import { getUserProfile, ProfileVO } from '@/api/system/user/profile'
import { socialAuthRedirect, socialBind, socialUnbind } from '@/api/system/user/socialUser'

const message = useMessage()
const socialUsers = ref<any[]>([])
const userInfo = ref<ProfileVO>()

const initSocial = async () => {
  const res = await getUserProfile()
  userInfo.value = res
  for (const i in SystemUserSocialTypeEnum) {
    const socialUser = { ...SystemUserSocialTypeEnum[i] }
    socialUsers.value.push(socialUser)
    if (userInfo.value?.socialUsers) {
      for (const j in userInfo.value.socialUsers) {
        if (socialUser.type === userInfo.value.socialUsers[j].type) {
          socialUser.openid = userInfo.value.socialUsers[j].openid
          break
        }
      }
    }
  }
}
const route = useRoute()
const bindSocial = () => {
  // 社交绑定
  const type = route.query.type
  const code = route.query.code
  const state = route.query.state
  if (!code) {
    return
  }
  socialBind(type, code, state).then(() => {
    message.success('绑定成功')
    initSocial()
  })
}
const bind = (row) => {
  const redirectUri = location.origin + '/user/profile?type=' + row.type
  // 进行跳转
  socialAuthRedirect(row.type, encodeURIComponent(redirectUri)).then((res) => {
    window.location.href = res
  })
}
const unbind = async (row) => {
  const res = await socialUnbind(row.type, row.openid)
  if (res) {
    row.openid = undefined
  }
  message.success('解绑成功')
}

onMounted(async () => {
  await initSocial()
})

watch(
  () => route,
  (newRoute) => {
    bindSocial()
    console.log(newRoute)
  },
  {
    immediate: true
  }
)
</script>

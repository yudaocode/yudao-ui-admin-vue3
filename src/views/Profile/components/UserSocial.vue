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
          <el-button link class="mr-5" type="primary" @click="unbind(row)">(解绑)</el-button>
        </template>
        <template v-else>
          未绑定
          <el-button link class="mr-5" type="primary" @click="bind(row)">(绑定)</el-button>
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts" setup>
import { SystemUserSocialTypeEnum } from '@/utils/constants'
import { getBindSocialUserList } from '@/api/system/social/user'
import { socialAuthRedirect, socialBind, socialUnbind } from '@/api/system/user/socialUser'
import { buildSocialRedirectUri, clearSocialCallback, getSocialCallback } from '@/utils/social'
import { useTagsViewStore } from '@/store/modules/tagsView'

defineOptions({ name: 'UserSocial' })
defineProps<{
  activeName: string
}>()
const message = useMessage()
const socialUsers = ref<any[]>([])

const initSocial = async () => {
  socialUsers.value = [] // 重置避免无限增长
  // 获取已绑定的社交用户列表
  const bindSocialUserList = await getBindSocialUserList()
  // 检查该社交平台是否已绑定
  for (const i in SystemUserSocialTypeEnum) {
    const socialUser = { ...SystemUserSocialTypeEnum[i] }
    socialUsers.value.push(socialUser)
    if (bindSocialUserList && bindSocialUserList.length > 0) {
      for (const bindUser of bindSocialUserList) {
        if (socialUser.type === bindUser.type) {
          socialUser.openid = bindUser.openid
          break
        }
      }
    }
  }
}
const route = useRoute()
const { options, replace, resolve } = useRouter()
const tagsViewStore = useTagsViewStore()
const emit = defineEmits<{
  (e: 'update:activeName', v: string): void
}>()
const bindSocial = async () => {
  // 社交绑定
  const type = getUrlValue('type')
  const { code, state } = getSocialCallback()
  if (!code) {
    return
  }
  // 清理 URL 参数，避免刷新重复触发
  clearSocialCallback(options.history)
  // 同步当前路由、标签页：history 路由时，它们仍带有 code 等参数，重新打开标签页会带回 code，所以替换为清理后的地址，并删除旧标签页
  // 注意：Profile 路由的 viewKey 为 Profile，替换后不会重建页面
  const callbackRoute = { ...route }
  if (options.history.location !== callbackRoute.fullPath) {
    await replace(options.history.location)
    tagsViewStore.delVisitedView(callbackRoute)
  }
  socialBind(type, code, state).then(() => {
    message.success('绑定成功')
    emit('update:activeName', 'userSocial')
  })
}

// 双层 encode 需要在回调后进行 decode
function getUrlValue(key: string): string {
  const url = new URL(decodeURIComponent(location.href))
  return url.searchParams.get(key) ?? ''
}

const bind = (row) => {
  // 双层 encode 解决钉钉回调 type 参数丢失的问题
  const redirectUri = buildSocialRedirectUri(resolve('/user/profile').href, { type: row.type })
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
  () => {
    bindSocial()
  },
  {
    immediate: true
  }
)
</script>

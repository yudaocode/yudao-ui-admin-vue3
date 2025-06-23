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

<script lang="ts" setup>
import { SystemUserSocialTypeEnum } from '@/utils/constants'
import { getUserProfile, ProfileVO } from '@/api/system/user/profile'
import { getBindList, socialAuthRedirect, socialBind, socialUnbind } from '@/api/system/user/socialUser'
import { useRoute } from 'vue-router'

defineOptions({ name: 'UserSocial' })

defineProps<{ activeName: string }>()
const emit = defineEmits<{ (e: 'update:activeName', v: string): void }>()
const message = useMessage()
const route = useRoute()

const socialUsers = ref<any[]>([])
const userInfo = ref<ProfileVO>()

/** 获取并初始化社交账号列表 */
const initSocial = async () => {
  try {
    userInfo.value = await getUserProfile()
    const bindedList = await getBindList()

    const existingSocialUsers = bindedList ?? []
    socialUsers.value = Object.values(SystemUserSocialTypeEnum).map((socialType) => {
      const match = existingSocialUsers.find((item) => item.type === socialType.type)
      return {
        ...socialType,
        openid: match?.openid,
      }
    })
  } catch (e) {
    message.error('获取社交账号列表失败，请稍后重试')
    console.error('[initSocial error]', e)
  }
}

/** 检查是否是登录回调，并进行绑定 */
const handleBindCallback = async () => {
  const { code, state } = route.query
  const type = getUrlValue('type')
  if (!code || !type) return
  try {
    await socialBind(type, code as string, state as string)
    message.success('绑定成功')
    emit('update:activeName', 'userSocial')
    await initSocial()
  } catch (error) {
    message.error('绑定失败，请稍后重试')
  }
}

/** 获取 URL 中参数值 */
function getUrlValue(key: string): string {
  const url = new URL(decodeURIComponent(location.href))
  return url.searchParams.get(key) ?? ''
}

/** 跳转到第三方授权页面 */
const bind = async (row: any) => {
  const redirectUri = location.origin + '/user/profile?' + encodeURIComponent(`type=${row.type}`)
  try {
    const authUrl = await socialAuthRedirect(row.type, encodeURIComponent(redirectUri))
    window.location.href = authUrl
  } catch (error) {
    message.error('获取授权链接失败，请稍后重试')
  }
}

/** 执行解绑 */
const unbind = async (row: any) => {
  try {
    const res = await socialUnbind(row.type, row.openid)
    if (res) {
      row.openid = undefined
      message.success('解绑成功')
    }
  } catch (error) {
    message.error('解绑失败，请稍后重试')
  }
}

onMounted(initSocial)
watch(
  () => route.query,
  handleBindCallback,
  { immediate: true }
)
</script>

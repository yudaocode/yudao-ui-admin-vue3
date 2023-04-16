<template>
  <div>
    <div class="text-center">
      <UserAvatar :img="userInfo?.avatar" />
    </div>
    <ul class="list-group list-group-striped">
      <li class="list-group-item">
        <Icon class="mr-5px" icon="ep:user" />
        {{ t('profile.user.username') }}
        <div class="pull-right">{{ userInfo?.username }}</div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="ep:phone" />
        {{ t('profile.user.mobile') }}
        <div class="pull-right">{{ userInfo?.mobile }}</div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="fontisto:email" />
        {{ t('profile.user.email') }}
        <div class="pull-right">{{ userInfo?.email }}</div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="carbon:tree-view-alt" />
        {{ t('profile.user.dept') }}
        <div v-if="userInfo?.dept" class="pull-right">{{ userInfo?.dept.name }}</div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="ep:suitcase" />
        {{ t('profile.user.posts') }}
        <div v-if="userInfo?.posts" class="pull-right">
          {{ userInfo?.posts.map((post) => post.name).join(',') }}
        </div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="icon-park-outline:peoples" />
        {{ t('profile.user.roles') }}
        <div v-if="userInfo?.roles" class="pull-right">
          {{ userInfo?.roles.map((role) => role.name).join(',') }}
        </div>
      </li>
      <li class="list-group-item">
        <Icon class="mr-5px" icon="ep:calendar" />
        {{ t('profile.user.createTime') }}
        <div class="pull-right">{{ formatDate(userInfo?.createTime) }}</div>
      </li>
    </ul>
  </div>
</template>
<script lang="ts" name="ProfileUser" setup>
import { formatDate } from '@/utils/formatTime'
import UserAvatar from './UserAvatar.vue'

import { getUserProfile, ProfileVO } from '@/api/system/user/profile'

const { t } = useI18n()
const userInfo = ref<ProfileVO>()
const getUserInfo = async () => {
  const users = await getUserProfile()
  userInfo.value = users
}
onMounted(async () => {
  await getUserInfo()
})
</script>

<style scoped>
.text-center {
  text-align: center;
  position: relative;
  height: 120px;
}

.list-group-striped > .list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.list-group {
  padding-left: 0px;
  list-style: none;
}

.list-group-item {
  border-bottom: 1px solid #e7eaec;
  border-top: 1px solid #e7eaec;
  margin-bottom: -1px;
  padding: 11px 0px;
  font-size: 13px;
}

.pull-right {
  float: right !important;
}
</style>

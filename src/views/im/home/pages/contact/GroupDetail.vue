<template>
  <!--
    通讯录 - 群聊详情
    - 内容走共享 <GroupInfo>，与 GroupInfoCard 浮层用同一份组件
    - 通讯录里都是已加群（GroupInfo 内部按 groupStore 推导）；chat 抛上去由父级承接
  -->
  <div class="pt-12 px-6">
    <GroupInfo :group="group" @chat="emit('chat', $event)" />
  </div>
</template>

<script lang="ts" setup>
import GroupInfo from '../../components/group/GroupInfo.vue'
import type { GroupLite } from '../../types'

defineOptions({ name: 'ImContactGroupDetail' })

defineProps<{
  group: GroupLite
}>()

const emit = defineEmits<{
  chat: [group: GroupLite]
}>()
</script>

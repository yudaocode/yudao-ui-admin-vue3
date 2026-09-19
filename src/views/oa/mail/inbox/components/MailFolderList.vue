<template>
  <aside
    class="flex w-220px shrink-0 flex-col border-r border-r-solid border-[var(--el-border-color-light)] p-12px"
  >
    <MailAccountSelect
      v-model="accountId"
      :accounts="accounts"
      :disabled="syncing || composing"
      @change="emit('account-change')"
    />
    <el-button
      type="primary"
      class="mt-8px !ml-0"
      :disabled="!accountId || composing"
      @click="emit('compose')"
    >
      写信
    </el-button>
    <nav class="mt-12px min-h-0 flex-1 overflow-auto">
      <button
        v-for="folder in folders"
        :key="folder.key"
        type="button"
        class="mb-4px h-36px w-full flex shrink-0 cursor-pointer items-center justify-between gap-8px border-0 rounded px-12px py-0 text-left text-14px leading-20px hover:bg-[var(--el-fill-color-light)] disabled:cursor-not-allowed disabled:opacity-50"
        :class="{
          'bg-[var(--el-fill-color-light)] text-[var(--el-color-primary)] font-bold':
            folderKey === folder.key,
          'bg-transparent': folderKey !== folder.key
        }"
        :disabled="composing || operating"
        @click="emit('folder-change', folder.key)"
      >
        <span class="truncate" :title="folder.name">{{ folder.name }}</span>
        <span
          v-if="folder.unreadCount > 0"
          class="shrink-0 text-12px text-[var(--el-color-primary)]"
          :title="`${folder.unreadCount} 封未读邮件`"
          :aria-label="`${folder.unreadCount} 封未读邮件`"
        >
          {{ folder.unreadCount }}
        </span>
      </button>
    </nav>
    <div class="mt-auto pt-16px">
      <el-button :loading="syncing" :disabled="!accountId || composing" @click="emit('sync')">
        同步
      </el-button>
      <el-button @click="emit('settings')">账号设置</el-button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import MailAccountSelect from '../../account/components/MailAccountSelect.vue'
import type { MailAccountVO } from '@/api/oa/mail/account'
import type { MailFolderVO } from '@/api/oa/mail/folder'

defineOptions({ name: 'OaMailFolderList' })

defineProps<{
  accounts: MailAccountVO[]
  folders: MailFolderVO[]
  folderKey: string
  syncing: boolean
  composing: boolean
  operating: boolean
}>()
const accountId = defineModel<number>('accountId') // 当前账号
const emit = defineEmits<{
  'account-change': []
  'folder-change': [key: string]
  compose: []
  sync: []
  settings: []
}>()
</script>

<template>
  <section
    class="flex w-340px shrink-0 flex-col border-r border-r-solid border-[var(--el-border-color-light)]"
  >
    <div class="border-b border-b-solid border-[var(--el-border-color-light)] p-16px">
      <el-input
        v-model="keyword"
        placeholder="搜索主题/发件人"
        clearable
        @keyup.enter="emit('query')"
        @clear="emit('query')"
      >
        <template #append>
          <el-button @click="emit('query')"><Icon icon="ep:search" /> 搜索</el-button>
        </template>
      </el-input>
      <el-radio-group v-model="filter" class="mt-12px" size="small" @change="emit('query')">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="unread">未读</el-radio-button>
        <el-radio-button value="attach">有附件</el-radio-button>
      </el-radio-group>
    </div>
    <div v-loading="loading" class="min-h-0 flex-1 overflow-auto">
      <el-alert v-if="listError" :title="listError" type="error" :closable="false" />
      <el-empty v-if="!list.length && !loading" :description="emptyText" />
      <button
        v-for="mail in list"
        :key="mail.id"
        type="button"
        class="block w-full cursor-pointer border-0 border-b-1 border-b-solid border-[var(--el-border-color-light)] px-12px py-8px text-left hover:bg-[var(--el-fill-color-light)]"
        :class="{
          'bg-[var(--el-fill-color-light)]': selectedId === mail.id,
          'bg-transparent': selectedId !== mail.id
        }"
        :disabled="disabled"
        @click="emit('select', mail)"
      >
        <div class="flex items-center gap-8px">
          <span
            v-if="!mail.readStatus"
            class="h-6px w-6px shrink-0 rounded-full bg-[var(--el-color-danger)]"
            title="未读"
            aria-label="未读"
          >
          </span>
          <span class="min-w-0 flex-1 truncate" :class="{ 'font-bold': !mail.readStatus }">
            {{ mail.subject || '（无主题）' }}
          </span>
          <span class="shrink-0 text-12px text-[var(--el-text-color-secondary)]">
            {{ formatDate(mail.receiveTime, 'MM-DD HH:mm') }}
          </span>
        </div>
        <div class="mt-6px truncate text-12px text-[var(--el-text-color-secondary)]">
          {{ mail.sender }}
        </div>
        <div v-if="mail.hasAttach" class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          有附件
        </div>
      </button>
    </div>
    <div class="border-t border-t-solid border-[var(--el-border-color-light)] p-12px">
      <Pagination
        v-model:page="pageNo"
        v-model:limit="pageSize"
        :total="total"
        :pager-count="5"
        class="!float-none !my-0 flex-wrap justify-center gap-y-8px"
        @pagination="emit('page-change')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MailMessageVO } from '@/api/oa/mail/message'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaMailMessageList' })

defineProps<{
  list: MailMessageVO[]
  loading: boolean
  listError: string
  emptyText: string
  selectedId?: number
  disabled: boolean
  total: number
}>()

const keyword = defineModel<string>('keyword', { required: true }) // 搜索关键字
const filter = defineModel<string>('filter', { required: true }) // 邮件筛选
const pageSize = defineModel<number>('pageSize', { required: true }) // 每页条数
const pageNo = defineModel<number>('pageNo', { required: true }) // 当前页码
const emit = defineEmits<{
  query: []
  'page-change': []
  select: [mail: MailMessageVO]
}>()
</script>

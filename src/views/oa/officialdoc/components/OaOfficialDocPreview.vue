<template>
  <article class="mx-auto bg-white px-40px py-32px text-black">
    <h1
      class="mb-24px text-center font-bold text-red-600"
      :style="{ fontSize: (template?.fontSize || 36) + 'px' }"
    >
      {{ template?.authorityName }}
    </h1>
    <p
      class="text-center"
      v-text="
        (document.noPrefix || '') +
        (document.year ? '〔' + document.year + '〕' : '') +
        (document.sequence == null ? '' : document.sequence + '号')
      "
    ></p>
    <hr
      class="my-24px border-red-600"
      :class="
        template?.separatorType === OaOfficialDocSeparatorType.DOUBLE
          ? 'border-t-4px border-double'
          : 'border-t-1px border-solid'
      "
    />
    <h2 class="mb-24px text-center text-24px font-bold">{{ document.title }}</h2>
    <div v-dompurify-html="document.content || ''" class="min-h-280px text-18px leading-9"> </div>
    <div class="mt-24px text-right">
      <img
        v-if="template?.sealPicUrl"
        :src="template.sealPicUrl"
        alt="印章"
        class="ml-auto w-120px"
      />
      <p>{{ template?.authorityName }}</p>
      <p>{{ document.issueTime ? formatDate(document.issueTime, 'YYYY年MM月DD日') : '' }}</p>
    </div>
  </article>
</template>
<script setup lang="ts">
import type { OfficialDocSendVO } from '@/api/oa/officialdoc/send'
import type { OfficialDocTemplateVO } from '@/api/oa/officialdoc/template'
import { formatDate } from '@/utils/formatTime'
import { OaOfficialDocSeparatorType } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaOfficialDocPreview' })

defineProps<{
  document: OfficialDocSendVO
  template?: OfficialDocTemplateVO
}>()
</script>

<!-- 知识引用组件 -->
<template>
  <!-- 知识引用列表 -->
  <div v-if="segments && segments.length > 0" class="mt-10px p-10px rounded-8px bg-[#f5f5f5]">
    <div class="text-14px text-[#666] mb-8px flex items-center">
      <Icon icon="ep:document" class="mr-5px" /> 知识引用
    </div>
    <div class="flex flex-wrap gap-8px">
      <div
        v-for="(doc, index) in documentList"
        :key="index"
        class="p-8px px-12px bg-white rounded-6px cursor-pointer transition-all hover:bg-[#e6f4ff]"
        @click="handleClick(doc)"
      >
        <div class="text-14px text-[#333] mb-4px">
          {{ doc.title }}
          <span class="text-12px text-[#999] ml-4px">（{{ doc.segments.length }} 条）</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 知识引用详情弹窗 -->
  <el-popover
    v-model:visible="dialogVisible"
    :width="600"
    trigger="click"
    placement="top-start"
    :offset="55"
    popper-class="knowledge-popover"
  >
    <template #reference>
      <div ref="documentRef"></div>
    </template>
    <template #default>
      <div class="text-16px font-bold mb-12px">{{ document?.title }}</div>
      <div class="max-h-[60vh] overflow-y-auto">
        <div
          v-for="(segment, index) in document?.segments"
          :key="index"
          class="p-12px border-b-solid border-b-[#eee] last:border-b-0"
        >
          <div
            class="block mb-8px px-8px py-2px bg-[#f5f5f5] rounded-4px text-12px text-[#666] w-fit"
          >
            分段 {{ segment.id }}
          </div>
          <div class="text-14px leading-[1.6] text-[#333] mt-[10px]">
            {{ segment.content }}
          </div>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
const props = defineProps<{
  segments: {
    id: number
    documentId: number
    documentName: string
    content: string
  }[]
}>()

const document = ref<{
  id: number
  title: string
  segments: {
    id: number
    content: string
  }[]
} | null>(null) // 知识库文档列表
const dialogVisible = ref(false) // 知识引用详情弹窗
const documentRef = ref<HTMLElement>() // 知识引用详情弹窗 Ref

/** 按照 document 聚合 segments */
const documentList = computed(() => {
  if (!props.segments) return []

  const docMap = new Map()
  props.segments.forEach((segment) => {
    if (!docMap.has(segment.documentId)) {
      docMap.set(segment.documentId, {
        id: segment.documentId,
        title: segment.documentName,
        segments: []
      })
    }
    docMap.get(segment.documentId).segments.push({
      id: segment.id,
      content: segment.content
    })
  })
  return Array.from(docMap.values())
})

/** 点击 document 处理 */
const handleClick = (doc: any) => {
  document.value = doc
  dialogVisible.value = true
}
</script>

<script setup lang="ts">
const emit = defineEmits(['hideMentionModal', 'insertMention'])

const inputRef = ref()
const top = ref('')
const left = ref('')
const searchVal = ref('')
const list = ref([
  { id: 'startUser', name: '发起人' },
  { id: 'startUserDept', name: '发起人部门' },
  { id: 'processName', name: '流程名称' },
  { id: 'processNum', name: '流程编号' },
  { id: 'startTime', name: '发起时间' },
  { id: 'endTime', name: '结束时间' },
  { id: 'processStatus', name: '流程状态' },
  { id: 'printUser', name: '打印人' },
  { id: 'printTime', name: '打印时间' }
])
const searchedList = computed(() => {
  const searchValStr = searchVal.value.trim().toLowerCase()
  return list.value.filter((item) => {
    const name = item.name.toLowerCase()
    return name.indexOf(searchValStr) >= 0
  })
})
const inputKeyupHandler = (event: any) => {
  if (event.key === 'Escape') {
    emit('hideMentionModal')
  }
  if (event.key === 'Enter') {
    const firstOne = searchedList.value[0]
    if (firstOne) {
      const { id, name } = firstOne
      insertMentionHandler(id, name)
    }
  }
}
const insertMentionHandler = (id: any, name: any) => {
  emit('insertMention', id, name)
  emit('hideMentionModal')
}

const formFields = inject<any>('formFieldsObj')
onMounted(() => {
  if (formFields.value && formFields.value.length > 0) {
    const cloneFormField = formFields.value.map((item) => {
      return {
        name: '[表单]' + item.title,
        id: item.field
      }
    })
    list.value.push(...cloneFormField)
  }
  const domSelection = document.getSelection()
  const domRange = domSelection?.getRangeAt(0)
  if (domRange == null) return
  const rect = domRange.getBoundingClientRect()

  top.value = `${rect.top + 20}px`
  left.value = `${rect.left + 5}px`

  inputRef.value.focus()
})
</script>

<template>
  <div
    id="mention-modal"
    class="absolute border border-[#ccc] border-solid bg-white p-5px"
    :style="{ top: top, left: left }"
  >
    <input
      id="mention-input"
      v-model="searchVal"
      ref="inputRef"
      class="w-100px outline-none"
      @keyup="inputKeyupHandler"
    />
    <ul id="mention-list" class="m-0 p-0">
      <li
        v-for="item in searchedList"
        :key="item.id"
        class="cursor-pointer list-none py-3px text-left hover:underline"
        @click="insertMentionHandler(item.id, item.name)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

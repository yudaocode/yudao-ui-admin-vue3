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
  <div id="mention-modal" :style="{ top: top, left: left }">
    <!-- TODO @lesan：css 可以用 unocss 哇？ -->
    <input id="mention-input" v-model="searchVal" ref="inputRef" @keyup="inputKeyupHandler" />
    <ul id="mention-list">
      <li
        v-for="item in searchedList"
        :key="item.id"
        @click="insertMentionHandler(item.id, item.name)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<style>
#mention-modal {
  position: absolute;
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 5px;
}

#mention-modal input {
  width: 100px;
  outline: none;
}

#mention-modal ul {
  padding: 0;
  margin: 0;
}

#mention-modal ul li {
  list-style: none;
  cursor: pointer;
  padding: 3px 0;
  text-align: left;
}

#mention-modal ul li:hover {
  text-decoration: underline;
}
</style>

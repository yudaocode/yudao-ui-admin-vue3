<template>
  <div>
    <el-form-item label="执行方式" key="executeType">
      <el-select v-model="serviceTaskForm.executeType" @change="handleExecuteTypeChange">
        <el-option label="Java类" value="class" />
        <el-option label="表达式" value="expression" />
        <el-option label="代理表达式" value="delegateExpression" />
        <el-option label="HTTP 调用" value="http" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'class'"
      label="Java类"
      prop="class"
      key="execute-class"
    >
      <el-input v-model="serviceTaskForm.class" clearable @change="updateElementTask" />
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'expression'"
      label="表达式"
      prop="expression"
      key="execute-expression"
    >
      <el-input v-model="serviceTaskForm.expression" clearable @change="updateElementTask" />
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'delegateExpression'"
      label="代理表达式"
      prop="delegateExpression"
      key="execute-delegate"
    >
      <el-input v-model="serviceTaskForm.delegateExpression" clearable @change="updateElementTask" />
    </el-form-item>
    <template v-if="serviceTaskForm.executeType === 'http'">
      <el-form-item label="请求方法" key="http-method">
        <el-select v-model="httpTaskForm.requestMethod">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
          <el-option label="HEAD" value="HEAD" />
          <el-option label="OPTIONS" value="OPTIONS" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求地址" key="http-url" prop="requestUrl">
        <el-input v-model="httpTaskForm.requestUrl" clearable />
      </el-form-item>
      <el-form-item label="请求头" key="http-headers">
        <el-input
          v-model="httpTaskForm.requestHeaders"
          type="textarea"
          resize="vertical"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
        />
      </el-form-item>
      <!--      <el-form-item label="禁止重定向" key="http-disallow-redirects">-->
      <!--        <el-switch v-model="httpTaskForm.disallowRedirects" />-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="忽略异常" key="http-ignore-exception">-->
      <!--        <el-switch v-model="httpTaskForm.ignoreException" />-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="瞬态保存响应参数" key="http-save-transient">-->
      <!--        <el-switch v-model="httpTaskForm.saveResponseParametersTransient" />-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="JSON 保存响应变量" key="http-save-json">-->
      <!--        <el-switch v-model="httpTaskForm.saveResponseVariableAsJson" />-->
      <!--      </el-form-item>-->
    </template>
  </div>
</template>

<script lang="ts" setup>
import { updateElementExtensions } from '@/components/bpmnProcessDesigner/package/utils'
defineOptions({ name: 'ServiceTask' })
const props = defineProps({
  id: String,
  type: String
})

const prefix = (inject('prefix', 'flowable') || 'flowable') as string
const flowableTypeKey = `${prefix}:type`
const flowableFieldType = `${prefix}:Field`

const HTTP_FIELD_NAMES = [
  'requestMethod',
  'requestUrl',
  'requestHeaders',
  'disallowRedirects',
  'ignoreException',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson'
]
const HTTP_BOOLEAN_FIELDS = new Set([
  'disallowRedirects',
  'ignoreException',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson'
])

const DEFAULT_TASK_FORM = {
  executeType: '',
  class: '',
  expression: '',
  delegateExpression: ''
}

const DEFAULT_HTTP_FORM = {
  requestMethod: 'GET',
  requestUrl: '',
  requestHeaders: 'Content-Type: application/json',
  disallowRedirects: false,
  ignoreException: false,
  saveResponseParametersTransient: false,
  saveResponseVariableAsJson: false
}

const serviceTaskForm = ref({ ...DEFAULT_TASK_FORM })
const httpTaskForm = ref({ ...DEFAULT_HTTP_FORM })
const bpmnElement = ref()
const httpInitializing = ref(false)

const bpmnInstances = () => (window as any)?.bpmnInstances

const collectHttpExtensionInfo = () => {
  const businessObject = bpmnElement.value?.businessObject
  const extensionElements = businessObject?.extensionElements
  const httpFields = new Map<string, string>()
  const otherExtensions: any[] = []

  extensionElements?.values?.forEach((item: any) => {
    if (item?.$type === flowableFieldType && HTTP_FIELD_NAMES.includes(item.name)) {
      const value = item.string ?? item.stringValue ?? item.expression ?? ''
      httpFields.set(item.name, value)
    } else {
      otherExtensions.push(item)
    }
  })

  return { httpFields, otherExtensions }
}

const resetHttpDefaults = () => {
  httpInitializing.value = true
  httpTaskForm.value = { ...DEFAULT_HTTP_FORM }
  nextTick(() => {
    httpInitializing.value = false
  })
}

const resetHttpForm = () => {
  httpInitializing.value = true
  const { httpFields } = collectHttpExtensionInfo()
  const nextForm: Record<string, any> = { ...DEFAULT_HTTP_FORM }

  HTTP_FIELD_NAMES.forEach((name) => {
    const stored = httpFields.get(name)
    if (stored !== undefined) {
      nextForm[name] = HTTP_BOOLEAN_FIELDS.has(name) ? stored === 'true' : stored
    }
  })

  httpTaskForm.value = nextForm
  nextTick(() => {
    httpInitializing.value = false
    updateHttpExtensions(true)
  })
}

const resetServiceTaskForm = () => {
  const businessObject = bpmnElement.value?.businessObject
  const nextForm: Record<string, any> = { ...DEFAULT_TASK_FORM }

  if (businessObject) {
    if (businessObject.class) {
      nextForm.class = businessObject.class
      nextForm.executeType = 'class'
    }
    if (businessObject.expression) {
      nextForm.expression = businessObject.expression
      nextForm.executeType = 'expression'
    }
    if (businessObject.delegateExpression) {
      nextForm.delegateExpression = businessObject.delegateExpression
      nextForm.executeType = 'delegateExpression'
    }
    if (businessObject.$attrs?.[flowableTypeKey] === 'http') {
      nextForm.executeType = 'http'
    }
  }

  serviceTaskForm.value = nextForm

  if (nextForm.executeType === 'http') {
    resetHttpForm()
  } else {
    resetHttpDefaults()
  }
}

const shouldPersistField = (name: string, value: any) => {
  if (HTTP_BOOLEAN_FIELDS.has(name)) return true
  if (name === 'requestMethod') return true
  if (name === 'requestUrl') return !!value
  return value !== undefined && value !== ''
}

const updateHttpExtensions = (force = false) => {
  if (!bpmnElement.value) return
  if (!force && (httpInitializing.value || serviceTaskForm.value.executeType !== 'http')) {
    return
  }

  const { httpFields: existingFields, otherExtensions } = collectHttpExtensionInfo()

  const desiredEntries: [string, string][] = []
  HTTP_FIELD_NAMES.forEach((name) => {
    const rawValue = httpTaskForm.value[name]
    if (!shouldPersistField(name, rawValue)) {
      return
    }

    const persisted = HTTP_BOOLEAN_FIELDS.has(name)
      ? String(!!rawValue)
      : rawValue === undefined
        ? ''
        : String(rawValue)

    desiredEntries.push([name, persisted])
  })

  if (
    !force &&
    desiredEntries.length === existingFields.size &&
    desiredEntries.every(([name, value]) => existingFields.get(name) === value)
  ) {
    return
  }

  const moddle = bpmnInstances().moddle
  const httpFieldElements = desiredEntries.map(([name, value]) =>
    moddle.create(flowableFieldType, {
      name,
      string: value
    })
  )

  updateElementExtensions(bpmnElement.value, [...otherExtensions, ...httpFieldElements])
}

const removeHttpExtensions = () => {
  if (!bpmnElement.value) return
  const { httpFields, otherExtensions } = collectHttpExtensionInfo()
  if (!httpFields.size) {
    return
  }

  if (!otherExtensions.length) {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      extensionElements: null
    })
    return
  }

  updateElementExtensions(bpmnElement.value, otherExtensions)
}

const updateElementTask = () => {
  if (!bpmnElement.value) return

  const taskAttr: Record<string, any> = {
    class: null,
    expression: null,
    delegateExpression: null,
    [flowableTypeKey]: null
  }

  const type = serviceTaskForm.value.executeType
  if (type === 'class' || type === 'expression' || type === 'delegateExpression') {
    taskAttr[type] = serviceTaskForm.value[type] || null
  } else if (type === 'http') {
    taskAttr[flowableTypeKey] = 'http'
  }

  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), taskAttr)

  if (type === 'http') {
    updateHttpExtensions(true)
  } else {
    removeHttpExtensions()
  }
}

const handleExecuteTypeChange = (value: string) => {
  serviceTaskForm.value.executeType = value
  if (value === 'http') {
    resetHttpForm()
  }
  updateElementTask()
}

onBeforeUnmount(() => {
  bpmnElement.value = null
})

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    nextTick(() => {
      resetServiceTaskForm()
    })
  },
  { immediate: true }
)

watch(
  () => httpTaskForm.value,
  () => {
    updateHttpExtensions()
  },
  { deep: true }
)
</script>

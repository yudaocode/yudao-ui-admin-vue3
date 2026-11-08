<script setup lang="ts">
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as AreaApi from '@/api/system/area'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import {
  DICT_TYPE,
  getBoolDictOptions,
  getDictLabel,
  getDictOptions,
  getIntDictOptions,
  getStrDictOptions
} from '@/utils/dict'
import { decodeFields } from '@/utils/formCreate'
import { collectFieldRules, isSubForm, parseSubFormFields } from '@/components/FormCreate/src/utils'
import { getApiSelectOptions } from '@/components/FormCreate/src/components/useApiSelect'
import { FieldPermissionType } from '@/components/SimpleProcessDesignerV2/src/consts'
import {
  getSubFieldPermission,
  getSubFieldPermissionField
} from '@/components/SimpleProcessDesignerV2/src/utils'
import { registerComponent } from '@/utils/routerHelper'

interface FormFieldItem {
  html: string
  id: string
  name: string
}

interface FormFieldOption {
  label?: string
  value?: unknown
}

type FormFieldRule = Record<string, unknown> & {
  field?: string
  options?: FormFieldOption[]
  props?: Record<string, unknown>
  title?: string
  type?: string
}

type PrintableRecord = Record<string, unknown>

interface AreaNode {
  children?: AreaNode[]
  id?: number
  name: string
}

interface PrintLookupMaps {
  apiSelectOptionsMap: Map<string, FormFieldOption[]>
  areaMap: Map<string, string>
  deptMap: Map<string, string>
  userMap: Map<string, string>
}

const userStore = useUserStore()

const visible = ref(false)
const loading = ref(false)

const printData = ref()
const userName = computed(() => userStore.user.nickname ?? '')
const printTime = ref(formatDate(new Date(), 'YYYY-MM-DD HH:mm'))
const formFields = ref<FormFieldItem[]>([])
const printDataMap = ref<Record<string, string>>({})
const fieldsPermission = ref<Record<string, string>>() // 表单字段权限，沿用审批详情的计算结果
const BusinessFormComponent = shallowRef<any>()

const open = async (id: string, formFieldsPermission?: Record<string, string>) => {
  loading.value = true
  fieldsPermission.value = formFieldsPermission
  try {
    printData.value = await ProcessInstanceApi.getProcessInstancePrintData(id)
    printTime.value = formatDate(new Date(), 'YYYY-MM-DD HH:mm')
    initPrintDataMap()
    await parseFormFields()
    initBusinessFormComponent()
  } finally {
    loading.value = false
  }
  visible.value = true
}
defineExpose({ open })

const initBusinessFormComponent = () => {
  const businessFormPath =
    printData.value?.processInstance?.processDefinition?.formCustomViewPath || ''
  BusinessFormComponent.value = businessFormPath ? registerComponent(businessFormPath) : undefined
}

const parseFormFields = async () => {
  if (!printData.value) return

  const formFieldsObj = decodeFields(
    printData.value.processInstance.processDefinition?.formFields || []
  ) as FormFieldRule[]
  // 布局组件（栅格、卡片等）中的字段，同样需要打印
  const fieldRules = collectFieldRules(formFieldsObj) as FormFieldRule[]
  const processVariables = printData.value.processInstance.formVariables ?? {}
  // 子表单的子字段，也需要加载用户、部门、地区等名称
  const lookupMaps = await loadPrintLookupMaps(
    fieldRules.flatMap((item) =>
      isSubForm(item) ? [item, ...parseSubFormFields(item).map((field) => field.rule)] : [item]
    )
  )
  const res: FormFieldItem[] = []

  for (const item of fieldRules) {
    const fieldKey = String(item.field ?? '')
    // 隐藏的字段不打印；子表单的子字段都隐藏时，与审批页一致，整个子表单不打印
    if (
      fieldsPermission.value?.[fieldKey] === FieldPermissionType.NONE ||
      isSubFormFieldsHidden(item)
    ) {
      printDataMap.value[fieldKey] = ''
      continue
    }
    const id = fieldKey
    const name = String(item.title ?? fieldKey)
    const variable = processVariables[fieldKey]
    const html = isSubForm(item)
      ? formatSubFormField(item, variable, lookupMaps)
      : formatPrintField(item, variable, lookupMaps)

    printDataMap.value[fieldKey] = html
    res.push({ id, name, html })
  }
  formFields.value = res
}

const getRuleProp = (rule: FormFieldRule, key: string) => {
  return rule?.[key] ?? rule?.props?.[key]
}

const isPrintableRecord = (value: unknown): value is PrintableRecord => {
  return typeof value === 'object' && value !== null
}

const getRecordValue = (record: PrintableRecord, key: string) => {
  return record[key]
}

const isNotEmptyString = (value: string) => value.length > 0

const isEmptyValue = (value: unknown) => value === undefined || value === null || value === ''

const toValueArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
  }
  if (isEmptyValue(value)) {
    return []
  }
  return [value]
}

const escapeHtml = (value: unknown) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const tryFormatDate = (value: unknown) => {
  if (isEmptyValue(value)) {
    return ''
  }
  const formatted = formatDate(value as Date | number | string)
  return formatted === 'Invalid Date' ? escapeHtml(value) : formatted
}

const formatDateValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => tryFormatDate(item)).join(' ~ ')
  }
  return tryFormatDate(value)
}

const formatPrimitiveValue = (value: unknown): string => {
  if (isEmptyValue(value)) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatPrimitiveValue(item))
      .filter((s) => isNotEmptyString(s))
      .join(', ')
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (isPrintableRecord(value)) {
    const displayValue =
      getRecordValue(value, 'label') ??
      getRecordValue(value, 'name') ??
      getRecordValue(value, 'url') ??
      getRecordValue(value, 'value') ??
      JSON.stringify(value)
    return escapeHtml(displayValue)
  }
  return escapeHtml(value)
}

const createImageHtml = (url: string) => {
  const imgEl = document.createElement('img')
  imgEl.setAttribute('src', url)
  imgEl.setAttribute('style', 'max-width: 600px; max-height: 300px;')
  return imgEl.outerHTML
}

const renderImageListHtml = (value: unknown) => {
  return toValueArray(value)
    .map((item) => {
      let url: string | undefined
      if (typeof item === 'string') {
        url = item
      } else if (isPrintableRecord(item)) {
        const recordUrl = getRecordValue(item, 'url')
        url = recordUrl ? String(recordUrl) : undefined
      }
      return url ? createImageHtml(url) : ''
    })
    .filter((s) => isNotEmptyString(s))
    .join('<br/>')
}

const createFileLinkHtml = (file: unknown) => {
  const record = isPrintableRecord(file) ? file : undefined
  const recordUrl = record ? getRecordValue(record, 'url') : undefined
  const url = typeof file === 'string' ? file : String(recordUrl ?? '')
  if (!url) {
    return ''
  }
  const linkEl = document.createElement('a')
  linkEl.setAttribute('href', url)
  linkEl.setAttribute('target', '_blank')
  linkEl.setAttribute('rel', 'noopener noreferrer')
  const fallbackName = url.slice(Math.max(0, url.lastIndexOf('/') + 1)) || url
  const recordName = record ? getRecordValue(record, 'name') : undefined
  linkEl.textContent = recordName ? String(recordName) : fallbackName
  return linkEl.outerHTML
}

const renderFileListHtml = (value: unknown) => {
  return toValueArray(value)
    .map((item) => createFileLinkHtml(item))
    .filter((s) => isNotEmptyString(s))
    .join('<br/>')
}

const mapValuesWithOptions = (value: unknown, options: FormFieldOption[] = []) => {
  const values = toValueArray(value)
  const labels = values
    .map((item) => {
      const matched = options.find(
        (option) => option?.value === item || String(option?.value ?? '') === String(item)
      )
      return escapeHtml(matched?.label ?? String(item))
    })
    .filter((s) => isNotEmptyString(s))
  return labels.join(', ')
}

const flattenAreaTree = (list: AreaNode[] = [], map: Map<string, string> = new Map()) => {
  list.forEach((item) => {
    if (item.id !== undefined) {
      map.set(String(item.id), item.name)
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenAreaTree(item.children, map)
    }
  })
  return map
}

const mapValueWithLabelMap = (value: unknown, labelMap: Map<string, string>, separator = ', ') => {
  const values = toValueArray(value)
  const labels = values
    .map((item) => escapeHtml(labelMap.get(String(item)) ?? String(item)))
    .filter((s) => isNotEmptyString(s))
  return labels.length > 0 ? labels.join(escapeHtml(separator)) : formatPrimitiveValue(values)
}

const getTypedDictOptions = (dictType: string, valueType: string) => {
  switch (valueType) {
    case 'bool':
    case 'boolean':
      return getBoolDictOptions(dictType)
    case 'int':
    case 'number':
      return getIntDictOptions(dictType)
    case 'str':
    case 'string':
      return getStrDictOptions(dictType)
    default:
      return getDictOptions(dictType)
  }
}

const loadPrintLookupMaps = async (formFieldsObj: FormFieldRule[]) => {
  const hasAreaSelect = formFieldsObj.some((item) => item.type === 'AreaSelect')
  const hasUserSelect = formFieldsObj.some((item) => item.type === 'UserSelect')
  const hasDeptSelect = formFieldsObj.some((item) => item.type === 'DeptSelect')

  const [areaList, userList, deptList] = await Promise.all([
    hasAreaSelect ? AreaApi.getAreaTree() : Promise.resolve([]),
    hasUserSelect ? UserApi.getSimpleUserList() : Promise.resolve([]),
    hasDeptSelect ? DeptApi.getSimpleDeptList() : Promise.resolve([])
  ])

  // 接口选择器：按组件配置请求选项，用于打印选项名称；请求失败时，打印原值
  const apiSelectOptionsMap = new Map<string, FormFieldOption[]>()
  await Promise.all(
    formFieldsObj
      .filter((item) => item.type === 'ApiSelect' && getRuleProp(item, 'returnType') !== 'name')
      .map(async (item) => {
        const key = getApiSelectKey(item)
        if (apiSelectOptionsMap.has(key)) {
          return
        }
        apiSelectOptionsMap.set(key, [])
        try {
          apiSelectOptionsMap.set(key, (await getApiSelectOptions(getApiSelectProps(item))) ?? [])
        } catch (e) {
          console.warn(`[loadPrintLookupMaps][接口选择器(${item.field}) 加载选项失败]`, e)
        }
      })
  )

  return {
    apiSelectOptionsMap,
    areaMap: flattenAreaTree(areaList as AreaNode[]),
    deptMap: new Map((deptList ?? []).map((item) => [String(item.id), item.name] as const)),
    userMap: new Map(
      (userList ?? []).map((item) => [String(item.id), item.nickname ?? item.username] as const)
    )
  } satisfies PrintLookupMaps
}

/** 接口选择器的配置：未设置的属性，使用组件的默认值 */
const getApiSelectProps = (rule: FormFieldRule): Record<string, any> => {
  return {
    method: 'GET',
    labelField: 'label',
    valueField: 'value',
    remoteField: 'label',
    ...rule.props
  }
}

/** 接口选择器的选项缓存 key：相同配置的接口选择器，只请求一次 */
const getApiSelectKey = (rule: FormFieldRule) => {
  return JSON.stringify(getApiSelectProps(rule))
}

const formatPrintField = (rule: FormFieldRule, value: unknown, lookupMaps: PrintLookupMaps) => {
  const type = String(rule.type ?? '')

  switch (type) {
    case 'ApiSelect':
      // 未匹配到选项时（例如远程搜索、分页接口未返回该值），打印原值
      return mapValuesWithOptions(value, lookupMaps.apiSelectOptionsMap.get(getApiSelectKey(rule)))
    case 'AreaSelect': {
      const separator = String(getRuleProp(rule, 'separator') || '/')
      return mapValueWithLabelMap(value, lookupMaps.areaMap, separator)
    }
    case 'cascader':
    case 'checkbox':
    case 'radio':
    case 'select':
    case 'treeSelect': {
      const options = getRuleProp(rule, 'options')
      return Array.isArray(options) && options.length > 0
        ? mapValuesWithOptions(value, options as FormFieldOption[])
        : formatPrimitiveValue(value)
    }
    case 'date':
    case 'DatePicker':
    case 'datePicker':
    case 'daterange':
    case 'datetime':
    case 'datetimerange':
    case 'month':
    case 'monthrange':
    case 'RangePicker':
    case 'rangePicker':
    case 'TimePicker':
    case 'timePicker':
    case 'TimeRangePicker':
    case 'timeRangePicker':
      return formatDateValue(value)
    case 'DeptSelect': {
      if (String(getRuleProp(rule, 'returnType')) === 'name') {
        return formatPrimitiveValue(value)
      }
      return mapValueWithLabelMap(value, lookupMaps.deptMap)
    }
    case 'DictSelect': {
      const dictType = getRuleProp(rule, 'dictType')
      if (typeof dictType !== 'string' || !dictType) {
        return formatPrimitiveValue(value)
      }
      const valueType = String(getRuleProp(rule, 'valueType') ?? '')
      return mapValuesWithOptions(value, getTypedDictOptions(dictType, valueType))
    }
    case 'FileUpload':
    case 'UploadFile':
      return renderFileListHtml(value)
    case 'IframeComponent': {
      const propsObj = rule.props
      const propsUrl = isPrintableRecord(propsObj)
        ? String(getRecordValue(propsObj, 'url') ?? '')
        : ''
      const iframeUrl = isEmptyValue(value) ? propsUrl : String(value ?? '')
      return iframeUrl ? createFileLinkHtml(iframeUrl) : ''
    }
    case 'ImagesUpload':
    case 'ImageUpload':
    case 'UploadImg':
    case 'UploadImgs':
      return renderImageListHtml(value)
    case 'switch': {
      if (isEmptyValue(value)) return '否'
      const checkedVal = getRuleProp(rule, 'checkedValue') ?? getRuleProp(rule, 'activeValue')
      const isChecked =
        checkedVal !== undefined && checkedVal !== null ? value === checkedVal : Boolean(value)
      return isChecked ? '是' : '否'
    }
    case 'Editor':
    case 'Tinymce':
      return isEmptyValue(value) ? '' : String(value)
    case 'UserSelect': {
      if (String(getRuleProp(rule, 'returnType')) === 'name') {
        return formatPrimitiveValue(value)
      }
      return mapValueWithLabelMap(value, lookupMaps.userMap)
    }
    default:
      return formatPrimitiveValue(value)
  }
}

/** 获得子表单可打印的子字段：隐藏的子字段不打印 */
const getPrintSubFormFields = (rule: FormFieldRule) => {
  const subFormField = String(rule.field ?? '')
  return parseSubFormFields(rule).filter(
    (item) =>
      getSubFieldPermission(
        fieldsPermission.value?.[subFormField],
        fieldsPermission.value?.[getSubFieldPermissionField(subFormField, item.field)]
      ) !== FieldPermissionType.NONE
  )
}

/** 子表单的子字段，是否都已隐藏 */
const isSubFormFieldsHidden = (rule: FormFieldRule) => {
  return (
    isSubForm(rule) &&
    parseSubFormFields(rule).length > 0 &&
    getPrintSubFormFields(rule).length === 0
  )
}

/** 子表单（表格表单、子表单）：按子字段权限打印成表格，隐藏的子字段不打印 */
const formatSubFormField = (rule: FormFieldRule, value: unknown, lookupMaps: PrintLookupMaps) => {
  const columns = getPrintSubFormFields(rule)
  const rows = toValueArray(value).filter(isPrintableRecord)
  if (columns.length === 0 || rows.length === 0) {
    return ''
  }
  const tableEl = document.createElement('table')
  tableEl.setAttribute('border', '1')
  tableEl.setAttribute('style', 'width:100%;border-collapse:collapse;')
  const headTr = document.createElement('tr')
  columns.forEach((column) => {
    const th = document.createElement('th')
    th.setAttribute('style', 'padding:5px;')
    th.textContent = column.title
    headTr.appendChild(th)
  })
  tableEl.appendChild(headTr)
  rows.forEach((row) => {
    const tr = document.createElement('tr')
    columns.forEach((column) => {
      const td = document.createElement('td')
      td.setAttribute('style', 'padding:5px;')
      td.innerHTML = formatPrintField(column.rule, row[column.field], lookupMaps)
      tr.appendChild(td)
    })
    tableEl.appendChild(tr)
  })
  return tableEl.outerHTML
}

const initPrintDataMap = () => {
  if (!printData.value) return

  printDataMap.value['startUser'] = printData.value.processInstance.startUser?.nickname || ''
  printDataMap.value['startUserDept'] = printData.value.processInstance.startUser?.deptName || ''
  printDataMap.value['processName'] = printData.value.processInstance.name
  printDataMap.value['processNum'] = String(printData.value.processInstance.id ?? '')
  printDataMap.value['startTime'] = formatDate(printData.value.processInstance.startTime)
  printDataMap.value['endTime'] = formatDate(printData.value.processInstance.endTime)
  printDataMap.value['processStatus'] = String(
    getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, printData.value.processInstance.status) ??
      ''
  )
  printDataMap.value['printUser'] = userName.value
  printDataMap.value['printTime'] = printTime.value
}

const getPrintTemplateHTML = () => {
  if (!printData.value?.printTemplateHtml) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(printData.value.printTemplateHtml, 'text/html')
  // table 添加border
  const tables = doc.querySelectorAll('table')
  tables.forEach((item) => {
    item.setAttribute('border', '1')
    item.setAttribute('style', (item.getAttribute('style') || '') + 'border-collapse:collapse;')
  })
  // 替换 mentions
  const mentions = doc.querySelectorAll('[data-w-e-type="mention"]')
  mentions.forEach((item) => {
    const mentionId = JSON.parse(decodeURIComponent(item.getAttribute('data-info') ?? ''))['id']
    item.innerHTML = printDataMap.value[mentionId] ?? ''
  })
  // 替换流程记录
  const processRecords = doc.querySelectorAll('[data-w-e-type="process-record"]')
  const processRecordTable: Element = document.createElement('table')
  if (processRecords.length > 0) {
    // 构建流程记录html
    processRecordTable.setAttribute('border', '1')
    processRecordTable.setAttribute('style', 'width:100%;border-collapse:collapse;')
    const headTr = document.createElement('tr')
    const headTd = document.createElement('td')
    headTd.setAttribute('colspan', '2')
    headTd.setAttribute('width', 'auto')
    headTd.setAttribute('style', 'text-align: center;')
    headTd.textContent = '流程节点'
    headTr.appendChild(headTd)
    processRecordTable.appendChild(headTr)
    printData.value.tasks.forEach((item) => {
      const tr = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = item.name
      const td2 = document.createElement('td')
      td2.textContent = item.description
      tr.appendChild(td1)
      tr.appendChild(td2)
      processRecordTable.appendChild(tr)
    })
  }
  processRecords.forEach((item) => {
    item.innerHTML = processRecordTable.outerHTML
  })
  // 返回 html
  return doc.body.innerHTML
}

const printObj = ref({
  id: 'printDivTag',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})
</script>

<template>
  <el-dialog v-loading="loading" v-model="visible" :show-close="false">
    <div id="printDivTag" style="word-break: break-all">
      <div v-if="printData.printTemplateEnable" v-html="getPrintTemplateHTML()"></div>
      <div v-else>
        <h2 class="text-center">{{ printData.processInstance.name }}</h2>
        <div class="text-right text-15px">{{ '打印人员: ' + userName }}</div>
        <div class="flex justify-between">
          <div class="text-15px">{{ '流程编号: ' + printData.processInstance.id }}</div>
          <div class="text-15px">{{ '打印时间: ' + printTime }}</div>
        </div>
        <table class="mt-20px w-100%" border="1" style="border-collapse: collapse">
          <tbody>
            <tr>
              <td class="p-5px w-25%">发起人</td>
              <td class="p-5px w-25%">{{ printData.processInstance.startUser.nickname }}</td>
              <td class="p-5px w-25%">发起时间</td>
              <td class="p-5px w-25%">{{ formatDate(printData.processInstance.startTime) }}</td>
            </tr>
            <tr>
              <td class="p-5px w-25%">所属部门</td>
              <td class="p-5px w-25%">{{ printData.processInstance.startUser.deptName }}</td>
              <td class="p-5px w-25%">流程状态</td>
              <td class="p-5px w-25%">
                {{
                  getDictLabel(
                    DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
                    printData.processInstance.status
                  )
                }}
              </td>
            </tr>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>表单内容</h4>
              </td>
            </tr>
            <tr v-for="item in formFields" :key="item.id">
              <td class="p-5px w-20%">
                {{ item.name }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                <div v-html="item.html"></div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 业务表单：独立成块渲染，不嵌入表格单元格，避免宽度与分页受限 -->
        <div v-if="BusinessFormComponent && formFields.length === 0" class="mt-20px">
          <component
            :is="BusinessFormComponent"
            :id="printData.processInstance.businessKey"
            :readonly="true"
            :print-mode="true"
          />
        </div>
        <table class="mt-20px w-100%" border="1" style="border-collapse: collapse">
          <tbody>
            <tr>
              <td class="p-5px w-100% text-center" colspan="4">
                <h4>流程节点</h4>
              </td>
            </tr>
            <tr v-for="item in printData.tasks" :key="item.id">
              <td class="p-5px w-20%">
                {{ item.name }}
              </td>
              <td class="p-5px w-80%" colspan="3">
                {{ item.description }}
                <div v-if="item.signPicUrl && item.signPicUrl.length > 0">
                  <img class="w-90px h-40px" :src="item.signPicUrl" alt="" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" v-print="printObj"> 打 印</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style>
/* 修复打印只显示一页 */
@media print {
  @page {
    size: auto;
  }

  body,
  html,
  div {
    height: auto !important;
  }
}
</style>

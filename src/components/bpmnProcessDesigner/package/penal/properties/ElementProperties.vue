<template>
  <div class="panel-tab__content">
    <el-table :data="elementPropertyList" max-height="240" fit border>
      <el-table-column label="序号" width="50px" type="index" />
      <el-table-column label="属性名" prop="name" min-width="100px" show-overflow-tooltip />
      <el-table-column label="属性值" prop="value" min-width="100px" show-overflow-tooltip />
      <el-table-column label="操作" width="110px">
        <template #default="scope">
          <el-button link @click="openAttributesForm(scope.row, scope.$index)" size="small">
            编辑
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            link
            size="small"
            style="color: #ff4d4f"
            @click="removeAttributes(scope.row, scope.$index)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button">
      <XButton
        type="primary"
        preIcon="ep:plus"
        title="添加属性"
        @click="openAttributesForm(null, -1)"
      />
    </div>

    <el-dialog
      v-model="propertyFormModelVisible"
      title="属性配置"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="propertyForm" label-width="80px" ref="attributeFormRef">
        <el-form-item label="属性名：" prop="name">
          <el-input v-model="propertyForm.name" clearable />
        </el-form-item>
        <el-form-item label="属性值：" prop="value">
          <el-input v-model="propertyForm.value" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="propertyFormModelVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveAttribute">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
defineOptions({ name: 'ElementProperties' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')
// const width = inject('width')

const elementPropertyList = ref<any[]>([])
const propertyForm = ref<any>({})
const editingPropertyIndex = ref(-1)
const propertyFormModelVisible = ref(false)
const otherExtensionList = ref()
const bpmnElementProperties = ref()
const bpmnElementPropertyList = ref()
const attributeFormRef = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const resetAttributesList = () => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement
  const businessObject = bpmnElement.businessObject

  otherExtensionList.value = [] // 其他扩展配置
  bpmnElementProperties.value =
    businessObject?.extensionElements?.values?.filter((ex) => {
      if (ex.$type !== `${prefix}:Properties`) {
        otherExtensionList.value.push(ex)
      }
      return ex.$type === `${prefix}:Properties`
    }) ?? []

  // 保存所有的 扩展属性字段
  bpmnElementPropertyList.value = bpmnElementProperties.value.reduce(
    (pre, current) => pre.concat(current.values),
    []
  )
  // 复制 显示
  elementPropertyList.value = JSON.parse(JSON.stringify(bpmnElementPropertyList.value ?? []))
}
const openAttributesForm = (attr, index) => {
  editingPropertyIndex.value = index
  propertyForm.value = index === -1 ? {} : JSON.parse(JSON.stringify(attr))
  propertyFormModelVisible.value = true
  nextTick(() => {
    if (attributeFormRef.value) attributeFormRef.value.clearValidate()
  })
}
const removeAttributes = (attr, index) => {
  console.log(attr, 'attr')
  ElMessageBox.confirm('确认移除该属性吗？', '提示', {
    confirmButtonText: '确 认',
    cancelButtonText: '取 消'
  })
    .then(() => {
      elementPropertyList.value.splice(index, 1)
      bpmnElementPropertyList.value.splice(index, 1)
      // 新建一个属性字段的保存列表
      const propertiesObject = bpmnInstances().moddle.create(`${prefix}:Properties`, {
        values: bpmnElementPropertyList.value
      })
      updateElementExtensions(propertiesObject)
      resetAttributesList()
    })
    .catch(() => console.info('操作取消'))
}
const saveAttribute = () => {
  console.log(propertyForm.value, 'propertyForm.value')
  const { name, value } = propertyForm.value
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  const bpmnElement = instances.bpmnElement

  if (editingPropertyIndex.value !== -1) {
    instances.modeling.updateModdleProperties(
      bpmnElement,
      bpmnElementPropertyList.value[editingPropertyIndex.value],
      {
        name,
        value
      }
    )
  } else {
    // 新建属性字段
    const newPropertyObject = instances.moddle.create(`${prefix}:Property`, {
      name,
      value
    })
    // 新建一个属性字段的保存列表
    const propertiesObject = instances.moddle.create(`${prefix}:Properties`, {
      values: bpmnElementPropertyList.value.concat([newPropertyObject])
    })
    updateElementExtensions(propertiesObject)
  }
  propertyFormModelVisible.value = false
  resetAttributesList()
}
const updateElementExtensions = (properties) => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement) return

  const bpmnElement = instances.bpmnElement
  const extensions = instances.moddle.create('bpmn:ExtensionElements', {
    values: otherExtensionList.value.concat([properties])
  })
  instances.modeling.updateProperties(bpmnElement, {
    extensionElements: extensions
  })
}

watch(
  () => props.id,
  (val) => {
    if (val) {
      val && val.length && resetAttributesList()
    }
  },
  { immediate: true }
)
</script>

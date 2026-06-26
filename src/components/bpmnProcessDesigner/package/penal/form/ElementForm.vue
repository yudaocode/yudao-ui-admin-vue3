<template>
  <div class="panel-tab__content">
    <el-form label-width="80px">
      <el-form-item label="流程表单">
        <!--        <el-input v-model="formKey" clearable @change="updateElementFormKey" />-->
        <el-select v-model="formKey" clearable @change="updateElementFormKey">
          <el-option v-for="form in formList" :key="form.id" :label="form.name" :value="form.id" />
        </el-select>
      </el-form-item>
      <!--      <el-form-item label="业务标识">-->
      <!--        <el-select v-model="businessKey" @change="updateElementBusinessKey">-->
      <!--          <el-option v-for="i in fieldList" :key="i.id" :value="i.id" :label="i.label" />-->
      <!--          <el-option label="无" value="" />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
    </el-form>

    <!--字段列表-->
    <!--    <div class="element-property list-property">-->
    <!--      <el-divider><Icon icon="ep:coin" /> 表单字段</el-divider>-->
    <!--      <el-table :data="fieldList" max-height="240" fit border>-->
    <!--        <el-table-column label="序号" type="index" width="50px" />-->
    <!--        <el-table-column label="字段名称" prop="label" min-width="80px" show-overflow-tooltip />-->
    <!--        <el-table-column-->
    <!--          label="字段类型"-->
    <!--          prop="type"-->
    <!--          min-width="80px"-->
    <!--          :formatter="(row) => fieldType[row.type] || row.type"-->
    <!--          show-overflow-tooltip-->
    <!--        />-->
    <!--        <el-table-column-->
    <!--          label="默认值"-->
    <!--          prop="defaultValue"-->
    <!--          min-width="80px"-->
    <!--          show-overflow-tooltip-->
    <!--        />-->
    <!--        <el-table-column label="操作" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button type="primary" link @click="openFieldForm(scope, scope.$index)"-->
    <!--              >编辑</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeField(scope, scope.$index)"-->
    <!--              >移除</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->
    <!--    </div>-->
    <!--    <div class="element-drawer__button">-->
    <!--      <el-button type="primary" proIcon="ep:plus" @click="openFieldForm(null, -1)">添加字段</el-button>-->
    <!--    </div>-->

    <!--字段配置侧边栏-->
    <!--    <el-drawer-->
    <!--      v-model="fieldModelVisible"-->
    <!--      title="字段配置"-->
    <!--      :size="`${width}px`"-->
    <!--      append-to-body-->
    <!--      destroy-on-close-->
    <!--    >-->
    <!--      <el-form :model="formFieldForm" label-width="90px">-->
    <!--        <el-form-item label="字段ID">-->
    <!--          <el-input v-model="formFieldForm.id" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="类型">-->
    <!--          <el-select-->
    <!--            v-model="formFieldForm.typeType"-->
    <!--            placeholder="请选择字段类型"-->
    <!--            clearable-->
    <!--            @change="changeFieldTypeType"-->
    <!--          >-->
    <!--            <el-option v-for="(value, key) of fieldType" :label="value" :value="key" :key="key" />-->
    <!--          </el-select>-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="类型名称" v-if="formFieldForm.typeType === 'custom'">-->
    <!--          <el-input v-model="formFieldForm.type" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="名称">-->
    <!--          <el-input v-model="formFieldForm.label" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="时间格式" v-if="formFieldForm.typeType === 'date'">-->
    <!--          <el-input v-model="formFieldForm.datePattern" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="默认值">-->
    <!--          <el-input v-model="formFieldForm.defaultValue" clearable />-->
    <!--        </el-form-item>-->
    <!--      </el-form>-->

    <!--      &lt;!&ndash; 枚举值设置 &ndash;&gt;-->
    <!--      <template v-if="formFieldForm.type === 'enum'">-->
    <!--        <el-divider key="enum-divider" />-->
    <!--        <p class="listener-filed__title" key="enum-title">-->
    <!--          <span><Icon icon="ep:menu" />枚举值列表：</span>-->
    <!--          <el-button type="primary" @click="openFieldOptionForm(null, -1, 'enum')"-->
    <!--            >添加枚举值</el-button-->
    <!--          >-->
    <!--        </p>-->
    <!--        <el-table :data="fieldEnumList" key="enum-table" max-height="240" fit border>-->
    <!--          <el-table-column label="序号" width="50px" type="index" />-->
    <!--          <el-table-column label="枚举值编号" prop="id" min-width="100px" show-overflow-tooltip />-->
    <!--          <el-table-column label="枚举值名称" prop="name" min-width="100px" show-overflow-tooltip />-->
    <!--          <el-table-column label="操作" width="90px">-->
    <!--            <template #default="scope">-->
    <!--              <el-button-->
    <!--                type="primary"-->
    <!--                link-->
    <!--                @click="openFieldOptionForm(scope, scope.$index, 'enum')"-->
    <!--                >编辑</el-button-->
    <!--              >-->
    <!--              <el-divider direction="vertical" />-->
    <!--              <el-button-->
    <!--                type="primary"-->
    <!--                link-->
    <!--                style="color: #ff4d4f"-->
    <!--                @click="removeFieldOptionItem(scope, scope.$index, 'enum')"-->
    <!--                >移除</el-button-->
    <!--              >-->
    <!--            </template>-->
    <!--          </el-table-column>-->
    <!--        </el-table>-->
    <!--      </template>-->

    <!--      &lt;!&ndash; 校验规则 &ndash;&gt;-->
    <!--      <el-divider key="validation-divider" />-->
    <!--      <p class="listener-filed__title" key="validation-title">-->
    <!--        <span><Icon icon="ep:menu" />约束条件列表：</span>-->
    <!--        <el-button type="primary" @click="openFieldOptionForm(null, -1, 'constraint')"-->
    <!--          >添加约束</el-button-->
    <!--        >-->
    <!--      </p>-->
    <!--      <el-table :data="fieldConstraintsList" key="validation-table" max-height="240" fit border>-->
    <!--        <el-table-column label="序号" width="50px" type="index" />-->
    <!--        <el-table-column label="约束名称" prop="name" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="约束配置" prop="config" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="操作" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              @click="openFieldOptionForm(scope, scope.$index, 'constraint')"-->
    <!--              >编辑</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeFieldOptionItem(scope, scope.$index, 'constraint')"-->
    <!--              >移除</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->

    <!--      &lt;!&ndash; 表单属性 &ndash;&gt;-->
    <!--      <el-divider key="property-divider" />-->
    <!--      <p class="listener-filed__title" key="property-title">-->
    <!--        <span><Icon icon="ep:menu" />字段属性列表：</span>-->
    <!--        <el-button type="primary" @click="openFieldOptionForm(null, -1, 'property')"-->
    <!--          >添加属性</el-button-->
    <!--        >-->
    <!--      </p>-->
    <!--      <el-table :data="fieldPropertiesList" key="property-table" max-height="240" fit border>-->
    <!--        <el-table-column label="序号" width="50px" type="index" />-->
    <!--        <el-table-column label="属性编号" prop="id" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="属性值" prop="value" min-width="100px" show-overflow-tooltip />-->
    <!--        <el-table-column label="操作" width="90px">-->
    <!--          <template #default="scope">-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              @click="openFieldOptionForm(scope, scope.$index, 'property')"-->
    <!--              >编辑</el-button-->
    <!--            >-->
    <!--            <el-divider direction="vertical" />-->
    <!--            <el-button-->
    <!--              type="primary"-->
    <!--              link-->
    <!--              style="color: #ff4d4f"-->
    <!--              @click="removeFieldOptionItem(scope, scope.$index, 'property')"-->
    <!--              >移除</el-button-->
    <!--            >-->
    <!--          </template>-->
    <!--        </el-table-column>-->
    <!--      </el-table>-->

    <!--      &lt;!&ndash; 底部按钮 &ndash;&gt;-->
    <!--      <div class="element-drawer__button">-->
    <!--        <el-button>取 消</el-button>-->
    <!--        <el-button type="primary" @click="saveField">保 存</el-button>-->
    <!--      </div>-->
    <!--    </el-drawer>-->

    <!--    <el-dialog-->
    <!--      v-model="fieldOptionModelVisible"-->
    <!--      :title="optionModelTitle"-->
    <!--      width="600px"-->
    <!--      append-to-body-->
    <!--      destroy-on-close-->
    <!--    >-->
    <!--      <el-form :model="fieldOptionForm" label-width="96px">-->
    <!--        <el-form-item label="编号/ID" v-if="fieldOptionType !== 'constraint'" key="option-id">-->
    <!--          <el-input v-model="fieldOptionForm.id" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="名称" v-if="fieldOptionType !== 'property'" key="option-name">-->
    <!--          <el-input v-model="fieldOptionForm.name" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="配置" v-if="fieldOptionType === 'constraint'" key="option-config">-->
    <!--          <el-input v-model="fieldOptionForm.config" clearable />-->
    <!--        </el-form-item>-->
    <!--        <el-form-item label="值" v-if="fieldOptionType === 'property'" key="option-value">-->
    <!--          <el-input v-model="fieldOptionForm.value" clearable />-->
    <!--        </el-form-item>-->
    <!--      </el-form>-->
    <!--      <template #footer>-->
    <!--        <el-button @click="fieldOptionModelVisible = false">取 消</el-button>-->
    <!--        <el-button type="primary" @click="saveFieldOption">确 定</el-button>-->
    <!--      </template>-->
    <!--    </el-dialog>-->
  </div>
</template>

<script lang="ts" setup>
import * as FormApi from '@/api/bpm/form'

defineOptions({ name: 'ElementForm' })

const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')

const formKey = ref<number | undefined>()
const bpmnELement = ref()
const elExtensionElements = ref()
const formData = ref()
const otherExtensions = ref()

const bpmnInstances = () => (window as any)?.bpmnInstances
const resetFormList = () => {
  bpmnELement.value = bpmnInstances().bpmnElement
  formKey.value = bpmnELement.value.businessObject.formKey
  // if (formKey.value?.length > 0) {
  //   formKey.value = parseInt(formKey.value)
  // }
  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnELement.value.businessObject.get('extensionElements') ||
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })
  // 获取元素表单配置 或者 创建新的表单配置
  formData.value =
    elExtensionElements.value.values.filter((ex) => ex.$type === `${prefix}:FormData`)?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:FormData`, { fields: [] })

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value = elExtensionElements.value.values.filter(
    (ex) => ex.$type !== `${prefix}:FormData`
  )

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions()
}
const updateElementFormKey = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    formKey: formKey.value
  })
}
const updateElementExtensions = () => {
  // 更新回扩展元素
  const newElExtensionElements = bpmnInstances().moddle.create(`bpmn:ExtensionElements`, {
    values: otherExtensions.value.concat(formData.value)
  })
  // 更新到元素上
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    extensionElements: newElExtensionElements
  })
}

const formList = ref<Array<{ id: number; name: string }>>([]) // 流程表单的下拉框的数据
onMounted(async () => {
  formList.value = await FormApi.getFormSimpleList()
  formKey.value = formKey.value != null ? Number(formKey.value) : undefined
})

watch(
  () => props.id,
  (val) => {
    val &&
      val.length &&
      nextTick(() => {
        resetFormList()
      })
  },
  { immediate: true }
)
</script>

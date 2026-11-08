<!-- 表单字段权限设置：用于发起人、审批、抄送节点，以及 BPMN 设计器的用户任务 -->
<template>
  <div class="field-setting-pane">
    <div v-if="title" class="field-setting-desc">{{ title }}</div>
    <div class="field-permit-title">
      <div class="setting-title-label first-title"> 字段名称 </div>
      <div class="other-titles">
        <span
          v-for="option in PERMISSION_OPTIONS"
          :key="option.value"
          class="setting-title-label cursor-pointer"
          @click="updateAllPermission(option.value)"
        >
          {{ option.label }}
        </span>
      </div>
    </div>
    <template v-for="item in fieldsPermission" :key="item.field">
      <div class="field-setting-item">
        <div class="field-setting-item-label"> {{ item.title }} </div>
        <el-radio-group
          v-model="item.permission"
          class="field-setting-item-group"
          @change="emit('change')"
        >
          <div v-for="option in PERMISSION_OPTIONS" :key="option.value" class="item-radio-wrap">
            <el-radio
              :value="option.value"
              size="large"
              :disabled="isPermissionDisabled(option.value)"
            >
              <span></span>
            </el-radio>
          </div>
        </el-radio-group>
      </div>
      <!-- 子表单的子字段：未单独设置时继承子表单，子表单的权限是上限 -->
      <div v-for="child in item.children" :key="child.field" class="field-setting-item">
        <div class="field-setting-item-label pl-16px"> {{ child.title }} </div>
        <el-radio-group
          class="field-setting-item-group"
          :model-value="getSubFieldPermission(item.permission, child.permission)"
          :disabled="item.permission === FieldPermissionType.NONE"
          @change="(value) => updateSubFieldPermission(item, child, value)"
        >
          <div v-for="option in PERMISSION_OPTIONS" :key="option.value" class="item-radio-wrap">
            <el-radio
              :value="option.value"
              size="large"
              :disabled="isPermissionDisabled(option.value, item.permission)"
            >
              <span></span>
            </el-radio>
          </div>
        </el-radio-group>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { FieldPermissionType } from '../../consts'
import { getSubFieldPermission } from '../../utils'

defineOptions({ name: 'FieldsPermissionSetting' })

const props = defineProps({
  // 标题，为空时不展示
  title: {
    type: String,
    default: ''
  },
  // 是否允许「可编辑」。例如说：抄送节点仅能查看
  writable: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['change']) // 用户修改权限后触发

// 字段权限配置：field、title、permission；子表单还有 children 子字段权限，permission 为空表示继承子表单
const fieldsPermission = defineModel<Array<Record<string, any>>>({ required: true })

const PERMISSION_OPTIONS = [
  { label: '只读', value: FieldPermissionType.READ },
  { label: '可编辑', value: FieldPermissionType.WRITE },
  { label: '隐藏', value: FieldPermissionType.NONE }
]

/** 是否禁用权限选项：不允许「可编辑」时；子字段不能超过子表单的权限 */
const isPermissionDisabled = (permission: string, subFormPermission?: string) => {
  if (permission !== FieldPermissionType.WRITE) {
    return false
  }
  return !props.writable || subFormPermission === FieldPermissionType.READ
}

/** 批量设置字段权限：子表单的子字段，一并恢复为继承 */
const updateAllPermission = (permission: string) => {
  if (isPermissionDisabled(permission)) {
    return
  }
  fieldsPermission.value.forEach((item) => {
    item.permission = permission
    item.children?.forEach((child: Record<string, any>) => (child.permission = undefined))
  })
  emit('change')
}

/** 设置子字段权限：选择与子表单相同的权限时，恢复为继承 */
const updateSubFieldPermission = (
  item: Record<string, any>,
  child: Record<string, any>,
  permission?: string | number | boolean
) => {
  child.permission = permission === item.permission ? undefined : permission
  emit('change')
}
</script>

<style lang="scss" scoped>
.field-setting-pane {
  display: flex;
  flex-direction: column;
  font-size: 14px;

  .field-setting-desc {
    padding-right: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 700;
  }

  .field-permit-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 45px;
    padding-left: 12px;
    line-height: 45px;
    background-color: #f8fafc0a;
    border: 1px solid #1f38581a;

    .first-title {
      flex: 1;
      text-align: left !important;
    }

    .other-titles {
      display: flex;
      justify-content: space-between;
    }

    .setting-title-label {
      display: inline-block;
      width: 100px;
      padding: 5px 0;
      font-size: 13px;
      font-weight: 700;
      color: #000;
      text-align: center;
    }
  }

  .field-setting-item {
    align-items: center;
    display: flex;
    justify-content: space-between;
    height: 38px;
    padding-left: 12px;
    border: 1px solid #1f38581a;
    border-top: 0;

    .field-setting-item-label {
      display: inline-block;
      flex: 1;
      min-width: 0;
      min-height: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: text;
    }

    .field-setting-item-group {
      display: flex;
      justify-content: space-between;

      .item-radio-wrap {
        display: inline-block;
        width: 100px;
        text-align: center;
      }
    }
  }
}
</style>

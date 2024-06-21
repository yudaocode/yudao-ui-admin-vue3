<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="currentNode.name"
          :placeholder="currentNode.name"
        />
        <div v-else class="node-name"
          >{{ currentNode.name }}
          <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()"
        /></div>

        <div class="divide-line"></div>
      </div>
    </template>
    <el-tabs type="border-card" v-model="activeTabName">
      <el-tab-pane label="抄送人" name="user">
        <div>
          <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
            <el-form-item label="抄送人设置" prop="candidateStrategy">
              <el-radio-group
                v-model="configForm.candidateStrategy"
                @change="changeCandidateStrategy"
              >
                <el-radio
                  v-for="(dict, index) in copyUserStrategies"
                  :key="index"
                  :value="dict.value"
                  :label="dict.value"
                >
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.ROLE"
              label="指定角色"
              prop="candidateParamArray"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="
                configForm.candidateStrategy == CandidateStrategy.DEPT_MEMBER ||
                configForm.candidateStrategy == CandidateStrategy.DEPT_LEADER
              "
              label="指定部门"
              prop="candidateParamArray"
              span="24"
            >
              <el-tree-select
                ref="treeRef"
                v-model="configForm.candidateParamArray"
                :data="deptTreeOptions"
                :props="defaultProps"
                empty-text="加载中，请稍后"
                multiple
                node-key="id"
                style="width: 100%"
                show-checkbox
              />
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.POST"
              label="指定岗位"
              prop="candidateParamArray"
              span="24"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in postOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id!"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.USER"
              label="指定用户"
              prop="candidateParamArray"
              span="24"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in userOptions"
                  :key="item.id"
                  :label="item.nickname"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy === CandidateStrategy.USER_GROUP"
              label="指定用户组"
              prop="candidateParamArray"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in userGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="configForm.candidateStrategy === CandidateStrategy.EXPRESSION"
              label="流程表达式"
              prop="candidateParamArray"
            >
              <el-input
                type="textarea"
                v-model="configForm.candidateParamArray[0]"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane label="表单字段权限" name="fields" v-if="formType === 10">
        <div class="field-setting-pane">
          <div class="field-setting-desc">字段权限</div>
          <div class="field-permit-title">
            <div class="setting-title-label first-title"> 字段名称 </div>
            <div class="other-titles">
              <span class="setting-title-label">只读</span>
              <span class="setting-title-label">可编辑</span>
              <span class="setting-title-label">隐藏</span>
            </div>
          </div>
          <div
            class="field-setting-item"
            v-for="(item, index) in configForm.fieldsPermission"
            :key="index"
          >
            <div class="field-setting-item-label"> {{ item.title }} </div>
            <el-radio-group class="field-setting-item-group" v-model="item.permission">
              <div class="item-radio-wrap">
                <el-radio value="1" size="large" label="1"><span></span></el-radio>
              </div>
              <div class="item-radio-wrap">
                <el-radio value="2" size="large" label="2" disabled><span></span></el-radio>
              </div>
              <div class="item-radio-wrap">
                <el-radio value="3" size="large" label="3"><span></span></el-radio>
              </div>
            </el-radio-group>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-divider />
      <div>
        <el-button type="primary" @click="saveConfig">确 定</el-button>
        <el-button @click="closeDrawer">取 消</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts">
import { SimpleFlowNode, CandidateStrategy, NodeType, NODE_DEFAULT_NAME } from '../consts'
import { getDefaultFieldsPermission } from '../utils'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
import { defaultProps } from '@/utils/tree'
import { cloneDeep } from 'lodash-es'
defineOptions({
  name: 'CopyTaskNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 是否可见
const settingVisible = ref(false)
// 当前节点信息
const currentNode = ref<SimpleFlowNode>(props.flowNode)
const roleOptions = inject<Ref<RoleApi.RoleVO[]>>('roleList') // 角色列表
const postOptions = inject<Ref<PostApi.PostVO[]>>('postList') // 岗位列表
const userOptions = inject<Ref<UserApi.UserVO[]>>('userList') // 用户列表
const deptOptions = inject<Ref<DeptApi.DeptVO[]>>('deptList') // 部门列表
const userGroupOptions = inject<Ref<UserGroupApi.UserGroupVO[]>>('userGroupList') // 用户组列表
const deptTreeOptions = inject('deptTree') // 部门树
const formType = inject('formType') // 表单类型
const formFields = inject<Ref<string[]>>('formFields')

// 抄送人策略， 去掉发起人自选 和 发起人自己
const copyUserStrategies = computed(() => {
  return getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY).filter(
    (item) =>
      item.value !== CandidateStrategy.START_USER_SELECT &&
      item.value !== CandidateStrategy.START_USER
  )
})
// 激活的 Tab 标签页
const activeTabName = ref('user')
const formRef = ref() // 表单 Ref

const configForm = ref<any>({
  candidateParamArray: [],
  candidateStrategy: CandidateStrategy.USER,
  fieldsPermission: []
})
// 表单校验规则
const formRules = reactive({
  candidateStrategy: [{ required: true }],
  candidateParamArray: [{ required: true, message: '选项不能为空', trigger: 'blur' }]
})

// 关闭
const closeDrawer = () => {
  settingVisible.value = false
}
// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'user'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.candidateParam = configForm.value.candidateParamArray?.join(',')
  currentNode.value.candidateStrategy = configForm.value.candidateStrategy
  currentNode.value.showText = showText
  currentNode.value.fieldsPermission = configForm.value.fieldsPermission
  settingVisible.value = false
  return true
}

const open = () => {
  settingVisible.value = true
}
//  修改当前编辑的节点， 由父组件传过来
const setCurrentNode = (node: SimpleFlowNode) => {
  currentNode.value = node
  configForm.value.fieldsPermission =
    cloneDeep(node.fieldsPermission) || getDefaultFieldsPermission(formFields?.value)
  configForm.value.candidateStrategy = node.candidateStrategy
  const strCandidateParam = node?.candidateParam
  if (node.candidateStrategy === CandidateStrategy.EXPRESSION) {
    configForm.value.candidateParamArray[0] = strCandidateParam
  } else {
    if (strCandidateParam) {
      configForm.value.candidateParamArray = strCandidateParam.split(',').map((item) => +item)
    }
  }
}

defineExpose({ open, setCurrentNode }) // 暴露方法给父组件
const changeCandidateStrategy = () => {
  configForm.value.candidateParamArray = []
}
// TODO 貌似可以和 UserTaskNodeConfig 重复了， 如何共用??
const getShowText = (): string => {
  let showText = ''
  // 指定成员
  if (configForm.value.candidateStrategy === CandidateStrategy.USER) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      userOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.nickname)
        }
      })
      showText = `指定成员：${candidateNames.join(',')}`
    }
  }
  // 指定角色
  if (configForm.value.candidateStrategy === CandidateStrategy.ROLE) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      roleOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定角色：${candidateNames.join(',')}`
    }
  }
  // 指定部门
  if (
    configForm.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER ||
    configForm.value.candidateStrategy === CandidateStrategy.DEPT_LEADER
  ) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      deptOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      if (currentNode.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER) {
        showText = `部门成员：${candidateNames.join(',')}`
      } else {
        showText = `部门的负责人：${candidateNames.join(',')}`
      }
    }
  }
  // 指定岗位
  if (configForm.value.candidateStrategy === CandidateStrategy.POST) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      postOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定岗位: ${candidateNames.join(',')}`
    }
  }
  // 指定用户组
  if (configForm.value.candidateStrategy === CandidateStrategy.USER_GROUP) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      userGroupOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定用户组: ${candidateNames.join(',')}`
    }
  }
  // 流程表达式
  if (configForm.value.candidateStrategy === CandidateStrategy.EXPRESSION) {
    if (configForm.value.candidateParamArray?.length > 0) {
      showText = `流程表达式：${configForm.value.candidateParamArray[0]}`
    }
  }
  return showText
}
// 显示名称输入框
const showInput = ref(false)

const clickIcon = () => {
  showInput.value = true
}
// 输入框失去焦点
const blurEvent = () => {
  showInput.value = false
  currentNode.value.name =
    currentNode.value.name || (NODE_DEFAULT_NAME.get(NodeType.COPY_TASK_NODE) as string)
}
</script>

<style lang="scss" scoped>
// ::v-deep(.el-divider--horizontal) {
//   display: block;
//   height: 1px;
//   margin: 0;
//   border-top: 1px var(--el-border-color) var(--el-border-style);
// }
</style>

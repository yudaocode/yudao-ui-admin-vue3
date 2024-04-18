<!-- eslint-disable vue/html-self-closing -->
<template>
  <el-drawer
    :append-to-body="true"
    v-model="visible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
    class="justify-start"
  >
    <template #header>
      <div class="w-full flex flex-col">
        <span class="text-size-2xl">审批设置</span>
        <el-divider />
      </div>
    </template>
    <el-tabs type="border-card">
      <el-tab-pane label="审批人">
        <div>
          <el-form label-position="top" label-width="100px">
            <el-form-item label="审批方式" prop="approveMethod">
              <el-select v-model="candidateConfig.approveMethod" style="width: 100%" clearable>
                <el-option
                  v-for="dict in approveMethods"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="审批人规则类型" prop="candidateStrategy">
              <el-select
                v-model="candidateConfig.candidateStrategy"
                style="width: 100%"
                clearable
                @change="changecandidateStrategy"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="candidateConfig.candidateStrategy == 10"
              label="指定角色"
              prop="candidateParam"
            >
              <el-select
                v-model="candidateConfig.candidateParam"
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
                candidateConfig.candidateStrategy == 20 || candidateConfig.candidateStrategy == 21
              "
              label="指定部门"
              prop="candidateParam"
              span="24"
            >
              <el-tree-select
                ref="treeRef"
                v-model="candidateConfig.candidateParam"
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
              v-if="candidateConfig.candidateStrategy == 22"
              label="指定岗位"
              prop="candidateParam"
              span="24"
            >
              <el-select
                v-model="candidateConfig.candidateParam"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in postOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="
                candidateConfig.candidateStrategy == 30 ||
                candidateConfig.candidateStrategy == 31 ||
                candidateConfig.candidateStrategy == 32
              "
              label="指定用户"
              prop="candidateParam"
              span="24"
            >
              <el-select
                v-model="candidateConfig.candidateParam"
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
              v-if="candidateConfig.candidateStrategy === 40"
              label="指定用户组"
              prop="candidateParam"
            >
              <el-select
                v-model="candidateConfig.candidateParam"
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
              v-if="candidateConfig.candidateStrategy === 60"
              label="流程表达式"
              prop="candidateParam"
            >
              <el-input
                type="textarea"
                v-model="candidateConfig.candidateParam[0]"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane label="设置字段权限" v-if ="formType === 10">
        <div class="field-setting-pane h-full w-full flex flex-col">
          <div class="field-setting-content mr-2 overflow-auto py-4 pr-2">
            <div class="field-container flex flex-col flex-items-start">
              <div class="mb-2 ml-4 font-bold">字段权限</div>
              <div class="field-body ml-4 mt-2">
                <div class="field-permit-box text-size--13px">
                  <div class="field-permit-title">
                    <span class="setting-title-label">组件名称</span>
                    <span class="setting-title-label">可编辑</span>
                    <span class="setting-title-label">只读</span>
                    <span class="setting-title-label">隐藏</span>
                  </div>
                  <!-- <div class="field-setting-item">
                    <span class="field-setting-item-label">全选</span>
                    <span class="all-checkbox-wrap">
                      <el-checkbox
                        label=""
                        size="large"
                      />
                    </span>
                    <span class="all-checkbox-wrap">
                      <el-checkbox
                        label=""
                        size="large"
                      />
                    </span>
                    <span class="all-checkbox-wrap">
                      <el-checkbox
                        label=""
                        size="large"
                      />
                    </span>
                  </div> -->
                  <div class="field-setting-item-check">
                    <div
                      class="field-setting-item"
                      v-for="(item, index) in candidateConfig.fieldsPermission"
                      :key="index"
                    >
                      <span class="field-setting-item-label"> {{ item.title }}</span>
                      <el-radio-group v-model="item.permission">
                        <div class="item-radio-wrap">
                          <el-radio value="1" size="large" label="1" />
                        </div>
                        <div class="item-radio-wrap">
                          <el-radio value="2" size="large" label="2" />
                        </div>
                        <div class="item-radio-wrap">
                          <el-radio value="3" size="large" label="3" />
                        </div>
                      </el-radio-group>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
<script lang="ts" setup>
import { ref, watch, computed, toRaw } from 'vue'
import { approveMethods } from '../util'
import { useWorkFlowStoreWithOut } from '@/store/modules/bpm/simpleWorkflow'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'

const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const deptTreeOptions = ref() // 部门树
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
const candidateConfig = ref({
  candidateStrategy: undefined,
  candidateParam: [],
  approveMethod: undefined,
  fieldsPermission: []
})
const store = useWorkFlowStoreWithOut()
let { setApproverDrawer, setUserTaskConfig } = store
// let approverConfig1 = computed(() => store.approverConfig1)
let approverDrawer = computed(() => store.approverDrawer)
const userTaskConfig = computed(() => store.userTaskConfig)
const formType = inject('formType')
let visible = computed({
  get() {
    return approverDrawer.value
  },
  set() {
    closeDrawer()
  }
})
watch(userTaskConfig, (val) => {
  if (val.value.attributes) {
    candidateConfig.value.approveMethod = val.value.attributes.approveMethod
    candidateConfig.value.candidateStrategy = val.value.attributes.candidateStrategy
    const candidateParamStr = val.value.attributes.candidateParam
    if (val.value.attributes.candidateStrategy === 60) {
      candidateConfig.value.candidateParam = [candidateParamStr]
    } else {
      if (candidateParamStr) {
        candidateConfig.value.candidateParam = candidateParamStr.split(',').map((item) => +item)
      }
    }
    console.log('val.value.attributes.fieldsPermission', val.value.attributes.fieldsPermission)
    candidateConfig.value.fieldsPermission = val.value.attributes.fieldsPermission
  }
})
// watch(approverConfig1, (val) => {
//   approverConfig.value = val.value
// })

const saveConfig = () => {
  const rawConfig = toRaw(userTaskConfig.value)
  const { approveMethod, candidateStrategy, candidateParam, fieldsPermission } = toRaw(
    candidateConfig.value
  )
  const candidateParamStr = candidateParam.join(',')
  rawConfig.value.attributes = {
    approveMethod,
    candidateStrategy,
    candidateParam: candidateParamStr,
    fieldsPermission: fieldsPermission
  }
  rawConfig.flag = true
  // TODO 进行校验
  // setApproverConfig({
  //     value: approverConfig.value,
  //     flag: true,
  //     id: approverConfig1.value.id
  // })
  setUserTaskConfig({
    value: rawConfig.value,
    flag: true,
    id: userTaskConfig.value.id
  })
  closeDrawer()
}

const closeDrawer = () => {
  setApproverDrawer(false)
}
const changecandidateStrategy = () => {
  candidateConfig.value.candidateParam = []
}
const handleAllCheck = (event, type) => {
  console.log('event', event);
  console.log('type', type);
  event.target.checked = true;  
  let permission = '1'
  if (type === 'edit' && editAllChecked.value) {
    permission = '1'
  }
  if (type === 'read' && readAllChecked.value) {
    permission = '2'
  }
  if (type === 'hide' && hideAllChecked.value) {
    permission = '3'
  }
  candidateConfig.value.fieldsPermission.forEach((item) => {
    item.permission = permission
  })
}
onMounted(async () => {
  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()

  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得部门列表
  const deptOptions = await DeptApi.getSimpleDeptList()
  deptTreeOptions.value = handleTree(deptOptions, 'id')
  // 获得用户组列表
  userGroupOptions.value = await UserGroupApi.getUserGroupSimpleList()
})
</script>
<style lang="scss" scoped>
// ::v-deep .el-drawer__header {
//   margin-bottom: 2px;
// }
.field-permit-title {
  height: 45px;
  padding: 0 0 0 12px;
  line-height: 32px;
  background-color: rgba(248, 250, 252, 0.04);
  border: 1px solid rgba(31, 56, 88, 0.1);

  .setting-title-label:first-child {
    text-align: left;
  }

  .setting-title-label {
    display: inline-block;
    width: 110px;
    padding: 5px 0;
    font-size: 13px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
  }
}

.field-setting-item {
  display: flex;
  align-items: center;
  height: 38px;
  padding-bottom: 0;
  padding-left: 12px;
  line-height: 38px;
  border-right: 1px solid rgba(31, 56, 88, 0.1);
  border-bottom: 1px solid rgba(31, 56, 88, 0.1);
  border-left: 1px solid rgba(31, 56, 88, 0.1);

  .no-label {
    font-size: 0;
  }

  .field-setting-item-label {
    display: inline-block;
    width: 110px;
    min-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;
  }

  .all-checkbox-wrap {
    display: inline-block;
    width: 110px;
    text-align: center;
  }

  .item-radio-wrap {
    display: inline-block;
    width: 110px;
    padding-left: 6px;
    text-align: center;
  }
}

::v-deep(.el-radio__label) {
  opacity: 0; /* 隐藏标签文本 */
}

::v-deep(.el-divider--horizontal) {
  display: block;
  width: 100%;
  height: 1px;
  margin: 4px 0;
  border-top: 1px var(--el-border-color) var(--el-border-style);
}
</style>

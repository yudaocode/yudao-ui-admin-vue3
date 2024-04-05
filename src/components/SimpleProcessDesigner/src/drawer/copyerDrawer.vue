<template>
  <el-drawer
    :append-to-body="true"
    v-model="visible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="copy-task-header">抄送人设置</div>
    </template>
    <div>
      <el-form label-position="top" label-width="100px">
        <el-form-item label="选择抄送人" prop="candidateStrategy">
          <el-select v-model="candidateConfig.candidateStrategy" style="width: 100%" clearable @change="changecandidateStrategy">
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
          v-if="candidateConfig.candidateStrategy == 20 || candidateConfig.candidateStrategy == 21"
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
    <div class="demo-drawer__footer clear">
      <el-button type="primary" @click="saveConfig">确 定</el-button>
      <el-button @click="closeDrawer">取 消</el-button>
    </div>
  </el-drawer>
</template>
<script lang="ts" setup>
import { ref, watch, computed, toRaw } from 'vue'
import { useWorkFlowStoreWithOut } from '@/store/modules/simpleWorkflow'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
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
})
const store = useWorkFlowStoreWithOut()
const { setCopyerDrawer, setCopyerConfig } = store

const copyerDrawer = computed(() => store.copyerDrawer)
const copyerConfig = computed(() => store.copyerConfig)

const visible = computed({
  get() {
    return copyerDrawer.value
  },
  set() {
    closeDrawer()
  }
})
watch(copyerConfig, (val) => {
  if (val.value.attributes) {
    console.log('val.value.attributes', val.value.attributes);
    candidateConfig.value.candidateStrategy = val.value.attributes.candidateStrategy
    const candidateParamStr =  val.value.attributes.candidateParam;
    if(val.value.attributes.candidateStrategy === 60) {
      candidateConfig.value.candidateParam = [candidateParamStr]
    } else {
      if(candidateParamStr){
        candidateConfig.value.candidateParam =  candidateParamStr.split(',').map((item) => +item)
      }
    }
    
    // candidateConfig.value = val.value.attributes
  }
})


const saveConfig = () => {
  const rawConfig = toRaw(copyerConfig.value)
  const { candidateStrategy , candidateParam} = toRaw(candidateConfig.value);
  const candidateParamStr = candidateParam.join(',')
  rawConfig.value.attributes = {
    candidateStrategy,
    candidateParam: candidateParamStr
  } 
  rawConfig.flag = true
  // TODO 进行校验
  // setApproverConfig({
  //     value: approverConfig.value,
  //     flag: true,
  //     id: approverConfig1.value.id
  // })

  setCopyerConfig({
    value: rawConfig.value,
    flag: true,
    id: copyerConfig.value.id,
  })
  console.log('after is copyerConfig', copyerConfig.value)
  closeDrawer()
}

const closeDrawer = () => {
  setCopyerDrawer(false)
}
const changecandidateStrategy = () => {
  candidateConfig.value.candidateParam = []
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
.copy-task-header {
  font-size: 16px !important;
}
</style>

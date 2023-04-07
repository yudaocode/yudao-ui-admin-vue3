<template>
  <!-- 表单 -->
  <div v-show="getShow" class="form-cont">
    <!--    <LoginFormTitle style="width: 100%" />-->
    <el-tabs class="form" style="float: none" value="uname">
      <el-tab-pane :label="'三方授权（' + client.name + ')'" name="uname" />
    </el-tabs>
    <div>
      <el-form ref="ssoForm" :model="loginForm" class="login-form">
        <!-- 授权范围的选择 -->
        此第三方应用请求获得以下权限：
        <el-form-item prop="scopes">
          <el-checkbox-group v-model="loginForm.scopes">
            <el-checkbox
              v-for="scope in params.scopes"
              :key="scope"
              :label="scope"
              style="display: block; margin-bottom: -10px"
              >{{ formatScope(scope) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <!-- 下方的登录按钮 -->
        <el-form-item style="width: 100%">
          <el-button
            :loading="loading"
            size="small"
            style="width: 60%"
            type="primary"
            @click.prevent="handleAuthorize(true)"
          >
            <span v-if="!loading">同意授权</span>
            <span v-else>授 权 中...</span>
          </el-button>
          <el-button size="small" style="width: 36%" @click.prevent="handleAuthorize(false)"
            >拒绝
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script lang="ts" name="SSOLogin" setup>
// import LoginFormTitle from './LoginFormTitle.vue' // TODO 艿艿你看看要不要这个表头
import { authorize, getAuthorize, paramsType, scopesType } from '@/api/login'
import { LoginStateEnum, useLoginState } from './useLogin'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const { t } = useI18n()
const ssoForm = ref() // 表单Ref
const { getLoginState, setLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.SSO)
const loginForm = reactive<{ scopes: scopesType }>({
  scopes: [] // 已选中的 scope 数组
})
const params = reactive<paramsType>({
  // URL 上的 client_id、scope 等参数
  responseType: '',
  clientId: '',
  redirectUri: '',
  state: '',
  scopes: [] // 优先从 query 参数获取；如果未传递，从后端获取
}) // 表单Ref
const client = ref({
  // 客户端信息
  name: '',
  logo: ''
})
const loading = ref(false)
const handleAuthorize = (approved) => {
  ssoForm.value.validate((valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    // 计算 checkedScopes + uncheckedScopes
    let checkedScopes
    let uncheckedScopes
    if (approved) {
      // 同意授权，按照用户的选择
      checkedScopes = loginForm.scopes
      uncheckedScopes = params.scopes.filter((item) => checkedScopes.indexOf(item) === -1)
    } else {
      // 拒绝，则都是取消
      checkedScopes = []
      uncheckedScopes = params.scopes
    }
    // 提交授权的请求
    doAuthorize(false, checkedScopes, uncheckedScopes)
      .then((res) => {
        const href = res.data
        if (!href) {
          return
        }
        location.href = href
      })
      .finally(() => {
        loading.value = false
      })
  })
}
const doAuthorize = (autoApprove, checkedScopes, uncheckedScopes) => {
  return authorize(
    params.responseType,
    params.clientId,
    params.redirectUri,
    params.state,
    autoApprove,
    checkedScopes,
    uncheckedScopes
  )
}
const formatScope = (scope) => {
  // 格式化 scope 授权范围，方便用户理解。
  // 这里仅仅是一个 demo，可以考虑录入到字典数据中，例如说字典类型 "system_oauth2_scope"，它的每个 scope 都是一条字典数据。
  // TODO 这个之做了中文部分
  return t(`login.sso.${scope}`)
}
const route = useRoute()
const init = () => {
  // 防止在没有登录的情况下循环弹窗
  if (typeof route.query.client_id === 'undefined') return
  // 解析参数
  // 例如说【自动授权不通过】：client_id=default&redirect_uri=https%3A%2F%2Fwww.iocoder.cn&response_type=code&scope=user.read%20user.write
  // 例如说【自动授权通过】：client_id=default&redirect_uri=https%3A%2F%2Fwww.iocoder.cn&response_type=code&scope=user.read
  params.responseType = route.query.response_type as string
  params.clientId = route.query.client_id as string
  params.redirectUri = route.query.redirect_uri as string
  params.state = route.query.state as string
  if (route.query.scope) {
    params.scopes = (route.query.scope as string).split(' ')
  }

  // 如果有 scope 参数，先执行一次自动授权，看看是否之前都授权过了。
  if (params.scopes.length > 0) {
    doAuthorize(true, params.scopes, []).then((res) => {
      if (!res) {
        console.log('自动授权未通过！')
        return
      }
      location.href = res.data
    })
  }

  // 获取授权页的基本信息
  getAuthorize(params.clientId).then((res) => {
    client.value = res.client
    // 解析 scope
    let scopes
    // 1.1 如果 params.scope 非空，则过滤下返回的 scopes
    if (params.scopes.length > 0) {
      scopes = []
      for (const scope of res.scopes) {
        if (params.scopes.indexOf(scope.key) >= 0) {
          scopes.push(scope)
        }
      }
      // 1.2 如果 params.scope 为空，则使用返回的 scopes 设置它
    } else {
      scopes = res.scopes
      for (const scope of scopes) {
        params.scopes.push(scope.key)
      }
    }
    // 生成已选中的 checkedScopes
    for (const scope of scopes) {
      if (scope.value) {
        loginForm.scopes.push(scope.key)
      }
    }
  })
}
// =======SSO======
const { currentRoute } = useRouter()
// 监听当前路由
watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    if (route.name === 'SSOLogin') {
      setLoginState(LoginStateEnum.SSO)
      init()
    }
  },
  { immediate: true }
)
init()
</script>

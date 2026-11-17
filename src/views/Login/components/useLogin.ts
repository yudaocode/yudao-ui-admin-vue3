import { Ref } from 'vue'

export enum LoginStateEnum {
  LOGIN,
  REGISTER,
  RESET_PASSWORD,
  MOBILE,
  QR_CODE,
  SSO
}

const currentState = ref(LoginStateEnum.LOGIN)

export function useLoginState() {
  function setLoginState(state: LoginStateEnum) {
    currentState.value = state
  }
  const getLoginState = computed(() => currentState.value)

  function handleBackLogin() {
    setLoginState(LoginStateEnum.LOGIN)
  }

  return {
    setLoginState,
    getLoginState,
    handleBackLogin
  }
}

/**
 * 登录、注册、第三方登录成功后的跳转目标：只接受站内绝对路径（以 / 开头且不是 // 协议相对地址），
 * 其它值（空、非字符串如路由 query 的数组、相对路径、外部地址）回到首页。返回字符串，由 router.push 按原样解析 query、hash
 */
export function resolveLoginRedirect(redirect: unknown): string {
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
}

export function useFormValid<T extends Object = any>(formRef: Ref<any>) {
  async function validForm() {
    const form = unref(formRef)
    if (!form) return
    const data = await form.validate()
    return data as T
  }

  return {
    validForm
  }
}

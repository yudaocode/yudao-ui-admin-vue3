import request from '@/config/axios'

// 获得授权信息
export const getAuthorize = (clientId: string) => {
  return request.get({ url: '/system/oauth2/authorize?clientId=' + clientId })
}

// 发起授权
export const authorize = (
  responseType: string,
  clientId: string,
  redirectUri: string,
  state: string,
  autoApprove: boolean,
  checkedScopes: string[],
  uncheckedScopes: string[]
) => {
  // 构建 scopes
  const scopes = {}
  for (const scope of checkedScopes) {
    scopes[scope] = true
  }
  for (const scope of uncheckedScopes) {
    scopes[scope] = false
  }
  // 发起请求
  return request.post({
    url: '/system/oauth2/authorize',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    },
    params: {
      response_type: responseType,
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      auto_approve: autoApprove,
      scope: JSON.stringify(scopes)
    }
  })
}

<template>
  <div></div>
</template>
<script lang="ts" setup>
defineOptions({ name: 'Redirect' })

const { currentRoute, replace } = useRouter()
// hash 随 query 一起转发，刷新页签后保留原锚点
const { params, query, hash } = unref(currentRoute)
const { path, _redirect_type = 'path' } = params

Reflect.deleteProperty(params, '_redirect_type')
Reflect.deleteProperty(params, 'path')

const _path = Array.isArray(path) ? path.join('/') : path

// 守卫抛错、懒加载失败时 replace 会 reject，错误已交给 router.onError；命名路由不存在时 replace 同步抛错。
// async 封装使两者都成为拒绝（函数体同步执行，跳转时机不变），输出到控制台后收口，避免未处理的异常
const navigate = async () => {
  if (_redirect_type === 'name') {
    return replace({
      name: _path,
      query,
      params,
      hash
    })
  }
  return replace({
    path: _path.startsWith('/') ? _path : '/' + _path,
    query,
    hash
  })
}

navigate().catch((error) => console.error(error))
</script>

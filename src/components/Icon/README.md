# Icon 在线 / 离线图标

`<Icon icon="..." />` 支持以下名称：

- `svg-icon:xxx`：`src/assets/svgs` 下的本地 svg（始终离线）。
- `prefix:name`：Iconify 图标，如 `ep:edit`、`mdi:home`；兼容上游 `vi-` 前缀（`vi-ep:edit` 等同 `ep:edit`）。

## 默认：在线

未配置 `VITE_USE_ONLINE_ICON`（或为 `false` 以外的值）时，行为与原来一致：

- `ep`、`fa`、`fa-solid` 三个图标集已全量本地注册（即 IconSelect 可选范围）；
- 其它图标集在运行时按需请求 Iconify API，内网环境可能缺图标。

## 可选：离线

在构建使用的环境中设置 `VITE_USE_ONLINE_ICON=false`，构建时会生成离线图标子集（`build/vite/offlineIcons.ts`）：

- 扫描 `src` 下以字面量出现的 `prefix:name`（含 `vi-` 前缀、三元表达式的各分支），只收录 `@iconify/json` 中实际存在的图标集与图标（含别名及其旋转、翻转变换）；
- `ep`、`fa`、`fa-solid` 仍为全量注册，不重复打包；
- 子集在应用启动时同步注册，图标首次渲染即可用，不发起网络请求。

源码中没有字面量的图标（如后台菜单配置的图标、运行时拼接的名称）需通过 `VITE_OFFLINE_ICONS` 显式声明，逗号分隔：

```
VITE_USE_ONLINE_ICON=false
VITE_OFFLINE_ICONS=simple-icons:civicrm,simple-icons:erpnext,tabler:ai
```

`VITE_OFFLINE_ICONS` 会严格校验格式、图标集与图标是否存在，任一项无效时构建（及 dev 启动）直接报错并列出无效项；在线模式下忽略该配置。

离线模式下仍未包含的图标：渲染同尺寸的空白占位，不请求 Iconify API；开发环境下每个名称在控制台提示一次。

注意：

- dev 下子集在启动时生成，新增源码图标或修改 `VITE_OFFLINE_ICONS` 后需重启 dev；
- 只支持 `@iconify/json` 中的图标集，自定义图标请使用 `svg-icon:`。

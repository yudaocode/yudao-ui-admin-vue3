# Form 组件：componentProps 的 on 与 slots

`schema.componentProps` 除组件属性外，还支持 `on`（组件事件）与 `slots`（组件插槽）。Search 内部使用 Form，写法相同。

## on：组件事件

键为事件名，按 Vue 规则转为监听属性：`change` → `onChange`，`visible-change` / `visibleChange` → `onVisibleChange`，`update:file-list` / `update:fileList` → `onUpdate:fileList`。

```ts
{
  field: 'status',
  label: '状态',
  component: 'Select',
  componentProps: {
    options,
    onChange: (value) => console.log('原写法', value),
    on: {
      change: (value) => console.log('on 写法', value),
      'visible-change': (visible) => console.log(visible)
    }
  }
}
```

- 与 componentProps 中已有的同名 `onXxx`（函数或函数数组，含 `onUpdate:file-list` 这类 kebab 别名）合并，全部都会触发；执行顺序为：已有的精确键、已有的别名、`on` 中的键。`on` 中多个键规范到同一事件时也都会触发。
- 合并结果是一个函数（不是数组），可用于 ElUpload 的 `onChange`、`onSuccess` 等函数类型的属性。
- 某个监听抛出同步异常时，其余监听仍会执行。
- 全部监听同步返回时，合并结果返回最后一个监听的返回值；有异常时在全部执行后抛出：一个异常原样抛出，多个异常合并为一个 `AggregateError`（`errors` 中按监听顺序保留全部原因）。
- 有监听返回 Promise（或 thenable）时，合并结果返回一个 Promise：全部成功时为最后一个监听的结果；有失败（含同步异常）时一次性拒绝，一个原因原样拒绝，多个原因为 `AggregateError`。各个监听的 Promise 都由合并结果统一观察，不会产生额外的未处理拒绝；合并结果的拒绝由调用方处理（Vue 事件监听会进入 Vue 的错误处理；ElUpload 等直接调用函数型属性且不处理返回值时，与只传一个异步监听的情况相同）。
- 内部的 `v-model` 监听不受影响。

## slots：组件插槽

| 值 | 含义 | 插槽名 | 参数 |
| --- | --- | --- | --- |
| 函数 | 渲染函数 | camelCase 转 kebab-case，如 `rangeSeparator` → `range-separator` | 组件插槽原参数 |
| `true` 等非函数真值 | 模板插槽标记，渲染 Form 的模板插槽 `#字段-插槽名` | 不转换 | 模板插槽参数 |

```ts
{
  field: 'weight',
  component: 'Input',
  componentProps: {
    slots: {
      append: () => 'kg', // 渲染函数
      prefix: true // 模板插槽：<template #weight-prefix>...</template>
    }
  }
}
```

### default 的特殊行为

- `Select`、`Radio`、`RadioGroup`、`RadioButton`、`Checkbox`、`CheckboxGroup`、`CheckboxButton`：函数 `default(options)` 收到当前 `componentProps.options`（`optionApi`、字典或 `setSchema` 写入后的最新值），**替换**自动渲染的选项，此时 `optionsSlot` 不再生效。
- `SelectV2`：函数 `default(item, scope)` 用于渲染虚拟列表中的每一行，`item` 为行数据，`scope` 为 ElSelectV2 默认插槽的原参数。
- 未提供函数 `default` 时，保持原有的自动渲染与 `optionsSlot` 行为。

### Select 的选项与分组

- `optionDefault(option)`：渲染单个选项的内容。
- `optionGroupDefault(option)`：渲染整个分组，返回值替换 `ElOptionGroup`。
- 选项内容优先级：`optionsSlot` 模板插槽 `#字段-option` > `optionDefault` > 默认显示 label。
- 这两个函数只用于选项渲染，不作为 ElSelect 的组件插槽。

### Divider

- Divider 同样支持 `on` 与 `slots`，写法与参数约定同上；不会自动添加 `clearable`，`contentPosition` 默认 `left`。
- 默认内容为 `label`。只有函数 `default`（返回空值时按空内容渲染）或确实存在的模板插槽 `#字段-default`（配合 `slots.default = true`）才替换它；标记为真但没有对应模板插槽时仍显示 `label`。

## 优先级

模板插槽 `#字段` 整体替换表单组件，优先于 `formItemProps.slots.default` 与 `componentProps` 中的一切写法；`#字段-label`、`#字段-error` 优先于 `formItemProps.slots.label` / `error`。

## 组件默认宽度

- 非 inline 表单（含 `isCol` 栅格）：未传 `componentProps.style` 时，组件（含 Upload）默认 `style: { width: '100%' }`，占满表单项。
- 传入真值 `componentProps.style`（对象、字符串、数组，包括空对象 `{}`）时原样使用，不合并默认宽度；需要原宽度时传 `style: {}` 或显式宽度。
- inline 表单不追加 100%：输入类组件保持默认 229.5px，范围日期/时间保持原宽。是否 inline 以 ElForm 最终收到的 `inline` 为准（组件传入的 `inline` 优先于 `setProps` 设置的值）。
- 模板插槽 `#字段` 与 `formItemProps.slots.default` 渲染的内容不追加默认宽度。

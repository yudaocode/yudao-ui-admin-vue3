# Table 组件示例

`TableExample.vue` 演示公共 `Table` 组件（`@/components/Table`）的用法。示例使用固定数据，不调用接口，也没有注册菜单或路由，需要时在任意页面里引入即可。

项目里多数业务页面仍直接使用 `el-table`，这里只演示公共 `Table`，不要求迁移现有页面。

## 演示内容

- **columns + data**：列由 `columns` 数组驱动，数据由 `data` 传入。
- **字典列**：`useCrudSchemas` 中配置 `dictType: DICT_TYPE.COMMON_STATUS` 和 `dictClass: 'number'` 后，表格列会自动用 `DictTag` 渲染 0 / 1。`DictTag` 读取的是系统字典缓存，登录后字典已加载时才会显示标签文字。
- **column.slots**：`slots.default` 自定义单元格，`slots.header` 自定义表头。旧写法的 `#字段名` 和 `#字段名-header` 具名插槽仍然可用，优先级低于 `column.slots`。
- **showAction 工具栏**：刷新（触发 `refresh` 事件）、尺寸、列设置。列设置可以调整显隐、左右固定和顺序，点“确定”后才生效，“还原”恢复到列定义的默认值。列设置只叠加在渲染结果上，不会修改传入的 `columns`。
- **分页**：`v-model:current-page`、`v-model:page-size` 配合 `pagination`（至少传 `total`）。
- **addColumn / delColumn**：通过组件 ref 调用。

## 注意

`columns` 必须是可变数组（例如 `reactive([...])`）。`addColumn`、`delColumn`、`setColumn` 是 Table 既有的 API，会直接修改这份数组；传入 `readonly` 对象或常量数组会导致这些方法失效。

如果配合 `useTable` 使用，`methods.setColumn`、`methods.addColumn`、`methods.delColumn` 会转调同名的 Table 方法，行为相同。

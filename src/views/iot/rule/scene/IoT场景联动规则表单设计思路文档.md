// TODO @puhui999：这些后续需要删除哈
# IoT场景联动规则表单设计思路文档

## 概述

本文档详细描述了IoT场景联动规则表单的设计思路，包括表单结构、组件设计、数据流转和用户交互逻辑。通过Mermaid图直观展示各个组件之间的关系和数据流向。

## 表单整体架构设计

### 1. 表单主体结构

表单采用分步骤设计，包含以下主要部分：

- **基础信息配置**：场景名称、描述、状态
- **触发器配置**：设备触发或定时触发
- **执行器配置**：设备控制或告警配置
- **预览与保存**：配置预览和最终保存

### 2. 组件层次结构图

```mermaid
graph TB
    A[RuleSceneForm<br/>主表单组件] --> B[BasicInfoSection<br/>基础信息]
    A --> C[TriggerSection<br/>触发器配置]
    A --> D[ActionSection<br/>执行器配置]
    A --> E[PreviewSection<br/>预览区域]

    %% 基础信息组件
    B --> B1[NameInput<br/>场景名称输入]
    B --> B2[DescriptionInput<br/>场景描述输入]
    B --> B3[StatusRadio<br/>状态选择]

    %% 触发器配置组件
    C --> C1[TriggerTypeSelector<br/>触发类型选择器]
    C --> C2[DeviceTriggerConfig<br/>设备触发配置]
    C --> C3[TimerTriggerConfig<br/>定时触发配置]

    %% 设备触发配置子组件
    C2 --> C21[ProductSelector<br/>产品选择器]
    C2 --> C22[DeviceSelector<br/>设备选择器]
    C2 --> C23[PropertySelector<br/>属性选择器]
    C2 --> C24[OperatorSelector<br/>操作符选择器]
    C2 --> C25[ValueInput<br/>值输入]
    C2 --> C26[ConditionGroupConfig<br/>条件分组配置]

    %% 定时触发配置子组件
    C3 --> C31[CronInput<br/>CRON表达式输入]
    C3 --> C32[CronBuilder<br/>可视化CRON构建器]
    C3 --> C33[NextExecutionPreview<br/>下次执行时间预览]

    %% 执行器配置组件
    D --> D1[ActionTypeSelector<br/>执行类型选择器]
    D --> D2[DeviceControlConfig<br/>设备控制配置]
    D --> D3[AlertConfig<br/>告警配置]

    %% 设备控制配置子组件
    D2 --> D21[TargetProductSelector<br/>目标产品选择器]
    D2 --> D22[TargetDeviceSelector<br/>目标设备选择器]
    D2 --> D23[ControlTypeSelector<br/>控制类型选择器]
    D2 --> D24[ParamsConfig<br/>参数配置]

    %% 告警配置子组件
    D3 --> D31[AlertConfigSelector<br/>告警配置选择器]

    %% 预览区域组件
    E --> E1[ConfigPreview<br/>配置预览]
    E --> E2[ValidationResult<br/>验证结果]
    E --> E3[SaveButton<br/>保存按钮]

    %% 样式定义
    classDef mainComponent fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef sectionComponent fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef subComponent fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px

    class A mainComponent
    class B,C,D,E sectionComponent
    class B1,B2,B3,C1,C2,C3,C21,C22,C23,C24,C25,C26,C31,C32,C33,D1,D2,D3,D21,D22,D23,D24,D31,E1,E2,E3 subComponent
```

### 3. 组件层次结构文本

```text
RuleSceneForm (主表单)
├── BasicInfoSection (基础信息)
│   ├── NameInput (场景名称输入)
│   ├── DescriptionInput (场景描述输入)
│   └── StatusRadio (状态选择)
├── TriggerSection (触发器配置)
│   ├── TriggerTypeSelector (触发类型选择)
│   ├── DeviceTriggerConfig (设备触发配置)
│   │   ├── ProductSelector (产品选择器)
│   │   ├── DeviceSelector (设备选择器)
│   │   ├── PropertySelector (属性选择器)
│   │   ├── OperatorSelector (操作符选择器)
│   │   ├── ValueInput (值输入)
│   │   └── ConditionGroupConfig (条件分组配置)
│   └── TimerTriggerConfig (定时触发配置)
│       ├── CronInput (CRON表达式输入)
│       ├── CronBuilder (可视化CRON构建器)
│       └── NextExecutionPreview (下次执行时间预览)
├── ActionSection (执行器配置)
│   ├── ActionTypeSelector (执行类型选择)
│   ├── DeviceControlConfig (设备控制配置)
│   │   ├── TargetProductSelector (目标产品选择器)
│   │   ├── TargetDeviceSelector (目标设备选择器)
│   │   ├── ControlTypeSelector (控制类型选择器)
│   │   └── ParamsConfig (参数配置)
│   └── AlertConfig (告警配置)
│       └── AlertConfigSelector (告警配置选择器)
└── PreviewSection (预览区域)
    ├── ConfigPreview (配置预览)
    ├── ValidationResult (验证结果)
    └── SaveButton (保存按钮)
```

## 表单数据结构设计

### 1. 表单数据模型结构图

```mermaid
classDiagram
    class RuleSceneFormData {
        +number id?
        +string name
        +string description?
        +number status
        +TriggerFormData[] triggers
        +ActionFormData[] actions
        +validateForm() boolean
        +toApiFormat() ApiRequestData
    }

    class TriggerFormData {
        +number type
        +number productId?
        +number deviceId?
        +string identifier?
        +string operator?
        +string value?
        +string cronExpression?
        +ConditionGroupFormData[] conditionGroups?
        +validateTrigger() boolean
        +isDeviceTrigger() boolean
        +isTimerTrigger() boolean
    }

    class ActionFormData {
        +number type
        +number productId?
        +number deviceId?
        +Record params?
        +number alertConfigId?
        +validateAction() boolean
        +isDeviceAction() boolean
        +isAlertAction() boolean
    }

    class ConditionGroupFormData {
        +ConditionFormData[] conditions
        +string logicOperator
        +validateGroup() boolean
    }

    class ConditionFormData {
        +number type
        +number productId
        +number deviceId
        +string identifier
        +string operator
        +string param
        +validateCondition() boolean
    }

    class TriggerTypeEnum {
        <<enumeration>>
        DEVICE_STATE_UPDATE: 1
        DEVICE_PROPERTY_POST: 2
        DEVICE_EVENT_POST: 3
        DEVICE_SERVICE_INVOKE: 4
        TIMER: 100
    }

    class ActionTypeEnum {
        <<enumeration>>
        DEVICE_PROPERTY_SET: 1
        DEVICE_SERVICE_INVOKE: 2
        ALERT_TRIGGER: 100
        ALERT_RECOVER: 101
    }

    class OperatorEnum {
        <<enumeration>>
        EQUALS: "="
        NOT_EQUALS: "!="
        GREATER_THAN: ">"
        LESS_THAN: "<"
        IN: "in"
        BETWEEN: "between"
    }

    RuleSceneFormData "1" --> "*" TriggerFormData : contains
    RuleSceneFormData "1" --> "*" ActionFormData : contains
    TriggerFormData "1" --> "*" ConditionGroupFormData : contains
    ConditionGroupFormData "1" --> "*" ConditionFormData : contains
    TriggerFormData --> TriggerTypeEnum : uses
    ActionFormData --> ActionTypeEnum : uses
    ConditionFormData --> OperatorEnum : uses
```

### 2. 表单数据模型代码

```typescript
interface RuleSceneFormData {
  // 基础信息
  id?: number;
  name: string;
  description?: string;
  status: number;

  // 触发器配置
  triggers: TriggerFormData[];

  // 执行器配置
  actions: ActionFormData[];
}

interface TriggerFormData {
  type: number;
  productId?: number;
  deviceId?: number;
  identifier?: string;
  operator?: string;
  value?: string;
  cronExpression?: string;
  conditionGroups?: ConditionGroupFormData[];
}

interface ActionFormData {
  type: number;
  productId?: number;
  deviceId?: number;
  params?: Record<string, any>;
  alertConfigId?: number;
}

interface ConditionGroupFormData {
  conditions: ConditionFormData[];
  logicOperator: 'AND' | 'OR';
}

interface ConditionFormData {
  type: number;
  productId: number;
  deviceId: number;
  identifier: string;
  operator: string;
  param: string;
}
```

### 2. 表单验证规则

```typescript
const validationRules = {
  name: [
    { required: true, message: '场景名称不能为空' },
    { max: 50, message: '场景名称不能超过50个字符' }
  ],
  status: [
    { required: true, message: '场景状态不能为空' },
    { type: 'enum', enum: [0, 1], message: '状态值必须为0或1' }
  ],
  triggers: [
    { required: true, message: '触发器配置不能为空' },
    { type: 'array', min: 1, message: '至少需要一个触发器' }
  ],
  actions: [
    { required: true, message: '执行器配置不能为空' },
    { type: 'array', min: 1, message: '至少需要一个执行器' }
  ]
};
```

## 核心组件设计

### 1. 基础信息组件 (BasicInfoSection)

```vue
<template>
  <el-card class="basic-info-section">
    <template #header>
      <span>基础信息</span>
    </template>
    
    <el-form :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="场景名称" prop="name">
        <el-input 
          v-model="formData.name" 
          placeholder="请输入场景名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="场景描述" prop="description">
        <el-input 
          v-model="formData.description" 
          type="textarea"
          placeholder="请输入场景描述"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="场景状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="0">开启</el-radio>
          <el-radio :label="1">关闭</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </el-card>
</template>
```

### 2. 触发器配置组件 (TriggerSection)

```vue
<template>
  <el-card class="trigger-section">
    <template #header>
      <div class="section-header">
        <span>触发器配置</span>
        <el-button type="primary" size="small" @click="addTrigger">
          <el-icon><Plus /></el-icon>
          添加触发器
        </el-button>
      </div>
    </template>
    
    <div v-for="(trigger, index) in triggers" :key="index" class="trigger-item">
      <div class="trigger-header">
        <span>触发器 {{ index + 1 }}</span>
        <el-button 
          type="danger" 
          size="small" 
          text 
          @click="removeTrigger(index)"
          v-if="triggers.length > 1"
        >
          删除
        </el-button>
      </div>
      
      <!-- 触发类型选择 -->
      <TriggerTypeSelector v-model="trigger.type" @change="onTriggerTypeChange(trigger, $event)" />
      
      <!-- 设备触发配置 -->
      <DeviceTriggerConfig 
        v-if="isDeviceTrigger(trigger.type)"
        v-model="trigger"
      />
      
      <!-- 定时触发配置 -->
      <TimerTriggerConfig 
        v-if="trigger.type === TriggerType.TIMER"
        v-model="trigger.cronExpression"
      />
    </div>
  </el-card>
</template>
```

### 3. 执行器配置组件 (ActionSection)

```vue
<template>
  <el-card class="action-section">
    <template #header>
      <div class="section-header">
        <span>执行器配置</span>
        <el-button type="primary" size="small" @click="addAction">
          <el-icon><Plus /></el-icon>
          添加执行器
        </el-button>
      </div>
    </template>
    
    <div v-for="(action, index) in actions" :key="index" class="action-item">
      <div class="action-header">
        <span>执行器 {{ index + 1 }}</span>
        <el-button 
          type="danger" 
          size="small" 
          text 
          @click="removeAction(index)"
          v-if="actions.length > 1"
        >
          删除
        </el-button>
      </div>
      
      <!-- 执行类型选择 -->
      <ActionTypeSelector v-model="action.type" @change="onActionTypeChange(action, $event)" />
      
      <!-- 设备控制配置 -->
      <DeviceControlConfig 
        v-if="isDeviceAction(action.type)"
        v-model="action"
      />
      
      <!-- 告警配置 -->
      <AlertConfig 
        v-if="isAlertAction(action.type)"
        v-model="action.alertConfigId"
      />
    </div>
  </el-card>
</template>
```

## 表单交互流程设计

### 1. 表单初始化流程图

```mermaid
flowchart TD
    A[页面加载] --> B[初始化表单数据结构]
    B --> C[获取基础数据]
    C --> C1[加载产品列表]
    C --> C2[加载告警配置列表]
    C --> C3[加载用户权限信息]
    C1 --> D[表单渲染]
    C2 --> D
    C3 --> D
    D --> E[建立双向数据绑定]
    E --> F[表单就绪]

    %% 错误处理
    C --> G{数据加载失败?}
    G -->|是| H[显示错误信息]
    G -->|否| D
    H --> I[提供重试选项]
    I --> C
```

### 2. 触发器配置流程图

```mermaid
flowchart TD
    A[开始配置触发器] --> B[选择触发类型]
    B --> C{触发类型}

    %% 设备触发分支
    C -->|设备触发| D[设备触发配置]
    D --> D1[选择产品]
    D1 --> D2[加载设备列表]
    D2 --> D3[选择设备]
    D3 --> D4[加载物模型]
    D4 --> D5[选择属性/事件]
    D5 --> D6[选择操作符]
    D6 --> D7[输入比较值]
    D7 --> D8[配置条件分组]
    D8 --> E[触发器配置完成]

    %% 定时触发分支
    C -->|定时触发| F[定时触发配置]
    F --> F1[输入CRON表达式]
    F1 --> F2{表达式格式}
    F2 -->|正确| F3[显示下次执行时间]
    F2 -->|错误| F4[显示错误提示]
    F4 --> F5[提供可视化编辑器]
    F5 --> F1
    F3 --> E

    %% 验证
    E --> G[验证触发器配置]
    G --> H{验证通过?}
    H -->|是| I[保存触发器配置]
    H -->|否| J[显示验证错误]
    J --> D
```

### 3. 执行器配置流程图

```mermaid
flowchart TD
    A[开始配置执行器] --> B[选择执行类型]
    B --> C{执行类型}

    %% 设备控制分支
    C -->|设备控制| D[设备控制配置]
    D --> D1[选择目标产品]
    D1 --> D2[加载目标设备列表]
    D2 --> D3[选择目标设备]
    D3 --> D4[选择控制类型]
    D4 --> D5{控制类型}
    D5 -->|属性设置| D6[配置属性参数]
    D5 -->|服务调用| D7[配置服务参数]
    D6 --> E[执行器配置完成]
    D7 --> E

    %% 告警分支
    C -->|告警触发/恢复| F[告警配置]
    F --> F1[选择告警配置项]
    F1 --> F2[配置告警参数]
    F2 --> E

    %% 验证
    E --> G[验证执行器配置]
    G --> H{验证通过?}
    H -->|是| I[保存执行器配置]
    H -->|否| J[显示验证错误]
    J --> D
```

### 4. 表单提交流程图

```mermaid
flowchart TD
    A[用户点击保存] --> B[表单验证]
    B --> C{验证通过?}
    C -->|否| D[显示验证错误]
    D --> E[用户修正错误]
    E --> B

    C -->|是| F[数据转换]
    F --> G[转换为API格式]
    G --> H[提交请求]
    H --> I{请求成功?}

    I -->|是| J[显示成功消息]
    J --> K[跳转到列表页面]

    I -->|否| L[显示错误消息]
    L --> M[提供重试选项]
    M --> H

    %% 加载状态
    H --> N[显示加载状态]
    N --> I
```

### 5. 数据流转图

```mermaid
flowchart LR
    A[用户输入] --> B[表单组件]
    B --> C[数据验证]
    C --> D[状态管理]
    D --> E[API调用]
    E --> F[后端处理]
    F --> G[数据库存储]

    %% 反向数据流
    G --> H[响应数据]
    H --> I[状态更新]
    I --> J[UI更新]
    J --> K[用户反馈]

    %% 错误处理流
    C --> L{验证失败?}
    L -->|是| M[错误提示]
    M --> A

    E --> N{请求失败?}
    N -->|是| O[错误处理]
    O --> K
```

## 组件状态管理设计

### 1. 状态管理架构图

```mermaid
graph TB
    A[全局状态管理] --> B[表单状态]
    A --> C[UI状态]
    A --> D[数据缓存状态]

    %% 表单状态
    B --> B1[formData<br/>表单数据]
    B --> B2[validationErrors<br/>验证错误]
    B --> B3[isDirty<br/>数据变更标识]
    B --> B4[isSubmitting<br/>提交状态]

    %% UI状态
    C --> C1[loading<br/>加载状态]
    C --> C2[activeStep<br/>当前步骤]
    C --> C3[expandedSections<br/>展开的区域]
    C --> C4[modalVisible<br/>弹窗显示状态]

    %% 数据缓存状态
    D --> D1[productList<br/>产品列表]
    D --> D2[deviceList<br/>设备列表]
    D --> D3[thingModelList<br/>物模型列表]
    D --> D4[alertConfigList<br/>告警配置列表]

    %% 状态操作
    E[状态操作] --> E1[updateFormData<br/>更新表单数据]
    E --> E2[validateForm<br/>验证表单]
    E --> E3[resetForm<br/>重置表单]
    E --> E4[submitForm<br/>提交表单]

    %% 样式定义
    classDef stateClass fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef actionClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class A,B,C,D stateClass
    class E,E1,E2,E3,E4 actionClass
```

### 2. 组件通信图

```mermaid
sequenceDiagram
    participant U as User
    participant F as FormComponent
    participant T as TriggerSection
    participant A as ActionSection
    participant S as StateManager
    participant API as BackendAPI

    U->>F: 填写基础信息
    F->>S: updateFormData(basicInfo)
    S-->>F: 状态更新完成

    U->>T: 配置触发器
    T->>S: updateTriggers(triggerData)
    S->>API: loadDeviceList(productId)
    API-->>S: 返回设备列表
    S-->>T: 更新设备选项

    U->>A: 配置执行器
    A->>S: updateActions(actionData)
    S-->>A: 状态更新完成

    U->>F: 点击保存
    F->>S: validateForm()
    S-->>F: 验证结果

    alt 验证通过
        F->>S: submitForm()
        S->>API: saveRuleScene(formData)
        API-->>S: 保存结果
        S-->>F: 显示成功消息
    else 验证失败
        S-->>F: 显示错误信息
    end
```

### 3. 数据流向图

```mermaid
flowchart LR
    A[用户操作] --> B[组件事件]
    B --> C[状态更新]
    C --> D[数据验证]
    D --> E{验证通过?}

    E -->|是| F[更新状态]
    E -->|否| G[显示错误]

    F --> H[触发副作用]
    H --> I[API调用]
    I --> J[更新缓存]
    J --> K[UI重新渲染]

    G --> L[用户修正]
    L --> A

    %% 样式
    classDef processClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef decisionClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef errorClass fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class A,B,C,D,F,H,I,J,K,L processClass
    class E decisionClass
    class G errorClass
```

## 用户体验优化

### 1. 智能提示和帮助

- **字段说明**：为复杂字段提供详细说明和示例
- **实时验证**：输入时实时验证数据格式
- **智能推荐**：根据已选择的产品推荐相关设备
- **预览功能**：实时预览配置效果

### 2. 错误处理和反馈

- **表单验证**：清晰的错误提示信息
- **数据加载**：加载状态和错误重试机制
- **保存反馈**：明确的成功/失败反馈

### 3. 操作便利性

- **批量操作**：支持批量添加/删除触发器和执行器
- **模板功能**：提供常用场景模板
- **导入导出**：支持配置的导入和导出

## 响应式设计考虑

### 1. 移动端适配

- **布局调整**：在小屏幕上采用垂直布局
- **操作优化**：增大点击区域，优化触摸操作
- **内容精简**：在移动端隐藏非必要信息

### 2. 不同屏幕尺寸适配

- **大屏幕**：充分利用空间，并排显示更多内容
- **中等屏幕**：平衡内容密度和可读性
- **小屏幕**：优先显示核心功能

## 性能优化策略

### 1. 组件懒加载

```javascript
// 懒加载复杂组件
const DeviceTriggerConfig = defineAsyncComponent(() => 
  import('./components/DeviceTriggerConfig.vue')
);
```

### 2. 数据缓存

```javascript
// 缓存产品和设备数据
const productCache = new Map();
const deviceCache = new Map();
```

### 3. 防抖处理

```javascript
// 搜索防抖
const debouncedSearch = debounce(searchDevices, 300);
```

## 可访问性设计

### 1. 键盘导航

- 支持Tab键在表单元素间导航
- 提供快捷键操作

### 2. 屏幕阅读器支持

- 为表单元素提供适当的标签
- 使用ARIA属性增强可访问性

### 3. 颜色和对比度

- 确保足够的颜色对比度
- 不仅依赖颜色传达信息

## 表单验证策略

### 1. 验证层次结构图

```mermaid
graph TB
    A[表单验证] --> B[字段级验证]
    A --> C[组件级验证]
    A --> D[表单级验证]
    A --> E[业务级验证]

    %% 字段级验证
    B --> B1[必填验证]
    B --> B2[格式验证]
    B --> B3[长度验证]
    B --> B4[类型验证]

    %% 组件级验证
    C --> C1[触发器验证]
    C --> C2[执行器验证]
    C --> C3[条件组合验证]

    %% 表单级验证
    D --> D1[数据完整性验证]
    D --> D2[逻辑一致性验证]
    D --> D3[依赖关系验证]

    %% 业务级验证
    E --> E1[设备权限验证]
    E --> E2[产品可用性验证]
    E --> E3[规则冲突验证]

    %% 样式定义
    classDef levelClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef validationClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class A levelClass
    class B,C,D,E levelClass
    class B1,B2,B3,B4,C1,C2,C3,D1,D2,D3,E1,E2,E3 validationClass
```

### 2. 验证时机图

```mermaid
stateDiagram-v2
    [*] --> 字段输入
    字段输入 --> 实时验证: onChange
    实时验证 --> 显示错误: 验证失败
    实时验证 --> 清除错误: 验证通过
    显示错误 --> 字段输入: 用户修正
    清除错误 --> 字段输入: 继续输入

    字段输入 --> 失焦验证: onBlur
    失焦验证 --> 显示警告: 格式错误
    失焦验证 --> 正常状态: 格式正确
    显示警告 --> 字段输入: 重新聚焦
    正常状态 --> 字段输入: 重新聚焦

    字段输入 --> 表单提交: 用户提交
    表单提交 --> 全量验证
    全量验证 --> 提交成功: 验证通过
    全量验证 --> 显示错误: 验证失败
    提交成功 --> [*]
    显示错误 --> 字段输入: 用户修正
```

## 测试策略

### 1. 测试金字塔图

```mermaid
graph TB
    A[测试金字塔] --> B[单元测试<br/>Unit Tests<br/>70%]
    A --> C[集成测试<br/>Integration Tests<br/>20%]
    A --> D[端到端测试<br/>E2E Tests<br/>10%]

    %% 单元测试详细
    B --> B1[组件渲染测试]
    B --> B2[数据验证逻辑测试]
    B --> B3[用户交互测试]
    B --> B4[工具函数测试]

    %% 集成测试详细
    C --> C1[表单提交流程测试]
    C --> C2[API调用测试]
    C --> C3[数据转换测试]
    C --> C4[组件间通信测试]

    %% 端到端测试详细
    D --> D1[完整用户流程测试]
    D --> D2[浏览器兼容性测试]
    D --> D3[响应式设计测试]
    D --> D4[性能测试]

    %% 样式定义
    classDef pyramidClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:3px
    classDef unitClass fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef integrationClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef e2eClass fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class A pyramidClass
    class B,B1,B2,B3,B4 unitClass
    class C,C1,C2,C3,C4 integrationClass
    class D,D1,D2,D3,D4 e2eClass
```

### 2. 测试用例覆盖图

```mermaid
mindmap
  root((测试用例覆盖))
    功能测试
      基础信息
        名称输入验证
        描述输入验证
        状态切换测试
      触发器配置
        设备触发配置
        定时触发配置
        条件组合测试
      执行器配置
        设备控制配置
        告警配置测试
      表单提交
        验证流程测试
        保存流程测试

    异常测试
      网络异常
        API调用失败
        超时处理
      数据异常
        格式错误处理
        空数据处理
      用户异常
        权限不足
        操作冲突

    性能测试
      加载性能
        首屏加载时间
        组件渲染性能
      交互性能
        表单响应速度
        数据处理性能
      内存性能
        内存泄漏检测
        组件销毁测试

    兼容性测试
      浏览器兼容
        Chrome测试
        Firefox测试
        Safari测试
        Edge测试
      设备兼容
        桌面端测试
        平板端测试
        移动端测试
```

## 表单设计架构总览

### 完整架构图

```mermaid
graph TB
    %% 用户界面层
    subgraph "用户界面层 (UI Layer)"
        A[RuleSceneForm 主表单]
        B[BasicInfoSection 基础信息]
        C[TriggerSection 触发器配置]
        D[ActionSection 执行器配置]
        E[PreviewSection 预览区域]
    end

    %% 状态管理层
    subgraph "状态管理层 (State Management)"
        F[FormState 表单状态]
        G[ValidationState 验证状态]
        H[UIState 界面状态]
        I[CacheState 缓存状态]
    end

    %% 业务逻辑层
    subgraph "业务逻辑层 (Business Logic)"
        J[FormValidator 表单验证器]
        K[DataTransformer 数据转换器]
        L[ConfigBuilder 配置构建器]
        M[RuleEngine 规则引擎]
    end

    %% 数据访问层
    subgraph "数据访问层 (Data Access)"
        N[ProductAPI 产品接口]
        O[DeviceAPI 设备接口]
        P[RuleSceneAPI 规则场景接口]
        Q[AlertAPI 告警接口]
    end

    %% 工具层
    subgraph "工具层 (Utilities)"
        R[CronValidator CRON验证器]
        S[TypeChecker 类型检查器]
        T[ErrorHandler 错误处理器]
        U[Logger 日志记录器]
    end

    %% 连接关系
    A --> B
    A --> C
    A --> D
    A --> E

    B --> F
    C --> F
    D --> F
    E --> F

    F --> J
    G --> J
    H --> K
    I --> L

    J --> M
    K --> M
    L --> M

    M --> N
    M --> O
    M --> P
    M --> Q

    J --> R
    K --> S
    M --> T
    A --> U

    %% 样式定义
    classDef uiClass fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef stateClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef businessClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef dataClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef utilClass fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class A,B,C,D,E uiClass
    class F,G,H,I stateClass
    class J,K,L,M businessClass
    class N,O,P,Q dataClass
    class R,S,T,U utilClass
```

### 设计原则总结

```mermaid
mindmap
  root((表单设计原则))
    用户体验
      直观易用
        清晰的视觉层次
        一致的交互模式
        智能的操作提示
      响应迅速
        实时验证反馈
        快速数据加载
        流畅的动画效果
      错误友好
        明确的错误信息
        便捷的错误修正
        优雅的异常处理

    技术架构
      组件化设计
        高内聚低耦合
        可复用的组件
        清晰的组件边界
      状态管理
        集中式状态管理
        可预测的状态变更
        高效的状态同步
      数据流控制
        单向数据流
        明确的数据来源
        可追踪的数据变更

    质量保证
      代码质量
        类型安全
        代码规范
        充分的注释
      测试覆盖
        单元测试
        集成测试
        端到端测试
      性能优化
        懒加载
        缓存策略
        防抖节流

    可维护性
      模块化结构
        清晰的目录结构
        合理的文件组织
        明确的依赖关系
      文档完善
        API文档
        组件文档
        使用说明
      扩展性设计
        插件化架构
        配置化开发
        版本兼容性
```

## 总结

IoT场景联动规则表单设计需要考虑：

### 1. 核心设计要点

- **复杂性管理**：通过组件化和分步骤设计降低复杂度
- **用户体验**：提供直观的操作界面和智能提示
- **数据完整性**：完善的验证机制确保数据质量
- **扩展性**：模块化设计支持功能扩展
- **性能优化**：合理的加载和缓存策略
- **可访问性**：确保所有用户都能正常使用

### 2. 技术实现要点

- **状态管理**：采用集中式状态管理，确保数据流的可控性
- **组件设计**：高内聚低耦合的组件架构，提高代码复用性
- **验证策略**：多层次的验证机制，保证数据质量
- **错误处理**：完善的错误处理和用户反馈机制
- **性能优化**：懒加载、缓存、防抖等优化策略

### 3. 质量保证

- **测试覆盖**：完整的测试金字塔，确保代码质量
- **文档完善**：详细的设计文档和使用说明
- **代码规范**：统一的编码规范和类型安全

通过以上设计思路和详细的Mermaid图表，可以构建一个功能完善、用户友好、技术先进的IoT场景联动规则配置表单系统。

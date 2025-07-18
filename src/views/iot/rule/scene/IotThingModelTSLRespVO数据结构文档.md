# IotThingModelTSLRespVO 数据结构文档

## 概述

`IotThingModelTSLRespVO` 是IoT产品物模型TSL（Thing Specification Language）的响应数据结构，用于返回完整的产品物模型定义，包括属性、事件和服务的详细信息。TSL是阿里云IoT平台定义的一套物模型描述规范。

## 主体数据结构

### IotThingModelTSLRespVO

```typescript
interface IotThingModelTSLRespVO {
  productId: number;                    // 产品编号（必填）
  productKey: string;                   // 产品标识（必填）
  properties: ThingModelProperty[];     // 属性列表（必填）
  events: ThingModelEvent[];           // 事件列表（必填）
  services: ThingModelService[];       // 服务列表（必填）
}
```

**字段说明：**
- `productId`: 产品编号，唯一标识一个IoT产品
- `productKey`: 产品标识符，用于设备连接和识别
- `properties`: 设备属性列表，描述设备的状态信息
- `events`: 设备事件列表，描述设备主动上报的事件
- `services`: 设备服务列表，描述可以调用的设备功能

## 属性数据结构 (ThingModelProperty)

### 基本结构

```typescript
interface ThingModelProperty {
  identifier: string;                   // 属性标识符（必填）
  name: string;                        // 属性名称（必填）
  accessMode: string;                  // 访问模式（必填）
  required?: boolean;                  // 是否必选
  dataType: string;                    // 数据类型（必填）
  dataSpecs?: ThingModelDataSpecs;     // 数据规范（非列表型）
  dataSpecsList?: ThingModelDataSpecs[]; // 数据规范（列表型）
}
```

### 字段详细说明

#### identifier（属性标识符）
- **类型**: `string`
- **必填**: 是
- **格式**: 正则表达式 `^[a-zA-Z][a-zA-Z0-9_]{0,31}$`
- **说明**: 只能由字母、数字和下划线组成，必须以字母开头，长度不超过32个字符
- **示例**: `"temperature"`, `"humidity"`, `"power_status"`

#### name（属性名称）
- **类型**: `string`
- **必填**: 是
- **说明**: 属性的显示名称，用于界面展示
- **示例**: `"温度"`, `"湿度"`, `"电源状态"`

#### accessMode（访问模式）
- **类型**: `string`
- **必填**: 是
- **枚举值**:
  - `"r"`: 只读，设备只能上报，平台不能下发
  - `"rw"`: 读写，设备可以上报，平台也可以下发
- **示例**: `"r"`, `"rw"`

#### dataType（数据类型）
- **类型**: `string`
- **必填**: 是
- **枚举值**:
  - `"int"`: 整数型
  - `"float"`: 单精度浮点型
  - `"double"`: 双精度浮点型
  - `"enum"`: 枚举型
  - `"bool"`: 布尔型
  - `"text"`: 文本型
  - `"date"`: 时间型
  - `"struct"`: 结构体型
  - `"array"`: 数组型

## 事件数据结构 (ThingModelEvent)

### 基本结构

```typescript
interface ThingModelEvent {
  identifier: string;                   // 事件标识符（必填）
  name: string;                        // 事件名称（必填）
  required?: boolean;                  // 是否必选
  type: string;                        // 事件类型（必填）
  outputParams?: ThingModelParam[];    // 输出参数
  method?: string;                     // 执行方法
}
```

### 字段详细说明

#### type（事件类型）
- **类型**: `string`
- **必填**: 是
- **枚举值**:
  - `"info"`: 信息事件
  - `"alert"`: 告警事件
  - `"error"`: 故障事件

#### outputParams（输出参数）
- **类型**: `ThingModelParam[]`
- **必填**: 否
- **说明**: 事件触发时返回的参数信息

## 服务数据结构 (ThingModelService)

### 基本结构

```typescript
interface ThingModelService {
  identifier: string;                   // 服务标识符（必填）
  name: string;                        // 服务名称（必填）
  required?: boolean;                  // 是否必选
  callType: string;                    // 调用类型（必填）
  inputParams?: ThingModelParam[];     // 输入参数
  outputParams?: ThingModelParam[];    // 输出参数
  method?: string;                     // 执行方法
}
```

### 字段详细说明

#### callType（调用类型）
- **类型**: `string`
- **必填**: 是
- **枚举值**:
  - `"async"`: 异步调用
  - `"sync"`: 同步调用

## 参数数据结构 (ThingModelParam)

### 基本结构

```typescript
interface ThingModelParam {
  identifier: string;                   // 参数标识符（必填）
  name: string;                        // 参数名称（必填）
  direction: string;                   // 参数方向（必填）
  paraOrder?: number;                  // 参数序号
  dataType: string;                    // 数据类型（必填）
  dataSpecs?: ThingModelDataSpecs;     // 数据规范（非列表型）
  dataSpecsList?: ThingModelDataSpecs[]; // 数据规范（列表型）
}
```

### 字段详细说明

#### direction（参数方向）
- **类型**: `string`
- **必填**: 是
- **枚举值**:
  - `"input"`: 输入参数
  - `"output"`: 输出参数

## 数据规范结构 (ThingModelDataSpecs)

数据规范是一个抽象基类，根据不同的数据类型有不同的具体实现：

### 1. 数值型数据规范 (ThingModelNumericDataSpec)

适用于 `int`、`float`、`double` 类型：

```typescript
interface ThingModelNumericDataSpec {
  dataType: "int" | "float" | "double";
  max: string;                         // 最大值（必填）
  min: string;                         // 最小值（必填）
  step: string;                        // 步长（必填）
  precise?: string;                    // 精度（float/double可选）
  defaultValue?: string;               // 默认值
  unit?: string;                       // 单位符号
  unitName?: string;                   // 单位名称
}
```

### 2. 布尔/枚举型数据规范 (ThingModelBoolOrEnumDataSpecs)

适用于 `bool`、`enum` 类型：

```typescript
interface ThingModelBoolOrEnumDataSpecs {
  dataType: "bool" | "enum";
  name: string;                        // 枚举项名称（必填）
  value: number;                       // 枚举值（必填）
}
```

### 3. 文本/时间型数据规范 (ThingModelDateOrTextDataSpecs)

适用于 `text`、`date` 类型：

```typescript
interface ThingModelDateOrTextDataSpecs {
  dataType: "text" | "date";
  length?: number;                     // 数据长度（text类型需要，最大2048）
  defaultValue?: string;               // 默认值
}
```

### 4. 数组型数据规范 (ThingModelArrayDataSpecs)

适用于 `array` 类型：

```typescript
interface ThingModelArrayDataSpecs {
  dataType: "array";
  size: number;                        // 数组元素个数（必填）
  childDataType: string;               // 数组元素数据类型（必填）
  dataSpecsList?: ThingModelDataSpecs[]; // 子元素数据规范（struct类型时）
}
```

**childDataType 枚举值**:
- `"struct"`: 结构体
- `"int"`: 整数
- `"float"`: 单精度浮点
- `"double"`: 双精度浮点
- `"text"`: 文本

### 5. 结构体型数据规范 (ThingModelStructDataSpecs)

适用于 `struct` 类型：

```typescript
interface ThingModelStructDataSpecs {
  dataType: "struct";
  identifier: string;                  // 属性标识符（必填）
  name: string;                        // 属性名称（必填）
  accessMode: string;                  // 操作类型（必填）
  required?: boolean;                  // 是否必选
  childDataType: string;               // 子数据类型（必填）
  dataSpecs?: ThingModelDataSpecs;     // 数据规范（非列表型）
  dataSpecsList?: ThingModelDataSpecs[]; // 数据规范（列表型）
}
```

**childDataType 枚举值**:
- `"int"`: 整数
- `"float"`: 单精度浮点
- `"double"`: 双精度浮点
- `"text"`: 文本
- `"date"`: 时间
- `"enum"`: 枚举
- `"bool"`: 布尔

## 数据类型映射关系

### dataSpecs vs dataSpecsList

- **dataSpecs**: 用于非列表型数据类型（`int`、`float`、`double`、`text`、`date`、`array`）
- **dataSpecsList**: 用于列表型数据类型（`enum`、`bool`、`struct`）

### JSON多态序列化

数据规范使用Jackson的`@JsonTypeInfo`和`@JsonSubTypes`注解实现多态序列化：

```json
{
  "dataType": "int",
  "max": "100",
  "min": "0",
  "step": "1",
  "unit": "°C",
  "unitName": "摄氏度"
}
```

## 完整示例

### 温度传感器物模型示例

```json
{
  "productId": 1024,
  "productKey": "temperature_sensor",
  "properties": [
    {
      "identifier": "temperature",
      "name": "温度",
      "accessMode": "r",
      "required": true,
      "dataType": "float",
      "dataSpecs": {
        "dataType": "float",
        "max": "100.0",
        "min": "-40.0",
        "step": "0.1",
        "precise": "1",
        "unit": "°C",
        "unitName": "摄氏度"
      }
    },
    {
      "identifier": "power_switch",
      "name": "电源开关",
      "accessMode": "rw",
      "required": false,
      "dataType": "bool",
      "dataSpecsList": [
        {
          "dataType": "bool",
          "name": "关闭",
          "value": 0
        },
        {
          "dataType": "bool",
          "name": "开启",
          "value": 1
        }
      ]
    }
  ],
  "events": [
    {
      "identifier": "high_temperature_alert",
      "name": "高温告警",
      "required": false,
      "type": "alert",
      "outputParams": [
        {
          "identifier": "current_temp",
          "name": "当前温度",
          "direction": "output",
          "dataType": "float",
          "dataSpecs": {
            "dataType": "float",
            "max": "100.0",
            "min": "-40.0",
            "step": "0.1"
          }
        }
      ]
    }
  ],
  "services": [
    {
      "identifier": "reset_device",
      "name": "重置设备",
      "required": false,
      "callType": "async",
      "inputParams": [
        {
          "identifier": "reset_type",
          "name": "重置类型",
          "direction": "input",
          "dataType": "enum",
          "dataSpecsList": [
            {
              "dataType": "enum",
              "name": "软重置",
              "value": 1
            },
            {
              "dataType": "enum",
              "name": "硬重置",
              "value": 2
            }
          ]
        }
      ],
      "outputParams": [
        {
          "identifier": "result",
          "name": "执行结果",
          "direction": "output",
          "dataType": "bool",
          "dataSpecsList": [
            {
              "dataType": "bool",
              "name": "失败",
              "value": 0
            },
            {
              "dataType": "bool",
              "name": "成功",
              "value": 1
            }
          ]
        }
      ]
    }
  ]
}
```

## 前端使用建议

### 1. TypeScript类型定义

建议在前端项目中定义完整的TypeScript接口，确保类型安全：

```typescript
// 定义完整的类型接口
export interface IotThingModelTSLRespVO {
  productId: number;
  productKey: string;
  properties: ThingModelProperty[];
  events: ThingModelEvent[];
  services: ThingModelService[];
}

// 使用联合类型处理数据规范的多态性
export type ThingModelDataSpecs = 
  | ThingModelNumericDataSpec
  | ThingModelBoolOrEnumDataSpecs
  | ThingModelDateOrTextDataSpecs
  | ThingModelArrayDataSpecs
  | ThingModelStructDataSpecs;
```

### 2. 数据验证

```typescript
// 验证数据类型和数据规范的一致性
function validateDataSpecs(dataType: string, dataSpecs: any): boolean {
  switch (dataType) {
    case 'int':
    case 'float':
    case 'double':
      return dataSpecs.dataType === dataType && 
             dataSpecs.max !== undefined && 
             dataSpecs.min !== undefined;
    case 'bool':
    case 'enum':
      return Array.isArray(dataSpecs) && 
             dataSpecs.every(spec => spec.name && spec.value !== undefined);
    // ... 其他类型验证
    default:
      return false;
  }
}
```

### 3. 数据转换工具

```typescript
// 将后端数据转换为前端展示格式
function formatPropertyValue(property: ThingModelProperty, value: any): string {
  if (property.dataType === 'enum' || property.dataType === 'bool') {
    const spec = property.dataSpecsList?.find(s => s.value === value);
    return spec?.name || String(value);
  }
  
  if (property.dataType === 'float' || property.dataType === 'double') {
    const unit = property.dataSpecs?.unit || '';
    return `${value}${unit}`;
  }
  
  return String(value);
}
```

## 注意事项

1. **数据规范选择**: 根据`dataType`选择使用`dataSpecs`还是`dataSpecsList`
2. **标识符唯一性**: 在同一产品下，所有功能的`identifier`必须唯一
3. **数据类型一致性**: 参数的`dataType`必须与其`dataSpecs`的`dataType`保持一致
4. **枚举值处理**: 布尔型和枚举型数据使用`dataSpecsList`数组存储可选值
5. **嵌套结构**: 结构体和数组类型可能包含嵌套的数据规范定义
6. **版本兼容**: 物模型结构可能随版本演进，前端需要做好兼容性处理

这个数据结构为IoT设备的完整功能描述提供了标准化的格式，支持复杂的数据类型和嵌套结构，能够满足各种IoT设备的建模需求。

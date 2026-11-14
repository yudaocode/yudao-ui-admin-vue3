import { computed, ref, toRaw, type Ref } from 'vue'

/**
 * 可选的无 UI 表单状态 hook（名称与导出对齐上游 packages/hooks/src/useForm.ts，来源 c7f8db52d、14d2bec7b）
 *
 * - 不依赖任何表单组件实例，不是旧的 schema Form 注册 hook；业务表单直接使用 el-form
 * - values / dirty / reset 只处理顶层字段（浅复制、Object.is 比较），不做嵌套深比较
 * - 0、false 是合法的非空值；本文件的 required 只把 null / undefined / 空白字符串 / 空数组视为空
 * - 本地保留的修复：reset 代次隔离旧校验与提交、校验序号单调递增、dirty 两侧取原始对象比较
 * - 不加入自动导入；el-form 规则中自动导入的 required 仍来自 @/utils/formRules
 */
export type FormModel = object
export type FormField<Model extends FormModel> = Extract<keyof Model, string>
export type FormValidatorResult = string | string[] | null | undefined

export type FormValidator<Value = unknown, Model extends FormModel = FormModel> = (
  value: Value,
  values: Readonly<Model>
) => FormValidatorResult | Promise<FormValidatorResult>

export type FormRules<Model extends FormModel> = Partial<{
  [Field in FormField<Model>]:
    | FormValidator<Model[Field], Model>
    | FormValidator<Model[Field], Model>[]
}>

export type FormErrors<Model extends FormModel> = Partial<Record<FormField<Model>, string[]>>

export type FormErrorInput<Model extends FormModel> = Partial<
  Record<FormField<Model>, string | string[] | null | undefined>
>

export interface UseFormOptions<Model extends FormModel> {
  initialValues: Model
  rules?: FormRules<Model>
}

type FieldInput<Model extends FormModel> = FormField<Model> | readonly FormField<Model>[]

const toArray = <Value>(value: Value | readonly Value[]) =>
  (Array.isArray(value) ? value : [value]) as readonly Value[]

const clone = <Model extends FormModel>(values: Model) => ({ ...values }) as Model

const message = (value: string | (() => string)) => (typeof value === 'function' ? value() : value)

/**
 * 本 hook 的必填校验函数（与上游同名），需从 @/hooks/web/useForm 显式导入；
 * 与自动导入的 @/utils/formRules required（Element Plus FormItemRule 对象）不是同一个
 */
export const required = (
  errorMessage: string | (() => string) = 'This field is required'
): FormValidator => {
  return (value) => {
    const empty =
      value == null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    return empty ? message(errorMessage) : undefined
  }
}

export const useForm = <Model extends FormModel>(options: UseFormOptions<Model>) => {
  let initialValues = clone(options.initialValues)
  const values = ref(clone(initialValues)) as Ref<Model>
  const errors = ref<FormErrors<Model>>({}) as Ref<FormErrors<Model>>
  const touchedFields = ref<FormField<Model>[]>([]) as Ref<FormField<Model>[]>
  const validating = ref(false)
  const submitting = ref(false)
  const submitError = ref<unknown>(null)
  const submitCount = ref(0)

  // 表单代次：reset 后递增，reset 之前开始的校验、提交不再写入状态
  let epoch = 0
  let activeValidations = 0
  // 校验序号单调递增（reset 也不归零），避免 reset 前的旧校验与新校验序号相同而覆盖结果
  let validationSeq = 0
  const validationVersions = new Map<FormField<Model>, number>()

  const dirtyFields = computed(() => {
    const fields = new Set([
      ...Object.keys(initialValues),
      ...Object.keys(values.value)
    ] as FormField<Model>[])
    // 两侧都取原始对象再比较：初始值为 reactive 时，同一引用不被误判为已修改
    return [...fields].filter(
      (field) => !Object.is(toRaw(values.value[field]), toRaw(initialValues[field]))
    )
  })
  const dirty = computed(() => dirtyFields.value.length > 0)
  const hasErrors = computed(() =>
    (Object.values(errors.value) as Array<string[] | undefined>).some(
      (messages) => messages && messages.length > 0
    )
  )

  const setValue = <Field extends FormField<Model>>(field: Field, value: Model[Field]) => {
    values.value[field] = value
  }

  const setValues = (nextValues: Partial<Model>) => {
    Object.assign(values.value, nextValues)
  }

  const touch = (fields: FieldInput<Model>) => {
    touchedFields.value = [
      ...new Set([...touchedFields.value, ...toArray(fields)])
    ] as FormField<Model>[]
  }

  const clearErrors = (fields?: FieldInput<Model>) => {
    if (!fields) {
      errors.value = {}
      return
    }

    const nextErrors = { ...errors.value }
    toArray(fields).forEach((field) => delete nextErrors[field])
    errors.value = nextErrors
  }

  const setErrors = (nextErrors: FormErrorInput<Model>) => {
    const merged = { ...errors.value }
    for (const field of Object.keys(nextErrors) as FormField<Model>[]) {
      const fieldMessages = nextErrors[field] as string | string[] | null | undefined
      if (fieldMessages == null || fieldMessages.length === 0) delete merged[field]
      else merged[field] = typeof fieldMessages === 'string' ? [fieldMessages] : fieldMessages
    }
    errors.value = merged
  }

  const validateField = async (field: FormField<Model>) => {
    touch(field)
    const configured = options.rules?.[field]
    const validators = configured
      ? (toArray(configured) as readonly FormValidator<Model[typeof field], Model>[])
      : []
    const currentEpoch = epoch
    const version = ++validationSeq
    validationVersions.set(field, version)
    activeValidations += 1
    validating.value = true

    const fieldErrors: string[] = []
    try {
      for (const validator of validators) {
        try {
          const result = await validator(values.value[field], values.value)
          if (result) fieldErrors.push(...toArray(result))
        } catch (error) {
          fieldErrors.push(error instanceof Error ? error.message : String(error))
        }
      }

      // 只有该字段最新一次、且 reset 之后开始的校验可以写入错误
      if (currentEpoch === epoch && validationVersions.get(field) === version) {
        setErrors({ [field]: fieldErrors } as FormErrorInput<Model>)
      }
      return fieldErrors.length === 0
    } finally {
      // reset 已清零计数，旧校验结束时不再改动
      if (currentEpoch === epoch) {
        activeValidations -= 1
        validating.value = activeValidations > 0
      }
    }
  }

  const validate = async () => {
    const fields = Object.keys(options.rules ?? {}) as FormField<Model>[]
    const results = await Promise.all(fields.map(validateField))
    return results.every(Boolean)
  }

  // 同一时间只允许一次提交；reset 后旧提交的结果、错误与结束状态不影响新的提交
  const submit = async <Result>(handler: (formValues: Model) => Promise<Result> | Result) => {
    if (submitting.value) return undefined

    const currentEpoch = epoch
    submitting.value = true
    submitError.value = null
    submitCount.value += 1
    try {
      if (!(await validate())) return undefined
      if (currentEpoch !== epoch) return undefined
      return await handler(clone(values.value))
    } catch (error) {
      if (currentEpoch === epoch) submitError.value = error
      throw error
    } finally {
      if (currentEpoch === epoch) submitting.value = false
    }
  }

  const reset = (nextValues?: Model) => {
    epoch += 1
    if (nextValues) initialValues = clone(nextValues)
    values.value = clone(initialValues)
    errors.value = {}
    touchedFields.value = []
    submitError.value = null
    submitting.value = false
    activeValidations = 0
    validating.value = false
    validationVersions.clear()
  }

  return {
    state: {
      values,
      errors,
      touchedFields,
      dirtyFields,
      dirty,
      hasErrors,
      validating,
      submitting,
      submitError,
      submitCount
    },
    actions: {
      setValue,
      setValues,
      setErrors,
      clearErrors,
      touch,
      validateField,
      validate,
      submit,
      reset
    }
  }
}

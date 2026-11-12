import { computed, ref, toRaw, type Ref } from 'vue'

/**
 * 可选的无 UI 表单状态 hook（参考上游 c7f8db52d packages/hooks/useForm）
 *
 * - 独立于现有基于 Form 组件实例的 useForm，不自动迁移业务表单
 * - values / dirty / reset 只处理顶层字段（浅复制、Object.is 比较），不做嵌套深比较
 * - 0、false 是合法的非空值；requiredModelField 只把 null / undefined / 空白字符串 / 空数组视为空
 */
export type ModelFormValues = object
export type ModelFormField<Model extends ModelFormValues> = Extract<keyof Model, string>
export type ModelFormValidatorResult = string | string[] | null | undefined

export type ModelFormValidator<Value = unknown, Model extends ModelFormValues = ModelFormValues> = (
  value: Value,
  values: Readonly<Model>
) => ModelFormValidatorResult | Promise<ModelFormValidatorResult>

export type ModelFormRules<Model extends ModelFormValues> = Partial<{
  [Field in ModelFormField<Model>]:
    | ModelFormValidator<Model[Field], Model>
    | ModelFormValidator<Model[Field], Model>[]
}>

export type ModelFormErrors<Model extends ModelFormValues> = Partial<
  Record<ModelFormField<Model>, string[]>
>

export type ModelFormErrorInput<Model extends ModelFormValues> = Partial<
  Record<ModelFormField<Model>, string | string[] | null | undefined>
>

export interface UseModelFormOptions<Model extends ModelFormValues> {
  initialValues: Model
  rules?: ModelFormRules<Model>
}

type FieldInput<Model extends ModelFormValues> =
  | ModelFormField<Model>
  | readonly ModelFormField<Model>[]

const toArray = <Value>(value: Value | readonly Value[]) =>
  (Array.isArray(value) ? value : [value]) as readonly Value[]

const clone = <Model extends ModelFormValues>(values: Model) => ({ ...values }) as Model

const message = (value: string | (() => string)) => (typeof value === 'function' ? value() : value)

/** 必填校验：命名与全局的 required 规则区分 */
export const requiredModelField = (
  errorMessage: string | (() => string) = 'This field is required'
): ModelFormValidator => {
  return (value) => {
    const empty =
      value == null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    return empty ? message(errorMessage) : undefined
  }
}

export const useModelForm = <Model extends ModelFormValues>(
  options: UseModelFormOptions<Model>
) => {
  let initialValues = clone(options.initialValues)
  const values = ref(clone(initialValues)) as Ref<Model>
  const errors = ref<ModelFormErrors<Model>>({}) as Ref<ModelFormErrors<Model>>
  const touchedFields = ref<ModelFormField<Model>[]>([]) as Ref<ModelFormField<Model>[]>
  const validating = ref(false)
  const submitting = ref(false)
  const submitError = ref<unknown>(null)
  const submitCount = ref(0)

  // 表单代次：reset 后递增，reset 之前开始的校验、提交不再写入状态
  let epoch = 0
  let activeValidations = 0
  // 校验序号单调递增（reset 也不归零），避免 reset 前的旧校验与新校验序号相同而覆盖结果
  let validationSeq = 0
  const validationVersions = new Map<ModelFormField<Model>, number>()

  const dirtyFields = computed(() => {
    const fields = new Set([
      ...Object.keys(initialValues),
      ...Object.keys(values.value)
    ] as ModelFormField<Model>[])
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

  const setValue = <Field extends ModelFormField<Model>>(field: Field, value: Model[Field]) => {
    values.value[field] = value
  }

  const setValues = (nextValues: Partial<Model>) => {
    Object.assign(values.value, nextValues)
  }

  const touch = (fields: FieldInput<Model>) => {
    touchedFields.value = [
      ...new Set([...touchedFields.value, ...toArray(fields)])
    ] as ModelFormField<Model>[]
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

  const setErrors = (nextErrors: ModelFormErrorInput<Model>) => {
    const merged = { ...errors.value }
    for (const field of Object.keys(nextErrors) as ModelFormField<Model>[]) {
      const fieldMessages = nextErrors[field] as string | string[] | null | undefined
      if (fieldMessages == null || fieldMessages.length === 0) delete merged[field]
      else merged[field] = typeof fieldMessages === 'string' ? [fieldMessages] : fieldMessages
    }
    errors.value = merged
  }

  const validateField = async (field: ModelFormField<Model>) => {
    touch(field)
    const configured = options.rules?.[field]
    const validators = configured
      ? (toArray(configured) as readonly ModelFormValidator<Model[typeof field], Model>[])
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
        setErrors({ [field]: fieldErrors } as ModelFormErrorInput<Model>)
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
    const fields = Object.keys(options.rules ?? {}) as ModelFormField<Model>[]
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

import { onBeforeUnmount, ref, toRaw } from 'vue'
import type * as Monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type MonacoApi = typeof Monaco
type EditorOptions = Monaco.editor.IStandaloneEditorConstructionOptions

let monacoPromise: Promise<MonacoApi> | undefined

// 首次创建编辑器时才加载 monaco（参考上游 00989b7ac），worker 使用 Vite 原生 ?worker；
// 页面已有 MonacoEnvironment（如其它 monaco 封装）时不覆写
const loadMonaco = (): Promise<MonacoApi> => {
  if (!monacoPromise) {
    monacoPromise = import('monaco-editor').then((monaco) => {
      if (!self.MonacoEnvironment) {
        self.MonacoEnvironment = {
          getWorker(_, label) {
            if (label === 'json') {
              return new jsonWorker()
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
              return new cssWorker()
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
              return new htmlWorker()
            }
            if (label === 'typescript' || label === 'javascript') {
              return new tsWorker()
            }
            return new editorWorker()
          }
        }
      }
      return monaco
    })
    // 加载失败时允许下次重试
    monacoPromise.catch(() => (monacoPromise = undefined))
  }
  return monacoPromise
}

export function useMonacoEditor(language: string = 'javascript') {
  let monaco: MonacoApi | undefined
  // 编辑器实例：每个 hook 最多一个
  let monacoEditor: Monaco.editor.IStandaloneCodeEditor | null = null
  // 由本 hook 创建的 model；调用方通过 options.model 传入的 model 归调用方所有，不在此释放
  let ownedModel: Monaco.editor.ITextModel | null = null
  // 事件句柄，随编辑器一起释放
  const disposables: Monaco.IDisposable[] = []
  let creating: Promise<Monaco.editor.IStandaloneCodeEditor | null> | undefined
  let disposed = false
  // 目标元素
  const monacoEditorRef = ref<HTMLElement>()

  // 创建实例：monaco 异步加载，传入函数时在加载完成后取值，保证使用最新的配置；
  // 加载期间已卸载则不创建，重复调用返回同一实例
  async function createEditor(
    editorOption: EditorOptions | (() => EditorOptions) = {}
  ): Promise<Monaco.editor.IStandaloneCodeEditor | null> {
    if (monacoEditor) return monacoEditor
    if (!creating) {
      creating = loadMonaco().then((api) => {
        if (disposed || !monacoEditorRef.value) return null
        monaco = api
        const {
          model,
          value,
          language: optionLanguage,
          ...option
        } = typeof editorOption === 'function' ? editorOption() : editorOption
        // Vue 可能代理调用方的 SDK model，Monaco 必须接收原始实例。
        const externalModel = toRaw(model)
        if (externalModel === undefined) {
          ownedModel = api.editor.createModel(value ?? '', optionLanguage ?? language)
        } else if (externalModel && optionLanguage) {
          // 调用方 model 同样以传入的 language 为准（加载完成时的最新值）；只改语言，不接管其生命周期
          api.editor.setModelLanguage(externalModel, optionLanguage)
        }
        monacoEditor = api.editor.create(monacoEditorRef.value, {
          // 是否启用预览图
          minimap: { enabled: true },
          // 圆角
          roundedSelection: true,
          // 主题
          theme: 'vs-dark',
          // 主键
          multiCursorModifier: 'ctrlCmd',
          // 滚动条
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          },
          // 行号
          lineNumbers: 'on',
          // tab大小
          tabSize: 2,
          //字体大小
          fontSize: 14,
          // 控制编辑器在用户键入、粘贴、移动或缩进行时是否应自动调整缩进
          autoIndent: 'advanced',
          // 自动布局
          automaticLayout: true,
          ...option,
          model: externalModel === undefined ? ownedModel : externalModel
        })
        return monacoEditor
      })
      // 加载失败时允许重新创建
      creating.catch(() => (creating = undefined))
    }
    return creating
  }

  // 登记事件句柄，释放编辑器时一并释放
  function track(disposable: Monaco.IDisposable) {
    disposables.push(disposable)
  }

  // 格式化：仅在调用方显式调用时执行，不在赋值后自动格式化
  async function formatDoc() {
    await monacoEditor?.getAction('editor.action.formatDocument')?.run()
  }

  // 数据更新：内容不同才写入；只读不影响程序写入，不修改 readOnly
  function updateVal(val: string) {
    if (monacoEditor && monacoEditor.getValue() !== val) {
      monacoEditor.setValue(val)
    }
  }

  // 配置更新
  function updateOptions(opt: Monaco.editor.IEditorOptions & Monaco.editor.IGlobalEditorOptions) {
    monacoEditor?.updateOptions(opt)
  }

  // 获取配置
  function getOption<T extends Monaco.editor.EditorOption>(name: T) {
    return monacoEditor?.getOption(name)
  }

  // 获取实例
  function getEditor() {
    return monacoEditor
  }

  function changeLanguage(newLanguage: string) {
    const model = monacoEditor?.getModel()
    if (monaco && model) {
      monaco.editor.setModelLanguage(model, newLanguage)
    }
  }

  // 注意：monaco 的主题是全局的，切换会作用于页面上所有 monaco 编辑器
  function changeTheme(newTheme: string) {
    monaco?.editor.setTheme(newTheme)
  }

  // 页面离开 销毁：事件句柄、编辑器及自建 model
  function dispose() {
    disposed = true
    disposables.splice(0).forEach((item) => item.dispose())
    monacoEditor?.dispose()
    monacoEditor = null
    ownedModel?.dispose()
    ownedModel = null
  }

  onBeforeUnmount(dispose)

  return {
    monacoEditorRef,
    createEditor,
    track,
    getEditor,
    updateVal,
    updateOptions,
    getOption,
    formatDoc,
    changeLanguage,
    changeTheme
  }
}

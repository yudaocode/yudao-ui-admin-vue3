const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
  ['blockquote', 'code-block'], // 引用  代码块
  [{ header: 1 }, { header: 2 }], // 1、2 级标题
  [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
  [{ script: 'sub' }, { script: 'super' }], // 上标/下标
  [{ indent: '-1' }, { indent: '+1' }], // 缩进
  // [{'direction': 'rtl'}],                         // 文本方向
  [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
  [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
  [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
  [{ font: [] }], // 字体种类
  [{ align: [] }], // 对齐方式
  ['clean'], // 清除文本格式
  ['link', 'image', 'video'] // 链接、图片、视频
]

export default {
  theme: 'snow',
  placeholder: '请输入文章内容',
  modules: {
    toolbar: {
      container: toolbarOptions,
      // container: "#toolbar",
      handlers: {
        image: function (value) {
          if (value) {
            // 触发input框选择图片文件
            document.querySelector('.avatar-uploader input').click()
          } else {
            this.quill.format('image', false)
          }
        },
        link: function (value) {
          if (value) {
            const href = prompt('注意！只支持公众号图文链接')
            this.quill.format('link', href)
          } else {
            this.quill.format('link', false)
          }
        }
      }
    }
  }
}

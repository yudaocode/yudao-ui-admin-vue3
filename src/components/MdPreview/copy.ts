export const copyText = (content: string) => {//复制
    // content = content.replace(/^\s/,'')
    navigator.clipboard.writeText(content).then(function () {
      ElMessage({
        message: '复制成功!',
        type: 'success',
      })
    }).catch(function () {
        (function (content) {
            document.oncopy = function (e) {
                e.clipboardData?.setData('text', content);
                e.preventDefault();
                document.oncopy = null;
                ElMessage({
                  message: '复制成功!',
                  type: 'success',
                })
            };
        })(content);
        document.execCommand('copy');
    });
};

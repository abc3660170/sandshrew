var { getAppConfig } = require("./utils/utils");
module.exports = {
    assetsDir: 'packages/website/src/assets',
    chainWebpack: config => {
        config
            .plugin('define')
            .tap(args => {
                args[0]['process.env'] = {
                    ...args[0],
                    'VUE_APP_PORT': JSON.stringify(getAppConfig().port)
                }
                console.log(args)
                return args
            })
    },
    pages: {
        index:{
            entry: 'packages/website/src/main.js',
            // 模板来源
            template: 'packages/website/public/index.html',
            // 在 dist/index.html 的输出
            filename: 'index.html',
            // 当使用 title 选项时，
            // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
            title: 'Sandshrew',
            // 在这个页面中包含的块，默认情况下会包含
            // 提取出来的通用 chunk 和 vendor chunk。
            chunks: ['chunk-vendors', 'chunk-common', 'index']
        }
        
    }
}

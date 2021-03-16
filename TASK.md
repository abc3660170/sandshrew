1. ～～封装local-npm的接口～～
1. ～～调用npmjs的服务查询包信息(npmjs-api)～～
1. 支持上传package.json 文件 解析 dependences 和  devDependences 让用户选择性下载依赖，默认只下载 dependences
1. 界面提示下载操作只能单线程做，把目前的下载包操作改为异步
1. 下载的文件名支持用户自定义，系统补充上时间戳即可
1. 可以查看包详情，跳转到包的主页
1. 美化包详情部分的样式
1. 美化已选包部分的样式
1. 下载前检测dependency是否存在不存在则安装失败
1. 部署到内网时包查询功能
1. 保证抽取和导入不能同时进行

***
2021-03-16

1. express 的不同源跨域问题解决
1. config.yaml 合理性分组
1. config.yaml 中的 local-npm 里的url必须改为绝对ip
1. npm install 必须增加环境变量
1. 服务端口问题统一用配置做，目前都是hard coding进去的
1. fee-local-npm 中的getTarLocation 需要针对内网进行优化, 建议通过配置去改进，而不是一斧头统一掉，外网该有外网的通用逻辑，内网是专用逻辑

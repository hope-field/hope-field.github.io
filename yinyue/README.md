## 音悦 ~ 一款 PWA 版的在线音乐 APP

**[Version Of Progressive Web App](https://yinyue.now.sh)** 

**Serverless**

基于 Serverless ，项目前后端分离，代码部署在 **zeit** 平台上。

**技术栈**

JavaScript

CSS3、Sass

Koa2 、axios

PWA ( Manifest / Service Worker / cacheStorage )

**后端部分** 

用 Koa2 搭建简易的 HTTP Server ，用来提供路由和处理请求。

为前端提供用户请求音乐相关数据的接口。

**前端部分** 

基于 rem 和 vw 的移动端适配。

基于 CSS3 和原生 JS 配合实现的一些页面动态效果。

音乐播放器的基本功能：

  * 上下首切换
  * 播放顺序的改变
  * 添加歌曲到歌单，歌单播放，歌单歌曲删除

歌曲、歌手的搜索功能。

歌手页数据的请求，每个歌手只有 30 首歌曲可以播放，因为 QQ 音乐给的接口只有 30 首哈哈 ^_^

**PWA 部分** 

基于 Manifest ，实现应用可添加到桌面等功能。

基于 Service Worker ，实现静态资源的预缓存，拦截请求并对其进行处理，比如图片和音乐可以通过拦截然后进行缓存，这样在离线的情况下仍能够播放音乐。

基于 cacheStorage ，它是与 Service Worker 一起使用的一个 API，但与 localStorage 和 sessionStorage 不同，因为当用户退出页面后，放在它里面的缓存数据仍然有效。利用这个特性可以实现保存用户歌单的简单功能，意思是每次用户退出然后再次进入时，歌单里面的歌曲仍然存在而不会初始化，当前显示的歌曲仍和用户退出时显示的歌曲一致。

> 本项目是适配的移动端所以在网站中打开时请自行切换到移动端视角查看，然后就是 iOS 请长按项目地址拷贝后用 Safari 打开，点击正下角的按钮然后将应用添加到桌面。需要注意的是只有 iOS 系统升级到 11.3.0 以上才会支持 Service Worker 缓存功能，不过没有升级添加到桌面后也能看，应有的效果还是有的，只是不能做到重启应用后秒开的效果。Android 可通过手机谷歌浏览器打开点击右上角按钮然后有添加到主屏幕的选项。



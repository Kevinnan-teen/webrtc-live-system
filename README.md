# webrtc 流媒体直播系统

基于 webrtc 的流媒体直播系统。前端用 Layui + Bootstrap 构建，后端用 nodejs。功能主要包含 WebRTC 和 RTMP+HTTP-FLV 流媒体直播以及直播间内 group chat。

#### 调试代码（建议本地安装 nodejs 环境）

- 安装 nvm 管理 nodejs 版本，安装 npm 管理 nodejs 包。

- 进入`models`目录，创建数据库和数据表（用户数据表、直播间数据表）

  ```shell
  node create_talbe.js
  ```

- 进入项目根目录，运行程序：`node app.js`

- 在浏览器端用`http://localhost:3000`访问项目主页

- webrtc 使用 nodejs 实现，浏览器 js 要调用 nodejs 的模块只能现将符合 CommonJS 的 Nodejs 代码转换为浏览器端可以调用的 js 代码，这里用到前端模块化工具`Browserify`。在在调试位于`public/js`目录下的 WebRTC 模块时，每次修改后需执行以下命令转换为浏览器可以调用的 js 代码。

  ```sh
  // 直播间页面支持 webrtc
  $ browserify room_webrtc.js > room_webrtc_compiled.js
  // webrtc 推流页面
  $ browserify publish_webrtc.js > publish_webrtc_compiled.js
  ```

#### 功能介绍

- 用户注册、登录
- 用户信息管理（查看用户 ID、用户名、账号创建时间），申请成为主播
- 直播管理（直播间ID、RTMP 推流、WebRTC 推流）
- 直播间（实时流媒体支持 HTTP-FLV 和 WebRTC、弹幕聊天）

#### 项目演示

[项目演示](./doc/demo.md)

#### 实现细节

- TO DO

#### ToDo

- [x] 基于 nodejs + webSocket 实现 WebRTC 信令服务器，获取 WebRTC 流媒体数据并播放
- [ ] 使用 NoSQL 数据库（如 Mangodb）存储历史消息

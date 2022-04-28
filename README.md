# webrtc 流媒体直播系统

基于 webrtc 的流媒体直播系统。前端用 Layui + Bootstrap 构建，后端用 nodejs。功能主要包含 WebRTC 和 RTMP+HTTP-FLV 流媒体直播以及直播间内 group chat。

#### 调试代码（建议本地安装 nodejs 环境）

- 安装 nvm 管理 nodejs 版本，安装 npm 管理 nodejs 包。
- 进入`models`目录，创建数据库和数据表（用户数据表、直播间数据表）
- 进入项目跟目录，运行程序：`node app.js`
- 在浏览器端用`http://localhost:3000`访问项目主页

#### 功能介绍

- 用户注册、登录；
- 用户信息管理（查看用户 ID、用户名、账号创建时间），申请成为主播；
- 直播管理（直播间ID、直播 RTMP 推流地址）；
- 直播间（实时流媒体、弹幕聊天）；

#### 项目演示

[项目演示](./doc/demo.md)

#### 实现细节

- TO DO

#### ToDo

- [ ] 用户信息页面（profile.ejs）添加推流地址
- [ ] 使用 NoSQL 数据库（如 Mangodb）存储历史消息
- [ ] 基于 nodejs + webSocket 实现 WebRTC 信令服务器，获取 WebRTC 流媒体数据并播放

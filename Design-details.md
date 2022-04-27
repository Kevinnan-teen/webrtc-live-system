# Design details

### unresolved problems

- [ ] 用户申请直播间，由于 Anchor 数据表的主键是 room_id，这无法避免一个用户申请多个直播间的情况；可以在 insert 之前先查找 anchor table 是否存在 user_id。

### 1、Data models

#### User Table

用户ID 默认从`1`开始。

| 字段名 | 字段缩略  | 字段类型 |
| ------ | --------- | -------- |
| 用户ID | user_id   | int      |
| 用户名 | user_name | string   |
| 密码   | password  | string   |

#### Anchor Table

普通用户可申请成为主播。

用户可以自己选择 room_id，申请成功后可以获得对应的直播间号 room_id 。

> 添加直播间标题！

| 字段名     | 字段缩略   | 字段类型 |
| ---------- | ---------- | -------- |
| 直播间ID   | room_id    | int      |
| 用户ID     | user_id    | int      |
| 直播间标题 | room_title | string   |

> message 相关数据都保存在 NoSQL 数据库中，方便随时读写。

#### message_id

对于 one-on-one 聊天，为了保证消息正确顺序，只能有一个全局 msg_id。

用户发送的每条消息都有对应的 message_id ，message_id 可以保证消息的正确顺序。

msg_id 从 `0`开始。

| 字段名 | 字段缩略 | 字段类型 |
| ------ | -------- | -------- |
|        |          |          |
| 消息ID | msg_id   | bigint   |

#### group_message_id

对于 group chat ，用户发送到每个直播间的消息都有对应的 group_message_id，group_message_id 保证消息的正确顺序。

msg_id 从 `0`开始。

| 字段名   | 字段缩略 | 字段类型 |
| -------- | -------- | -------- |
| 直播间ID | room_id  | int      |
| 消息ID   | msg_id   | bigint   |

#### Message Table

one-on-one chat 消息 数据库表。

主键：（msg_id，msg_from_user_id，msg_to_user_id）

| 字段名       | 字段缩略         | 字段类型  |
| ------------ | ---------------- | --------- |
| 消息ID       | msg_id           | bigint    |
| 发送方用户ID | msg_from_user_id | int       |
| 接收方用户ID | msg_to_user_id   | int       |
| 消息内容     | msg_content      | text      |
| 创建时间     | created_at       | timestamp |

#### Group Message Table

group chat 消息 数据库表。

主键：（room_id, message_id）。room_id 区分不同的频道/直播间。message_id 的作用同上。

| 字段名     | 字段缩略    | 字段类型  |
| ---------- | ----------- | --------- |
| 消息ID     | msg_id      | bigint    |
| 直播间ID   | room_id     | int       |
| 发送用户ID | user_id     | int       |
| 消息内容   | msg_content | text      |
| 创建时间   | created_at  | timestamp |


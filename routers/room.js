const Router = require('koa-router');

const {renderRoom, specialRoomInfoPOSTAPI} = require('../controllers/room');

let room_router = new Router();
room_router.get('room', renderRoom)
.post('api/specialRoomInfo-post', specialRoomInfoPOSTAPI)

module.exports = room_router;

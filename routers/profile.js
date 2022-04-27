const Router = require('koa-router');

const {renderProfile, profilePostAPI, modifyRoomTitlePostAPI}
       = require('../controllers/profile');

let profile_router = new Router();
profile_router.get('profile', renderProfile)
.post('api/profile-post', profilePostAPI)
.post('api/modifyRoomTitle-post', modifyRoomTitlePostAPI)

module.exports = profile_router;

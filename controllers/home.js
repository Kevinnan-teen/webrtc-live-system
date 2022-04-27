const {findAllRooms} = require('../models/sql_exec');

let renderIndex = async function(ctx){
    await ctx.render('index');
}

let roomInfoGetAPI = async function(ctx){
    if(ctx.isAuthenticated()){
        var found_data = await findAllRooms();
        ctx.body = {
            room_data: found_data
        }
    }else{
        ctx.body = {
            room_data: []
        }
    }
}

module.exports = {renderIndex, roomInfoGetAPI}

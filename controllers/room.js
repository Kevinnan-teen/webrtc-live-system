const {findSpecialRoomByRoomid} = require('../models/sql_exec');

let renderRoom = async function(ctx){
    if(ctx.isAuthenticated()){
       await ctx.render('room');
    }else{
        ctx.redirect('/');
    }
}

let specialRoomInfoPOSTAPI = async function(ctx){
    if(ctx.isAuthenticated()){
        var data = ctx.request.body;
        var found_data = await findSpecialRoomByRoomid(data.room_id);
        ctx.body = {
            room_data: found_data
        }
    }else{
        ctx.redirect('/');
    }
}

module.exports = {renderRoom, specialRoomInfoPOSTAPI}

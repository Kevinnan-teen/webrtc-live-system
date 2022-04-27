const {findProfileInfoByUsername, updateAnchorRoomTitleByUsername}
       = require('../models/sql_exec');

let renderProfile = async function(ctx){
    if(ctx.isAuthenticated())
        await ctx.render('profile');
    else
        ctx.redirect('/signin');
}

let profilePostAPI = async function(ctx){
    if(ctx.isAuthenticated()){
        var data = ctx.request.body;
        var found_data = await findProfileInfoByUsername(data['user_name']);
        ctx.body = found_data;
    }else{
        ctx.redirect('/signin');
    }
}

let modifyRoomTitlePostAPI = async function(ctx){
    var data = ctx.request.body;
    var ret  = await updateAnchorRoomTitleByUsername(data['user_name'],
                                                     data['new_room_title']);
    if(ret){
        ctx.body = {
            update_status: 1
        };
    }else{
        ctx.body = {
            update_status: 0
        }
    }
}

module.exports = {renderProfile, profilePostAPI, modifyRoomTitlePostAPI} 

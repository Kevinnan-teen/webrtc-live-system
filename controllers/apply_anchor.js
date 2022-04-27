const {findUseridByUsername, insertAnchor} = require('../models/sql_exec');

let applyanchorRender = async function(ctx){
    if(ctx.isAuthenticated()){
        await ctx.render('apply_anchor');
    }else{
        ctx.redirect('/');
    }
}

let applyRoomPostAPI = async function(ctx){
    var data = ctx.request.body;
    var user_id = await findUseridByUsername(data['user_name']);
    var new_room_data = {
        room_id: data['room_id'],
        room_title: data['room_title'],
        user_id: user_id
    };
    var ret = await insertAnchor(new_room_data);
    if(ret){
        console.log('success.');
        ctx.body = {
            apply_status: 1
        }
    }else{
        console.log('fail')
        ctx.body = {
            apply_status: 0
        }
    }
}

module.exports = {applyanchorRender, applyRoomPostAPI}

const path = require('path');
db_name = path.join(__dirname, 'data.db');

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: db_name,
    },
});


let insertUser = async function(data){
    try{
        await knex('users').insert(data);
        console.log('insert user data successfully!');
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}

let insertAnchor = async function(data){
    try{
        await knex('anchor').insert(data);
        console.log('insert anchor data successfully!');
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}

let findUserPasswordByUsername = async function(user_name){
    try{
        var found_data = await knex('users').where(
            {user_name: user_name}
        ).select('password');
        if(found_data.length)
            return found_data[0]['password'];
        else
            return '';
    }catch(err){
        console.log(err);
        return '';
    }
}

let findUserByUsername = async function(user_name){
    try{
        var found_data = await knex('users').where(
            {user_name: user_name}
        );
        if(found_data.length)
            return found_data[0];
        else
            return {};
    }catch(err){
        console.log(err);
        return {};
    }
}

let findUserAndRoomByUsername = async function(user_name){
    try{
        var found_data = await knex('users')
            .join('anchor', 'users.user_id', '=', 'anchor.user_id')
            .select('users.user_id', 'users.user_name', 'users.created_at',
                'anchor.room_id', 'anchor.room_title')
            .where({user_name: user_name})
        if(found_data.length)
            return found_data[0];
        else
            return {};
    }catch(err){
        console.log(err);
        return {};
    }
}

/*
 * 通过用户名查找Profile信息
 * user_id user_name created_at room_id room_title
 * 如果没有创建直播间，只返回 user_id user_name created_ad
 * */
let findProfileInfoByUsername = async function(user_name){
    var found_data = await findUserAndRoomByUsername(user_name);
    if(Object.keys(found_data).length)
        return found_data;
    else{
        found_data = await findUserByUsername(user_name);
        found_data = {
            user_id: found_data['user_id'],
            user_name: found_data['user_name'],
            created_at: found_data['created_at']
        };
        return found_data;
    }
    return {};
}

let findUseridByUsername = async function(user_name){
    try{
        var found_data = await knex('users')
                            .select('user_id')
                            .where('user_name', '=', user_name)
        if(found_data.length)
            return found_data[0]['user_id'];
        else
            return {};
    }catch(err){
        console.log(err);
        return {};
    }
}

let findAllRooms = async function()
{
    try{
        var found_data = await knex('anchor')
            .join('users', 'anchor.user_id', '=', 'users.user_id')
            .select('users.user_id', 'users.user_name', 'anchor.room_id',
                    'anchor.room_title');
        if(found_data.length)
            return found_data;
        else
            return [];
    }catch(err){
        console.log(err);
        return [];
    }
}

/*
 * 根据 room_id 查找 room 信息*/
let findSpecialRoomByRoomid = async function(room_id)
{
    try{
        var found_data = await knex('anchor')
            .join('users', 'anchor.user_id', '=', 'users.user_id')
            .select('users.user_id', 'users.user_name', 'anchor.room_id',
                    'anchor.room_title')
            .where('anchor.room_id', '=', room_id);
        if(found_data.length)
            return found_data[0];
        else
            return {};
    }catch(err){
        console.log(err);
        return {};
    }
    
}

/*
 * 更改直播间标题
 * */
let updateAnchorRoomTitleByUsername = async function(user_name, new_room_title)
{
    try{
        var user_id = await findUseridByUsername(user_name);
        await knex('anchor')
            .where('user_id', '=', user_id)
            .update({
                room_title: new_room_title
            })
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}


module.exports = {insertUser, insertAnchor, findUserPasswordByUsername,
                  findUserByUsername, findUserAndRoomByUsername, 
                  findProfileInfoByUsername, findUseridByUsername,
                  updateAnchorRoomTitleByUsername, findAllRooms,
                  findSpecialRoomByRoomid};



const {findUserPasswordByUsername, findUserByUsername, findProfileInfoByUsername,
       findUserAndRoomByUsername, findUseridByUsername,
       updateAnchorRoomTitleByUsername, findAllRooms, findSpecialRoomByRoomid}
       = require('../models/sql_exec');

async function findUserPasswordByUsernameTest()
{
    var user_name_list = [
        'nachr', 'klay', '', 'lucas'
    ];

    for(var i = 0; i < user_name_list.length; i++){
        var found_data = await findUserPasswordByUsername(user_name_list[i]);
        console.log(found_data);
    }
}

async function findUserByUsernameTest()
{
    var user_name_list = [
        'dragon_飞飞i', 'nachr', 'klay'
    ];
    for(var ele of user_name_list){
        var found_data = await findUserByUsername(ele);
        console.log(found_data);
    }
}

async function findUserAndRoomByUsernameTest()
{
    var user_name_list = [
       'nachr', 'klay', '菠萝赛东'
    ];
    for(var ele of user_name_list){
        var found_data = await findUserAndRoomByUsername(ele);
        console.log(Object.keys(found_data).length);
        if(Object.keys(found_data).length)
            console.log(found_data);
        else{
            found_data = await findUserByUsername(ele);
            console.log(found_data);
        }
    }
}

async function findProfileInfoByUsernameTest(){
    var user_name_list = [
       'nachr', 'klay', '菠萝赛东'
    ];
    for(var ele of user_name_list){
        var found_data = await findProfileInfoByUsername(ele);
        console.log(found_data);
    }
}

async function findUseridByUsernameTest(){
    var user_name_list = [
       'nachr', 'klay', '菠萝赛东'
    ];
    for(var ele of user_name_list){
        var found_data = await findUseridByUsername(ele);
        console.log(found_data);
    } 
}

async function findAllRoomsTest()
{
    var found_data = await findAllRooms();
    console.log(found_data);
}

async function findSpecialRoomByRoomidTest()
{
    var room_id_list = [
        '2000', '2002', '20000'
    ];
    for(var ele of room_id_list){
        var found_data = await findSpecialRoomByRoomid(ele);
        console.log(found_data);
    }
}

async function updateAnchorRoomTitleByUsernameTest(){
    new_room_title_list = [
        ['nachr', '直播间标题修改测试1']
    ];
    for(var ele of new_room_title_list){
        var ret = await updateAnchorRoomTitleByUsername(ele[0], ele[1]);
        if(ret)
            console.log('修改直播间标题成功');
        else
            console.log('修改直播间标题失败');
    } 
    
}

//findUserPasswordByUsernameTest();
//findUserByUsernameTest();
//findUserAndRoomByUsernameTest();
//findProfileInfoByUsernameTest();
//findUseridByUsernameTest();
//findAllRoomsTest();
findSpecialRoomByRoomidTest();
//updateAnchorRoomTitleByUsernameTest();

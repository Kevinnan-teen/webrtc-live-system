const {insertUser, insertAnchor} = require('../models/sql_exec');

function randomName(len) {
    len = len || 23;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = chars.length;
    var str = '';
    for (i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return new Date().getTime() + str;
}

async function insertUserTest(){
    // user_name为空字符串，password为空字符串
    // user_name为空字符串，password长度为1000
    // user_name长度为1000，password为空字符串
    // user_name长度为1000，password长度为1000
    data1 = {
        user_name: '',
        password: '',
    };

    data2 = {
        user_name: '',
        password: randomName(1000),
    };

    data3 = {
        user_name: randomName(1000),
        password: '',
    };

    data4 = {
        user_name: randomName(1000),
        password: randomName(1000),
    };

    data5 = {
        user_name: 'dragon_飞飞i',
        password: 'loveyou',
    }

    ret = await insertUser(data1);
    if(ret)
        console.log('----------ss');
    else
        console.log('~~~~~~~~~~~xx');
    //insertUser(data2);  //error : user_name = '' 已经存在，主键约束
    //insertUser(data3);
    //insertUser(data4);
    insertUser(data5);
}

async function insertAnchorTest(){
    data = [
        {room_id: '2000', room_title:'今日无头', user_id: 1},
        {room_id: '2001', room_title:'0基础主播，勿喷', user_id: 2},
        {room_id: '2002', user_id: 3},
    ]
    for(i = 0; i < data.length; i++){
        insertAnchor(data[i]);
    }
}

//insertUserTest();
insertAnchorTest();

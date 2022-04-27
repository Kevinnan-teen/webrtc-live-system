const {Users} = require('../utils/chat_users');

var users = new Users();


function addUserTest(){
    var user_data = [
        {id: '1', user:'nachr', room: '2000'},
        {id: '2', user:'nachr', room: '2000'},
        {id: '3', user:'Lucas', room: '2001'},
        {id: '4', user:'菠萝赛东', room: '2000'},
    ]
    for(var ele of user_data){
        users.addUser(ele.id, ele.user, ele.room);
    }
}

function getUserListTest(){
    console.log(users.getUserList('2000'));
}

addUserTest();
getUserListTest();

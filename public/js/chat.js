var socket = io();

function displayMsgAndScrollToBottom(msg_text){
    var div = document.getElementsByClassName('msg-div')[0];
    div.innerHTML += '<div>' + msg_text + '</div>';
    div.scrollTop = div.scrollHeight;
}



function sendMsg(){
    var msg_text = document.getElementById('msg').value;
    if(msg_text){
        var user_name = '<strong>' + getCookie('user_name') + ': ' + '</strong>';
        msg_text = user_name + msg_text;

        socket.emit('createMessage', {
            text: msg_text
        }, () => {
            document.getElementById('msg').value = '';
        })
    }else{
        console.log('empty');
    }
}

socket.on('connect', () => {
    var param = {
        room_id: getUrlParam('room_id'),
        user_name: getCookie('user_name')
    };
    socket.emit('join', param, (err) => {
        if(err){
            console.log(err);
        }else{
            console.log('join room success');
        }
    })
})

socket.on('disconnect', () => {
    console.log('disconnect from server');
})

socket.on('updateUserList', (users) => {
    // todo : 更新直播间人数
    var users = users.filter((ele, pos) => {
        return users.indexOf(ele) == pos;
    })
    console.log(users);
    user_info = '直播间人数:' + users.length.toString();
    document.getElementById("userList-div").innerHTML = user_info;
})

socket.on('newMessage', (message) => {
    displayMsgAndScrollToBottom(message.text);
})



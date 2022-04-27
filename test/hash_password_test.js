const {hashPassword, checkPassword} = require('../utils/hash_password');


async function hashPasswordTest(){
    var password_list = [
        '123456', 'abcdef', '$%&aaaaaaa'
    ];

    var stored_password_list = [
        '$2b$10$jFFrJr9/xhTINtt9d6KVNe8GRcQQ.rEAak/T9t9loem2PGtBqd/Ta'
    ];

    for(var i = 0; i < password_list.length; i++){
        hashed_password = await hashPassword(password_list[i]);
        console.log(hashed_password);
    }

    var match = await checkPassword(password_list[0], stored_password_list[0]);
    if(match)
        console.log('match');
    else
        console.log('not match');
}

hashPasswordTest();



const bcrypt = require('bcrypt');

const salt_rounds = 10;

let hashPassword = async function(origin_password){
    //bcrypt 每一次 HASH 出来的值不一样
    const hashed_password = await bcrypt.hash(origin_password, salt_rounds);
    return hashed_password;
}

let checkPassword = async function(signin_password, stored_password){
    const match = await bcrypt.compare(signin_password, stored_password);
    return match;
}

module.exports = {hashPassword, checkPassword}


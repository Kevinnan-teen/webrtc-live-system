const bcrypt = require('bcrypt');

const {hashPassword} = require('../utils/hash_password');
const {insertUser} = require('../models/sql_exec');



let renderSignup = async function(ctx){
    await ctx.render('signup');
}

let signupPostAPI = async function(ctx){
    var data            = ctx.request.body;
    var password        = data.password;

    var hashed_password = await hashPassword(password);
    var user_data = {
        user_name:  data.username,
        password:   hashed_password
    };
 
    var ret = await insertUser(user_data);
    
    if(ret){
        ctx.body = {
            signup_status: 1
        }
        //ctx.redirect('/signin');
    }else{
        ctx.body = {
            sign_up_status: 0
        }
    }
}

module.exports = {renderSignup, signupPostAPI}

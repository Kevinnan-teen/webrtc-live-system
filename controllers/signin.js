const {checkPassword} = require('../utils/hash_password');
const {findUserPasswordByUsername} = require('../models/sql_exec');
const passport = require('../utils/passport');

let renderSignin = async function(ctx){
    await ctx.render('signin');
}

let signinPostAPI = async function(ctx, next){
    var data = ctx.request.body;
    
    //var stored_password = await findUserPasswordByUsername(data.username);

    //var ret = await checkPassword(data.password, stored_password);

    //if(ret){
        //ctx.body = {
            //signin_status: 1
        //}
    //}else{
        //ctx.body = {
            //signin_status: 0
        //}
    //}
    return passport.authenticate('local', function(err, user, info){
        if(err){
            ctx.body = {
                code: -1,
                msg: err
            }
        }else if(user){
            ctx.body = {
                code: 0,
                user_info: user,
                msg: info
            };
            ctx.login(user);
        }else{
            ctx.body = {
                code: 1,
                msg: info
            }
        }
    })(ctx, next);
}

module.exports = {renderSignin, signinPostAPI}

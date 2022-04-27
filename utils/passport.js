const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;

const {findUserPasswordByUsername, findProfileInfoByUsername} 
      = require('../models/sql_exec');
const {checkPassword} = require('../utils/hash_password');

passport.serializeUser(function(user, done){
    done(null, user);
})

passport.deserializeUser(function(user, done){
    done(null, user);
})

passport.use(new LocalStrategy(async function(username, password, done){
    var stored_password = await findUserPasswordByUsername(username);
    var found_data = await findProfileInfoByUsername(username);
    console.log(found_data);
    if(stored_password === ''){
        console.log('用户不存在')
        return done(null, false, '用户不存在');
    }
    var ret = await checkPassword(password, stored_password);
    if(ret){
        console.log('登录成功');
        return done(null, found_data, '登录成功');
    }else{
        return done(null, false, '密码错误');
    }
}))

module.exports = passport;

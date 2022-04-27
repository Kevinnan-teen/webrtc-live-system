const Koa            = require('koa');
const Static         = require('koa-static');
const Views          = require('koa-views');
const bodyParser     = require('koa-bodyparser');
const koa_session    = require('koa-session');
const path           = require('path');
const {createServer} = require('http');
const {Server}       = require('socket.io');

const router   = require('./routers/index');
const passport = require('./utils/passport');
const {Users}  = require('./utils/chat_users');

const app        = new Koa();
const httpServer = createServer(app.callback());
const io         = new Server(httpServer);
let   users      = new Users();

app.use(Static(
    path.join(__dirname, './public')
));

app.use(Views(path.join(__dirname, './views'),{
        extension: 'ejs'
}));

app.use(bodyParser());

const CONFIG = {
    key: 'koa.sess',
    maxAge: 24*60*60*1000,
    httpOnly: false,
    rolling: true
}

const session_signed_key = ['some_secret_hurr'];
const session = koa_session(CONFIG, app);
app.keys = session_signed_key;

app.use(session);

app.use(passport.initialize());
app.use(passport.session());


io.on("connection", socket => {
    console.log('connect..')
    
    socket.on('join', (param, callback) => {
        console.log(param);
        socket.join(param.room_id);
        users.removeUser(socket.id);
        users.addUser(socket.id, param.user_name, param.room_id);
            
        console.log(users.getUserList(param.room_id));
        io.to(param.room_id).emit('updateUserList', users.getUserList(param.room_id));

        callback();
    })

    socket.on('createMessage', (message, callback) => {
        var user = users.getUser(socket.id);
        
        io.to(user.room).emit('newMessage', message);

        callback();
    })

    socket.on('disconnect', () => {
        var user = users.removeUser(socket.id);
        console.log('user disconnected');
    });

});

app.use(router.routes()).use(router.allowedMethods());

httpServer.listen(3000, () => {
    console.log('listening on 3000...');
})

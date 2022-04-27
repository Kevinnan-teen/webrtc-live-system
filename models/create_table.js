const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

// User Table（用户信息表）
// user_id:    用户id
// user_name:  用户名（主键）
// password:   密码

// Anchor Table（主播信息表）
// room_id:     直播间id（主键）
// room_title:  直播间标题
// user_id:     用户id

async function createTable(){
    try{
        await knex.schema.createTable('users', table => {
            table.increments('user_id', { primaryKey: false });
            table.string('user_name').notNullable().primary();
            table.string('password').notNullable();
            table.timestamps(true, true);
        }).createTable('anchor', table => {
            table.string('room_id').primary();
            table.string('room_title');
            table.integer('user_id').references('user.id').notNullable();
        })
        console.log('create user table successfully!');
    }catch(err){
        console.log(err);
    }
}

createTable();

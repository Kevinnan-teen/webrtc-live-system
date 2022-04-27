
let signoutGETAPI = async function(ctx, next){
    await ctx.logout();
    if(!ctx.isAuthenticated()){
        ctx.body = {
            code:0
        };
        ctx.session = null;
        ctx.redirect('/');
    }else{
        ctx.body = {
            code: -1
        }
    }
}

module.exports = {signoutGETAPI}

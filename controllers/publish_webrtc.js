let renderPublishWebrtc = async function(ctx){
    if(ctx.isAuthenticated())
        await ctx.render('publish_webrtc');
    else
        ctx.redirect('/signin');
}


module.exports = {renderPublishWebrtc}

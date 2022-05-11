const Client = require('./Client');

console.log('------------------------------');

//获取get请求参数
function getUrlParam(name){
    //构造一个含有目标参数的正则表达式对象
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    //匹配目标参数
    var r = window.location.search.substr(1).match(reg);
    //返回参数值
    if(r != null) {
    return decodeURI(r[2]);
    }
    return null;
}


var AppController = function () {
    this.server = window.location.host.split(':')[0] + ':8000';
    this.roomId = getUrlParam("room_id");
    this.userId = Math.ceil(Math.random()*100000).toString();

    console.log("server:", this.server, "roomId:", this.roomId, "userId:", this.userId);
   
    this.change_button = document.getElementById("changeBtn");
    this.change_button.onclick = this.ChangeClicked.bind(this);

    this.flvPlayer = null;

    if (flvjs.isSupported()) {
      var videoElement = document.getElementById('videoElement');          
      this.flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: sessionStorage.getItem('httpflv_link')
      });
      this.flvPlayer.attachMediaElement(videoElement);
      this.flvPlayer.load();
      this.flvPlayer.play();
    }

    this._client = new Client();
    
};


AppController.prototype.ChangeClicked = async function(){
    var video_type = document.getElementById("video_type").innerText;
    if(video_type === "HTTP-FLV"){
        document.getElementById("video_type").innerHTML = "WebRTC";
        this.flvPlayer.unload();
        this.flvPlayer.detachMediaElement();
        this.flvPlayer.destroy();
        this.webrtcSupport();        
    }else{
        document.getElementById("video_type").innerHTML = "HTTP-FLV";
        
        var webrtc_video = document.getElementById("webrtc_video");
        webrtc_video.pause();
        webrtc_video.removeAttribute('src');
        webrtc_video.srcObject = null;
        //webrtc_video.load();

        if (flvjs.isSupported()) {
          var videoElement = document.getElementById('videoElement');          
          this.flvPlayer = flvjs.createPlayer({
              type: 'flv',
              url: sessionStorage.getItem('httpflv_link')
          });
          this.flvPlayer.attachMediaElement(videoElement);
          this.flvPlayer.load();
          this.flvPlayer.play();
        }
    }
};


AppController.prototype.webrtcSupport = async function(){
    var usersInRoom = null;//{"users":[{"uid":"11111"}, {"uid":"22222"}]}
    try
    {
        console.log("call join api userid:", this.userId);
        usersInRoom = await this._client.Join({serverHost: this.server,
                                            roomId: this.roomId, userId: this.userId});
    }
    catch (error)
    {
        console.log("join error:", error);
        return;
    }

    this._client.on('disconected', async(data) => {
        console.log('websocket is disconnected');
    });
    this._client.on('userin', async(data) => {
        console.log('notify userin, data:' + JSON.stringify(data));
    });
    this._client.on('userout', async(data) => {
        var remoteUid = data.uid;
        console('notify userout, data:' + JSON.stringify(data));
        removeRemoteUserView(remoteUid);

        var publishers = this._client.GetRemoteUserPublishers(remoteUid);
        if (publishers != null) {
            console.log("start unsubscirbing remote uid:", remoteUid, ", publishers:", publishers);
            console.log('start unsubscribe remote uid:' +  remoteUid + ", publishers:" + JSON.stringify(publishers))
            this._client.UnSubscribe(remoteUid, publishers);
        }
    });

    this._client.on('publish', async (data) => {
        try {
            var remoteUid  = data['uid'];
            var remotePcId = data['pcid'];
            var userType   = data['user_type'];

            console.log(' receive publish message user type:', userType);
            console.log('notify publish, data:' + JSON.stringify(data));

            var newMediaStream = await this._client.Subscribe(remoteUid, userType, remotePcId, data['publishers']);
            
    
            var videoElement = document.getElementById("webrtc_video");
            //var videoElement = document.getElementById("videoElement");
            //videoElement.setAttribute("playsinline", "playsinline");
            videoElement.setAttribute("autoplay", "autoplay");
            videoElement.setAttribute("loop", "loop");
            videoElement.setAttribute("controls", "controls");
            videoElement.srcObject    = newMediaStream;
            //videoElement.style.width  = 320;
            //videoElement.style.height = 180;

            var statsContainer = document.getElementById("webrtc_status");

            var videoWidthElement = document.createElement("label");
            var videoHeightElement = document.createElement("label");
            var videoBpsElement = document.createElement("label");
            var videoFpsElement = document.createElement("label");
            var audioBpsElement = document.createElement("label");
            var audioFpsElement = document.createElement("label");
            var rttElement = document.createElement("label");

            videoWidthElement.id = 'videoWidth_' + remoteUid;
            videoHeightElement.id = 'videoHeight_' + remoteUid;
            videoHeightElement.style.paddingLeft = '10px';
            videoBpsElement.id = 'videoBps_' + remoteUid;
            videoFpsElement.id = 'videoFps_' + remoteUid;
            videoFpsElement.style.paddingLeft = '10px';
            audioBpsElement.id = 'audioBps_' + remoteUid;
            audioFpsElement.id = 'audioFps_' + remoteUid;
            audioFpsElement.style.paddingLeft = '10px';
            rttElement.id = 'rtt_' + remoteUid;
            rttElement.style.paddingLeft = '10px';

            var statsVideo1Container = document.createElement("div");
            statsVideo1Container.id = 'statsVideo1Container_' + remoteUid;
            statsVideo1Container.className = 'StatsItemContainer';
            statsContainer.appendChild(statsVideo1Container);
            
            statsVideo1Container.appendChild(videoWidthElement);
            statsVideo1Container.appendChild(videoHeightElement);

            var statsVideo2Container = document.createElement("div");
            statsVideo2Container.id = 'statsVideo2Container_' + remoteUid;
            statsVideo2Container.className = 'StatsItemContainer';
            statsContainer.appendChild(statsVideo2Container);

            statsVideo2Container.appendChild(videoBpsElement);
            statsVideo2Container.appendChild(videoFpsElement);

            var statsAudioContainer = document.createElement("div");
            statsAudioContainer.id = 'statsAudioContainer_' + remoteUid;
            statsAudioContainer.className = 'StatsItemContainer';
            statsContainer.appendChild(statsAudioContainer);

            statsAudioContainer.appendChild(audioBpsElement);
            statsAudioContainer.appendChild(audioFpsElement);
            statsAudioContainer.appendChild(rttElement);
    
            console.log("start play remote uid:", remoteUid);
            await videoElement.play();
        } catch (error) {
            console.log("subscribe error:", error);
            return;
        }
    });

    this._client.on('unpublish', async(data) => {
        var remoteUid = data.uid;
        var publishersInfo = data.publishers;

        console.log('notify unpublish, data:' + JSON.stringify(data));
        try {
            this._client.UnSubscribe(remoteUid, publishersInfo);
        } catch (error) {
            console.log("UnSubscribe error:", error);
            throw error;
        }
        removeRemoteUserView(remoteUid);
    });

    this._client.on('stats', (data) => {
        document.getElementById("videoWidth").value = data.video.width.toString();
        document.getElementById("videoHeight").value = data.video.height.toString();
        document.getElementById("videoFps").value = parseInt(data.video.fps).toString();
        document.getElementById("videoBps").value = parseInt(data.video.bps).toString();

        document.getElementById("audioFps").value = parseInt(data.audio.fps).toString();
        document.getElementById("audioBps").value = parseInt(data.audio.bps).toString();

        document.getElementById("Rtt").value = data.rtt.toString();
        var videoElement = document.getElementById("webrtc_video");
    });

    this._client.on('remoteStats', (data) => {
        let remoteUid = data.uid;
        let videoWidthId = 'videoWidth_' + remoteUid;
        let videoHeightId = 'videoHeight_' + remoteUid;
        let videoBpsId = 'videoBps_' + remoteUid;
        let videoFpsId = 'videoFps_' + remoteUid;
        let audioBpsId = 'audioBps_' + remoteUid;
        let audioFpsId = 'audioFps_' + remoteUid;
        let rttElementId = 'rtt_' + remoteUid;

        document.getElementById(videoWidthId).innerText = 'video width: ' + data.video.width.toString();
        document.getElementById(videoHeightId).innerText = 'video height: ' + data.video.height.toString();
        document.getElementById(videoBpsId).innerText = 'video bps(kbps): ' + data.video.bps.toString();
        document.getElementById(videoFpsId).innerText = 'video fps: ' + data.video.fps.toString();
        document.getElementById(audioBpsId).innerText = 'audio bps(kbps): ' + data.audio.bps.toString();
        document.getElementById(audioFpsId).innerText = 'audio fps: ' + data.audio.fps.toString();
        document.getElementById(rttElementId).innerText = 'rtt(ms): ' + data.rtt.toString();
    })
}

function removeRemoteUserView(remoteUid) {
    var userContainerId = 'userContainer_' + remoteUid;
    var userContainer = document.getElementById(userContainerId);
    var userLabelId = 'userLabel_' + remoteUid;
    var userLabel = document.getElementById(userLabelId);
    var mediaContainerId = 'mediaContainer_' + remoteUid;
    var mediaContainer = document.getElementById(mediaContainerId);
    var videoElementId = 'videoElement_' + remoteUid;
    var videoElement = document.getElementById(videoElementId);
    var remoteContainerElement = document.getElementById('remoteContainer');

    if (mediaContainer) {
        mediaContainer.removeChild(videoElement);
    }
    
    if (userContainer && mediaContainer) {
        userContainer.removeChild(mediaContainer);
        userContainer.removeChild(userLabel);
    }

    if (remoteContainerElement && userContainer) {
        remoteContainerElement.removeChild(userContainer);
    }

    videoElement   = null;
    mediaContainer = null;
    userLabel      = null;
    userContainer  = null;
}


var appConntrol = new AppController();


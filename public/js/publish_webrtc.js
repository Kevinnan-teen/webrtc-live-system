const Client = require('./Client');

console.log('------------------------------');

var AppController = function () {
    this.server = document.getElementById('server').value;
    this.roomId = document.getElementById('roomId').value.toString();
    this.userId = document.getElementById('userId').value.toString();
    this.mediaElement = document.getElementById('video_container_publish');
    var logTextArea  = document.getElementById('logTextArea');
    logTextArea.value = '';

    console.log("server:", this.server, "roomId:", this.roomId, "userId:", this.userId);
    
    this.openCamera       = document.getElementById("opencamera");
    this.openScreen       = document.getElementById("openscreen");
    this.joinButton       = document.getElementById("join");
    this.publishButton    = document.getElementById("publish");
    this.unpublishButtton = document.getElementById("unpublish");

    this.openCamera.onclick       = this.OpenCameraClicked.bind(this);
    this.openScreen.onclick       = this.OpenScreenClicked.bind(this);
    this.joinButton.onclick       = this.JoinClicked.bind(this);
    this.publishButton.onclick    = this.PublishScreenClicked.bind(this);
    this.unpublishButtton.onclick = this.UnPublishScreenClicked.bind(this);

    this._client = new Client();
    this._cameraReady = false;
    this._screenReady = false;
};

AppController.prototype.OpenCameraClicked = async function () {
    if (this._cameraReady) {
        console.log("the camera is already open");
        return;
    }
    var cameraMediaStream = await this._client.OpenCamera();

    this.mediaElement.srcObject = cameraMediaStream;

    this.mediaElement.addEventListener("canplay", () => {
        if (this.mediaElement) {
            console.log("start play the local camera view.");
            this.mediaElement.play();
            this._cameraReady = true;
            writeLogText("camera is ready");
        }
    });
}

AppController.prototype.OpenScreenClicked = async function(){
    if(this._screenReady){
        console.log("the screen is already open");
        return;
    }
    var screenMediaStream = await this._client.OpenScreen();
    this.mediaElement.srcObject = screenMediaStream;
    this.mediaElement.addEventListener("canplay", () => {
        if (this.mediaElement) {
            console.log("start play the local screen view.");
            this.mediaElement.play();
            this._screenReady = true;
            writeLogText("screen is ready");
        }
    });
}

AppController.prototype.JoinClicked = async function () {
    this.server = document.getElementById('server').value;
    this.roomId = document.getElementById('roomId').value.toString();
    this.userId = document.getElementById('userId').value.toString();

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

    writeLogText("join ok, users in room: " + JSON.stringify(usersInRoom));
    this._client.on('disconected', async(data) => {
        writeLogText('websocket is disconnected');
    });
    this._client.on('userin', async(data) => {
        writeLogText('notify userin, data:' + JSON.stringify(data));
    });
    this._client.on('userout', async(data) => {
        var remoteUid = data.uid;
        writeLogText('notify userout, data:' + JSON.stringify(data));
        removeRemoteUserView(remoteUid);

        var publishers = this._client.GetRemoteUserPublishers(remoteUid);
        if (publishers != null) {
            console.log("start unsubscirbing remote uid:", remoteUid, ", publishers:", publishers);
            writeLogText('start unsubscribe remote uid:' +  remoteUid + ", publishers:" + JSON.stringify(publishers))
            this._client.UnSubscribe(remoteUid, publishers);
        }
    });

    this._client.on('unpublish', async(data) => {
        var remoteUid = data.uid;
        var publishersInfo = data.publishers;

        writeLogText('notify unpublish, data:' + JSON.stringify(data));
        try {
            this._client.UnSubscribe(remoteUid, publishersInfo);
        } catch (error) {
            console.log("UnSubscribe error:", error);
            throw error;
        }
        removeRemoteUserView(remoteUid);
    });

}

AppController.prototype.PublishScreenClicked = async function () {
    if (!this._screenReady) {
        console.log("the screen is not open");
        alert('the screen is not open');
        return;
    }
    await this._client.PublishScreen({videoEnable: true, audioEnable: false});

    writeLogText("publish roomId:" + this.roomId + ", uid:" + this.userId + ", video enable" + ", audio disable");
}

AppController.prototype.UnPublishScreenClicked = async function () {
    await this._client.UnPublishScreen({videoDisable: true, audioDisable: false});
    writeLogText("publish roomId:" + this.roomId + ", uid:" + this.userId + ", video disable" + ", audio disable");
}

AppController.prototype.PublishCameraClicked = async function () {
    if (!this._cameraReady) {
        console.log("the camera is not open");
        alert('the camera is not open');
        return;
    }
    await this._client.PublishCamera({videoEnable: true, audioEnable: true});

    writeLogText("publish roomId:" + this.roomId + ", uid:" + this.userId + ", video enable" + ", audio enable");
}

AppController.prototype.UnPublishCameraClicked = async function () {
    await this._client.UnPublishCamera({videoDisable: true, audioDisable: true});
    writeLogText("publish roomId:" + this.roomId + ", uid:" + this.userId + ", video disable" + ", audio disable");
}

function writeLogText(logInfo) {
    var nowData = new Date();
    var logTextArea  = document.getElementById('logTextArea');
    logTextArea.value += '[';
    logTextArea.value += nowData.toLocaleString();
    logTextArea.value += '] ';
    logTextArea.value += logInfo;
    logTextArea.value += '\r\n';
    logTextArea.scrollTop = logTextArea.scrollHeight;
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


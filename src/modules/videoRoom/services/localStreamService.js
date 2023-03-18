import * as constraintsService from './constraintsServiceV2';

export async function getLocalVideoStream(isMobile, switchCamera = false) {
    let constraints = null;
    let stream = null;
    if (isMobile)
        constraints = constraintsService.getMobileConstraints(switchCamera, true);
    else
        constraints = await constraintsService.getConstraints(switchCamera, true);
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    catch (error) {
        if (error.name == 'OverconstrainedError' && error.constraint == 'facingMode' || error.name.toLowerCase() == 'notreadableerror') {
            isMobile = false;
            constraints = await constraintsService.getConstraints(true, true);
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        else {
            console.warn(error);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
    }
    return stream;
}

export async function getLocalVideoStreamByCamInd(ind) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const camera = cameras[ind];
    const constraints = {
        audio: true,
        video: {
            groupId: camera.groupId
        }
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
}

export async function shareScreen(){
    return await navigator.mediaDevices.getDisplayMedia();
}

export async function getFakeStream() {
    const canvas = document.createElement('canvas');
    const canvasStream = canvas.captureStream();
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const [videoTrack] = canvasStream.getVideoTracks();
    const [audioTrack] = audioStream.getAudioTracks();

    const stream = new MediaStream([videoTrack, audioTrack]);
    return stream;
}

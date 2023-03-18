let isFrontCamera = true;
let selectedCameraGroupId = '';

export function getMobileConstraints(switchCamera, audioEnabled) {
    if (switchCamera)
        isFrontCamera = !isFrontCamera;
    return {
        video: {
            facingMode: {
                exact: isFrontCamera ? 'user' : 'environment'
            }
        },
        audio: audioEnabled
    };
}


export function getMobileConstraintsV2(switchCamera, audioEnabled) {
    if (switchCamera)
        isFrontCamera = !isFrontCamera;
    let constraints = null;
    if (isFrontCamera)
        constraints = { video: true, audio: audioEnabled };
    else
        constraints = {
            video: {
                facingMode: {
                    exact: 'environment'
                }
            },
            audio: audioEnabled
        };
    return constraints;
}

export async function getConstraints(switchCamera, audioEnabled) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(c => c.kind === 'videoinput');
    let videoConstraints;
    if (!selectedCameraGroupId)
        selectedCameraGroupId = cameras[0].groupId;
    else {
        if (switchCamera) {
            let selectedCamera = null;
            selectedCamera = cameras.find(c => c.groupId === selectedCameraGroupId);
            const ind = cameras.indexOf(selectedCamera);
            let nextInd = 0;
            if (ind < cameras.length - 1)
                nextInd = ind + 1;
            selectedCameraGroupId = cameras[nextInd].groupId;
        }
    }
    // if (switchCamera) {
    //     videoConstraints = {
    //         groupId: selectedCameraGroupId,
    //         width: 640/8,
    //         height: 480/8,
    //     };
    // }
    // else {
    //     videoConstraints = {
    //         groupId: selectedCameraGroupId,
    //     };
    // }


    videoConstraints = {
        groupId: selectedCameraGroupId,
    };
    return {
        video: videoConstraints,
        audio: audioEnabled
    };
}

export async function getConstraintsByCameraId(cameraIndex) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(c => c.kind === 'videoinput');
    const camera = cameras[cameraIndex];
    selectedCameraGroupId = camera.groupId;
    const videoConstraints = {
        groupId: camera.groupId
    };

    return {
        video: videoConstraints,
        audio: true
    };
}
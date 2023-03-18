let isFrontCamera = true;
let selectedCameraId = '';

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
    if (!selectedCameraId)
        selectedCameraId = cameras[0].deviceId;
    else {
        if (switchCamera) {
            let selectedCamera = cameras.find(c => c.deviceId === selectedCameraId);
            const ind = cameras.indexOf(selectedCamera);
            let nextInd = 0;
            if (ind < cameras.length - 1)
                nextInd = ind + 1;
            selectedCameraId = cameras[nextInd].deviceId;
        }
    }
    return {
        video: {
            deviceId: {
                exact: selectedCameraId
            }
        },
        audio: audioEnabled
    };
}

export async function getConcreteCameraConstraints(camIndex) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(c => c.kind === 'videoinput');
    const cemeraId = cameras[camIndex].deviceId;
    return {
        video: {
            deviceId: {
                exact: cemeraId
            }
        },
        audio: true
    };
}
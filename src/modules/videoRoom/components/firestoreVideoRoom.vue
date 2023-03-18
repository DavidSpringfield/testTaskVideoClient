<template>
    <div class="flex flex-col w-full items-center justify-between relative h-screen fixed">
        <div class="flex fixed justify-between z-10 w-full max-width-600" v-if="!isFullScreen">
            <div class="ml-2 mt-2">
                <button class="btn" @click="onGridChange">
                    <img src="../assets/images/pngs/icons-grid6.png" width="40" />
                </button>
            </div>
            <StopNowComponent class="mr-2 mt-2" :timeLeftSec="timeLeftSec" :criticalTime="criticalTime"
                :introTimeLeftSec="introTimeLeftSec" :incomeCall="incomeCall" @onStop="onStop" />
        </div>

        <VideoGrid :isScreenSharing="isScreenSharing" v-show="gridMode === 1" style="z-index:4" class="fixed"
            :class="{ 'max-width-600': !isFullScreen }" :localStream="localStream" :remoteStream="remoteStream"
            :remoteAudioEnabled="remoteAudioEnabled" :remoteVideoEnabled="remoteVideoEnabled"
            :localVideoEnabled="!isCameraMuted" @onFullScreen="onFullScreen" />
        <VideoGrid2 :isScreenSharing="isScreenSharing" class="fixed" v-show="gridMode === 2" :localStream="localStream"
            :remoteStream="remoteStream" :remoteAudioEnabled="remoteAudioEnabled" :remoteVideoEnabled="remoteVideoEnabled"
            @onFullScreen="onFullScreen" />

        <BottomButtons v-on:enable-disable-camera="onEnableDisableCameraWithStatus" id="buttons" v-if="!isFullScreen"
            style="z-index:4;" class="fixed bottom-2" v-on:start-stop-mic="onStartStopMicWithStatus"
            v-on:share-screen="onShareScreen" v-on:switch-camera="onSwitchCamera" v-on:screen-recording="onScreenRecording"
            :isCameraEnabled="!isCameraMuted" :isMicEnabled="!isMicMuted" :isScreenSharing="isScreenSharing"
            :isScreenRecording="isScreenRecording" />

    </div>
</template>

<script>
import VideoGrid from './subComponents/videoGrid';
import VideoGrid2 from './subComponents/videoGrid2';
import BottomButtons from './subComponents/bottomButtons';
import StopNowComponent from './subComponents/stopNow';
import * as roomService from '../services/firestoreRoomService';
import * as constraintsService from '../services/constraintsServiceV2';
import * as localStreamService from '../services/localStreamService';
import * as roomStore from '@/services/roomStore';
import { interval } from 'rxjs';

export default {
    name: 'FirestoreVideoRoom',
    components: { VideoGrid, VideoGrid2, BottomButtons, StopNowComponent },
    data() {
        return {
            localStream: MediaStream,
            remoteStream: MediaStream,
            roomCreated: false,
            roomJoined: false,
            isMicMuted: false,
            isMicWasMuted: false,
            isCameraMuted: false,
            isCameraWasMuted: false,
            isCameraActivated: false,
            remoteAudioEnabled: true,
            remoteVideoEnabled: true,
            isScreenSharing: false,
            isScreenRecording: false,
            isMobile: navigator.userAgent.toLowerCase().includes('mobile'),
            introTimeLeftSec: 30,
            timeLeftSec: 45,
            criticalTime: 15,
            gridMode: 1,
            isFullScreen: false
        };
    },
    props: ['incomeCall', 'roomId', 'myId'],
    emits: ['introEnded', 'roomPaid', 'callEnded', 'callStopped'],
    watch: {
        localStream() {
            if (!this.localStream) {
                this.isMicMuted = true;
                this.isCameraMuted = true;
                return;
            }
            const [audioTrack] = this.localStream.getAudioTracks();
            this.isMicMuted = !(audioTrack && audioTrack.enabled);
            const [videoTrack] = this.localStream.getVideoTracks();
            this.isCameraMuted = !(videoTrack && videoTrack.enabled);
        },
        roomId() {
            if (this.roomId)
                roomStore.listenForRoomChanges(this.roomId, null, this.onRoomModified, this.onStop);
        },
        gridMode() {

        }
    },
    async mounted() {
        const debug = false;
        if (debug) {
            this.localStream = await localStreamService.getLocalVideoStreamByCamInd(0);
            if (this.isMobile)
                this.remoteStream = this.localStream;
            else
                this.remoteStream = await localStreamService.getLocalVideoStreamByCamInd(1);
            return;
        }

        const introTimer = interval(1000).subscribe(() => {
            this.introTimeLeftSec = --this.introTimeLeftSec;
            if (this.introTimeLeftSec <= 0) {
                introTimer.unsubscribe();
                const mainTimer = interval(1000).subscribe(() => {
                    this.timeLeftSec = --this.timeLeftSec;
                    if (this.timeLeftSec <= 0) {
                        mainTimer.unsubscribe();
                        this.$emit('callEnded');
                    }
                });
            }
        });

        this.localStream = roomService.localStream;
        roomService.remoteStreamChanges$.subscribe(change => {
            if (change) {
                this.remoteAudioEnabled = change.audioEnabled;
                this.remoteVideoEnabled = change.videoEnabled;
            }
        });
        roomService.remoteStream$.subscribe(stream => {
            if (stream)
                this.remoteStream = stream;
        });
        this.isCameraActivated = true;
        this.roomCreated = true;
        this.roomJoined = true;
    },
    unmounted() {
        roomService.dispose();
    },
    methods: {
        async onRoomModified(change) {
            const room = change.doc.data();
            if (room.status === 'paid') {
                await roomStore.updateRoom(this.roomId, { status: 'inProgress' });
                this.$emit('roomPaid');
                if (!this.isMicWasMuted)
                    this.startStopMic();
                if (!this.isCameraWasMuted)
                    this.enableDisableCamera();
                const mainTimer = interval(1000).subscribe(() => {
                    this.timeLeftSec = --this.timeLeftSec;
                    if (this.timeLeftSec <= 0) {
                        mainTimer.unsubscribe();
                        this.$emit('callEnded');
                    }
                });
            }
            else if (room.status === 'stopped') {
                this.$emit('callStopped');
            }
        },
        async activateCamera() {
            this.isCameraActivated = !this.isCameraActivated;
            this.localStream = await getVideoAudioStream();
            roomService.replaceVideoStream(this.localStream);
        },
        async onEnableDisableCameraWithStatus() {
            this.enableDisableCamera();
            await roomService.changeCameraStatus(this.myId, !this.isCameraMuted);
        },
        async onStartStopMicWithStatus() {
            this.startStopMic();
            await roomService.changeMicrophoneStatus(this.myId, !this.isMicMuted);
        },
        enableDisableCamera() {
            this.isCameraMuted = !this.isCameraMuted;
            this.localStream.getVideoTracks().forEach(track => track.enabled = !this.isCameraMuted);
        },
        startStopMic() {
            this.isMicMuted = !this.isMicMuted;
            this.localStream.getAudioTracks().forEach(track => track.enabled = !this.isMicMuted);
        },
        onShareScreen() {
            console.log('on share screen');
        },
        async onSwitchCamera() {
            this.localStream.getVideoTracks().forEach(track => track.stop());
            this.localStream = await localStreamService.getLocalVideoStream(this.isMobile, true);
            roomService.replaceStream(this.localStream);
            this.localStream.getAudioTracks().forEach(track => track.enabled = !this.isMicMuted);
        },
        onScreenRecording() {
            console.log('onScreenRecording');
        },
        onStop() {
            this.$emit('callStopped');
            roomStore.updateRoom(this.roomId, { status: 'stopped' });
            try {
                this.localStream.getTracks().forEach(track => track.stop());
            }
            catch (error) {
                console.error(error);
            }
        },
        onGridChange() {
            console.log(this.gridMode);
            if (this.gridMode == 2)
                this.gridMode = 1;
            else
                this.gridMode = ++this.gridMode;
        },
        onFullScreen() {
            this.isFullScreen = !this.isFullScreen;
        }
    }
}

async function getVideoAudioStream() {
    try {
        const constraints = await constraintsService.getConstraintsByCameraId(0);
        return await navigator.mediaDevices.getUserMedia(constraints);
    }
    catch (error) {
        const constraints = await constraintsService.getConstraintsByCameraId(1);
        return await navigator.mediaDevices.getUserMedia(constraints);
    }
}

</script>
<style scoped>
@import '../../../assets/custom.css';

.btn {
    @apply callPage-callBtn-w callPage-callBtn-h flex justify-center items-center rounded-full bg-neutralDark;
}
</style>

<template>
    <div class="flex justify-center items-center h-screen w-full relative">
        <div class="flex relative w-full h-screen"
             id="video-header">
            <div class="flex justify-center items-center w-full h-screen"
                 @click="onRemoteClick"
                 v-show="!localFullScreen"
                 id="remoteContainer">
                <video id='remoteVideo'
                       ref="remoteVideo"
                       class="rounded w-full h-screen object-cover"
                       autoPlay
                       playsInline="true"
                       disablepictureinpicture
                       v-show="remoteVideoEnabled" />
                <div class="fixed top-28 flex">
                    <img src="../../assets/images/pngs/camera-off.png"
                         v-show="!remoteVideoEnabled"
                         class="w-8"
                         :class="{ 'ml-5': !remoteAudioEnabled }" />
                    <img src="../../assets/images/pngs/muted.png"
                         v-show="!remoteAudioEnabled"
                         class="w-8" />
                </div>

                <button @click="onRemoteFullScreen"
                        class="absolute p-2"
                        v-if="remoteVideoEnabled && showRemoteFulscreenButton">
                    <img src="../../assets/images/pngs/exit-fullscreen3.png"
                         width="40"
                         v-if="remoteFullScreen" />
                    <img src="../../assets/images/pngs/full-screen.png"
                         width="40"
                         v-else />
                </button>
            </div>
            <div id="localContainer"
                 class="flex justify-center items-center absolute"
                 style="z-index:999"
                 :class="{ 'bottom-52 sm:bottom-20 right-0 mb-2': !localFullScreen, 'w-full': localFullScreen }"
                 v-show="!remoteFullScreen && localVideoEnabled">
                <video id='localVideo'
                       @click="onLocalClick"
                       ref="localVideo"
                       class="object-cover w-full h-screen"
                       :class="{ 'initialLocalVideoSize rounded-lg': !localFullScreen }"
                       autoPlay
                       muted
                       playsInline="true" />
                <button @click="onLocalFullScreen"
                        v-if="localVideoEnabled && showLocalFullscreenButton"
                        class="absolute p-2">
                    <img src="../../assets/images/pngs/exit-fullscreen3.png"
                         width="40"
                         v-if="localFullScreen" />
                    <img src="../../assets/images/pngs/full-screen.png"
                         width="40"
                         v-else />
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { timer } from 'rxjs';
import * as drag from '../../services/dragService';
// import * as fullScreen from '../../services/fullScreen';
export default {
    name: 'VideoGrid',
    data() {
        return {
            draggable: null,
            remoteFullScreen: false,
            localFullScreen: false,
            showRemoteFulscreenButton: false,
            showLocalFullscreenButton: true
        };
    },
    props:['isScreenSharing','localStream','remoteStream','remoteAudioEnabled','remoteVideoEnabled','localVideoEnabled'],
    emits: ['onFullScreen'],
    watch: {
        localStream() {
            if (!this.localStream) return;
            this.$refs.localVideo.srcObject = this.localStream;
        },
        remoteStream() {
            if (!this.remoteStream) return;
            this.$refs.remoteVideo.srcObject = this.remoteStream;
        },
    },
    computed: {
        localInitials() {
            return this.localUserName[0] + this.localUserLastName[0];
        },
        remoteInitials() {
            return this.remoteUserName[0] + this.remoteUserLastName[0];
        }
    },
    async mounted() {
        this.draggable = drag.draggable('localVideo', 'video-header');
    },
    methods: {
        onRemoteFullScreen() {
            this.remoteFullScreen = !this.remoteFullScreen;
            this.$emit('onFullScreen');
        },
        onLocalFullScreen() {
            this.localFullScreen = !this.localFullScreen;
            this.$emit('onFullScreen');
        },
        onRemoteClick() {
            this.showRemoteFulscreenButton = true;
            const showTimer = timer(4000).subscribe(() => {
                showTimer.unsubscribe();
                this.showRemoteFulscreenButton = false;
            });
        },
        onLocalClick() {
            console.log('on local click');
            this.showLocalFullscreenButton = true;
            const showTimer = timer(4000).subscribe(() => {
                showTimer.unsubscribe();
                this.showLocalFullscreenButton = false;
            });
        }
    }
}

</script>

<style scoped>
.initialLocalVideoSize {
    width: 140px;
    height: 200px;
}

video::-webkit-media-controls-fullscreen-button,
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-toggle-closed-captions-button,
video:-webkit-full-screen::-webkit-media-controls-fullscreen-button,
video:-webkit-full-screen::-webkit-media-controls-play-button,
video:-webkit-full-screen::-webkit-media-controls-toggle-closed-captions-button,

video::-moz-media-controls-fullscreen-button,
video::-moz-media-controls-play-button,
video::-moz-media-controls-toggle-closed-captions-button,
video:-moz-full-screen::-moz-media-controls-fullscreen-button,
video:-moz-full-screen::-moz-media-controls-play-button,
video:-moz-full-screen::-moz-media-controls-toggle-closed-captions-button,

video::-ms-media-controls-fullscreen-button,
video::-ms-media-controls-play-button,
video::-ms-media-controls-toggle-closed-captions-button,
video:-ms-full-screen::-ms-media-controls-fullscreen-button,
video:-ms-full-screen::-ms-media-controls-play-button,
video:-ms-full-screen::-ms-media-controls-toggle-closed-captions-button {
    display: none !important;
}
</style>
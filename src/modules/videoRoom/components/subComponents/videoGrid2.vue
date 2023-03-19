<template>
    <div class="flex flex-col justify-center items-center sm:flex-row relative w-full h-full">
        <div class="flex justify-center items-center w-full" @click="onRemoteClick" v-show="!isLocalFullScreen"
            :class="{ 'h-screen': isRemoteFullScreen }" id="remoteContainer">
            <video id='remoteVideo' ref="remoteVideo" class="w-full" :class="remoteVideoClass" autoPlay playsInline
                disablepictureinpicture style="object-fit: fill;"  />
            <div class="fixed top-28 flex">
                <img src="../../assets/images/pngs/camera-off.png" v-show="!remoteVideoEnabled" class="w-8"
                    :class="{ 'ml-5': !remoteAudioEnabled }" />
                <img src="../../assets/images/pngs/muted.png" v-show="!remoteAudioEnabled" class="w-8" />
            </div>
            <button @click="onRemoteFullScreen" class="absolute p-2" v-if="remoteVideoEnabled && showRemoteFulscreenButton">
                <img src="../../assets/images/pngs/exit-fullscreen3.png" width="40" v-if="isRemoteFullScreen" />
                <img src="../../assets/images/pngs/full-screen.png" width="40" v-else />
            </button>
        </div>
        <div class="flex justify-center items-center w-full" v-show="!isRemoteFullScreen"
            :class="{ 'h-screen': isLocalFullScreen }" @click="onLocalClick">
            <video id='localVideo' ref="localVideo" class="w-full" :class="localVideoClass" autoPlay playsInline
                disablepictureinpicture style="object-fit: fill;"/>
            <button @click="onLocalFullScreen" v-if="showLocalFullscreenButton" class="absolute p-2">
                <img src="../../assets/images/pngs/exit-fullscreen3.png" width="40" v-if="isLocalFullScreen" />
                <img src="../../assets/images/pngs/full-screen.png" width="40" v-else />
            </button>
        </div>
    </div>
</template>

<script>
import { timer } from 'rxjs';

export default {
    name: 'VideoGrid2',
    data() {
        return {
            isRemoteFullScreen: false,
            isLocalFullScreen: false,
            isWidthLimited: true,
            isMobile: navigator.userAgent.toLowerCase().includes('mobile'),
            showRemoteFulscreenButton: false,
            showLocalFullscreenButton: false
        };
    },
    props: ['isScreenSharing', 'localStream', 'remoteStream', 'remoteAudioEnabled', 'remoteVideoEnabled'],
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
        remoteVideoClass() {
            if (this.isMobile && !this.isRemoteFullScreen)
                return 'h-screen-40 object-contain';
            else if (!this.isMobile && !this.isRemoteFullScreen)
                return 'h-screen object-contain';
            else return 'h-screen object-cover';
        },
        localVideoClass() {
            if (this.isMobile && !this.isLocalFullScreen)
                return 'h-screen-40 object-contain';
            else if (!this.isMobile && !this.isLocalFullScreen)
                return 'h-screen object-contain';
            else return 'h-screen object-cover';
        }
    },
    mounted() {
        const container = document.querySelector('#router-view-wrapper');
        if (container)
            container.classList.remove('max-width-600');
    },
    unmounted() {
        const container = document.querySelector('#router-view-wrapper');
        container.classList.add('max-width-600');
    },
    methods: {
        onRemoteFullScreen() {
            this.isRemoteFullScreen = !this.isRemoteFullScreen;
            this.$emit('onFullScreen');
        },
        onLocalFullScreen() {
            this.isLocalFullScreen = !this.isLocalFullScreen;
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
.h-screen-40 {
    height: 45vh;
}
</style>
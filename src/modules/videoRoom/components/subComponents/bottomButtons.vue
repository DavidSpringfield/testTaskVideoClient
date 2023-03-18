<template>
  <div class="flex justify-center items-center w-full gap-1">
    <button @click="onEnableDisableCamera"
            class="btn"
            :class="{ 'btn-danger': !isCameraEnabled, 'btn-disabled': cameraButtonsDisabled }"
            :disabled="cameraButtonsDisabled">
      <img src="../../../../assets/svgs/camera.svg"
           alt="camera"
           v-if="isCameraEnabled" />
      <img src="../../../../assets/svgs/camera-nouse.svg"
           alt="camera"
           v-else />
    </button>
    <button @click="onStartStopMic"
            class="btn"
            :class="{ 'btn-danger': !isMicEnabled }">
      <img src="../../../../assets/svgs/recorder.svg"
           alt="camera"
           v-if="isMicEnabled" />
      <img src="../../../../assets/svgs/recorder-nouse.svg"
           alt="camera"
           v-else />
    </button>
    <button @click="onSwitchCamera"
            class="btn"
            :class="{ 'btn-disabled': switchCameraDisabled }"
            :disabled="switchCameraDisabled">
      <img src="../../../../assets/svgs/camera-rotate.svg"
           alt="camera" />
    </button>
    <button @click="onShareScreen"
            class="btn"
            :class="{ 'screen-sharing': isScreenSharing }">
      <img src="../../assets/images/pngs/share-screen.png"
           v-if="!isScreenSharing"
           width="35"
           alt="Share Screen" />
      <img src="../../assets/images/pngs/share-screen-indigo.png"
           v-else
           class=""
           width="35"
           alt="Stop screen sharing" />
    </button>
    <button @click="onScreenRecording"
            class="btn"
            :class="{ 'btn-danger': isScreenRecording }">
      <img src="../../assets/images/pngs/record.png"
           v-if="!isScreenRecording"
           width="35" />
      <img src="../../assets/images/pngs/recording-schreen.png"
           v-else
           width="35" />
    </button>
  </div>
</template>
  
<script>
export default {
  name: "BottomButtons",
  emits: ['enable-disable-camera', 'start-stop-mic', 'switch-camera', 'share-screen', 'screen-recording'],
  props: ['isCameraEnabled', 'isMicEnabled', 'isScreenSharing', 'isScreenRecording'],
  data() {
    return {
      cameraButtonsDisabled: false,
      switchCameraDisabled: false
    };
  },
  watch: {
    isScreenSharing() {
      this.cameraButtonsDisabled = this.isScreenSharing;
      this.switchCameraDisabled = this.isScreenSharing;
    },
    isCameraEnabled() {
      this.switchCameraDisabled = !this.isCameraEnabled;
    }
  },
  methods: {
    onEnableDisableCamera() {
      this.$emit("enable-disable-camera");
    },
    onStartStopMic() {
      this.$emit("start-stop-mic");
    },
    onSwitchCamera() {
      this.$emit("switch-camera");
    },
    onShareScreen() {
      this.$emit("share-screen");
    },
    onScreenRecording() {
      this.$emit("screen-recording");
    },
  },
};
</script>
<style scoped>
@import '../../../../assets/custom.css';

.btn {
  @apply callPage-callBtn-w callPage-callBtn-h flex justify-center items-center rounded-full bg-neutralDark;
}

.btn-danger {
  @apply callPage-callBtn-w callPage-callBtn-h flex justify-center items-center rounded-full bg-symanticDanger;
}

.btn-disabled {
  @apply callPage-callBtn-w callPage-callBtn-h flex justify-center items-center rounded-full bg-gray-600;
}

.screen-sharing {
  background-color: rgb(99 102 241);
}
</style>
  
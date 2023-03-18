<template>
    <div id="header">
        <!-- class="flex flex-row items-end w-full z-10 max-width-600 justify-end mr-5"> -->
        <div v-if="introTimeLeftSec > 0" class="timer-block">
            <div class="display-time-block">
                <span class="intro-text">Free Intro!</span>
                <div>
                    <span class="intro-text" v-if="incomeCall">
                        You will be charged in </span>
                    <span class="display-time"> {{
                        introDisplayTime }} </span>
                </div>
            </div>
            <button @click="onStop"
                class="stop-now-btn">
                Stop Now
            </button>
        </div>
        <div v-else
            class="timer-blockd">
            <div class="display-time-block">
                <span
                    :class="{ 'display-time-danger': timeLeftSec <= criticalTime, 'display-time': timeLeftSec > criticalTime }">
                    {{ displayTime }}</span>
            </div>
            <button @click="onStop" class="stop-now-btn">
                Stop
            </button>
        </div>
    </div>
</template>

<script>
import * as timeService from '../../services/timeService';
export default {
    name: 'StopNowComponent',
    props: ['timeLeftSec', 'introTimeLeftSec', 'criticalTime', 'incomeCall'],
    emits: ['onStop'],
    data() {
        return {
            displayTime: '',
            introDisplayTime: ''
        };
    },
    watch: {
        timeLeftSec() {
            this.displayTime = timeService.getDisplayTime(this.timeLeftSec);
        },
        introTimeLeftSec() {
            this.introDisplayTime = timeService.getDisplayTime(this.introTimeLeftSec);
        }
    },
    methods: {
        onStop() {
            this.$emit('onStop');
        }
    },
    mounted() {
        this.displayTime = timeService.getDisplayTime(this.timeLeftSec);
        this.introDisplayTime = timeService.getDisplayTime(this.introTimeLeftSec);
    }
}
</script>

<style scoped>
@import '../../../../assets/custom.css';

.stop-now-btn {
    @apply h-9 p-4 bg-symanticDanger text-neutralWhite rounded-3xl font-semibold text-strongMD leading-strongMD flex items-center
}

.timer-block {
    @apply h-11 flex flex-row items-center justify-between py-1 pl-4 pr-1 bg-neutralDarkest callPage-alarm-rounded;
}

.display-time-block {
    @apply py-0.5 flex flex-col mr-3;
}

.display-time {
    @apply text-neutralWhite text-bodySM leading-bodySM font-semibold ml-1;
}

.display-time-danger {
    @apply text-symanticDanger text-bodySM leading-bodySM font-semibold ml-1;
}

.intro-text {
    @apply text-neutralWhite text-bodySM leading-bodySM font-semibold;
}
</style>
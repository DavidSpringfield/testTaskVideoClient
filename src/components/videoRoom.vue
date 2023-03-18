<template>
    <div class="h-screen">
        <div v-if="!joinedOrCreated" class="h-full">
            <div class="text-neutralWhite">{{ message }} </div>
            <div class="flex justify-center items-center h-full gap-1">
                <button @click="createRoom" class="bg-indigo-500 p-2 text-white rounded">Create room</button>
                <button @click="joinRoom" class="bg-indigo-500 p-2 text-white rounded">Join room</button>
            </div>
        </div>
        <div v-else>
            <FirestoreVideoRoom :incomeCall="incomeCall" :roomId="roomId" :myId="myId" />
        </div>
    </div>
</template>

<script>
import * as roomService from '@/modules/videoRoom/services/firestoreRoomService';
import { db } from '@/fire';
import { setDoc, doc, collection } from 'firebase/firestore';
import * as localStreamService from '@/modules/videoRoom/services/localStreamService';
import FirestoreVideoRoom from '@/modules/videoRoom/components/firestoreVideoRoom';
export default {
    name: 'VideoRoom',
    components: { FirestoreVideoRoom },
    data() {
        return {
            myId: 'myTestId',
            advisorId: 'testAdvisorId',
            message: '',
            roomId: 'testRoomId',
            isMobile: navigator.userAgent.toLowerCase().includes('mobile'),
            joinedOrCreated: false,
            incomeCall: false
        };
    },
    methods: {
        async createRoom() {
            console.log('creating room');
            const roomRef = doc(collection(db, 'rooms'), this.roomId);
            await setDoc(roomRef, { testRoom: true });
            const stream = await localStreamService.getLocalVideoStream(this.isMobile);
            await roomService.createRoom(this.roomId, this.myId, stream);
            this.message = 'Room created';
            this.joinedOrCreated = true;
            this.incomeCall = false;
        },
        async joinRoom() {
            const stream = await localStreamService.getLocalVideoStream(this.isMobile);
            await roomService.joinRoom(this.roomId, this.myId, stream);
            this.message = 'Room joined';
            this.joinedOrCreated = true;
            this.incomeCall = true;
        }
    }
}
</script>
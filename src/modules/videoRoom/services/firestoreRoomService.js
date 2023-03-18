import { doc, getDoc, updateDoc, addDoc, deleteDoc, onSnapshot, query, collection, getDocs, where, documentId } from "firebase/firestore";
import { db } from "@/fire";
import * as iceStunServers from './iceStunServers';
import { BehaviorSubject } from "rxjs";
import * as roomStore from '@/services/roomStore';

const callerCandidates = 'callerCandidates';
const calleeCandidates = 'calleeCandidates';
let firestoreUnsubscribes = [];

// Define the WebRTC peer connection and media streams
let peerConnection;
export let localStream;
export let remoteStream;
export let remoteStream$ = new BehaviorSubject(null);
export let remoteStreamChanges$ = new BehaviorSubject(null);
export let roomReady$ = new BehaviorSubject(null);

// Define the room ID and the Firestore document reference
let roomRef;

export async function createNewRoom(myId, advisorId, stream) {
    remoteStream = new MediaStream();
    const { audio, video } = checkAudioVideo(stream);
    const initialRoom = {
        fromUserId: myId,
        toUserId: advisorId,
        participants: [{
            id: myId,
            audio: audio,
            video: video
        }]
    };
    roomRef = await roomStore.createRoom(initialRoom);
    // Set up the Firestore document for the room
    //roomRef = doc(db, "rooms", roomId);
    //await clearCandidates();


    //await updateDoc(roomRef, updatedRoom);

    // Set up the WebRTC peer connection
    const configuration = await iceStunServers.getIceConfig();
    peerConnection = new RTCPeerConnection(configuration);
    const candidatesCollection = collection(roomRef, callerCandidates);
    peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate)
            await addDoc(candidatesCollection, event.candidate.toJSON());
    });
    peerConnection.ontrack = (event) => {
        const kind = event.track.kind;
        if (kind === 'audio')
            console.log('got remote audio track');
        else if (kind === 'video')
            console.log('got remote video track');
        remoteStream.addTrack(event.track);
        remoteStream$.next(remoteStream);
    }

    localStream = stream;
    initializeTracks();

    // Create the offer and set it as the local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    listenForGotAnswer();
    listenForCandidatesAdded(calleeCandidates);
    listenForRoomChanges(myId);

    //Set the offer in the Firestore document
    const roomWithOffer = {
        offer: {
            type: offer.type,
            sdp: offer.sdp,
        }
    };
    await updateDoc(roomRef, roomWithOffer);
    return roomRef.id;
}

// Create a new room and set up the peer connection
export async function createRoom(roomId, myId, stream) {
    remoteStream = new MediaStream();
    // Set up the Firestore document for the room
    roomRef = doc(db, "rooms", roomId);
    await clearCandidates();
    const { audio, video } = checkAudioVideo(stream);
    const updatedRoom = {
        participants: [{
            id: myId,
            audio: audio,
            video: video
        }]
    };

    await updateDoc(roomRef, updatedRoom);

    // Set up the WebRTC peer connection
    const configuration = await iceStunServers.getIceConfig();
    peerConnection = new RTCPeerConnection(configuration);
    const candidatesCollection = collection(roomRef, callerCandidates);
    peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate)
            await addDoc(candidatesCollection, event.candidate.toJSON());
    });
    peerConnection.ontrack = (event) => {
        const kind = event.track.kind;
        if (kind === 'audio')
            console.log('got remote audio track');
        else if (kind === 'video')
            console.log('got remote video track');
        remoteStream.addTrack(event.track);
        remoteStream$.next(remoteStream);
    }

    localStream = stream;
    initializeTracks();

    // Create the offer and set it as the local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    listenForGotAnswer();
    listenForCandidatesAdded(calleeCandidates);
    listenForRoomChanges(myId);

    //Set the offer in the Firestore document
    const roomWithOffer = {
        offer: {
            type: offer.type,
            sdp: offer.sdp,
        }
    };
    await updateDoc(roomRef, roomWithOffer);
}


function initializeTracks() {
    localStream.getVideoTracks().forEach(track => {
        console.log('added local video track');
        peerConnection.addTrack(track, localStream);
    });
    localStream.getAudioTracks().forEach(track => {
        console.log('added local audio track');
        peerConnection.addTrack(track, localStream);
    });
}

function checkAudioVideo(stream) {
    const [audioTrack] = stream.getAudioTracks();
    const [videoTrack] = stream.getVideoTracks();
    const audio = audioTrack && audioTrack.enabled ? true : false;
    const video = videoTrack && videoTrack.enabled ? true : false;
    return { audio, video };
}

// Join an existing room and set up the peer connection
export async function joinRoom(roomId, myId, stream) {
    remoteStream = new MediaStream();
    // Set the room ID and Firestore document reference
    roomRef = doc(db, "rooms", roomId);

    // Check if the room exists
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
        throw new Error("Room not found");
    }

    // Increment the number of participants in the Firestore document
    let participants = roomDoc.data().participants;
    const { audio, video } = checkAudioVideo(stream);
    participants.push({
        id: myId,
        audio: audio,
        video: video
    });
    await updateDoc(roomRef, { participants: participants });

    // Set up the WebRTC peer connection
    const configuration = await iceStunServers.getIceConfig();
    peerConnection = new RTCPeerConnection(configuration);
    const callerCandidatesCollection = collection(roomRef, calleeCandidates);
    peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate)
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
    });

    peerConnection.ontrack = (event) => {
        const kind = event.track.kind;
        if (kind === 'audio')
            console.log('got remote audio track');
        else if (kind === 'video')
            console.log('got remote video track');
        remoteStream.addTrack(event.track);
        remoteStream$.next(remoteStream);
    };

    localStream = stream;
    initializeTracks();
    listenForRoomChanges(myId);

    // Set the remote description from the offer in the Firestore document
    const offer = roomDoc.data().offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create the answer and set it as
    // the local description
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Set the answer in the Firestore document
    const roomWithAnswer = {
        answer: {
            type: answer.type,
            sdp: answer.sdp,
        }
    };
    await updateDoc(roomRef, roomWithAnswer);
    listenForCandidatesAdded(callerCandidates);
    listenForRoomChanges(myId);
}

// Listen for remote ICE candidates 
function listenForCandidatesAdded(candidatesCollection) {
    const unsubscribe = onSnapshot(query(collection(roomRef, candidatesCollection)), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                try {
                    peerConnection.addIceCandidate(candidate);
                }
                catch (error) {
                    console.warn(error);
                }
            }
        });
    });
    firestoreUnsubscribes.push(unsubscribe);
}

function listenForRoomChanges(myId) {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where(documentId(), '==', roomRef.id));
    const unsubscribe = onSnapshot(q, snapshot => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
                const room = change.doc.data();
                const count = room.participants.length;
                if (count > 1)
                    roomReady$.next(true);
                else
                    roomReady$.next(false);
                const participant = room.participants.find(p => p.id != myId);
                if (participant)
                    remoteStreamChanges$.next({ audioEnabled: participant.audio, videoEnabled: participant.video })
            }
        });
    });
    firestoreUnsubscribes.push(unsubscribe);
}

// Listening for remote session description below
function listenForGotAnswer() {
    const unsubscribe = onSnapshot(roomRef, async snapshot => {
        const data = snapshot.data();
        if (!peerConnection.currentRemoteDescription && data && data.answer) {
            console.log('got answer');
            const rtcSessionDescription = new RTCSessionDescription(data.answer);
            try {
                await peerConnection.setRemoteDescription(rtcSessionDescription);
            }
            catch (error) {
                console.warn(error);
            }
        }
    });
    firestoreUnsubscribes.push(unsubscribe);
}

export async function hangUp() {


    // Decrement the number of participants in the Firestore document
    const roomDoc = await getDoc(roomRef);
    const participants = roomDoc.data().participants - 1;
    if (participants === 0) {
        await deleteDoc(roomRef);
    } else {
        await updateDoc(roomRef, { participants: participants });
    }
}

async function deleteSubcollection(ref, subcollectionName) {
    const querySnapshot = await getDocs(collection(ref, subcollectionName));
    querySnapshot.forEach(async docSn => {
        await deleteDoc(docSn.ref);
    });
}

async function clearCandidates() {
    await deleteSubcollection(roomRef, callerCandidates);
    await deleteSubcollection(roomRef, calleeCandidates)
}

export function replaceVideoStream(stream) {
    stream.getVideoTracks().forEach(track => {
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(track);
    });
}

export async function changeMicrophoneStatus(myId, enabled) {
    console.log(myId, enabled);
    let snapshot = await getDoc(roomRef);
    let room = await snapshot.data();
    let me = room.participants.find(p => p.id === myId);
    me.audio = enabled;
    await updateDoc(roomRef, room);
}

export async function changeCameraStatus(myId, enabled) {
    let snapshot = await getDoc(roomRef);
    let room = await snapshot.data();
    let me = room.participants.find(p => p.id === myId);
    me.video = enabled;
    await updateDoc(roomRef, room);
}

export function replaceStream(newStream) {
    // newStream.getVideoTracks().forEach(async track => {
    //     const sender = peerConnection.getSenders().find(s => s.track?.kind == track.kind);
    //     if (sender)
    //         sender.replaceTrack(track);
    // });
    newStream.getTracks().forEach(async track => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind == track.kind);
        if (sender)
            sender.replaceTrack(track);
    });
}

export function dispose() {
    peerConnection?.close();
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    peerConnection = null;
    localStream = null;
    remoteStream = null;
    firestoreUnsubscribes.forEach(unsubscribe => unsubscribe());
    firestoreUnsubscribes = [];
    remoteStream$ = new BehaviorSubject(null);
    remoteStreamChanges$ = new BehaviorSubject(null);
    roomReady$ = new BehaviorSubject(null);
}
// async function deleteRoom() {
//     await deleteSubcollection(roomRef, calleeCandidates);
//     await deleteSubcollection(roomRef, callerCandidates);
//     await deleteDoc(roomRef);
// }
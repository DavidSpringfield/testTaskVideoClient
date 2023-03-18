import { BehaviorSubject } from 'rxjs';
import io from 'socket.io-client';
import * as ice from './iceStunServers';
const wsUrl = 'https://video-room-server.herokuapp.com/';
//const wsUrl = 'http://localhost:5000';

let socket = null;
let peerConnection = null;
let room = null;
let localStream = null;
let incomeCall = false;

export let isRoomJoined$ = new BehaviorSubject(false);
export let isParticipantJoined$ = new BehaviorSubject(false);

export async function setLocalStream(stream) {
    logger.log('Set local stream');
    localStream = stream;
    const streams = peerConnection.getLocalStreams();
    if (streams.length == 0) {
        for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream);
        }
        await createOffer();
    }
    else {
        localStream.getVideoTracks().forEach(async track => {
            const sender = peerConnection.getSenders().find(s => s.track?.kind == track.kind);
            if (sender)
                sender.replaceTrack(track);
        });
        localStream.getAudioTracks().forEach(async track => {
            const sender = peerConnection.getSenders().find(s => s.track?.kind == track.kind);
            if (sender)
                sender.replaceTrack(track);
        });
    }
}

export let remoteStream$ = new BehaviorSubject(null);

export async function joinRoom(roomId, user) {
    if (!socket)
        socket = io.connect(wsUrl);
    socket.on('connect', async () => {
        logger.log('client connected to server');
        room = roomId;
        const config = await ice.getIceConfig();
        peerConnection = new RTCPeerConnection(config);
        logger.log('Trying join room');
        socket.emit('join', room, user);
        socket.on('joinCallback', (resp) => {
            if (resp.status == 'error')
                logger.log(resp.error);
            else {
                incomeCall = resp.participantsNumber == 2;
                logger.log('INcome call: ', incomeCall);
                onRoomJoined();
            }
        });
    });
}

async function onRoomJoined(err) {
    if (err) {
        console.error(err);
    } else {
        logger.log('room joined');
        isRoomJoined$.next(true);
        await startCall();
        socket.on('offer', async offer => {
            logger.log('OFFER RECEIVED');
            isParticipantJoined$.next(true);
            await createAnswerV2(offer);
        });

        socket.on('candidate', async candidate => {
            try {
                await peerConnection.addIceCandidate(candidate);
                logger.log('CANDIDATE RECEIVED');
            }
            catch (error) {
                console.warn(error);
            }
        });

        socket.on('answer', answer => {
            logger.log('ANSWER RECEIVED');
            isParticipantJoined$.next(true);
            try {
                peerConnection.setRemoteDescription(answer);
            }
            catch (error) {
                console.warn(error);
            }
        });
    }
}

async function startCall() {
    peerConnection.oniceconnectionstatechange = () => logger.log('ICE CONNECTION STATE: ', peerConnection.iceConnectionState);

    peerConnection.onicecandidate = e => {
        socket.emit('candidate', { room: room, candidate: e.candidate });
        logger.log('on ice candidate');
    };

    peerConnection.ontrack = () => {
        const remoteStreams = peerConnection.getRemoteStreams();
        remoteStream$.next(remoteStreams[0]);
    };

    try {
        if (localStream) {
            const clonedStream = localStream.clone();
            for (const track of clonedStream.getTracks()) {
                peerConnection.addTrack(track, clonedStream);
            }
        }

        return createOffer();
    } catch (error) {
        console.error(error);
    }
}

async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { room: room, offer });
        logger.log('SENDING OFFER:');
    } catch (error) {
        console.error(error);
    }
}

async function createAnswerV2(description) {
    logger.log('create answer');
    peerConnection.onicecandidate = e => {
        const iceCandidate = e.candidate;
        socket.emit('candidate', { room: room, candidate: iceCandidate });
        logger.log('candidate generated');
    };

    peerConnection.ontrack = e => {
        logger.log('peer connection got remote track');
        remoteStream$.next(e.streams[0]);
    };
    if (localStream) {
        const stream = localStream.clone();
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });
    }
    try {
        await peerConnection.setRemoteDescription(description);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        logger.log('Sending answer');
        socket.emit('answer', { room: room, answer });
    }
    catch (error) {
        console.warn(error);
    }
}

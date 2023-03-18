import { BehaviorSubject } from 'rxjs';
import io from 'socket.io-client';
import * as ice from './iceStunServers';
import * as apiUrls from '../../../constants/apiUrls';
const wsUrl = apiUrls.heroku(process.env.NODE_ENV).videoServer;
import * as logger from '@/services/loggerService';
//const wsUrl = 'http://localhost:5000';
logger.log('VIDEO SERVER URL: ', wsUrl);
let socket = null;
let peerConnection = null;
let room = null;
let localStream = null;

export let remoteStream$ = new BehaviorSubject(null);
export let remoteAudioEnabled$ = new BehaviorSubject(null);
export let remoteVideoEnabled$ = new BehaviorSubject(null);

export async function setLocalStream(stream) {
    logger.log('Set local stream');
    localStream = stream;
    if (!peerConnection) return;
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

export async function joinRoom(roomId, userId, callback) {
    if (!socket)
        socket = io.connect(wsUrl);
    socket.on('connect', async () => {
        logger.log('client connected to server');
        room = roomId;
        const config = await ice.getIceConfig();
        peerConnection = new RTCPeerConnection(config);
        logger.log('Trying join room');
        socket.emit('join', room, userId, async (clientsInRoom) => {
            logger.log('Clients connected to video server: ', clientsInRoom);
            registerConnectionHandlers();
            await createOffer();
            onRoomJoined(callback);
        });
        socket.on('participantConnected', (count) => {
            logger.log('participant connected. Count: ', count);
            // if (count > 1)
            //     roomReady$.next(true);
        });
    });
    socket.on('remoteVideoEnabled', (value) => {
        logger.log('remoteVideoEnabled: ', value);
        remoteVideoEnabled$.next(value);
    });
    socket.on('remoteAudioEnabled', (value) => {
        logger.log('remoteAudioEnabled: ', value);
        remoteAudioEnabled$.next(value);
    });
}

export function enableDisableAudio(enabled) {
    socket?.emit('enabledDisableAudio', enabled);
}

export function enableDisableVideo(enabled) {
    socket?.emit('enableDisableVideo', enabled);
}

async function onRoomJoined(callback) {
    logger.log('room joined');
    socket.on('offer', async offer => {
        logger.log('OFFER RECEIVED');
        callback();
        await createAnswer(offer);
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
        try {
            peerConnection.setRemoteDescription(answer);
            callback();
        }
        catch (error) {
            console.warn(error);
        }
    });
}

function registerConnectionHandlers() {
    peerConnection.oniceconnectionstatechange = () => {
        logger.log('ICE CONNECTION STATE: ', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState == 'disconnected')
            peerConnection.restartIce();
    }

    peerConnection.onicecandidate = e => {
        socket.emit('candidate', room, e.candidate);
        logger.log('on ice candidate');
    };

    peerConnection.ontrack = () => {
        const remoteStreams = peerConnection.getRemoteStreams();
        const remoteStream = remoteStreams[0];
        logger.log('got remote stream');
        remoteStream$.next(remoteStream);
    };

    try {
        if (localStream) {
            const clonedStream = localStream.clone();
            for (const track of clonedStream.getTracks()) {
                peerConnection.addTrack(track, clonedStream);
            }
        }

    } catch (error) {
        console.error(error);
    }
}

async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', room, offer);
        logger.log('SENDING OFFER:');
    } catch (error) {
        console.error(error);
    }
}

async function createAnswer(description) {
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
        socket.emit('answer', room, answer);
    }
    catch (error) {
        console.warn(error);
    }
}

export async function endCall() {
    peerConnection?.close();
    peerConnection = null;
    socket?.disconnect();
    socket = null;
}

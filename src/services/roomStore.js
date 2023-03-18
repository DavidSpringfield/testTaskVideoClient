import { collection, getDocs, getDoc, addDoc, onSnapshot, where, query, doc, updateDoc, documentId, deleteDoc } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { db } from '@/main';

export let unsubscribe;

export async function createRoom(room) {
    let roomRef = null;
    let constraints = [];
    constraints.push(where('fromUserId', '==', room.fromUserId));
    constraints.push(where('toUserId', '==', room.toUserId));
    const q = query(collection(db, 'rooms'), ...constraints);
    const snap = await getDocs(q);
    const docData = snap.docs[0];
    if (docData) {
        snap.docs.forEach(async d => {
            await deleteDoc(d.ref);
        });
    }
    roomRef = await addDoc(collection(db, 'rooms'), room);
    return roomRef;
}

export async function updateRoom(roomId, room) {
    const roomRef = doc(collection(db, 'rooms'), roomId);
    const snapshot = await getDoc(roomRef);
    if (snapshot.exists())
        await updateDoc(roomRef, room);
}

export async function deleteRoom(roomId) {
    const roomsCollection = collection(db, 'rooms');
    if (roomId) {
        const roomRef = doc(roomsCollection, roomId);
        await deleteSubcollection(roomRef, 'calleeCandidates');
        await deleteSubcollection(roomRef, 'callerCandidates');
        await deleteDoc(roomRef);
    }
}

async function deleteSubcollection(ref, subcollectionName) {
    const querySnapshot = await getDocs(collection(ref, subcollectionName));
    querySnapshot.forEach(async docSn => {
        await deleteDoc(docSn.ref);
    });
}

export function subscribeForRoom(roomRef) {
    const subject = new BehaviorSubject(null);
    unsubscribe = onSnapshot(roomRef, (snapshot) => {
        subject.next(snapshot.data());
    });
    return subject;
}

export function getRoomReference(roomId) {
    return doc(collection(db, 'rooms'), roomId);
}

export function getQueryReference(roomId) {
    const docId = documentId();
    return query(collection(db, 'rooms'), where(docId, '==', roomId));
}

export function listenForRoomChanges(roomId, added, modified, removed) {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where(documentId(), '==', roomId));
    onSnapshot(q, async (snapshot) => {
        const change = snapshot.docChanges()[0];
        if (!change) return;
        if (change.type == 'added' && added)
            added(change);
        else if (change.type == 'modified' && modified)
            modified(change);
        if (change.type == 'removed' && removed) {
            removed(change);
        }
    });
}
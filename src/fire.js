import { initializeApp } from "firebase/app";
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
    //... go to Firebase console, open project settings and copy the config to use it here
    apiKey: "AIzaSyD1TpRYBzTc3i-WiTXyL6qBOP_PuUXcQgs",
    authDomain: "search-7469a.firebaseapp.com",
    projectId: "search-7469a",
    storageBucket: "search-7469a.appspot.com",
    messagingSenderId: "917484826403",
    appId: "1:917484826403:web:cbc25419cbdcee0c5be696"
};

const fireApp = initializeApp(firebaseConfig);
const db = getFirestore(fireApp);

export { db };


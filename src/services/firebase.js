// Firebase initialization placeholders. Replace with real config.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app = null;
let db = null;
let auth = null;
let storage = null;

try {
	app = initializeApp(firebaseConfig);
	db = getFirestore(app);
	auth = getAuth(app);
	storage = getStorage(app);
} catch (e) {
	// eslint-disable-next-line no-console
	console.warn('Firebase not initialized. Check env config.', e);
}

export { app, db, auth, storage };
export const isFirebaseConfigured = Boolean(
	process.env.REACT_APP_FIREBASE_API_KEY &&
	process.env.REACT_APP_FIREBASE_PROJECT_ID
);



import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export function subscribeTourists(onData, onError) {
	if (!isFirebaseConfigured || !db) return () => {};
	const q = query(collection(db, 'tourists'), orderBy('updatedAt', 'desc'), limit(200));
	return onSnapshot(q, (snap) => {
		const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
		onData(items);
	}, onError);
}

export function subscribeIncidents(onData, onError) {
	if (!isFirebaseConfigured || !db) return () => {};
	const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(200));
	return onSnapshot(q, (snap) => {
		const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
		onData(items);
	}, onError);
}



import { isFirebaseConfigured, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { callAnomalyDetection } from './functions';
import { subscribeTourists } from './firestoreStreams';
import useAppStore from '../store/useAppStore';

const THRESHOLD = 0.8;

export function startAnomalyWatcher() {
	let lastProcessed = new Map();
	return subscribeTourists(async (tourists) => {
		for (const t of tourists) {
			const loc = t?.location;
			if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') continue;
			const key = t.id + ':' + (t.updatedAt?.seconds || t.updatedAt || 'na');
			if (lastProcessed.has(key)) continue;
			lastProcessed.set(key, true);

			try {
				const res = await callAnomalyDetection({
					gps: { lat: loc.latitude, lon: loc.longitude, speed: t.speed || 0 },
					itineraryDeviation: t.itineraryDeviation || 0,
					groupContext: t.groupId || null,
					areaRisk: t.areaRisk || { weather: 0, crime: 0, political: 0 }
				});
				if (res.score >= THRESHOLD) {
					await createIncident({
						tourist: t.name || t.id,
						touristId: t.id,
						type: 'Anomaly',
						status: 'Unresolved',
						score: res.score,
						riskLevel: res.riskLevel || 'Yellow',
						location: loc
					});
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.warn('Anomaly watcher error', e);
			}
		}
	});
}

async function createIncident(incident) {
	if (isFirebaseConfigured && db) {
		await addDoc(collection(db, 'incidents'), {
			...incident,
			createdAt: serverTimestamp()
		});
		return;
	}
	const addLocalIncident = useAppStore.getState().addLocalIncident;
	addLocalIncident({ id: Date.now(), ...incident });
}



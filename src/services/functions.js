import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, isFirebaseConfigured } from './firebase';

export async function callAnomalyDetection(payload) {
	if (!isFirebaseConfigured || !app) {
		return { score: 0, riskLevel: 'Green' };
	}
	const functions = getFunctions(app);
	const fn = httpsCallable(functions, 'detectAnomaly');
	const res = await fn(payload);
	return res?.data ?? { score: 0, riskLevel: 'Green' };
}



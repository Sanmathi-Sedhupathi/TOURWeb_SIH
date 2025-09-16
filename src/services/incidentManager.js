import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import useAppStore from '../store/useAppStore';

class IncidentManager {
	constructor() {
		this.incidentCounter = 1000;
	}

	// Create new incident with automated E-FIR generation
	async createIncident(incidentData) {
		try {
			const incident = {
				...incidentData,
				id: this.generateIncidentId(),
				createdAt: new Date().toISOString(),
				status: 'Open',
				priority: this.calculatePriority(incidentData),
				efir: await this.generateEFIR(incidentData),
				evidence: [],
				assignedOfficer: null,
				updates: []
			};

			if (isFirebaseConfigured && db) {
				const docRef = await addDoc(collection(db, 'incidents'), {
					...incident,
					createdAt: serverTimestamp()
				});
				incident.firestoreId = docRef.id;
			} else {
				// Store locally if Firebase not available
				const addLocalIncident = useAppStore.getState().addLocalIncident;
				addLocalIncident(incident);
			}

			// Trigger automated responses
			await this.triggerAutomatedResponse(incident);
			
			return incident;
		} catch (error) {
			console.error('Error creating incident:', error);
			throw error;
		}
	}

	// Generate unique incident ID
	generateIncidentId() {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const counter = String(this.incidentCounter++).padStart(4, '0');
		
		return `INC-${year}${month}${day}-${counter}`;
	}

	// Calculate incident priority
	calculatePriority(incidentData) {
		let priority = 'Medium';
		
		if (incidentData.type === 'SOS' || incidentData.score >= 0.9) {
			priority = 'Critical';
		} else if (incidentData.type === 'Anomaly' && incidentData.score >= 0.7) {
			priority = 'High';
		} else if (incidentData.riskLevel === 'Red') {
			priority = 'High';
		} else if (incidentData.riskLevel === 'Yellow') {
			priority = 'Medium';
		} else {
			priority = 'Low';
		}
		
		return priority;
	}

	// Generate automated E-FIR (Electronic First Information Report)
	async generateEFIR(incidentData) {
		const efir = {
			firNumber: this.generateFIRNumber(),
			dateTime: new Date().toISOString(),
			location: {
				coordinates: incidentData.location,
				address: await this.getAddressFromCoordinates(incidentData.location),
				jurisdiction: this.determineJurisdiction(incidentData.location)
			},
			complainant: {
				type: 'System Generated',
				details: 'AI Anomaly Detection System'
			},
			accused: {
				known: false,
				details: 'Unknown'
			},
			incident: {
				type: incidentData.type,
				category: this.categorizeIncident(incidentData),
				description: this.generateIncidentDescription(incidentData),
				severity: incidentData.priority || 'Medium'
			},
			victim: {
				name: incidentData.tourist || 'Unknown Tourist',
				touristId: incidentData.touristId,
				digitalId: incidentData.digitalId,
				contact: incidentData.emergencyContact
			},
			evidence: {
				gpsData: incidentData.location,
				anomalyScore: incidentData.score,
				riskFactors: incidentData.factors || [],
				timestamp: incidentData.timestamp
			},
			status: 'Registered',
			investigatingOfficer: null,
			remarks: 'Auto-generated based on AI anomaly detection'
		};

		return efir;
	}

	// Generate FIR number
	generateFIRNumber() {
		const date = new Date();
		const year = date.getFullYear();
		const stationCode = '001'; // Police station code
		const serialNumber = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
		
		return `FIR-${stationCode}-${year}-${serialNumber}`;
	}

	// Categorize incident for E-FIR
	categorizeIncident(incidentData) {
		const categories = {
			'SOS': 'Emergency Assistance',
			'Anomaly': 'Suspicious Activity',
			'Zone Breach': 'Restricted Area Entry',
			'Group Separation': 'Missing Person Alert',
			'Route Deviation': 'Lost Tourist'
		};
		
		return categories[incidentData.type] || 'General Incident';
	}

	// Generate incident description
	generateIncidentDescription(incidentData) {
		let description = `AI system detected ${incidentData.type.toLowerCase()} `;
		description += `for tourist ${incidentData.tourist || 'Unknown'} `;
		description += `at coordinates ${incidentData.location?.latitude}, ${incidentData.location?.longitude}. `;
		description += `Anomaly score: ${incidentData.score?.toFixed(2) || 'N/A'}. `;
		
		if (incidentData.factors && incidentData.factors.length > 0) {
			description += `Risk factors: ${incidentData.factors.join(', ')}. `;
		}
		
		description += `Immediate attention required.`;
		
		return description;
	}

	// Get address from coordinates (geocoding)
	async getAddressFromCoordinates(location) {
		if (!location?.latitude || !location?.longitude) {
			return 'Unknown Location';
		}

		try {
			// Using a free geocoding service (replace with preferred service)
			const response = await fetch(
				`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
			);
			const data = await response.json();
			
			return data.display_name || `${location.latitude}, ${location.longitude}`;
		} catch (error) {
			return `${location.latitude}, ${location.longitude}`;
		}
	}

	// Determine police jurisdiction
	determineJurisdiction(location) {
		// Simplified jurisdiction mapping (replace with real data)
		if (!location?.latitude || !location?.longitude) {
			return 'Central Police Station';
		}

		// Example jurisdiction mapping based on coordinates
		const lat = location.latitude;
		const lon = location.longitude;
		
		if (lat > 28.6 && lat < 28.7 && lon > 77.2 && lon < 77.3) {
			return 'New Delhi Police Station';
		} else if (lat > 28.5 && lat < 28.6) {
			return 'South Delhi Police Station';
		} else {
			return 'Central Police Station';
		}
	}

	// Trigger automated response based on incident
	async triggerAutomatedResponse(incident) {
		try {
			// Send alerts to relevant personnel
			await this.sendAlerts(incident);
			
			// Auto-assign to nearest available officer
			await this.autoAssignOfficer(incident);
			
			// Update dashboard notifications
			this.updateDashboardNotifications(incident);
			
		} catch (error) {
			console.error('Error in automated response:', error);
		}
	}

	// Send alerts to relevant personnel
	async sendAlerts(incident) {
		const alertData = {
			incidentId: incident.id,
			type: incident.type,
			priority: incident.priority,
			location: incident.location,
			tourist: incident.tourist,
			message: `${incident.priority} priority ${incident.type} detected for ${incident.tourist}`
		};

		// Add notification to dashboard
		const addNotification = useAppStore.getState().addNotification;
		addNotification({
			severity: incident.priority === 'Critical' ? 'error' : 'warning',
			message: alertData.message
		});

		// In a real implementation, send SMS, email, push notifications
		console.log('Alert sent:', alertData);
	}

	// Auto-assign incident to nearest available officer
	async autoAssignOfficer(incident) {
		// Simplified officer assignment (replace with real officer management system)
		const availableOfficers = [
			{ id: 'OFF001', name: 'Officer Smith', location: { lat: 28.6139, lon: 77.209 } },
			{ id: 'OFF002', name: 'Officer Johnson', location: { lat: 28.6289, lon: 77.2065 } },
			{ id: 'OFF003', name: 'Officer Brown', location: { lat: 28.6169, lon: 77.2090 } }
		];

		if (!incident.location?.latitude || !incident.location?.longitude) {
			return;
		}

		// Find nearest officer
		let nearestOfficer = null;
		let minDistance = Infinity;

		for (const officer of availableOfficers) {
			const distance = this.calculateDistance(
				incident.location.latitude, incident.location.longitude,
				officer.location.lat, officer.location.lon
			);
			
			if (distance < minDistance) {
				minDistance = distance;
				nearestOfficer = officer;
			}
		}

		if (nearestOfficer) {
			incident.assignedOfficer = nearestOfficer;
			
			// Update in database if available
			if (incident.firestoreId && isFirebaseConfigured && db) {
				await updateDoc(doc(db, 'incidents', incident.firestoreId), {
					assignedOfficer: nearestOfficer,
					updatedAt: serverTimestamp()
				});
			}
		}
	}

	// Calculate distance between two points
	calculateDistance(lat1, lon1, lat2, lon2) {
		const R = 6371; // Earth's radius in km
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	}

	// Update dashboard notifications
	updateDashboardNotifications(incident) {
		const addNotification = useAppStore.getState().addNotification;
		
		let severity = 'info';
		if (incident.priority === 'Critical') severity = 'error';
		else if (incident.priority === 'High') severity = 'warning';
		
		addNotification({
			severity,
			message: `New ${incident.type} incident: ${incident.id} - ${incident.tourist}`
		});
	}

	// Add evidence to incident
	async addEvidence(incidentId, evidenceData) {
		try {
			let evidenceUrl = null;
			
			// Upload file evidence to storage
			if (evidenceData.file && isFirebaseConfigured && storage) {
				const storageRef = ref(storage, `evidence/${incidentId}/${Date.now()}_${evidenceData.file.name}`);
				const snapshot = await uploadBytes(storageRef, evidenceData.file);
				evidenceUrl = await getDownloadURL(snapshot.ref);
			}

			const evidence = {
				id: Date.now().toString(),
				type: evidenceData.type,
				description: evidenceData.description,
				url: evidenceUrl,
				timestamp: new Date().toISOString(),
				addedBy: evidenceData.addedBy || 'System'
			};

			// Update incident with new evidence
			if (isFirebaseConfigured && db) {
				// Update in Firestore
				// Implementation depends on how incidents are stored
			}

			return evidence;
		} catch (error) {
			console.error('Error adding evidence:', error);
			throw error;
		}
	}

	// Update incident status
	async updateIncidentStatus(incidentId, status, remarks) {
		try {
			const update = {
				status,
				remarks,
				updatedAt: new Date().toISOString(),
				updatedBy: 'System' // Replace with actual user
			};

			if (isFirebaseConfigured && db) {
				await updateDoc(doc(db, 'incidents', incidentId), update);
			}

			return update;
		} catch (error) {
			console.error('Error updating incident status:', error);
			throw error;
		}
	}
}

export default new IncidentManager();
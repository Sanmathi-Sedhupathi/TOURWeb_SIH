import { isFirebaseConfigured, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import aiAnomalyDetection from './aiAnomalyDetection';
import riskAssessment from './riskAssessment';
import incidentManager from './incidentManager';
import blockchainService from './blockchain';
import { subscribeTourists } from './firestoreStreams';
import useAppStore from '../store/useAppStore';

const ANOMALY_THRESHOLD = 0.7;
const HIGH_RISK_THRESHOLD = 0.8;

class EnhancedAnomalyWatcher {
	constructor() {
		this.lastProcessed = new Map();
		this.groupNetworks = new Map();
		this.riskCache = new Map();
		this.isRunning = false;
	}

	start() {
		if (this.isRunning) return;
		
		this.isRunning = true;
		console.log('Enhanced Anomaly Watcher started');
		
		return subscribeTourists(async (tourists) => {
			await this.processTourists(tourists);
		});
	}

	async processTourists(tourists) {
		try {
			// Group tourists by area for network analysis
			const areaGroups = this.groupTouristsByArea(tourists);
			
			// Process each tourist
			for (const tourist of tourists) {
				await this.processTourist(tourist, areaGroups);
			}
			
			// Analyze group patterns
			await this.analyzeGroupPatterns(areaGroups);
			
		} catch (error) {
			console.error('Error processing tourists:', error);
		}
	}

	async processTourist(tourist, areaGroups) {
		const loc = tourist?.location;
		if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
			return;
		}

		// Create unique key for this tourist update
		const key = `${tourist.id}:${tourist.updatedAt?.seconds || tourist.updatedAt || Date.now()}`;
		if (this.lastProcessed.has(key)) return;
		this.lastProcessed.set(key, true);

		try {
			// Get comprehensive risk assessment
			const locationRisk = await this.getLocationRisk(loc.latitude, loc.longitude);
			
			// Prepare data for AI analysis
			const analysisData = {
				gps: {
					latitude: loc.latitude,
					longitude: loc.longitude,
					speed: tourist.speed || 0,
					acceleration: tourist.acceleration || 0,
					directionChange: tourist.directionChange || 0
				},
				itineraryDeviation: tourist.itineraryDeviation || 0,
				groupContext: this.getGroupContext(tourist, areaGroups),
				areaRisk: locationRisk,
				historicalData: await this.getHistoricalData(tourist.id),
				timeContext: this.getTimeContext()
			};

			// Run AI anomaly detection
			const anomalyResult = await aiAnomalyDetection.detectAnomaly(analysisData);
			
			// Update tourist risk level
			await this.updateTouristRisk(tourist, anomalyResult, locationRisk);
			
			// Check if incident should be created
			if (anomalyResult.score >= ANOMALY_THRESHOLD) {
				await this.createAnomalyIncident(tourist, anomalyResult, locationRisk);
			}
			
			// Update blockchain network if tourist is in a group
			if (tourist.groupId || tourist.familyId) {
				await this.updateGroupNetwork(tourist, anomalyResult);
			}
			
		} catch (error) {
			console.error(`Error processing tourist ${tourist.id}:`, error);
		}
	}

	groupTouristsByArea(tourists) {
		const areaGroups = new Map();
		const AREA_RADIUS = 0.01; // ~1km grouping radius
		
		tourists.forEach(tourist => {
			if (!tourist.location) return;
			
			const { latitude, longitude } = tourist.location;
			const areaKey = `${Math.floor(latitude / AREA_RADIUS)}_${Math.floor(longitude / AREA_RADIUS)}`;
			
			if (!areaGroups.has(areaKey)) {
				areaGroups.set(areaKey, []);
			}
			areaGroups.get(areaKey).push(tourist);
		});
		
		return areaGroups;
	}

	async getLocationRisk(latitude, longitude) {
		const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
		const cached = this.riskCache.get(cacheKey);
		
		if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 min cache
			return cached.risk;
		}
		
		const risk = await riskAssessment.getLocationRisk(latitude, longitude);
		this.riskCache.set(cacheKey, { risk, timestamp: Date.now() });
		
		return risk;
	}

	getGroupContext(tourist, areaGroups) {
		// Find the area group this tourist belongs to
		let areaGroup = null;
		for (const [key, group] of areaGroups) {
			if (group.find(t => t.id === tourist.id)) {
				areaGroup = group;
				break;
			}
		}
		
		if (!areaGroup) {
			return { size: 1, separation: 0, anomalies: 0 };
		}
		
		// Calculate group metrics
		const groupSize = areaGroup.length;
		const separation = this.calculateGroupSeparation(areaGroup);
		const anomalies = areaGroup.filter(t => t.anomalyScore > 0.5).length;
		
		return {
			size: groupSize,
			separation,
			anomalies,
			members: areaGroup.map(t => t.id)
		};
	}

	calculateGroupSeparation(group) {
		if (group.length < 2) return 0;
		
		let maxDistance = 0;
		for (let i = 0; i < group.length; i++) {
			for (let j = i + 1; j < group.length; j++) {
				const t1 = group[i];
				const t2 = group[j];
				
				if (!t1.location || !t2.location) continue;
				
				const distance = this.calculateDistance(
					t1.location.latitude, t1.location.longitude,
					t2.location.latitude, t2.location.longitude
				);
				
				maxDistance = Math.max(maxDistance, distance);
			}
		}
		
		return Math.min(maxDistance / 2, 1); // Normalize to 0-1
	}

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

	async getHistoricalData(touristId) {
		// In a real implementation, this would query historical data
		// For now, return simulated data
		return {
			visitCount: Math.floor(Math.random() * 10) + 1,
			avgStayTime: Math.random() * 4 + 1, // 1-5 hours
			anomalyCount: Math.floor(Math.random() * 3),
			previousLocations: []
		};
	}

	getTimeContext() {
		const now = new Date();
		return {
			hour: now.getHours(),
			dayOfWeek: now.getDay(),
			isWeekend: now.getDay() === 0 || now.getDay() === 6,
			isNight: now.getHours() < 6 || now.getHours() > 22,
			season: this.getSeason(now)
		};
	}

	getSeason(date) {
		const month = date.getMonth();
		if (month >= 2 && month <= 4) return 'spring';
		if (month >= 5 && month <= 7) return 'summer';
		if (month >= 8 && month <= 10) return 'autumn';
		return 'winter';
	}

	async updateTouristRisk(tourist, anomalyResult, locationRisk) {
		// Update tourist's risk level based on AI analysis
		const overallRisk = Math.max(anomalyResult.score, locationRisk.overall);
		const riskLevel = overallRisk >= 0.8 ? 'Red' : overallRisk >= 0.5 ? 'Yellow' : 'Green';
		
		// In a real implementation, update the tourist record in database
		tourist.riskLevel = riskLevel;
		tourist.anomalyScore = anomalyResult.score;
		tourist.riskFactors = anomalyResult.factors;
		tourist.lastRiskUpdate = new Date().toISOString();
	}

	async createAnomalyIncident(tourist, anomalyResult, locationRisk) {
		try {
			const incidentData = {
				tourist: tourist.name || `Tourist ${tourist.id}`,
				touristId: tourist.id,
				digitalId: tourist.digitalId,
				type: 'AI Anomaly',
				score: anomalyResult.score,
				riskLevel: anomalyResult.riskLevel,
				location: tourist.location,
				factors: anomalyResult.factors,
				locationRisk: locationRisk,
				emergencyContact: tourist.emergencyContact,
				groupId: tourist.groupId || tourist.familyId,
				timestamp: Date.now()
			};
			
			await incidentManager.createIncident(incidentData);
			
			// Add notification
			const addNotification = useAppStore.getState().addNotification;
			addNotification({
				severity: anomalyResult.riskLevel === 'Red' ? 'error' : 'warning',
				message: `AI detected ${anomalyResult.riskLevel.toLowerCase()} risk anomaly for ${tourist.name || 'tourist'}`
			});
			
		} catch (error) {
			console.error('Error creating anomaly incident:', error);
		}
	}

	async updateGroupNetwork(tourist, anomalyResult) {
		const groupId = tourist.groupId || tourist.familyId;
		if (!groupId) return;
		
		// Update blockchain network with latest tourist data
		const areaId = `area-${Math.floor(tourist.location.latitude * 100)}-${Math.floor(tourist.location.longitude * 100)}`;
		
		try {
			blockchainService.linkToAreaNetwork(tourist, areaId);
			
			// Store group network data
			if (!this.groupNetworks.has(groupId)) {
				this.groupNetworks.set(groupId, {
					id: groupId,
					members: [],
					riskData: {},
					lastUpdate: Date.now()
				});
			}
			
			const network = this.groupNetworks.get(groupId);
			network.riskData[tourist.id] = {
				anomalyScore: anomalyResult.score,
				riskLevel: anomalyResult.riskLevel,
				factors: anomalyResult.factors,
				timestamp: Date.now()
			};
			network.lastUpdate = Date.now();
			
		} catch (error) {
			console.error('Error updating group network:', error);
		}
	}

	async analyzeGroupPatterns(areaGroups) {
		// Analyze patterns across groups for collective insights
		for (const [areaKey, group] of areaGroups) {
			if (group.length < 3) continue; // Need at least 3 tourists for pattern analysis
			
			try {
				const patterns = await this.detectGroupPatterns(group);
				if (patterns.anomalous) {
					await this.handleGroupAnomaly(areaKey, group, patterns);
				}
			} catch (error) {
				console.error(`Error analyzing group patterns for area ${areaKey}:`, error);
			}
		}
	}

	async detectGroupPatterns(group) {
		// Analyze collective behavior patterns
		const avgSpeed = group.reduce((sum, t) => sum + (t.speed || 0), 0) / group.length;
		const riskLevels = group.map(t => t.riskLevel || 'Green');
		const highRiskCount = riskLevels.filter(r => r === 'Red').length;
		const mediumRiskCount = riskLevels.filter(r => r === 'Yellow').length;
		
		// Check for anomalous group behavior
		const anomalous = (
			avgSpeed > 60 || // Very high average speed
			highRiskCount > group.length * 0.5 || // More than 50% high risk
			(highRiskCount + mediumRiskCount) > group.length * 0.8 // More than 80% at risk
		);
		
		return {
			anomalous,
			avgSpeed,
			riskDistribution: { high: highRiskCount, medium: mediumRiskCount, low: group.length - highRiskCount - mediumRiskCount },
			groupSize: group.length,
			factors: anomalous ? this.identifyGroupRiskFactors(group) : []
		};
	}

	identifyGroupRiskFactors(group) {
		const factors = [];
		
		const avgSpeed = group.reduce((sum, t) => sum + (t.speed || 0), 0) / group.length;
		if (avgSpeed > 60) factors.push('High group movement speed');
		
		const highRiskCount = group.filter(t => t.riskLevel === 'Red').length;
		if (highRiskCount > group.length * 0.5) factors.push('Multiple high-risk individuals');
		
		const separation = this.calculateGroupSeparation(group);
		if (separation > 0.7) factors.push('Group members widely separated');
		
		return factors;
	}

	async handleGroupAnomaly(areaKey, group, patterns) {
		// Create group-level incident
		const incidentData = {
			tourist: `Group in area ${areaKey}`,
			touristId: `group-${areaKey}`,
			type: 'Group Anomaly',
			score: 0.8, // High score for group anomalies
			riskLevel: 'Red',
			location: this.calculateGroupCenter(group),
			factors: patterns.factors,
			groupSize: patterns.groupSize,
			affectedTourists: group.map(t => ({ id: t.id, name: t.name })),
			timestamp: Date.now()
		};
		
		await incidentManager.createIncident(incidentData);
		
		// Notify dashboard
		const addNotification = useAppStore.getState().addNotification;
		addNotification({
			severity: 'error',
			message: `Group anomaly detected: ${patterns.groupSize} tourists in area ${areaKey}`
		});
	}

	calculateGroupCenter(group) {
		const validLocations = group.filter(t => t.location);
		if (validLocations.length === 0) return null;
		
		const avgLat = validLocations.reduce((sum, t) => sum + t.location.latitude, 0) / validLocations.length;
		const avgLon = validLocations.reduce((sum, t) => sum + t.location.longitude, 0) / validLocations.length;
		
		return { latitude: avgLat, longitude: avgLon };
	}

	stop() {
		this.isRunning = false;
		this.lastProcessed.clear();
		this.groupNetworks.clear();
		this.riskCache.clear();
		console.log('Enhanced Anomaly Watcher stopped');
	}
}

export default new EnhancedAnomalyWatcher();
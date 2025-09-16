import { HfInference } from '@huggingface/inference';

class AIAnomalyDetection {
	constructor() {
		this.hf = new HfInference(process.env.REACT_APP_HUGGINGFACE_TOKEN);
		this.initialized = Boolean(process.env.REACT_APP_HUGGINGFACE_TOKEN);
	}

	// Main anomaly detection function
	async detectAnomaly(touristData) {
		try {
			const features = this.extractFeatures(touristData);
			const anomalyScore = await this.calculateAnomalyScore(features);
			const riskLevel = this.determineRiskLevel(anomalyScore, features);
			
			return {
				score: anomalyScore,
				riskLevel,
				factors: this.identifyRiskFactors(features, anomalyScore),
				timestamp: Date.now()
			};
		} catch (error) {
			console.warn('AI Anomaly Detection error:', error);
			return this.fallbackDetection(touristData);
		}
	}

	// Extract features for ML model
	extractFeatures(data) {
		const {
			gps = {},
			itineraryDeviation = 0,
			groupContext = {},
			areaRisk = {},
			historicalData = {},
			timeContext = {}
		} = data;

		return {
			// Movement features
			speed: gps.speed || 0,
			acceleration: gps.acceleration || 0,
			directionChange: gps.directionChange || 0,
			
			// Route deviation
			routeDeviation: itineraryDeviation,
			plannedVsActual: this.calculateRouteDeviation(gps, data.plannedRoute),
			
			// Temporal features
			timeOfDay: new Date().getHours(),
			dayOfWeek: new Date().getDay(),
			isNightTime: this.isNightTime(),
			
			// Environmental risks
			weatherRisk: areaRisk.weather || 0,
			crimeRisk: areaRisk.crime || 0,
			politicalRisk: areaRisk.political || 0,
			
			// Group context
			groupSize: groupContext.size || 1,
			groupSeparation: groupContext.separation || 0,
			groupAnomalies: groupContext.anomalies || 0,
			
			// Historical patterns
			visitFrequency: historicalData.visitCount || 0,
			avgStayTime: historicalData.avgStayTime || 0,
			previousAnomalies: historicalData.anomalyCount || 0
		};
	}

	// Calculate anomaly score using multiple algorithms
	async calculateAnomalyScore(features) {
		if (!this.initialized) {
			return this.calculateLocalAnomalyScore(features);
		}

		try {
			// Use Hugging Face for advanced anomaly detection
			const input = Object.values(features).join(',');
			
			// For demonstration, using a text classification model
			// In production, you'd use a specialized anomaly detection model
			const result = await this.hf.textClassification({
				model: 'distilbert-base-uncased-finetuned-sst-2-english',
				inputs: `Tourist behavior analysis: ${input}`
			});

			// Convert classification confidence to anomaly score
			const confidence = result[0]?.score || 0.5;
			return this.normalizeScore(confidence, features);
		} catch (error) {
			return this.calculateLocalAnomalyScore(features);
		}
	}

	// Local anomaly detection fallback
	calculateLocalAnomalyScore(features) {
		let score = 0;
		let factors = 0;

		// Speed anomaly
		if (features.speed > 80 || features.speed < 0.5) {
			score += 0.3;
			factors++;
		}

		// Route deviation
		if (features.routeDeviation > 0.5) {
			score += 0.25;
			factors++;
		}

		// Environmental risks
		const envRisk = (features.weatherRisk + features.crimeRisk + features.politicalRisk) / 3;
		score += envRisk * 0.2;

		// Time-based risks
		if (features.isNightTime && (features.crimeRisk > 0.6 || features.politicalRisk > 0.6)) {
			score += 0.15;
			factors++;
		}

		// Group separation
		if (features.groupSize > 1 && features.groupSeparation > 0.7) {
			score += 0.1;
			factors++;
		}

		return Math.min(score, 1.0);
	}

	// Determine risk level based on score and context
	determineRiskLevel(score, features) {
		if (score >= 0.8 || features.crimeRisk >= 0.9 || features.politicalRisk >= 0.9) {
			return 'Red';
		} else if (score >= 0.5 || features.weatherRisk >= 0.7 || features.crimeRisk >= 0.6) {
			return 'Yellow';
		}
		return 'Green';
	}

	// Identify specific risk factors
	identifyRiskFactors(features, score) {
		const factors = [];

		if (features.speed > 80) factors.push('High speed detected');
		if (features.routeDeviation > 0.5) factors.push('Significant route deviation');
		if (features.weatherRisk > 0.7) factors.push('Severe weather conditions');
		if (features.crimeRisk > 0.6) factors.push('High crime area');
		if (features.politicalRisk > 0.6) factors.push('Political instability');
		if (features.groupSeparation > 0.7) factors.push('Group members separated');
		if (features.isNightTime && score > 0.6) factors.push('High-risk nighttime activity');

		return factors;
	}

	// Utility functions
	calculateRouteDeviation(currentGps, plannedRoute) {
		if (!plannedRoute || !currentGps.latitude || !currentGps.longitude) return 0;
		
		// Simplified deviation calculation
		const distance = this.calculateDistance(
			currentGps.latitude, currentGps.longitude,
			plannedRoute.latitude, plannedRoute.longitude
		);
		
		return Math.min(distance / 1000, 1); // Normalize to 0-1
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

	isNightTime() {
		const hour = new Date().getHours();
		return hour < 6 || hour > 22;
	}

	normalizeScore(confidence, features) {
		// Adjust confidence based on environmental factors
		const envMultiplier = 1 + (features.weatherRisk + features.crimeRisk + features.politicalRisk) / 3;
		return Math.min(confidence * envMultiplier, 1.0);
	}

	// Fallback detection for when AI service is unavailable
	fallbackDetection(touristData) {
		const features = this.extractFeatures(touristData);
		const score = this.calculateLocalAnomalyScore(features);
		
		return {
			score,
			riskLevel: this.determineRiskLevel(score, features),
			factors: this.identifyRiskFactors(features, score),
			timestamp: Date.now(),
			source: 'local'
		};
	}
}

export default new AIAnomalyDetection();
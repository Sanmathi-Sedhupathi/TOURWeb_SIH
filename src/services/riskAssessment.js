// Risk assessment service for weather, crime, and political data
class RiskAssessmentService {
	constructor() {
		this.weatherAPI = process.env.REACT_APP_WEATHER_API_KEY;
		this.crimeDataCache = new Map();
		this.politicalDataCache = new Map();
		this.weatherCache = new Map();
	}

	// Get comprehensive risk assessment for a location
	async getLocationRisk(latitude, longitude) {
		try {
			const [weatherRisk, crimeRisk, politicalRisk] = await Promise.all([
				this.getWeatherRisk(latitude, longitude),
				this.getCrimeRisk(latitude, longitude),
				this.getPoliticalRisk(latitude, longitude)
			]);

			const overallRisk = this.calculateOverallRisk(weatherRisk, crimeRisk, politicalRisk);

			return {
				weather: weatherRisk,
				crime: crimeRisk,
				political: politicalRisk,
				overall: overallRisk,
				level: this.getRiskLevel(overallRisk),
				timestamp: Date.now()
			};
		} catch (error) {
			console.warn('Risk assessment error:', error);
			return this.getDefaultRisk();
		}
	}

	// Weather risk assessment
	async getWeatherRisk(lat, lon) {
		const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
		const cached = this.weatherCache.get(cacheKey);
		
		if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 min cache
			return cached.risk;
		}

		try {
			if (!this.weatherAPI) {
				return this.getSimulatedWeatherRisk(lat, lon);
			}

			const response = await fetch(
				`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherAPI}`
			);
			const data = await response.json();

			const risk = this.calculateWeatherRisk(data);
			this.weatherCache.set(cacheKey, { risk, timestamp: Date.now() });
			
			return risk;
		} catch (error) {
			return this.getSimulatedWeatherRisk(lat, lon);
		}
	}

	// Calculate weather risk from API data
	calculateWeatherRisk(weatherData) {
		let risk = 0;

		// Severe weather conditions
		const weather = weatherData.weather?.[0];
		if (weather) {
			const condition = weather.main.toLowerCase();
			if (['thunderstorm', 'tornado'].includes(condition)) risk += 0.8;
			else if (['rain', 'snow', 'fog'].includes(condition)) risk += 0.4;
			else if (['clouds'].includes(condition)) risk += 0.1;
		}

		// Wind speed
		const windSpeed = weatherData.wind?.speed || 0;
		if (windSpeed > 15) risk += 0.3;
		else if (windSpeed > 10) risk += 0.1;

		// Visibility
		const visibility = weatherData.visibility || 10000;
		if (visibility < 1000) risk += 0.4;
		else if (visibility < 5000) risk += 0.2;

		// Temperature extremes
		const temp = weatherData.main?.temp || 273;
		const celsius = temp - 273.15;
		if (celsius > 40 || celsius < -10) risk += 0.3;
		else if (celsius > 35 || celsius < 0) risk += 0.1;

		return Math.min(risk, 1.0);
	}

	// Crime risk assessment (simulated with historical data patterns)
	async getCrimeRisk(lat, lon) {
		const cacheKey = `crime-${lat.toFixed(2)},${lon.toFixed(2)}`;
		const cached = this.crimeDataCache.get(cacheKey);
		
		if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1 hour cache
			return cached.risk;
		}

		// Simulated crime risk based on location patterns
		const risk = this.calculateSimulatedCrimeRisk(lat, lon);
		this.crimeDataCache.set(cacheKey, { risk, timestamp: Date.now() });
		
		return risk;
	}

	// Political risk assessment
	async getPoliticalRisk(lat, lon) {
		const cacheKey = `political-${lat.toFixed(2)},${lon.toFixed(2)}`;
		const cached = this.politicalDataCache.get(cacheKey);
		
		if (cached && Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) { // 2 hour cache
			return cached.risk;
		}

		// Simulated political risk
		const risk = this.calculateSimulatedPoliticalRisk(lat, lon);
		this.politicalDataCache.set(cacheKey, { risk, timestamp: Date.now() });
		
		return risk;
	}

	// Simulated risk calculations (replace with real data sources)
	getSimulatedWeatherRisk(lat, lon) {
		// Simulate based on location and time
		const hour = new Date().getHours();
		const baseRisk = Math.sin(lat * 0.1) * 0.3 + 0.2;
		const timeMultiplier = hour >= 14 && hour <= 18 ? 1.5 : 1; // Afternoon storms
		return Math.min(baseRisk * timeMultiplier, 1.0);
	}

	calculateSimulatedCrimeRisk(lat, lon) {
		// Simulate higher crime risk in certain areas and times
		const hour = new Date().getHours();
		const isNight = hour < 6 || hour > 22;
		
		// Urban areas (higher population density) = higher crime risk
		const urbanFactor = Math.abs(Math.sin(lat * 2) * Math.cos(lon * 2)) * 0.4;
		const timeFactor = isNight ? 0.3 : 0.1;
		
		return Math.min(urbanFactor + timeFactor, 1.0);
	}

	calculateSimulatedPoliticalRisk(lat, lon) {
		// Simulate political risk based on region
		const regionRisk = Math.abs(Math.sin(lat * 0.5)) * 0.3;
		const randomEvents = Math.random() * 0.2; // Random political events
		
		return Math.min(regionRisk + randomEvents, 1.0);
	}

	// Calculate overall risk from individual components
	calculateOverallRisk(weather, crime, political) {
		// Weighted average with crime and political having higher weights
		const weights = { weather: 0.2, crime: 0.4, political: 0.4 };
		return weather * weights.weather + crime * weights.crime + political * weights.political;
	}

	// Convert risk score to level
	getRiskLevel(risk) {
		if (risk >= 0.7) return 'Red';
		if (risk >= 0.4) return 'Yellow';
		return 'Green';
	}

	// Default risk when service is unavailable
	getDefaultRisk() {
		return {
			weather: 0.2,
			crime: 0.3,
			political: 0.1,
			overall: 0.2,
			level: 'Green',
			timestamp: Date.now()
		};
	}

	// Get risk forecast for next 24-48 hours
	async getRiskForecast(lat, lon, hours = 24) {
		const forecast = [];
		const currentTime = new Date();
		
		for (let i = 0; i < hours; i += 6) { // 6-hour intervals
			const futureTime = new Date(currentTime.getTime() + i * 60 * 60 * 1000);
			const risk = await this.getForecastRisk(lat, lon, futureTime);
			
			forecast.push({
				time: futureTime.toISOString(),
				hour: futureTime.getHours(),
				...risk
			});
		}
		
		return forecast;
	}

	// Get forecasted risk for specific time
	async getForecastRisk(lat, lon, time) {
		// Simplified forecast based on time patterns
		const hour = time.getHours();
		const baseRisk = await this.getLocationRisk(lat, lon);
		
		// Adjust risk based on time of day
		let timeMultiplier = 1;
		if (hour >= 22 || hour <= 6) timeMultiplier = 1.3; // Night
		else if (hour >= 14 && hour <= 18) timeMultiplier = 1.2; // Afternoon
		
		return {
			weather: Math.min(baseRisk.weather * timeMultiplier, 1.0),
			crime: Math.min(baseRisk.crime * timeMultiplier, 1.0),
			political: baseRisk.political, // Political risk doesn't change with time of day
			overall: Math.min(baseRisk.overall * timeMultiplier, 1.0),
			level: this.getRiskLevel(baseRisk.overall * timeMultiplier)
		};
	}
}

export default new RiskAssessmentService();
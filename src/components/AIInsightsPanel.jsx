import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	Box,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Chip,
	LinearProgress,
	Grid,
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails
} from '@mui/material';
import {
	Psychology as AIIcon,
	TrendingUp as TrendIcon,
	Warning as WarningIcon,
	LocationOn as LocationIcon,
	Schedule as ScheduleIcon,
	ExpandMore as ExpandMoreIcon,
	Insights as InsightsIcon
} from '@mui/icons-material';
import aiAnomalyDetection from '../services/aiAnomalyDetection';
import riskAssessment from '../services/riskAssessment';

export default function AIInsightsPanel() {
	const [insights, setInsights] = useState({
		predictions: [],
		riskAreas: [],
		trends: [],
		alerts: []
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadAIInsights();
		const interval = setInterval(loadAIInsights, 5 * 60 * 1000); // Update every 5 minutes
		return () => clearInterval(interval);
	}, []);

	const loadAIInsights = async () => {
		try {
			setLoading(true);
			
			// Get predictions for high-risk areas
			const riskAreas = await generateRiskAreaPredictions();
			const trends = await analyzeTrends();
			const predictions = await generatePredictions();
			const alerts = await generateAIAlerts();
			
			setInsights({
				predictions,
				riskAreas,
				trends,
				alerts
			});
		} catch (error) {
			console.error('Error loading AI insights:', error);
		} finally {
			setLoading(false);
		}
	};

	const generateRiskAreaPredictions = async () => {
		// Simulate high-risk area predictions
		const areas = [
			{ lat: 28.6139, lon: 77.209, name: 'Connaught Place' },
			{ lat: 28.6562, lon: 77.2410, name: 'Red Fort Area' },
			{ lat: 28.5535, lon: 77.2588, name: 'Lotus Temple' },
			{ lat: 28.6129, lon: 77.2295, name: 'India Gate' }
		];

		const predictions = await Promise.all(
			areas.map(async (area) => {
				const risk = await riskAssessment.getLocationRisk(area.lat, area.lon);
				const forecast = await riskAssessment.getRiskForecast(area.lat, area.lon, 24);
				
				return {
					...area,
					currentRisk: risk,
					forecast: forecast,
					predictedRisk: Math.max(...forecast.map(f => f.overall)),
					peakRiskTime: forecast.reduce((max, f) => f.overall > max.overall ? f : max, forecast[0])
				};
			})
		);

		return predictions.sort((a, b) => b.predictedRisk - a.predictedRisk);
	};

	const analyzeTrends = async () => {
		// Simulate trend analysis
		return [
			{
				type: 'Tourist Clusters',
				trend: 'increasing',
				value: 15,
				change: '+23%',
				description: 'Tourist clustering in central areas increasing',
				timeframe: 'Last 6 hours'
			},
			{
				type: 'Anomaly Rate',
				trend: 'decreasing',
				value: 8,
				change: '-12%',
				description: 'Overall anomaly detection rate decreasing',
				timeframe: 'Last 24 hours'
			},
			{
				type: 'High-Risk Zones',
				trend: 'stable',
				value: 3,
				change: '0%',
				description: 'Number of high-risk zones remains stable',
				timeframe: 'Last 12 hours'
			}
		];
	};

	const generatePredictions = async () => {
		// Generate AI predictions for next 24 hours
		return [
			{
				time: '14:00 - 16:00',
				prediction: 'High tourist activity expected in central areas',
				confidence: 0.87,
				riskLevel: 'Yellow',
				factors: ['Weather conditions', 'Historical patterns', 'Event schedules']
			},
			{
				time: '18:00 - 20:00',
				prediction: 'Increased anomaly risk in market areas',
				confidence: 0.73,
				riskLevel: 'Yellow',
				factors: ['Crowd density', 'Lighting conditions', 'Crime patterns']
			},
			{
				time: '22:00 - 02:00',
				prediction: 'Elevated risk for isolated tourists',
				confidence: 0.91,
				riskLevel: 'Red',
				factors: ['Night time', 'Reduced visibility', 'Lower police presence']
			}
		];
	};

	const generateAIAlerts = async () => {
		// Generate current AI-based alerts
		return [
			{
				id: 1,
				type: 'Pattern Recognition',
				message: 'Unusual movement pattern detected in 3 tourist groups',
				severity: 'warning',
				confidence: 0.78,
				timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
			},
			{
				id: 2,
				type: 'Risk Prediction',
				message: 'Weather conditions may increase risk in northern areas',
				severity: 'info',
				confidence: 0.65,
				timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
			}
		];
	};

	const getRiskColor = (riskLevel) => {
		switch (riskLevel) {
			case 'Red': return '#c62828';
			case 'Yellow': return '#f9a825';
			case 'Green': return '#2e7d32';
			default: return '#90a4ae';
		}
	};

	const getTrendIcon = (trend) => {
		return <TrendIcon sx={{ 
			color: trend === 'increasing' ? '#c62828' : trend === 'decreasing' ? '#2e7d32' : '#f9a825',
			transform: trend === 'decreasing' ? 'rotate(180deg)' : 'none'
		}} />;
	};

	if (loading) {
		return (
			<Paper sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<AIIcon sx={{ mr: 1 }} />
					<Typography variant="h6">AI Predictive Insights</Typography>
				</Box>
				<LinearProgress />
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 2 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
				<AIIcon sx={{ mr: 1 }} />
				<Typography variant="h6">AI Predictive Insights</Typography>
			</Box>

			<Grid container spacing={2}>
				{/* Current Alerts */}
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								<WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
								Current AI Alerts
							</Typography>
							{insights.alerts.length > 0 ? (
								<List dense>
									{insights.alerts.map((alert) => (
										<ListItem key={alert.id}>
											<Alert 
												severity={alert.severity} 
												sx={{ width: '100%' }}
											>
												<Box>
													<Typography variant="body2" fontWeight="bold">
														{alert.type}
													</Typography>
													<Typography variant="body2">
														{alert.message}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Confidence: {(alert.confidence * 100).toFixed(0)}% • 
														{new Date(alert.timestamp).toLocaleTimeString()}
													</Typography>
												</Box>
											</Alert>
										</ListItem>
									))}
								</List>
							) : (
								<Typography variant="body2" color="text.secondary">
									No active AI alerts
								</Typography>
							)}
						</CardContent>
					</Card>
				</Grid>

				{/* Risk Area Predictions */}
				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								<LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
								High-Risk Area Predictions (24h)
							</Typography>
							<List dense>
								{insights.riskAreas.slice(0, 4).map((area, index) => (
									<ListItem key={index}>
										<ListItemIcon>
											<Chip 
												label={index + 1}
												size="small"
												sx={{ 
													backgroundColor: getRiskColor(area.currentRisk.level),
													color: 'white'
												}}
											/>
										</ListItemIcon>
										<ListItemText
											primary={area.name}
											secondary={
												<Box>
													<Typography variant="caption">
														Current: {area.currentRisk.level} • 
														Peak Risk: {area.peakRiskTime?.time || 'N/A'}
													</Typography>
													<LinearProgress 
														variant="determinate" 
														value={area.predictedRisk * 100}
														sx={{ mt: 0.5 }}
													/>
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				</Grid>

				{/* Trend Analysis */}
				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								<InsightsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
								Trend Analysis
							</Typography>
							<List dense>
								{insights.trends.map((trend, index) => (
									<ListItem key={index}>
										<ListItemIcon>
											{getTrendIcon(trend.trend)}
										</ListItemIcon>
										<ListItemText
											primary={
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant="body2">
														{trend.type}
													</Typography>
													<Chip 
														label={trend.change}
														size="small"
														color={trend.trend === 'increasing' ? 'error' : trend.trend === 'decreasing' ? 'success' : 'default'}
													/>
												</Box>
											}
											secondary={
												<Typography variant="caption">
													{trend.description} • {trend.timeframe}
												</Typography>
											}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				</Grid>

				{/* Predictions */}
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								<ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
								24-Hour Predictions
							</Typography>
							{insights.predictions.map((prediction, index) => (
								<Accordion key={index}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											<Typography variant="body2" fontWeight="bold">
												{prediction.time}
											</Typography>
											<Chip 
												label={prediction.riskLevel}
												size="small"
												sx={{ 
													backgroundColor: getRiskColor(prediction.riskLevel),
													color: 'white'
												}}
											/>
											<Typography variant="body2" sx={{ flex: 1 }}>
												{prediction.prediction}
											</Typography>
											<Typography variant="caption">
												{(prediction.confidence * 100).toFixed(0)}% confidence
											</Typography>
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Typography variant="body2" color="text.secondary" gutterBottom>
											Contributing Factors:
										</Typography>
										<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
											{prediction.factors.map((factor, idx) => (
												<Chip key={idx} label={factor} size="small" variant="outlined" />
											))}
										</Box>
									</AccordionDetails>
								</Accordion>
							))}
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Paper>
	);
}
import React from 'react';
import { Grid, Box } from '@mui/material';
import StatsWidget from '../components/StatsWidget';
import MapStub from '../components/MapStub';
import MapboxMap from '../components/MapboxMap';
import AIInsightsPanel from '../components/AIInsightsPanel';
import FamilyGroupTracker from '../components/FamilyGroupTracker';
import { subscribeTourists } from '../services/firestoreStreams';
import useAppStore from '../store/useAppStore';

export default function Dashboard() {
	const [points, setPoints] = React.useState([]);
	const [stats, setStats] = React.useState({
		totalTourists: 0,
		activeAlerts: 0,
		highRiskCount: 0
	});
	const localIncidents = useAppStore((s) => s.localIncidents);

	React.useEffect(() => {
		const unsub = subscribeTourists((items) => {
			const pts = items
				.filter((t) => typeof t?.location?.longitude === 'number' && typeof t?.location?.latitude === 'number')
				.map((t) => ({ longitude: t.location.longitude, latitude: t.location.latitude }));
			if (pts.length) setPoints(pts);
			
			// Update stats
			const highRisk = items.filter(t => t.riskLevel === 'Red').length;
			setStats({
				totalTourists: items.length,
				activeAlerts: localIncidents.filter(i => i.status === 'Open').length,
				highRiskCount: highRisk
			});
		});
		return () => unsub?.();
	}, [localIncidents]);

	return (
		<Box>
			<Grid container spacing={2}>
				<Grid item xs={12} md={3}>
					<StatsWidget title="Total Tourists Active" value={stats.totalTourists} />
				</Grid>
				<Grid item xs={12} md={3}>
					<StatsWidget title="Active Alerts" value={stats.activeAlerts} />
				</Grid>
				<Grid item xs={12} md={3}>
					<StatsWidget title="High-Risk Zone" value={stats.highRiskCount} />
				</Grid>
				<Grid item xs={12} md={3}>
					<StatsWidget title="AI Predictions" value="24h" subtitle="forecast active" />
				</Grid>
				
				<Grid item xs={12} lg={8}>
					{process.env.REACT_APP_MAPBOX_TOKEN ? 
						<MapboxMap height={400} points={points} /> : 
						<MapStub height={400} />
					}
				</Grid>
				
				<Grid item xs={12} lg={4}>
					<AIInsightsPanel />
				</Grid>
				
				<Grid item xs={12}>
					<FamilyGroupTracker />
				</Grid>
			</Grid>
		</Box>
	);
}



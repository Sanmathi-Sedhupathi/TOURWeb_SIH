import React from 'react';
import { Grid } from '@mui/material';
import StatsWidget from '../components/StatsWidget';
import MapStub from '../components/MapStub';
import MapboxMap from '../components/MapboxMap';
import { subscribeTourists } from '../services/firestoreStreams';

export default function Dashboard() {
	const [points, setPoints] = React.useState([]);

	React.useEffect(() => {
		const unsub = subscribeTourists((items) => {
			const pts = items
				.filter((t) => typeof t?.location?.longitude === 'number' && typeof t?.location?.latitude === 'number')
				.map((t) => ({ longitude: t.location.longitude, latitude: t.location.latitude }));
			if (pts.length) setPoints(pts);
		});
		return () => unsub?.();
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12} md={3}><StatsWidget title="Total Tourists Active" value={0} /></Grid>
			<Grid item xs={12} md={3}><StatsWidget title="Active Alerts" value={0} /></Grid>
			<Grid item xs={12} md={3}><StatsWidget title="High-Risk Zone" value={0} /></Grid>
			<Grid item xs={12}>
				{process.env.REACT_APP_MAPBOX_TOKEN ? <MapboxMap height={400} points={points} /> : <MapStub height={400} />}
			</Grid>
		</Grid>
	);
}



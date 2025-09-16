import { Paper, Typography } from '@mui/material';
import Map, { NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geofences } from '../data/geofences';
import { getRiskLevelColor } from '../utils/geo';

export default function MapboxMap({ height = 400, points = [] }) {
	const token = process.env.REACT_APP_MAPBOX_TOKEN;
	if (!token) {
		return (
			<Paper sx={{ p: 2, height }}>
				<Typography variant="subtitle2">Interactive Map</Typography>
				<Typography color="text.secondary" sx={{ mt: 1 }}>Set REACT_APP_MAPBOX_TOKEN to enable Mapbox.</Typography>
			</Paper>
		);
	}

	const pointsGeoJson = {
		type: 'FeatureCollection',
		features: points.map((p) => ({
			type: 'Feature',
			properties: {},
			geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }
		}))
	};

	const heatLayer = {
		id: 'tourists-heat',
		type: 'heatmap',
		source: 'tourists',
		maxzoom: 15,
		paint: {
			'heatmap-weight': 0.8,
			'heatmap-intensity': 1.2,
			'heatmap-color': [
				'interpolate', ['linear'], ['heatmap-density'],
				0, 'rgba(33,102,172,0)',
				0.2, 'rgb(103,169,207)',
				0.4, 'rgb(209,229,240)',
				0.6, 'rgb(253,219,199)',
				0.8, 'rgb(239,138,98)',
				1, 'rgb(178,24,43)'
			],
			'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 14, 30]
		}
	};

	const fenceFillLayer = (level) => ({
		id: `fence-fill-${level}`,
		type: 'fill',
		source: 'geofences',
		filter: ['==', ['get', 'level'], level],
		paint: { 'fill-color': getRiskLevelColor(level), 'fill-opacity': 0.15 }
	});

	const fenceLineLayer = (level) => ({
		id: `fence-line-${level}`,
		type: 'line',
		source: 'geofences',
		filter: ['==', ['get', 'level'], level],
		paint: { 'line-color': getRiskLevelColor(level), 'line-width': 2 }
	});

	return (
		<Paper sx={{ p: 0, height, overflow: 'hidden' }}>
			<Map
				mapboxAccessToken={token}
				initialViewState={{ longitude: 77.209, latitude: 28.6139, zoom: 10 }}
				mapStyle="mapbox://styles/mapbox/streets-v12"
				style={{ width: '100%', height }}
			>
				<NavigationControl position="top-left" />
				<ScaleControl />
				<Source id="tourists" type="geojson" data={pointsGeoJson}>
					<Layer {...heatLayer} />
				</Source>
				<Source id="geofences" type="geojson" data={geofences}>
					<Layer {...fenceFillLayer('Green')} />
					<Layer {...fenceLineLayer('Green')} />
					<Layer {...fenceFillLayer('Yellow')} />
					<Layer {...fenceLineLayer('Yellow')} />
					<Layer {...fenceFillLayer('Red')} />
					<Layer {...fenceLineLayer('Red')} />
				</Source>
			</Map>
		</Paper>
	);
}



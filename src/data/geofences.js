// Simple sample geo-fences as GeoJSON polygons (WGS84 lon/lat)
export const geofences = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: { level: 'Green' },
			geometry: {
				type: 'Polygon',
				coordinates: [[
					[77.15, 28.60], [77.27, 28.60], [77.27, 28.66], [77.15, 28.66], [77.15, 28.60]
				]]
			}
		},
		{
			type: 'Feature',
			properties: { level: 'Yellow' },
			geometry: {
				type: 'Polygon',
				coordinates: [[
					[77.19, 28.61], [77.31, 28.61], [77.31, 28.69], [77.19, 28.69], [77.19, 28.61]
				]]
			}
		},
		{
			type: 'Feature',
			properties: { level: 'Red' },
			geometry: {
				type: 'Polygon',
				coordinates: [[
					[77.21, 28.59], [77.24, 28.59], [77.24, 28.62], [77.21, 28.62], [77.21, 28.59]
				]]
			}
		}
	]
};



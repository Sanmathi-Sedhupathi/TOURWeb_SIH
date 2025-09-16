import { subscribeTourists } from './firestoreStreams';
import useAppStore from '../store/useAppStore';
import { geofences } from '../data/geofences';

// Point-in-polygon (ray casting) for simple polygons
function pointInPolygon(point, polygon) {
	const [x, y] = point;
	let inside = false;
	for (let ii = 0, jj = polygon.length - 1; ii < polygon.length; jj = ii++) {
		const xi = polygon[ii][0], yi = polygon[ii][1];
		const xj = polygon[jj][0], yj = polygon[jj][1];
		const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

function getZoneLevelForPoint(lon, lat) {
	for (const feature of geofences.features) {
		if (feature.geometry.type !== 'Polygon') continue;
		const coords = feature.geometry.coordinates[0];
		if (pointInPolygon([lon, lat], coords)) return feature.properties.level;
	}
	return null;
}

export function startZoneWatcher() {
	const addNotification = useAppStore.getState().addNotification;
	let lastZones = new Map();
	return subscribeTourists((items) => {
		for (const t of items) {
			const loc = t?.location;
			if (!loc) continue;
			const level = getZoneLevelForPoint(loc.longitude, loc.latitude);
			const prev = lastZones.get(t.id);
			if (level && level !== prev) {
				lastZones.set(t.id, level);
				if (level === 'Yellow' || level === 'Red') {
					addNotification({
						severity: level === 'Red' ? 'error' : 'warning',
						message: `${t.name || 'Tourist'} entered ${level} zone`
					});
				}
			}
		}
	});
}



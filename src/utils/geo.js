// Utilities for risk levels and geo-fences (stubs)
import { RiskLevel } from '../types';

export function getRiskLevelColor(level) {
	switch (level) {
		case RiskLevel.Green:
			return '#2e7d32';
		case RiskLevel.Yellow:
			return '#f9a825';
		case RiskLevel.Red:
			return '#c62828';
		default:
			return '#90a4ae';
	}
}

export function isInsideGeoFence(point, fence) {
	// Stub: always false, replace with real polygon/round check
	return false;
}



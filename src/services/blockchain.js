import Web3 from 'web3';
import CryptoJS from 'crypto-js';

// Blockchain service for tourist ID verification and group management
class BlockchainService {
	constructor() {
		this.web3 = null;
		this.contract = null;
		this.initialized = false;
		this.init();
	}

	async init() {
		try {
			// Initialize Web3 (using local provider or testnet)
			this.web3 = new Web3(process.env.REACT_APP_WEB3_PROVIDER || 'http://localhost:8545');
			this.initialized = true;
		} catch (error) {
			console.warn('Blockchain not initialized:', error);
		}
	}

	// Generate secure digital ID for tourist
	generateDigitalId(touristData) {
		const timestamp = Date.now();
		const data = {
			...touristData,
			timestamp,
			nonce: Math.random().toString(36).substring(7)
		};
		
		const hash = CryptoJS.SHA256(JSON.stringify(data)).toString();
		return {
			digitalId: `0x${hash.substring(0, 16)}`,
			hash: hash,
			timestamp,
			qrPayload: this.generateQRPayload(data)
		};
	}

	// Generate QR code payload
	generateQRPayload(data) {
		const payload = {
			id: data.digitalId || data.id,
			name: data.name,
			timestamp: data.timestamp,
			itinerary: data.itinerary,
			emergencyContact: data.emergencyContact,
			validUntil: data.validUntil || (Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
		};
		
		return CryptoJS.AES.encrypt(JSON.stringify(payload), 'tourist-verification-key').toString();
	}

	// Verify QR code authenticity
	verifyQRCode(qrPayload) {
		try {
			const decrypted = CryptoJS.AES.decrypt(qrPayload, 'tourist-verification-key').toString(CryptoJS.enc.Utf8);
			const data = JSON.parse(decrypted);
			
			const isValid = data.validUntil > Date.now();
			return {
				valid: isValid,
				data: isValid ? data : null,
				reason: isValid ? 'Valid' : 'Expired'
			};
		} catch (error) {
			return {
				valid: false,
				data: null,
				reason: 'Invalid format'
			};
		}
	}

	// Create blockchain group for area-based tracking
	createAreaGroup(areaId, tourists) {
		const groupId = CryptoJS.SHA256(`${areaId}-${Date.now()}`).toString().substring(0, 16);
		const groupData = {
			id: groupId,
			areaId,
			tourists: tourists.map(t => t.digitalId),
			createdAt: Date.now(),
			active: true
		};

		// In a real implementation, this would be stored on blockchain
		localStorage.setItem(`group-${groupId}`, JSON.stringify(groupData));
		return groupData;
	}

	// Get group information
	getGroupInfo(groupId) {
		try {
			const data = localStorage.getItem(`group-${groupId}`);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			return null;
		}
	}

	// Link tourists to area-based blockchain network
	linkToAreaNetwork(tourist, areaId) {
		const networkKey = `area-network-${areaId}`;
		let network = JSON.parse(localStorage.getItem(networkKey) || '{"tourists": [], "riskData": {}}');
		
		if (!network.tourists.find(t => t.digitalId === tourist.digitalId)) {
			network.tourists.push({
				digitalId: tourist.digitalId,
				name: tourist.name,
				joinedAt: Date.now()
			});
			localStorage.setItem(networkKey, JSON.stringify(network));
		}
		
		return network;
	}
}

export default new BlockchainService();
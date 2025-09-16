import React, { useState, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Stack,
	Typography,
	Box,
	Card,
	CardContent,
	Chip,
	Alert,
	Tabs,
	Tab,
	IconButton
} from '@mui/material';
import {
	QrCodeScanner as QrIcon,
	Upload as UploadIcon,
	CheckCircle as CheckIcon,
	Error as ErrorIcon,
	Person as PersonIcon,
	Schedule as ScheduleIcon,
	Security as SecurityIcon
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import blockchainService from '../services/blockchain';

export default function EnhancedQrVerification({ open, onClose, onVerify }) {
	const [activeTab, setActiveTab] = useState(0);
	const [qrValue, setQrValue] = useState('');
	const [verificationResult, setVerificationResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [scanner, setScanner] = useState(null);
	const fileInputRef = useRef(null);
	const scannerRef = useRef(null);

	React.useEffect(() => {
		if (open && activeTab === 0 && !scanner) {
			initializeScanner();
		}
		
		return () => {
			if (scanner) {
				scanner.clear();
				setScanner(null);
			}
		};
	}, [open, activeTab]);

	const initializeScanner = () => {
		if (scannerRef.current) {
			const html5QrcodeScanner = new Html5QrcodeScanner(
				"qr-reader",
				{ 
					fps: 10, 
					qrbox: { width: 250, height: 250 },
					aspectRatio: 1.0
				},
				false
			);

			html5QrcodeScanner.render(
				(decodedText) => {
					setQrValue(decodedText);
					handleVerify(decodedText);
					html5QrcodeScanner.clear();
					setScanner(null);
				},
				(error) => {
					// Handle scan error silently
				}
			);

			setScanner(html5QrcodeScanner);
		}
	};

	const handleVerify = async (qrData = qrValue) => {
		if (!qrData.trim()) return;

		setLoading(true);
		try {
			// Verify QR code using blockchain service
			const verification = blockchainService.verifyQRCode(qrData);
			
			if (verification.valid) {
				// Additional verification checks
				const enhancedResult = await performEnhancedVerification(verification.data);
				setVerificationResult(enhancedResult);
				onVerify?.(enhancedResult);
			} else {
				setVerificationResult({
					valid: false,
					reason: verification.reason,
					data: null
				});
			}
		} catch (error) {
			setVerificationResult({
				valid: false,
				reason: 'Verification failed',
				error: error.message
			});
		} finally {
			setLoading(false);
		}
	};

	const performEnhancedVerification = async (qrData) => {
		// Enhanced verification with additional checks
		const now = Date.now();
		const isExpired = qrData.validUntil < now;
		const isValidTime = now >= (qrData.timestamp || 0);
		
		// Check if tourist is in allowed areas (simplified)
		const locationValid = await checkLocationValidity(qrData);
		
		// Check trip status
		const tripValid = await checkTripStatus(qrData);
		
		return {
			valid: !isExpired && isValidTime && locationValid && tripValid,
			data: qrData,
			checks: {
				timeValid: !isExpired && isValidTime,
				locationValid,
				tripValid,
				blockchainValid: true
			},
			tourist: {
				name: qrData.name,
				digitalId: qrData.id,
				itinerary: qrData.itinerary,
				emergencyContact: qrData.emergencyContact,
				validUntil: new Date(qrData.validUntil).toLocaleDateString()
			},
			verifiedAt: new Date().toISOString()
		};
	};

	const checkLocationValidity = async (qrData) => {
		// Simplified location check - in real implementation, 
		// this would check against allowed areas for the tourist
		return true;
	};

	const checkTripStatus = async (qrData) => {
		// Check if the trip is still active and valid
		// In real implementation, this would query the trip database
		return true;
	};

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				// In a real implementation, you would decode QR from image
				// For now, we'll simulate with file name
				const simulatedQrData = `qr_data_from_${file.name}`;
				setQrValue(simulatedQrData);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleClose = () => {
		if (scanner) {
			scanner.clear();
			setScanner(null);
		}
		setVerificationResult(null);
		setQrValue('');
		onClose?.();
	};

	const renderVerificationResult = () => {
		if (!verificationResult) return null;

		return (
			<Card sx={{ mt: 2 }}>
				<CardContent>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						{verificationResult.valid ? (
							<CheckIcon color="success" sx={{ mr: 1 }} />
						) : (
							<ErrorIcon color="error" sx={{ mr: 1 }} />
						)}
						<Typography variant="h6">
							{verificationResult.valid ? 'Verification Successful' : 'Verification Failed'}
						</Typography>
					</Box>

					{verificationResult.valid ? (
						<Stack spacing={2}>
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									<PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Tourist Information
								</Typography>
								<Box sx={{ pl: 3 }}>
									<Typography variant="body2">
										<strong>Name:</strong> {verificationResult.tourist.name}
									</Typography>
									<Typography variant="body2">
										<strong>Digital ID:</strong> {verificationResult.tourist.digitalId}
									</Typography>
									<Typography variant="body2">
										<strong>Valid Until:</strong> {verificationResult.tourist.validUntil}
									</Typography>
									<Typography variant="body2">
										<strong>Itinerary:</strong> {verificationResult.tourist.itinerary}
									</Typography>
								</Box>
							</Box>

							<Box>
								<Typography variant="subtitle2" gutterBottom>
									<SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Verification Checks
								</Typography>
								<Box sx={{ pl: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
									<Chip 
										label="Time Valid" 
										color={verificationResult.checks.timeValid ? 'success' : 'error'}
										size="small"
									/>
									<Chip 
										label="Location Valid" 
										color={verificationResult.checks.locationValid ? 'success' : 'error'}
										size="small"
									/>
									<Chip 
										label="Trip Valid" 
										color={verificationResult.checks.tripValid ? 'success' : 'error'}
										size="small"
									/>
									<Chip 
										label="Blockchain Valid" 
										color={verificationResult.checks.blockchainValid ? 'success' : 'error'}
										size="small"
									/>
								</Box>
							</Box>

							<Box>
								<Typography variant="subtitle2" gutterBottom>
									<ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Verification Details
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
								</Typography>
							</Box>
						</Stack>
					) : (
						<Alert severity="error">
							<Typography variant="body2">
								<strong>Reason:</strong> {verificationResult.reason}
							</Typography>
							{verificationResult.error && (
								<Typography variant="body2">
									<strong>Error:</strong> {verificationResult.error}
								</Typography>
							)}
						</Alert>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
			<DialogTitle>Enhanced QR Code Verification</DialogTitle>
			<DialogContent>
				<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
					<Tab label="Camera Scan" icon={<QrIcon />} />
					<Tab label="File Upload" icon={<UploadIcon />} />
					<Tab label="Manual Entry" />
				</Tabs>

				{activeTab === 0 && (
					<Box>
						<Typography variant="body2" gutterBottom>
							Position the QR code within the camera frame to scan automatically.
						</Typography>
						<Box 
							id="qr-reader" 
							ref={scannerRef}
							sx={{ 
								width: '100%', 
								maxWidth: 400, 
								mx: 'auto',
								'& video': {
									width: '100% !important',
									height: 'auto !important'
								}
							}} 
						/>
					</Box>
				)}

				{activeTab === 1 && (
					<Box>
						<Typography variant="body2" gutterBottom>
							Upload an image containing a QR code for verification.
						</Typography>
						<input
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							ref={fileInputRef}
							style={{ display: 'none' }}
						/>
						<Button
							variant="outlined"
							startIcon={<UploadIcon />}
							onClick={() => fileInputRef.current?.click()}
							fullWidth
							sx={{ mt: 1 }}
						>
							Choose Image File
						</Button>
					</Box>
				)}

				{activeTab === 2 && (
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Typography variant="body2">
							Manually enter the QR code data or tourist ID for verification.
						</Typography>
						<TextField
							label="QR Code Data / Tourist ID"
							value={qrValue}
							onChange={(e) => setQrValue(e.target.value)}
							fullWidth
							multiline
							rows={3}
							placeholder="Enter QR code payload or tourist digital ID..."
						/>
						<Button
							variant="contained"
							onClick={() => handleVerify()}
							disabled={!qrValue.trim() || loading}
							fullWidth
						>
							{loading ? 'Verifying...' : 'Verify'}
						</Button>
					</Stack>
				)}

				{renderVerificationResult()}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Close</Button>
				{verificationResult?.valid && (
					<Button variant="contained" onClick={handleClose}>
						Verification Complete
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
import React from 'react';
import { Paper, Typography, Button, Box, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EnhancedQrVerification from '../components/EnhancedQrVerification';
import { subscribeTourists } from '../services/firestoreStreams';
import blockchainService from '../services/blockchain';

const mockRows = [
	{ 
		id: 1, 
		name: 'John Doe', 
		digitalId: '0xABC123', 
		safetyScore: 0.98, 
		itinerary: 'City A → City B', 
		location: 'City A',
		riskLevel: 'Green',
		groupId: 'GRP001',
		lastUpdate: new Date().toISOString()
	},
	{ 
		id: 2, 
		name: 'Jane Smith', 
		digitalId: '0xDEF456', 
		safetyScore: 0.76, 
		itinerary: 'Park → Museum', 
		location: 'City B',
		riskLevel: 'Yellow',
		groupId: 'GRP001',
		lastUpdate: new Date().toISOString()
	}
];

const columns = [
	{ field: 'name', headerName: 'Name', flex: 1 },
	{ field: 'digitalId', headerName: 'Digital ID', flex: 1 },
	{ 
		field: 'safetyScore', 
		headerName: 'Safety Score', 
		flex: 1, 
		valueFormatter: ({ value }) => value ? (value * 100).toFixed(0) + '%' : 'N/A',
		renderCell: ({ value }) => {
			const score = value * 100;
			const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
			return <Chip label={`${score.toFixed(0)}%`} color={color} size="small" />;
		}
	},
	{
		field: 'riskLevel',
		headerName: 'Risk Level',
		flex: 1,
		renderCell: ({ value }) => {
			const color = value === 'Green' ? 'success' : value === 'Yellow' ? 'warning' : 'error';
			return <Chip label={value} color={color} size="small" />;
		}
	},
	{ field: 'itinerary', headerName: 'Trip Itinerary', flex: 1 },
	{ field: 'location', headerName: 'Current Location', flex: 1 },
	{ field: 'groupId', headerName: 'Group ID', flex: 1 }
];

export default function Tourists() {
	const [open, setOpen] = React.useState(false);
	const [rows, setRows] = React.useState(mockRows);
	const [verificationResult, setVerificationResult] = React.useState(null);

	React.useEffect(() => {
		const unsub = subscribeTourists((items) => {
			if (Array.isArray(items) && items.length) {
				// Enhance tourist data with additional fields
				const enhancedItems = items.map(item => ({
					...item,
					riskLevel: item.riskLevel || 'Green',
					safetyScore: item.safetyScore || Math.random() * 0.4 + 0.6, // Simulate if not present
					groupId: item.groupId || item.familyId || null,
					lastUpdate: item.updatedAt || new Date().toISOString()
				}));
				setRows(enhancedItems);
			}
		});
		return () => unsub?.();
	}, []);

	const handleVerification = (result) => {
		setVerificationResult(result);
		if (result.valid) {
			// Update tourist data or perform additional actions
			console.log('Tourist verified:', result);
		}
	};

	const generateQRForTourist = (tourist) => {
		// Generate QR code for existing tourist
		const digitalId = blockchainService.generateDigitalId({
			id: tourist.id,
			name: tourist.name,
			itinerary: tourist.itinerary,
			emergencyContact: tourist.emergencyContact || 'Not provided'
		});
		
		console.log('Generated QR for tourist:', digitalId);
		// In a real implementation, this would display the QR code
	};
	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="h6" sx={{ mb: 2 }}>Tourist Real-Time Monitoring</Typography>
			
			{verificationResult && (
				<Box sx={{ mb: 2 }}>
					<Chip 
						label={`Last Verification: ${verificationResult.valid ? 'Success' : 'Failed'}`}
						color={verificationResult.valid ? 'success' : 'error'}
						onDelete={() => setVerificationResult(null)}
					/>
				</Box>
			)}
			
			<div style={{ height: 420, width: '100%', marginBottom: 16 }}>
				<DataGrid 
					rows={rows} 
					columns={columns} 
					pageSizeOptions={[5, 10, 20]} 
					initialState={{ 
						pagination: { paginationModel: { pageSize: 10 } },
						sorting: { sortModel: [{ field: 'lastUpdate', sort: 'desc' }] }
					}}
					onRowClick={(params) => {
						// Handle row click - could show detailed tourist info
						console.log('Tourist selected:', params.row);
					}}
				/>
			</div>
			
			<Box sx={{ display: 'flex', gap: 2 }}>
				<Button variant="contained" onClick={() => setOpen(true)}>
					Enhanced QR Verification
				</Button>
				<Button variant="outlined" onClick={() => generateQRForTourist(rows[0])}>
					Generate QR Code
				</Button>
			</Box>
			
			<EnhancedQrVerification 
				open={open} 
				onClose={() => setOpen(false)} 
				onVerify={handleVerification} 
			/>
		</Paper>
	);
}



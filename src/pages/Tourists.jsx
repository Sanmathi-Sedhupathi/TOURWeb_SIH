import React from 'react';
import { Paper, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import QrVerifyDialog from '../components/QrVerifyDialog';
import { subscribeTourists } from '../services/firestoreStreams';

const mockRows = [
	{ id: 1, name: 'John Doe', digitalId: '0xABC123', safetyScore: 0.98, itinerary: 'City A → City B', location: 'City A' },
	{ id: 2, name: 'Jane Smith', digitalId: '0xDEF456', safetyScore: 0.76, itinerary: 'Park → Museum', location: 'City B' }
];

const columns = [
	{ field: 'name', headerName: 'Name', flex: 1 },
	{ field: 'digitalId', headerName: 'Digital ID', flex: 1 },
	{ field: 'safetyScore', headerName: 'Safety Score', flex: 1, valueFormatter: ({ value }) => (value * 100).toFixed(0) + '%' },
	{ field: 'itinerary', headerName: 'Trip Itinerary', flex: 1 },
	{ field: 'location', headerName: 'Current Location', flex: 1 }
];

export default function Tourists() {
	const [open, setOpen] = React.useState(false);
	const [rows, setRows] = React.useState(mockRows);

	React.useEffect(() => {
		const unsub = subscribeTourists((items) => {
			if (Array.isArray(items) && items.length) setRows(items);
		});
		return () => unsub?.();
	}, []);

	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="h6" sx={{ mb: 2 }}>Tourist Real-Time Monitoring</Typography>
			<div style={{ height: 420, width: '100%', marginBottom: 16 }}>
				<DataGrid rows={rows} columns={columns} pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} />
			</div>
			<Button variant="contained" onClick={() => setOpen(true)}>QR Verification</Button>
			<QrVerifyDialog open={open} onClose={() => setOpen(false)} onVerify={() => {}} />
		</Paper>
	);
}



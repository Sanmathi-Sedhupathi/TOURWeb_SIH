import React from 'react';
import { Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { subscribeIncidents } from '../services/firestoreStreams';
import useAppStore from '../store/useAppStore';

const mockRows = [
	{ id: 1, tourist: 'John Doe', type: 'Anomaly', status: 'Unresolved', score: 0.87 },
	{ id: 2, tourist: 'Jane Smith', type: 'SOS', status: 'Resolved', score: 0.95 }
];

const columns = [
	{ field: 'tourist', headerName: 'Tourist', flex: 1 },
	{ field: 'type', headerName: 'Alert Type', flex: 1 },
	{ field: 'status', headerName: 'Status', flex: 1 },
	{ field: 'score', headerName: 'AI Score', flex: 1, valueFormatter: ({ value }) => value.toFixed(2) }
];

export default function Incidents() {
	const [rows, setRows] = React.useState(mockRows);
	const localIncidents = useAppStore((s) => s.localIncidents);

	React.useEffect(() => {
		const unsub = subscribeIncidents((items) => {
			if (Array.isArray(items) && items.length) setRows(items);
		});
		return () => unsub?.();
	}, []);

	React.useEffect(() => {
		if (!rows || rows.length === 0) {
			if (localIncidents.length) setRows(localIncidents);
		}
	}, [localIncidents]);

	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="h6" sx={{ mb: 2 }}>Incident Management</Typography>
			<div style={{ height: 420, width: '100%' }}>
				<DataGrid rows={rows} columns={columns} pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} />
			</div>
		</Paper>
	);
}



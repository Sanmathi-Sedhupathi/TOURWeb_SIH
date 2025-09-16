import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function MapStub({ height = 400 }) {
	return (
		<Paper sx={{ p: 2, height }}>
			<Typography variant="subtitle2">Interactive Map (stub)</Typography>
			<Box sx={{ mt: 2, height: height - 64, bgcolor: 'grey.100', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }} />
		</Paper>
	);
}



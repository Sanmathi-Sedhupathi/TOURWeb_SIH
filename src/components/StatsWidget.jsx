import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function StatsWidget({ title, value, subtitle }) {
	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="subtitle2">{title}</Typography>
			<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
				<Typography variant="h4">{value}</Typography>
				{subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
			</Box>
		</Paper>
	);
}



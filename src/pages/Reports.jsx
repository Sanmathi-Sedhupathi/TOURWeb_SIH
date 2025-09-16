import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const movementData = [
	{ time: '08:00', clusters: 12 },
	{ time: '10:00', clusters: 18 },
	{ time: '12:00', clusters: 25 },
	{ time: '14:00', clusters: 22 },
	{ time: '16:00', clusters: 28 },
	{ time: '18:00', clusters: 19 }
];

const alertsData = [
	{ area: 'Old Town', alerts: 14 },
	{ area: 'Riverfront', alerts: 9 },
	{ area: 'Market', alerts: 6 },
	{ area: 'Hill Park', alerts: 11 }
];

const riskDist = [
	{ name: 'Green', value: 60, color: '#2e7d32' },
	{ name: 'Yellow', value: 28, color: '#f9a825' },
	{ name: 'Red', value: 12, color: '#c62828' }
];

export default function Reports() {
	return (
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<Paper sx={{ p: 2, height: 360 }}>
					<Typography variant="subtitle2" sx={{ mb: 2 }}>Cluster Movement Trends</Typography>
					<ResponsiveContainer width="100%" height={280}>
						<LineChart data={movementData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="time" />
							<YAxis />
							<Tooltip />
							<Line type="monotone" dataKey="clusters" stroke="#1976d2" strokeWidth={2} dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</Paper>
			</Grid>
			<Grid item xs={12} md={6}>
				<Paper sx={{ p: 2, height: 360 }}>
					<Typography variant="subtitle2" sx={{ mb: 2 }}>Alerts per Area</Typography>
					<ResponsiveContainer width="100%" height={280}>
						<BarChart data={alertsData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="area" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="alerts" fill="#7b1fa2" />
						</BarChart>
					</ResponsiveContainer>
				</Paper>
			</Grid>
			<Grid item xs={12}>
				<Paper sx={{ p: 2, height: 360 }}>
					<Typography variant="subtitle2" sx={{ mb: 2 }}>Predicted Risk Distribution (Next 24h)</Typography>
					<ResponsiveContainer width="100%" height={280}>
						<PieChart>
							<Pie data={riskDist} dataKey="value" nameKey="name" outerRadius={110} label>
								{riskDist.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
							<Legend />
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</Paper>
			</Grid>
		</Grid>
	);
}



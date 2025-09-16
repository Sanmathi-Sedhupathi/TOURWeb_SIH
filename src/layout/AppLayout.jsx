import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import Notifier from '../components/Notifier';

const drawerWidth = 240;

const navItems = [
	{ label: 'Dashboard', to: '/dashboard' },
	{ label: 'Tourists', to: '/tourists' },
	{ label: 'Incidents', to: '/incidents' },
	{ label: 'Reports', to: '/reports' },
	{ label: 'Settings', to: '/settings' }
];

export default function AppLayout() {
	const location = useLocation();

	return (
		<Box sx={{ display: 'flex' }}>
			<AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
				<Toolbar>
					<Typography variant="h6" noWrap component="div">
						Admin / Police Dashboard
					</Typography>
				</Toolbar>
			</AppBar>
			<Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
				<Toolbar />
				<Box sx={{ overflow: 'auto' }}>
					<List>
						{navItems.map((item) => (
							<ListItemButton key={item.to} component={Link} to={item.to} selected={location.pathname.startsWith(item.to)}>
								<ListItemText primary={item.label} />
							</ListItemButton>
						))}
					</List>
				</Box>
			</Drawer>
			<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
				<Toolbar />
				<Outlet />
				<Notifier />
			</Box>
		</Box>
	);
}



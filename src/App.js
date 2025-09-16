import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Tourists from './pages/Tourists';
import Incidents from './pages/Incidents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';

const theme = createTheme({
	palette: {
		mode: 'light'
	}
});

function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<BrowserRouter>
				<Routes>
					<Route element={<AppLayout />}>
						<Route path="/" element={<Navigate to="/dashboard" replace />} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route element={<ProtectedRoute allowedRoles={["Admin", "Supervisor", "Police Officer"]} />}>
							<Route path="/tourists" element={<Tourists />} />
							<Route path="/incidents" element={<Incidents />} />
						</Route>
						<Route element={<ProtectedRoute allowedRoles={["Admin", "Supervisor"]} />}>
							<Route path="/reports" element={<Reports />} />
							<Route path="/settings" element={<Settings />} />
						</Route>
						<Route path="*" element={<Navigate to="/dashboard" replace />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;

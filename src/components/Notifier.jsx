import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import useAppStore from '../store/useAppStore';

export default function Notifier() {
	const notifications = useAppStore((s) => s.notifications);
	const dismiss = useAppStore((s) => s.dismissNotification);

	const current = notifications[0];
	const open = Boolean(current);

	const handleClose = () => {
		if (current) dismiss(current.id);
	};

	return (
		<Snackbar open={open} autoHideDuration={5000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
			<Alert onClose={handleClose} severity={current?.severity || 'info'} sx={{ width: '100%' }}>
				{current?.message || ''}
			</Alert>
		</Snackbar>
	);
}



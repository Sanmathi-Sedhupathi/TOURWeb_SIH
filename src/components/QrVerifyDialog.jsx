import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography } from '@mui/material';

export default function QrVerifyDialog({ open, onClose, onVerify }) {
	const [qrValue, setQrValue] = useState('');

	const handleVerify = () => {
		// Stub: Return parsed payload to parent
		onVerify?.({ qr: qrValue, verified: qrValue.trim().length > 0 });
		onClose?.();
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>QR Code Verification</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					<Typography variant="body2">Paste scanned QR payload or ID to simulate verification.</Typography>
					<TextField label="QR Payload / ID" value={qrValue} onChange={(e) => setQrValue(e.target.value)} fullWidth />
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button variant="contained" onClick={handleVerify}>Verify</Button>
			</DialogActions>
		</Dialog>
	);
}



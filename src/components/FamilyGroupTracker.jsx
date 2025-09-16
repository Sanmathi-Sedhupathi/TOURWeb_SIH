import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	Box,
	Card,
	CardContent,
	Chip,
	Avatar,
	Grid,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	IconButton,
	Tooltip
} from '@mui/material';
import {
	Group as GroupIcon,
	LocationOn as LocationIcon,
	Warning as WarningIcon,
	CheckCircle as CheckIcon,
	Error as ErrorIcon,
	Visibility as ViewIcon
} from '@mui/icons-material';
import { subscribeTourists } from '../services/firestoreStreams';
import blockchainService from '../services/blockchain';

export default function FamilyGroupTracker() {
	const [groups, setGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [tourists, setTourists] = useState([]);

	useEffect(() => {
		const unsub = subscribeTourists((items) => {
			setTourists(items);
			updateGroups(items);
		});
		return () => unsub?.();
	}, []);

	const updateGroups = (touristData) => {
		// Group tourists by family/group ID or proximity
		const groupMap = new Map();
		
		touristData.forEach(tourist => {
			const groupId = tourist.groupId || tourist.familyId || 'individual';
			
			if (!groupMap.has(groupId)) {
				groupMap.set(groupId, {
					id: groupId,
					name: tourist.groupName || `Group ${groupId}`,
					members: [],
					status: 'Safe',
					riskLevel: 'Green',
					lastUpdate: new Date().toISOString()
				});
			}
			
			groupMap.get(groupId).members.push(tourist);
		});

		// Calculate group status and risk
		const groupsArray = Array.from(groupMap.values()).map(group => {
			if (group.id === 'individual') return null;
			
			const riskLevels = group.members.map(m => m.riskLevel || 'Green');
			const hasRed = riskLevels.includes('Red');
			const hasYellow = riskLevels.includes('Yellow');
			
			group.riskLevel = hasRed ? 'Red' : hasYellow ? 'Yellow' : 'Green';
			group.status = hasRed ? 'High Risk' : hasYellow ? 'Caution' : 'Safe';
			
			// Check for separated members
			group.separated = checkGroupSeparation(group.members);
			if (group.separated) {
				group.status = 'Separated';
				group.riskLevel = 'Yellow';
			}
			
			return group;
		}).filter(Boolean);

		setGroups(groupsArray);
	};

	const checkGroupSeparation = (members) => {
		if (members.length < 2) return false;
		
		// Check if any member is too far from others
		const threshold = 0.5; // 500 meters
		
		for (let i = 0; i < members.length; i++) {
			for (let j = i + 1; j < members.length; j++) {
				const member1 = members[i];
				const member2 = members[j];
				
				if (!member1.location || !member2.location) continue;
				
				const distance = calculateDistance(
					member1.location.latitude, member1.location.longitude,
					member2.location.latitude, member2.location.longitude
				);
				
				if (distance > threshold) {
					return true;
				}
			}
		}
		
		return false;
	};

	const calculateDistance = (lat1, lon1, lat2, lon2) => {
		const R = 6371; // Earth's radius in km
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	};

	const getRiskColor = (riskLevel) => {
		switch (riskLevel) {
			case 'Red': return '#c62828';
			case 'Yellow': return '#f9a825';
			case 'Green': return '#2e7d32';
			default: return '#90a4ae';
		}
	};

	const getStatusIcon = (status, riskLevel) => {
		if (status === 'Separated') return <WarningIcon color="warning" />;
		if (riskLevel === 'Red') return <ErrorIcon color="error" />;
		if (riskLevel === 'Yellow') return <WarningIcon color="warning" />;
		return <CheckIcon color="success" />;
	};

	const handleViewGroup = (group) => {
		setSelectedGroup(group);
		setDialogOpen(true);
	};

	const createAreaNetwork = (group) => {
		// Create blockchain network for area-based tracking
		const areaId = `area-${Date.now()}`;
		const network = blockchainService.createAreaGroup(areaId, group.members);
		
		// Link all members to the network
		group.members.forEach(member => {
			blockchainService.linkToAreaNetwork(member, areaId);
		});
		
		console.log('Area network created:', network);
	};

	return (
		<Paper sx={{ p: 2 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
				<GroupIcon sx={{ mr: 1 }} />
				<Typography variant="h6">Family & Group Tracking</Typography>
			</Box>
			
			<Grid container spacing={2}>
				{groups.map((group) => (
					<Grid item xs={12} md={6} lg={4} key={group.id}>
						<Card sx={{ 
							border: `2px solid ${getRiskColor(group.riskLevel)}`,
							borderRadius: 2
						}}>
							<CardContent>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
									<Box>
										<Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
											{group.name}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{group.members.length} members
										</Typography>
									</Box>
									{getStatusIcon(group.status, group.riskLevel)}
								</Box>
								
								<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
									<Chip 
										label={group.status}
										color={group.riskLevel === 'Red' ? 'error' : group.riskLevel === 'Yellow' ? 'warning' : 'success'}
										size="small"
									/>
									<Chip 
										label={group.riskLevel}
										sx={{ 
											backgroundColor: getRiskColor(group.riskLevel),
											color: 'white'
										}}
										size="small"
									/>
								</Box>
								
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
									<LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
									<Typography variant="body2" color="text.secondary">
										Last update: {new Date(group.lastUpdate).toLocaleTimeString()}
									</Typography>
								</Box>
								
								<Box sx={{ display: 'flex', gap: 1 }}>
									<Button
										size="small"
										variant="outlined"
										startIcon={<ViewIcon />}
										onClick={() => handleViewGroup(group)}
									>
										View Details
									</Button>
									<Button
										size="small"
										variant="contained"
										onClick={() => createAreaNetwork(group)}
									>
										Link Network
									</Button>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>
			
			{groups.length === 0 && (
				<Box sx={{ textAlign: 'center', py: 4 }}>
					<GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
					<Typography variant="h6" color="text.secondary">
						No family groups detected
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Groups will appear when tourists with family/group IDs are active
					</Typography>
				</Box>
			)}
			
			{/* Group Details Dialog */}
			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					{selectedGroup?.name} - Group Details
				</DialogTitle>
				<DialogContent>
					{selectedGroup && (
						<Box>
							<Box sx={{ mb: 3 }}>
								<Typography variant="subtitle2" gutterBottom>Group Status</Typography>
								<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
									<Chip 
										label={selectedGroup.status}
										color={selectedGroup.riskLevel === 'Red' ? 'error' : selectedGroup.riskLevel === 'Yellow' ? 'warning' : 'success'}
									/>
									<Chip 
										label={`Risk Level: ${selectedGroup.riskLevel}`}
										sx={{ 
											backgroundColor: getRiskColor(selectedGroup.riskLevel),
											color: 'white'
										}}
									/>
								</Box>
							</Box>
							
							<Typography variant="subtitle2" gutterBottom>Group Members</Typography>
							<List>
								{selectedGroup.members.map((member) => (
									<ListItem key={member.id} divider>
										<ListItemAvatar>
											<Avatar sx={{ bgcolor: getRiskColor(member.riskLevel || 'Green') }}>
												{member.name?.charAt(0) || 'T'}
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={member.name || `Tourist ${member.id}`}
											secondary={
												<Box>
													<Typography variant="body2">
														Digital ID: {member.digitalId || 'Not assigned'}
													</Typography>
													<Typography variant="body2">
														Location: {member.location ? 
															`${member.location.latitude.toFixed(4)}, ${member.location.longitude.toFixed(4)}` : 
															'Unknown'
														}
													</Typography>
													<Typography variant="body2">
														Safety Score: {member.safetyScore ? 
															`${(member.safetyScore * 100).toFixed(0)}%` : 
															'N/A'
														}
													</Typography>
												</Box>
											}
										/>
										<Tooltip title={`Risk Level: ${member.riskLevel || 'Green'}`}>
											<IconButton>
												{getStatusIcon(member.status, member.riskLevel || 'Green')}
											</IconButton>
										</Tooltip>
									</ListItem>
								))}
							</List>
						</Box>
					)}
				</DialogContent>
			</Dialog>
		</Paper>
	);
}
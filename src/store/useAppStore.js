import { create } from 'zustand';

const useAppStore = create((set, get) => ({
	userRole: 'Admin',
	setUserRole: (role) => set({ userRole: role }),
	localIncidents: [],
	addLocalIncident: (incident) => set({ localIncidents: [incident, ...get().localIncidents] }),
	notifications: [],
	addNotification: (notification) => set({ notifications: [...get().notifications, { id: Date.now(), ...notification }] }),
	dismissNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) })
}));

export default useAppStore;



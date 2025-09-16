import { Navigate, Outlet } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
	const role = useAppStore((s) => s.userRole);
	if (allowedRoles.length && !allowedRoles.includes(role)) {
		return <Navigate to="/dashboard" replace />;
	}
	return <Outlet />;
}



import { Navigate, Outlet } from "react-router";
import { useMe } from "./hooks/useLogin";

export default function ProtectedRoute({ allowedRoles }) {
  const { data: user } = useMe();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

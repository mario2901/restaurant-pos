import { Navigate, Outlet } from "react-router";
import { useMe } from "./hooks/useLogin";

export default function ProtectedRoute() {
  const { data: user } = useMe();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

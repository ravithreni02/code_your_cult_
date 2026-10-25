import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleRouteProps {
  children: ReactNode;
  /** Roles allowed to view this route. If undefined, any authenticated user is allowed. */
  allow?: AppRole[];
  /** Where to send unauthenticated users. */
  redirectUnauth?: string;
  /** Where to send authenticated users with the wrong role. */
  redirectWrongRole?: string;
}

const RoleRoute = ({
  children,
  allow,
  redirectUnauth = "/auth",
  redirectWrongRole = "/dashboard",
}: RoleRouteProps) => {
  const { user, role, roles, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to={redirectUnauth} replace />;

  // Logged in but no active role chosen yet → force role selection
  if (!role && roles.length > 1) return <Navigate to="/select-role" replace />;

  if (allow && allow.length > 0 && (!role || !allow.includes(role))) {
    return <Navigate to={redirectWrongRole} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;

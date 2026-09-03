import { Link } from "@tanstack/react-router";

export function DashboardButton() {
  return (
  <Link to="/dashboard" className="text-sm font-medium text-on-dark">
    Dashboard
  </Link>
  );
}

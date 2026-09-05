import { createFileRoute, redirect, Outlet} from "@tanstack/react-router";
import { Header } from "../components/Header";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const isAuthenticated = true; // TODO: Replace with auth logic
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!isAuthenticated) {
      return redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <>
    <Header />
    <Outlet />
    </>
  );
}
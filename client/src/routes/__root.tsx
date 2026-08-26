import { Outlet, createRootRoute } from "@tanstack/react-router";

import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { Header } from "../components/Header";

import "../styles.css";

import rings from "../../assets/rings.svg";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Header />
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
      <div className="fixed inset-0 -z-10 bg-background pointer-events-none">
        <img src={rings} alt="" className = "absolute w-[70vw] h-[70vw] left-[-30vw] top-[-6vw] max-w-none"/>
      </div>
    </>
  );
}

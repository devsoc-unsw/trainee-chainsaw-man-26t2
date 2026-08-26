import { DashboardButton } from "./DashboardButton.tsx";
import { NewElectionButton } from "./NewElectionButton.tsx";
import { AvatarButton } from "./AvatarButton.tsx";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-on-dark/15 px-8 py-4 backdrop-blue-md bg-blue/15">
      <DashboardButton />
      <div className="flex items-center gap-4">
        <NewElectionButton />
        <AvatarButton />
      </div>
    </header>
  );
}

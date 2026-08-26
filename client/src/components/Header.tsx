import { NewElectionButton } from "./NewElectionButton.tsx";

export function Header() {
  return (
    <header className="flex justify-end px-8 py-4">
      <NewElectionButton />
    </header>
  );
}
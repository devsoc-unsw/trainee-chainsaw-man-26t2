import { Menu } from "@base-ui/react/menu";

// TODO: replace with the signed-in user's email once auth lands
const EMAIL = "makima@student.unsw.edu";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AvatarButton() {
  // TODO: replace with backend logout
  const logOut = () => {
    console.log("logOut");
  };

  return (
    <Menu.Root>
      <Menu.Trigger className="flex size-10 items-center justify-center rounded-full bg-card text-xs font-medium text-neutral-800">
        {initials(EMAIL)}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-44 rounded-lg border border-muted/40 bg-input p-1 shadow-lg">
            <div className="truncate px-2 py-1.5 text-xs text-muted/60">{EMAIL}</div>
            <Menu.Separator className="-mx-1 my-1 h-px bg-muted/20" />
            <Menu.Item
              onClick={logOut}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-neutral-800 outline-none select-none data-highlighted:bg-muted/15"
            >
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

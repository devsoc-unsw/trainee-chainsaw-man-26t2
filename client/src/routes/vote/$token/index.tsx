import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/vote/$token/")({
  component: RouteComponent,
});

function ResponsbilityButton() {

  return (
    <>
    <div>
      <button className="bg-card-muted rounded-2xl border px-5 py-1.5">
          Responsabilities
      </button>
    </div>
    </>
  );
}

function RoleCard() {

  const roleName = "# Role Name";
  const numCandidates = 0;

  return (
    <>
      <div className="snap-start h-45 flex-none flex flex-row justify-between bg-card rounded-xl">
        <div className="ml-10 mt-5">
          <h5 className="text-2xl">
            {roleName}
          </h5>
          <p className="text-muted">
            No. Candidates: {numCandidates}
          </p>
        </div>
        <div className="mr-10 mt-6">
          <ResponsbilityButton />
        </div>
      </div>
    </>
  );
}

function StatusPill() {

  const date = "2/2/2022"
  return (
    <>
    <div className="w-2/3 bg-statusLabel rounded-xl flex flex-row justify-center gap-2 py-1">
      <p className="">
        opens at
      </p>
      <p className="bg-white rounded-xl px-4 border-accent">
        {date}
      </p>
    </div>
    </>
  );
}

function SeeDetailsButton() {
  return (
  <>
    <button className="text-white text-3xl font-bold">
        Election Details 
    </button>
  </>
);
}


function ElectionBanner() {

  const orgName = "Org Name";
  const electionTitle = "Election Title";

  const userEmail = "example@gmail.com";

  return (
    <>
      <div className="w-3/4 h-1/3 flex-none flex flex-row justify-between items-center rounded-xl my-10 backdrop-blur-3xl shadow-2xl">
        <div className="h-3/4 flex flex-col gap-4 ml-10">
          <h1 className="text-6xl text-white font-bold">
            {orgName}
          </h1>
          <p className="text-3xl text-on-dark-muted">
            {electionTitle}
          </p>
          <div className="h-100 flex items-center">
            <StatusPill />
          </div>
        </div>
        <div className="h-3/4 flex flex-col justify-around mr-10">
          <SeeDetailsButton />
          <div>
            <h6 className="text-on-dark-muted">
              Voting as:
            </h6>
            <p className="text-on-dark-muted">
              {userEmail}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


function RolesList() {

  const numRoles = 0;

  return (
    <>
      <div className="w-2/3 min-h-0 flex-1 flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div className="w-2/3 flex flex-row items-center gap-4">
            <h2 className="text-on-dark text-4xl font-bold">
              Roles
            </h2>
            <p className="text-on-dark text-4xl font-bold">
               •
            </p>
            <p className="text-xl text-on-dark-muted">
              {`Positions: ${numRoles}`}
            </p>
          </div>
          <button className="h-fit bg-card-muted px-8 py-3/4 rounded-xl">
            Begin
          </button>
        </div>
        <div className="scrollbar-thin min-h-0 snap-y scroll-pt-1 flex-1 flex flex-col overflow-y-auto gap-4">
          <RoleCard />
          <RoleCard />
          <RoleCard />
          <RoleCard />
          <RoleCard />
          <div className="h-[50%] min-h-0 flex-none" aria-hidden="true" />
        </div>
      </div>
    </>
  );
} 

function RouteComponent() {
  return (
    <>
    <div className="bg-blue h-screen w-screen min-h-0 flex flex-col items-center">
      <ElectionBanner />
      <RolesList/>
    </div>
    </>
  );
}

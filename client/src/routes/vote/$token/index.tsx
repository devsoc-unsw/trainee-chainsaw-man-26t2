import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { getVoterCampaignInformation } from "#/lib/api";
import { format, getTime } from "date-fns";
import { utc } from "@date-fns/utc"
import type { VotingCampaign, VotingRole } from "#/lib/apiTypes";

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

function RoleCard({ role }: { role: VotingRole }) {
  const { title, no_of_positions, enable_abstention, candidates } = role;
  
 

  console.log(title)

  console.log(no_of_positions)

  const isAbstainable = (enable_abstention) ? "True" : "False";

   
  const numCandidates = candidates.length;

  return (
    <>
      <div className="snap-start h-45 flex-none flex flex-row justify-between bg-card rounded-xl">
        <div className="ml-10 mt-5">
          <h5 className="text-2xl">
            {title}
          </h5>
          <p className="text-muted">
            No. Candidates: {numCandidates}
          </p>
          <p className="text-muted">
            No. Positions: {no_of_positions}
          </p>
          <p className="text-muted">
            Abstainable?: {isAbstainable}
          </p>
        </div>
        <div className="mr-10 mt-6">
          <ResponsbilityButton />
        </div>
      </div>
    </>
  );
}

function StatusPill({opens, closes} : {opens: string, closes: string}) {

  const [time, ] = useState(() => Date.now())
  
  let date = opens
  let color = "status-label-red"
  let text = "opens on"
  
  if (time > getTime(opens)) {
    color = "status-label-green"
    date = closes
    text = "closes on"
  }


  return (
    <>
    <div className={`bg-${color} rounded-xl flex flex-row justify-center gap-2 py-1 px-5`}>
      <p className="">
        {text}
      </p>
      <p className="bg-white rounded-xl px-4 border-accent">
        {date}
      </p>
    </div>
    </>
  );
}

function BeginVotingButton({opens}: {opens: string}) {

  const [time, ] = useState(() => Date.now())
  
  let color = "status-label-red"
  
  if (time > getTime(opens)) {
    color = "status-label-green"
  }
  
  return (
  <>
    <button className={`h-fit bg-${color} px-8 py-3/4 rounded-xl`}>
      Begin
    </button>
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


function RouteComponent() {

  // const { token } = Route.useParams()

  // const { data, isLoading, isError } = useQuery<VotingCampaign>({
  //   queryKey: ["election-data", token],
  //   queryFn: () => getVoterCampaignInformation(token),
  //   staleTime: Infinity
  // });

  // if (isLoading) return <p>loading..</p> 

  // if (isError || !data) return <p>error loading..</p> 

  const temp_data: VotingCampaign = {
        campaign_id: "116654608163452025",
        title: "string",
        description: "string",
        opening_date_time: "2026-09-05T16:37:15.101Z",
        closing_date_time: "2026-09-05T16:37:15.101Z",
        roles: [
          {
            role_id: "45341522702939523632464",
            title: "Coolest Person evar",
            description: "string",
            no_of_positions: 1,
            enable_abstention: true,
            candidates: [
              {
                candidate_id: "95778102331795927968620469228440003938717881",
                first_name: "string",
                last_name: "string",
                manifesto: "string"
              }
            ]
          }
        ]
      };

  // const {title, description, opening_date_time, closing_date_time, roles} = isError || !data ? temp_data : data;
  
  const {title, description, opening_date_time, closing_date_time, roles} = temp_data;
  console.log(description)
  

  const orgName = "orgName"
  const userEmail = "example@gmail.com"

  // const { title, description, opening_date_time, closing_date_time, roles } = data;

  const open_date = format(opening_date_time, "HH:MM dd-mm-yyyy", { in: utc})
  const closing_date = format(closing_date_time, "HH:MM dd-mm-yyyy", { in: utc})



  return (
    <>
    <div className="h-screen w-screen min-h-0 flex flex-col items-center">
      <div className="w-3/4 h-1/3 flex-none flex flex-row justify-between items-center rounded-xl my-10 backdrop-blur-xl shadow-2xl">
        <div className="h-3/4 flex flex-col gap-4 ml-10">
          <h1 className="text-6xl text-white font-bold">
            {orgName}
          </h1>
          <p className="text-3xl text-on-dark-muted">
            {title}
          </p>
          <div className="h-100 flex items-center">
            <StatusPill opens={open_date} closes={closing_date}/>
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
              {`Positions: ${roles.length.toString()}`}
            </p>
          </div>
          <BeginVotingButton opens={open_date}/>
        </div>
          <div className="scrollbar-thin min-h-0 snap-y scroll-pt-1 flex-1 flex flex-col overflow-y-auto gap-4">
            {roles.map((role: VotingRole) => (
              <RoleCard key={role.role_id} role={role}/>
            ))}
          <div className="h-[50%] min-h-0 flex-none" aria-hidden="true" />
        </div>
      </div>
    </div>
    </>
  );
}

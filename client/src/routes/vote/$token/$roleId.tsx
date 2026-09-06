import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vote/$token/$roleId")({
  component: RouteComponent,
});

function CandidateCard() {

  const { name, description } = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum.";

  return (
  <>
    <div className="w-[100%] h-[100%] bg-card">
      <div>
          <h5>
            {name}
          </h5>
      </div>
      <p>
        {description}
      </p>
    </div>
  </>
  )
}


function BallotComponent() {

  const firstName= "First Name";
  const lastName = "Last Name";
  const manifesto = "Cool Campagin promises";

  return (
    <>
    <div className="w-[97%] h-[70%] rounded-xl bg-card-muted flex flex-col items-center">
      <h3 className="text-muted">
        Your Ballot
      </h3>
      <div className="h-auto flex flex-col items-center justify-between">
          <p className="text-muted">
            No candidate selected..
          </p>
      </div>
    </div>
    </>
  )
}


function RouteComponent() {

  const numCandidates = 0
  const roleDescription = "foobar"
  const rolePos = 2
  const numRoles = 5
  const userEmail = "example@gmail.com"

  const roleName = "Vice President of Technicals"


  return (
    <>
    <div className="w-screen h-screen flex-none flex flex-row justify-around items-center p-1.5 gap-1">
      <div className="w-4/18 h-39/40 flex flex-col flex-auto bg-card rounded-xl items-center">
        <div className="w-[100%] flex-none flex flex-row mt-5">
          <div className="w-flex-auto flex flex-row ml-2.5">
            <h3 className="text-3xl font-bold">
                {roleName}
            </h3>
          </div>
          <div className="flex-auto flex flex-col items-end mr-2.5">
            <p className="text-muted">
              page - {rolePos}/{numRoles}
            </p>
            <h4 className="text-lg font-bold">
                voting under:
            </h4>
            <p className="text-muted">
              {userEmail}
            </p>
          </div>
          </div>
          <div className="w-[100%] flex-auto ml-5">
            <h3 className="text-lg font-bold">
                Description
            </h3>
            <p className="text-muted">
              {roleDescription}
            </p>
          </div>
        <BallotComponent />
      </div>
      <div className="w-12/18 h-screen flex flex-col py-5.5 px-2.5 mr-1.5">
        <div className="flex-[25] flex-col">
          <div className="w-100% h-[1] flex flex-row items-center rounded-sm backdrop-blur-xl shadow-2xl gap-4">
            <h4 className="text-3xl font-bold text-on-dark">
              Candidates
            </h4>
            <p className="text-lg text-on-dark-muted align-middle">
              •
            </p>
            <p className="text-xl text-on-dark-muted">
              No Candidates: {`${numCandidates}`}
            </p>
          </div>
          <div className="h-[9] flex-1">
            <CandidateCard />
            <div className="h-[75%]"></div>
          </div>
        </div>
        <div className=" flex-[1] bg-card flex flex-row justify-between px-5 py-1.5 rounded-md">
          <button className="text-xl rounded-md bg-status-label-red px-2.5">
            Back
          </button>
          <button className="text-xl bg-muted  text-on-dark rounded-md px-2.5">
            Abstain
          </button>
        </div>
      </div>
    </div>
    </>
    );
}
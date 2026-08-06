import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/elections/$electionId/invites')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/elections/$electionId/invites"!</div>
}

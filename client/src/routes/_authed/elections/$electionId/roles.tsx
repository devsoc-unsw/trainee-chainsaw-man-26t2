import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/elections/$electionId/roles')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/elections/$electionId/roles"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/elections/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/elections/new"!</div>
}

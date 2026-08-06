import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/count/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/count/"!</div>
}

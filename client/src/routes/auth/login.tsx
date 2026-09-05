import { Link, createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-8">
      <Card className="w-full max-w-sm p-6">
        <div className="flex flex-col gap-5">
          <h1 className="text-sm font-medium">Sign in or create an account</h1>
          {/* TODO: fill in given auth */}
          <Link
            to="/dashboard"
            className="block rounded-full bg-emphasis px-4 py-2 text-center text-sm font-medium text-muted"
          >
            Continue with Google
          </Link>
        </div>
      </Card>
    </div>
  );
}

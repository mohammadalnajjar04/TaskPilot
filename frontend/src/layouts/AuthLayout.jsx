import { Outlet } from "react-router-dom";
import { CheckCircle2, ListChecks, Rocket, ShieldCheck, Timer } from "lucide-react";

function BrandMark({ onDark = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          onDark ? "bg-white/15 text-white" : "bg-primary-600 text-white"
        }`}
      >
        <ListChecks className="h-5 w-5" aria-hidden="true" />
      </span>
      <span
        className={`text-xl font-bold tracking-tight ${
          onDark ? "text-white" : "text-gray-900"
        }`}
      >
        TaskPilot
      </span>
    </div>
  );
}

const FEATURES = [
  {
    icon: Rocket,
    text: "Plan projects and tasks with a clean, focused workflow",
  },
  {
    icon: Timer,
    text: "Track progress and upcoming work in real time",
  },
  {
    icon: ShieldCheck,
    text: "Secure, collaborative workspace for you and your team",
  },
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-blue-400/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <BrandMark onDark />
        </div>

        <div className="relative space-y-8">
          <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
            Take control of your day,
            <br />
            one task at a time.
          </h2>
          <p className="max-w-md text-indigo-100">
            TaskPilot helps you organize projects, prioritize tasks, and keep
            your team moving in the same direction.
          </p>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300"
                  aria-hidden="true"
                />
                <span className="text-sm text-indigo-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">
          &copy; {new Date().getFullYear()} TaskPilot. All rights reserved.
        </p>
      </aside>

      <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <Outlet />
          </div>

          <p className="mt-6 text-center text-sm text-gray-400 lg:hidden">
            &copy; {new Date().getFullYear()} TaskPilot
          </p>
        </div>
      </main>
    </div>
  );
}

import { NavLink } from "react-router-dom";
import {
  IconFolder,
  IconHome,
  IconCog,
  IconLogo,
  IconShieldCheck,
  IconProfile,
  IconUsers,
} from "./icons";
import { useAppContext } from "../context/AppContext";

const topNav = [
  { label: "Home", to: "/dashboard", icon: IconHome, end: true },
  { label: "Patients", to: "/add-record", icon: IconUsers },
  { label: "Records", to: "/ledger", icon: IconFolder },
  { label: "Blockchain Status", to: "/validate", icon: IconShieldCheck },
  { label: "Settings", to: "/settings", icon: IconCog },
];

function Navbar() {
  const { user } = useAppContext();

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#1a3a6e] via-[#1e4a8c] to-[#2563eb] shadow-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5 text-white">
          <IconLogo className="h-8 w-8 shrink-0 text-white" />
          <span className="text-lg font-bold tracking-tight">HealthChain</span>
        </div>

        <nav className="hidden min-w-0 flex-1 justify-center gap-1 md:flex lg:gap-2">
          {topNav.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-white/90 transition lg:px-3",
                  isActive ? "border-b-2 border-white bg-white/10 text-white" : "hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              <span className="hidden lg:inline">{label}</span>
              <span className="lg:hidden">{label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-white sm:flex">
            <IconProfile className="h-5 w-5 shrink-0" />
            <p className="max-w-[140px] truncate text-sm font-semibold">{user.name}</p>
          </div>
        )}
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 md:hidden">
        {topNav.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={`m-${label}`}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-white/90",
                isActive ? "bg-white/15 text-white" : "hover:bg-white/10",
              ].join(" ")
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;

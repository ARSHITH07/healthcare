import { NavLink } from "react-router-dom";
import { IconChart, IconClipboard, IconCog, IconShieldCheck, IconUserPlus } from "./icons";

const links = [
  { label: "Dashboard", to: "/dashboard", icon: IconChart },
  { label: "Add Patient", to: "/add-record", icon: IconUserPlus },
  { label: "View Records", to: "/ledger", icon: IconClipboard },
  { label: "Verify Data", to: "/validate", icon: IconShieldCheck },
  { label: "Settings", to: "/settings", icon: IconCog },
];

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-[#f8fafc] lg:block">
      <nav className="flex flex-col gap-1 p-4 pt-6">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

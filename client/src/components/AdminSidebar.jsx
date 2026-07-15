import { NavLink } from "react-router-dom";

const links = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Staff", path: "/admin/cms/staff" },
  { name: "Hero Slides", path: "/admin/cms/hero" },
  { name: "Gallery", path: "/admin/cms/gallery" },
  { name: "Events", path: "/admin/cms/events" },
  { name: "Fees", path: "/admin/cms/fees" },
  { name: "Settings", path: "/admin/cms/settings" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-72 bg-blue-900 text-white">
      <div className="text-center py-8 border-b border-blue-700">
        <h1 className="text-2xl font-bold">
          Angels Home CMS
        </h1>
      </div>

      <nav className="p-4">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 mb-2 ${
                isActive
                  ? "bg-blue-700"
                  : "hover:bg-blue-800"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
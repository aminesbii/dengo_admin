import UserButton from "./auth/UserButton";
import { useLocation } from "react-router";
import { useTheme } from "../context/ThemeContext";

import {
  ClipboardListIcon,
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  SunIcon,
  MoonIcon,
  StoreIcon,
  FolderTreeIcon,
} from "lucide-react";

// eslint-disable-next-line
export const NAVIGATION = [
  { name: "Dashboard", path: "/dashboard", icon: <HomeIcon className="size-5" /> },
  { name: "Products", path: "/products", icon: <ShoppingBagIcon className="size-5" /> },
  { name: "Categories", path: "/categories", icon: <FolderTreeIcon className="size-5" /> },
  { name: "Orders", path: "/orders", icon: <ClipboardListIcon className="size-5" /> },
  { name: "Customers", path: "/customers", icon: <UsersIcon className="size-5" /> },
  { name: "Shops", path: "/vendors", icon: <StoreIcon className="size-5" /> },
];

function Navbar({ toggleSidebar, isOpen }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="navbar w-full bg-base-100 border-b border-base-300 sticky top-0 z-10">
      <div className="flex-1 px-4">
        <h1 className="text-xl font-bold">
          {NAVIGATION.find((item) => item.path === location.pathname)?.name || "Dashboard"} page
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle swap swap-rotate"
          aria-label="toggle theme"
        >
          {theme === "dark" ? (
            <SunIcon className="size-6 text-gray-100" />
          ) : (
            <MoonIcon className="size-6 text-slate-700" />
          )}
        </button>

        <UserButton />
      </div>
    </div>
  );
}

export default Navbar;
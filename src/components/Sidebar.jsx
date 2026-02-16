import {   PanelLeftIcon, PanelLeftCloseIcon, } from "lucide-react";
import { Link, useLocation } from "react-router";
import { NAVIGATION } from "./Navbar";

import DengoLogo from "../assets/DengoLogo.png";

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  // Static user data - replace with your actual user context/state management
  const user = {
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    firstName: "Admin",
    lastName: "User",
    emailAddresses: [{ emailAddress: "admin@dengo.com" }],
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        flex flex-col
        bg-base-100 border-r border-base-300
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-0 lg:w-16"}
        overflow-hidden
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-[67.5px] px-3 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <button 
        onClick={toggleSidebar} 
        className="btn btn-square btn-ghost" 
        aria-label="toggle sidebar"
      >
        {isOpen ? <PanelLeftCloseIcon className="size-7" /> : <PanelLeftIcon className="size-7" />}
      </button>
          </div>
          <span 
            className={`
              text-xl font-bold whitespace-nowrap
              transition-opacity duration-300
              ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}
            `}
          >
            Sidebar
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {NAVIGATION.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? "bg-primary text-primary-content" 
                      : "hover:bg-base-300 text-base-content"
                    }
                    ${!isOpen && "lg:justify-center lg:px-0"}
                  `}
                  title={!isOpen ? item.name : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span 
                    className={`
                      whitespace-nowrap transition-opacity duration-300
                      ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logo */}
      <div className="p-3 border-t border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0">
            <img 
              src={DengoLogo}
              alt="dengo" 
              className="w-10 h-10 rounded-full" 
            />
          </div>
          <div 
            className={`
              flex-1 min-w-0 transition-opacity duration-300
              ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}
            `}
          >
            <p className="text-sm font-semibold truncate">
              Dengo Admin
            </p>
            <p className="text-xs opacity-60 truncate">
              admin@dengo.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
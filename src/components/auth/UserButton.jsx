import { useState, useRef, useEffect } from "react";
import { useAuth, useUser } from "../../context/AuthContext";
import { LogOutIcon, UserIcon, ChevronDownIcon } from "lucide-react";

/**
 * UserButton component to replace Clerk's UserButton
 */
function UserButton() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dropdown dropdown-end" ref={dropdownRef}>
      <button
        className="btn btn-ghost btn-circle avatar"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user?.imageUrl ? (
          <div className="w-10 rounded-full">
            <img src={user.imageUrl} alt={user.name || "User"} />
          </div>
        ) : (
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-10">
              <span className="text-sm">{getInitials(user?.name)}</span>
            </div>
          </div>
        )}
      </button>

      {isOpen && (
        <ul className="menu dropdown-content z-[1] p-2   bg-base-100 rounded-box w-52 mt-2">
          <li className="menu-title px-4 py-2">
            <div className="flex items-center gap-3">
              {user?.imageUrl ? (
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img src={user.imageUrl} alt={user.name || "User"} />
                  </div>
                </div>
              ) : (
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <span className="text-xs">{getInitials(user?.name)}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{user?.name || "Admin"}</span>
                <span className="text-xs opacity-60">{user?.email}</span>
              </div>
            </div>
          </li>
          <div className="divider my-1"></div>
          <li>
            <button onClick={handleSignOut} className="text-error">
              <LogOutIcon className="w-4 h-4" />
              Sign Out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserButton;

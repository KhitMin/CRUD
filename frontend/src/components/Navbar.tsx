import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          CRUD App
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/posts"
                className="text-gray-700 hover:text-indigo-600"
              >
                Posts
              </Link>
              {isAdmin && (
                <Link
                  to="/users"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Users
                </Link>
              )}
              <Link
                to="/profile"
                className="text-sm text-gray-700 hover:text-indigo-600"
              >
                {user?.name}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-indigo-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

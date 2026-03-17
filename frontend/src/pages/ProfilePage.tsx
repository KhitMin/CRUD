import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/users";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNo: "",
    description: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await userService.getById(user.id);
        setProfile(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email,
          phoneNo: res.data.phoneNo || "",
          description: res.data.description || "",
        });
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await userService.update(user.id, form);
      setProfile(res.data);
      setEditing(false);
      setSuccess("Profile updated successfully");

      // AuthContext ထဲက user data ကိုလည်း update လုပ်
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      if (accessToken && refreshToken) {
        login(accessToken, refreshToken, { ...user, ...res.data });
      }
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;

    try {
      await userService.delete(user.id);
      logout();
      navigate("/login");
    } catch {
      setError("Failed to delete account");
    }
  };

  if (loading) {
    return <p className="mt-16 text-center text-gray-500">Loading...</p>;
  }

  if (!profile) {
    return <p className="mt-16 text-center text-gray-500">Profile not found.</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Profile</h1>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">{success}</p>
      )}

      {editing ? (
        <form onSubmit={handleUpdate} className="mt-6 space-y-4 rounded bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              name="phoneNo"
              value={form.phoneNo}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded bg-white p-6 shadow">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs uppercase text-gray-500">Name</dt>
              <dd className="text-gray-900">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Email</dt>
              <dd className="text-gray-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Role</dt>
              <dd className="text-gray-900">{profile.role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Phone</dt>
              <dd className="text-gray-900">{profile.phoneNo || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Description</dt>
              <dd className="text-gray-900">{profile.description || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Created</dt>
              <dd className="text-gray-900">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Updated</dt>
              <dd className="text-gray-900">
                {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "-"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Edit Profile
            </button>
            <button
              onClick={handleDelete}
              className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

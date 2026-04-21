import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getStoredProfile, saveStoredProfile } from "../lib/settingsStorage";

const roles = ["Clinician", "Administrator", "Auditor", "Researcher"];

function Settings() {
  const navigate = useNavigate();
  const { user, logout, pushToast } = useAppContext();
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [saved, setSaved] = useState(false);

  const handleLogout = () => {
    logout();
    pushToast({ tone: "info", message: "You have been signed out." });
    navigate("/login", { replace: true });
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((p) => ({ ...p, [name]: value }));
    setSaved(false);
  };

  const handleUpdateProfile = (event) => {
    event.preventDefault();
    saveStoredProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user?.email}. Profile data is stored in this browser only.
        </p>
      </div>

      <section className="page-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Profile settings</h2>
        <p className="mt-1 text-sm text-slate-500">Update user details for this workstation.</p>

        <form className="mt-6 space-y-4" onSubmit={handleUpdateProfile}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              className="input-mockup mt-1"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="input-mockup mt-1"
              placeholder="you@hospital.org"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select name="role" value={profile.role} onChange={handleProfileChange} className="input-mockup mt-1">
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-button w-full sm:w-auto">
            Update profile
          </button>
          {saved && <p className="text-sm font-medium text-green-600">Profile saved.</p>}
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">Session</h3>
          <p className="mt-1 text-xs text-slate-500">End your session and return to the dashboard.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;

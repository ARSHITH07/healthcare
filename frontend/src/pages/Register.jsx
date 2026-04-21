import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { IconLogo } from "../components/icons";
import { useAppContext } from "../context/AppContext";

const roles = ["Clinician", "Administrator", "Auditor", "Researcher"];

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: roles[0],
};

function Register() {
  const navigate = useNavigate();
  const { user, register, pushToast } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      register(form);
      pushToast({ tone: "success", message: "Account created." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create account.");
    }
  };

  return (
    <main className="min-h-screen bg-slateBg px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-[#1a3a6e]">
            <IconLogo className="h-10 w-10" />
            <span className="text-2xl font-bold">HealthChain</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
              New workspace
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Register your HealthChain account
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Create a local demo account for accessing records, validations, reports, and profile settings.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Registration</h2>
          <p className="mt-1 text-sm text-slate-500">
            This demo stores accounts in your browser only.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-mockup mt-1"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-mockup mt-1"
                placeholder="you@hospital.org"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Role
              <select name="role" value={form.role} onChange={handleChange} className="input-mockup mt-1">
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-mockup mt-1"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input-mockup mt-1"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <button type="submit" className="primary-button w-full rounded-md">
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-[#2563eb] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;

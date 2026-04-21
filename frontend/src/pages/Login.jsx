import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { IconLogo } from "../components/icons";
import { useAppContext } from "../context/AppContext";

const initialForm = {
  email: "",
  password: "",
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, pushToast } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      login(form);
      pushToast({ tone: "success", message: "Welcome back." });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
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
              Secure access
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to your ledger workspace
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Continue managing patient records, validating chain integrity, and reviewing audit activity.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Use the account you registered on this browser.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input-mockup mt-1"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <button type="submit" className="primary-button w-full rounded-md">
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to HealthChain?{" "}
            <Link to="/register" className="font-semibold text-[#2563eb] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;

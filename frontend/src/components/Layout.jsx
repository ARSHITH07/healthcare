import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import LoadingSpinner from "./LoadingSpinner";
import { useAppContext } from "../context/AppContext";

function Layout() {
  const { loading } = useAppContext();

  return (
    <div className="min-h-screen bg-slateBg">
      <Navbar />
      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-5">
          {loading ? (
            <div className="page-card flex min-h-[240px] items-center justify-center">
              <LoadingSpinner label="Loading blockchain ledger..." />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

export default Layout;

import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import LoadingSpinner from "./LoadingSpinner";
import { useAppContext } from "../context/AppContext";

function Layout() {
  const { loading } = useAppContext();

  return (
    <div className="min-h-screen bg-slateBg">
      <Navbar />
      <div className="flex min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
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

    </div>
  );
}

export default Layout;

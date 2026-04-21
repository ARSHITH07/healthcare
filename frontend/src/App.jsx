import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastViewport from "./components/ToastViewport";
import { useAppContext } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import AddRecord from "./pages/AddRecord";
import Ledger from "./pages/Ledger";
import Validate from "./pages/Validate";
import Tamper from "./pages/Tamper";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const { toasts } = useAppContext();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-record" element={<AddRecord />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/validate" element={<Validate />} />
            <Route path="/tamper" element={<Tamper />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastViewport toasts={toasts} />
    </>
  );
}

export default App;

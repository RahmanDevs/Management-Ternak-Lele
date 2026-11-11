import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useStore } from "./store/Store";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Batches from "./pages/Batches";
import NewBatch from "./pages/NewBatch";
import BatchDetail from "./pages/BatchDetail";
import WorkerHome from "./pages/WorkerHome";
import DailyLog from "./pages/DailyLog";
import History from "./pages/History";

function Guard({ ownerOnly = false }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && user.role !== "owner")
    return <Navigate to="/worker" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useStore();
  return (
    <Navigate
      to={!user ? "/login" : user.role === "owner" ? "/dashboard" : "/worker"}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard />}>
        <Route element={<Layout />}>
          <Route element={<Guard ownerOnly />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/new" element={<NewBatch />} />
            <Route path="/batches/:batchId/:tab?" element={<BatchDetail />} />
          </Route>
          <Route path="/worker" element={<WorkerHome />} />
          <Route path="/feed" element={<DailyLog kind="feed" />} />
          <Route path="/mortality" element={<DailyLog kind="mortality" />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

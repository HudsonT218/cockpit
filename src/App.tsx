import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthGate from "./components/AuthGate";
import Today from "./pages/Today";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Inbox from "./pages/Inbox";
import Planner from "./pages/Planner";
import DayPlanner from "./pages/DayPlanner";
import Shipped from "./pages/Shipped";

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/day" element={<DayPlanner />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/shipped" element={<Shipped />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

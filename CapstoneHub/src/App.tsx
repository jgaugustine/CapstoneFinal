import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import StageLight from "./pages/StageLight";
import StageSensor from "./pages/StageSensor";
import StageReadout from "./pages/StageReadout";
import StageDemosaic from "./pages/StageDemosaic";
import StagePost from "./pages/StagePost";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/light" element={<StageLight />} />
          <Route path="/sensor" element={<StageSensor />} />
          <Route path="/readout" element={<StageReadout />} />
          <Route path="/demosaic" element={<StageDemosaic />} />
          <Route path="/post" element={<StagePost />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

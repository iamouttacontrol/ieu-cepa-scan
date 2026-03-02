import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardScreen from "./components/screens/DashboardScreen";
import ReadinessScanScreen from "./components/screens/ReadinessScanScreen";
import ActionPlanScreen from "./components/screens/ActionPlanScreen";
import LearningScreen from "./components/screens/LearningScreen";
import ProfileScreen from "./components/screens/ProfileScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/readiness-scan" element={<ReadinessScanScreen />} />
            <Route path="/action-plan-generator" element={<ActionPlanScreen />} />
            <Route path="/action-plan" element={<ActionPlanScreen />} />
            <Route path="/learning" element={<LearningScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

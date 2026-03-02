import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import DashboardScreen from "@/components/screens/DashboardScreen";
import ReadinessScanScreen from "@/components/screens/ReadinessScanScreen";
import LearningScreen from "@/components/screens/LearningScreen";
import CommunityScreen from "@/components/screens/CommunityScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";

const screens: Record<string, React.FC> = {
  dashboard: DashboardScreen,
  scan: ReadinessScanScreen,
  learning: LearningScreen,
  community: CommunityScreen,
  profile: ProfileScreen,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const ActiveScreen = screens[activeTab];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <div className="pb-20 overflow-y-auto">
        <ActiveScreen />
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

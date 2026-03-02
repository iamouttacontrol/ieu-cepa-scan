import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import DashboardScreen from "@/components/screens/DashboardScreen";
import ReadinessScanScreen from "@/components/screens/ReadinessScanScreen";
import LearningScreen from "@/components/screens/LearningScreen";
import CommunityScreen from "@/components/screens/CommunityScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen onNavigate={setActiveTab} />;
      case "scan":
        return <ReadinessScanScreen />;
      case "learning":
        return <LearningScreen />;
      case "community":
        return <CommunityScreen onNavigate={setActiveTab} />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <DashboardScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <div className="pb-20 overflow-y-auto">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

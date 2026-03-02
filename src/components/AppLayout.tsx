import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIChatBot from "./AIChatBot";

const AppLayout = () => {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="pb-20 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
      <AIChatBot />
    </div>
  );
};

export default AppLayout;

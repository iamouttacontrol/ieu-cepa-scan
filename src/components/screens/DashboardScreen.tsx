import { ClipboardCheck, ListChecks, GraduationCap, Users, UserCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Sustainable Supply Academy</h1>
          <p className="text-sm text-muted-foreground">Your EU Export Readiness Partner</p>
        </div>
      </div>

      {/* Core Features */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Core Features
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/readiness-scan")}
            className="app-card flex w-full items-center gap-4 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Readiness Scan</p>
              <p className="text-xs text-muted-foreground">Assess your EU compliance status</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/action-plan-generator")}
            className="app-card flex w-full items-center gap-4 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ListChecks className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Action Plan</p>
              <p className="text-xs text-muted-foreground">Generate & track compliance steps</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/learning")}
            className="app-card flex w-full items-center gap-4 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Learning Hub</p>
              <p className="text-xs text-muted-foreground">3-5 min video microlearning</p>
            </div>
          </button>
        </div>
      </div>

      {/* Future Features */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Coming Soon
        </h2>
        <div className="space-y-3">
          <div className="app-card-static flex items-center gap-4 opacity-60">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Community Hub</p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
              <p className="text-xs text-muted-foreground">Connect with peers & share experiences</p>
            </div>
          </div>

          <div className="app-card-static flex items-center gap-4 opacity-60">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <UserCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Expert Matching</p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
              <p className="text-xs text-muted-foreground">Get verified expert support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust */}
      <div className="flex justify-center pt-2">
        <div className="trust-badge">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered · University Verified
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;

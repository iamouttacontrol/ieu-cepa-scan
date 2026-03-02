import { Play, GraduationCap, Clock } from "lucide-react";

const modules = [
  { title: "What is the Digital Product Passport?", duration: "3 min", topic: "Documentation" },
  { title: "EUDR: Deforestation Compliance Basics", duration: "4 min", topic: "EUDR" },
  { title: "CE Marking: Step-by-Step Guide", duration: "5 min", topic: "CEPA" },
  { title: "Sustainability Reporting Made Simple", duration: "4 min", topic: "Sustainability" },
  { title: "Product Safety Documentation Checklist", duration: "3 min", topic: "Documentation" },
  { title: "Understanding REACH Chemical Compliance", duration: "5 min", topic: "CEPA" },
];

const LearningScreen = () => {
  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Microlearning Library</h1>
        <p className="text-sm text-muted-foreground">Short video lessons (3-5 minutes each)</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 text-center">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h2 className="text-base font-bold text-primary">Coming Soon</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Video learning modules will be available shortly
        </p>
      </div>

      {/* Module List (greyed out) */}
      <div className="space-y-3 opacity-50 pointer-events-none">
        {modules.map((mod, i) => (
          <div key={i} className="app-card-static flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{mod.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {mod.duration}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {mod.topic}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningScreen;

import { Play, ChevronRight, CheckSquare, ArrowRight, Filter, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const modules = [
  { id: 1, title: "What is the Digital Product Passport?", duration: "3 min", tag: "Beginner", topic: "Documentation" },
  { id: 2, title: "EUDR Compliance for Palm Oil Exporters", duration: "5 min", tag: "Required", topic: "EUDR" },
  { id: 3, title: "Understanding CEPA Trade Benefits", duration: "4 min", tag: "Beginner", topic: "CEPA" },
  { id: 4, title: "Sustainability Reporting Basics", duration: "3 min", tag: "Advanced", topic: "Sustainability" },
  { id: 5, title: "Export Documentation Checklist", duration: "4 min", tag: "Required", topic: "Documentation" },
];

const filters = ["All", "EUDR", "CEPA", "Documentation", "Sustainability"];

const LearningScreen = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedModule, setSelectedModule] = useState<typeof modules[0] | null>(null);

  const filtered = activeFilter === "All" ? modules : modules.filter((m) => m.topic === activeFilter);

  if (selectedModule) {
    return (
      <div className="space-y-5 p-4">
        <button onClick={() => setSelectedModule(null)} className="text-sm text-primary font-medium">
          ← Back to Modules
        </button>

        {/* Video Placeholder */}
        <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Play className="h-6 w-6 text-primary ml-1" />
            </div>
            <p className="text-sm font-medium">{selectedModule.duration} video</p>
            <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1">
              <Clock className="h-3 w-3 text-accent-foreground" />
              <span className="text-xs font-medium text-accent-foreground">Coming Soon</span>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold">{selectedModule.title}</h2>

        {/* Key Takeaways */}
        <div className="wireframe-card space-y-2">
          <h3 className="text-sm font-semibold">3 Key Takeaways</h3>
          {[
            "Understand the core regulation requirements",
            "Know what documents you need to prepare",
            "Timeline and deadlines for compliance",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => toast.success("Action steps feature coming soon!")}
            className="flex w-full items-center justify-between rounded-lg bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground"
          >
            <span>Translate into Action Steps</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.success("Added to your checklist!")}
            className="flex w-full items-center justify-between rounded-lg border-2 border-primary py-3 px-4 text-sm font-semibold text-primary"
          >
            <span className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Add to My Checklist
            </span>
          </button>
          <button
            onClick={() => {
              const currentIndex = modules.findIndex((m) => m.id === selectedModule.id);
              const next = modules[(currentIndex + 1) % modules.length];
              setSelectedModule(next);
              toast.info(`Opening: ${next.title}`);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-3 text-sm font-medium text-foreground"
          >
            Next 3-Min Module
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">Learning</h1>
      <p className="text-sm text-muted-foreground">
        Short video modules — learn what you need, when you need it.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {filtered.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelectedModule(mod)}
            className="wireframe-card flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Play className="h-5 w-5 text-primary ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{mod.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{mod.duration}</span>
                <span
                  className={
                    mod.tag === "Beginner"
                      ? "tag-beginner"
                      : mod.tag === "Advanced"
                      ? "tag-advanced"
                      : "tag-required"
                  }
                >
                  {mod.tag}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LearningScreen;

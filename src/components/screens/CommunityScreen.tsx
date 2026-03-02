import { MessageCircle, Calendar, Video, Search, Users, ChevronRight } from "lucide-react";

const webinars = [
  { title: "EUDR Q&A with Trade Expert", date: "Mar 12, 2026", time: "14:00 WIB" },
  { title: "Exporting to Germany — What You Need", date: "Mar 18, 2026", time: "10:00 WIB" },
];

const threads = [
  { title: "Palm oil EUDR compliance tips?", replies: 12, sector: "Agriculture" },
  { title: "Best logistics partner for EU?", replies: 8, sector: "General" },
  { title: "CE marking for furniture", replies: 5, sector: "Furniture" },
];

const CommunityScreen = () => {
  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">Community Hub</h1>
      <p className="text-sm text-muted-foreground">
        Connect with experts, peers, and EU business contacts.
      </p>

      {/* Top Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="quick-action-btn">
          <MessageCircle className="h-6 w-6 text-primary" />
          <span>Ask an Expert</span>
        </button>
        <button className="quick-action-btn">
          <Calendar className="h-6 w-6 text-primary" />
          <span>Book Consultation</span>
        </button>
      </div>

      {/* Upcoming Webinars */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Upcoming Webinars
        </h2>
        <div className="space-y-2.5">
          {webinars.map((w, i) => (
            <div key={i} className="wireframe-card flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info">
                <Video className="h-5 w-5 text-info-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{w.title}</p>
                <p className="text-xs text-muted-foreground">{w.date} · {w.time}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Find EU Contact */}
      <button className="wireframe-card flex w-full items-center gap-3 border-2 border-dashed border-primary/30">
        <Search className="h-5 w-5 text-primary" />
        <div className="text-left">
          <p className="text-sm font-medium">Find EU Business Contact</p>
          <p className="text-xs text-muted-foreground">Search importers, agents & partners</p>
        </div>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>

      {/* Discussion Threads */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Discussion Threads
        </h2>
        <div className="space-y-2.5">
          {threads.map((t, i) => (
            <div key={i} className="wireframe-card flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.replies} replies · {t.sector}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityScreen;

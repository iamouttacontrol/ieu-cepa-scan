import { MessageCircle, Calendar, Video, Search, Users, ChevronRight, Clock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CommunityScreenProps {
  onNavigate: (tab: string) => void;
}

const webinars = [
  { title: "EUDR Q&A with Trade Expert", date: "Mar 12, 2026", time: "14:00 WIB", desc: "Live Q&A session with EU trade compliance expert covering EUDR requirements for Indonesian exporters." },
  { title: "Exporting to Germany — What You Need", date: "Mar 18, 2026", time: "10:00 WIB", desc: "Step-by-step guide covering documentation, logistics, and compliance for German market entry." },
];

const threads = [
  { title: "Palm oil EUDR compliance tips?", replies: 12, sector: "Agriculture", preview: "Has anyone successfully submitted EUDR due diligence documentation for palm oil products? Looking for tips on supply chain verification." },
  { title: "Best logistics partner for EU?", replies: 8, sector: "General", preview: "We're a small furniture exporter looking for reliable logistics partners with experience shipping to EU markets." },
  { title: "CE marking for furniture", replies: 5, sector: "Furniture", preview: "What's the process and timeline for getting CE marking for wooden furniture exports? Any recommendations for testing labs?" },
];

type ModalType = "expert" | "consult" | "contact" | "webinar" | "thread" | null;

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedWebinar, setSelectedWebinar] = useState<typeof webinars[0] | null>(null);
  const [selectedThread, setSelectedThread] = useState<typeof threads[0] | null>(null);

  const openWebinar = (w: typeof webinars[0]) => { setSelectedWebinar(w); setModal("webinar"); };
  const openThread = (t: typeof threads[0]) => { setSelectedThread(t); setModal("thread"); };
  const close = () => { setModal(null); setSelectedWebinar(null); setSelectedThread(null); };

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">Community Hub</h1>
      <p className="text-sm text-muted-foreground">
        Connect with experts, peers, and EU business contacts.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button className="quick-action-btn" onClick={() => setModal("expert")}>
          <MessageCircle className="h-6 w-6 text-primary" />
          <span>Ask an Expert</span>
        </button>
        <button className="quick-action-btn" onClick={() => setModal("consult")}>
          <Calendar className="h-6 w-6 text-primary" />
          <span>Book Consultation</span>
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Webinars</h2>
        <div className="space-y-2.5">
          {webinars.map((w, i) => (
            <button key={i} onClick={() => openWebinar(w)} className="wireframe-card flex w-full items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info">
                <Video className="h-5 w-5 text-info-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{w.title}</p>
                <p className="text-xs text-muted-foreground">{w.date} · {w.time}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setModal("contact")} className="wireframe-card flex w-full items-center gap-3 border-2 border-dashed border-primary/30">
        <Search className="h-5 w-5 text-primary" />
        <div className="text-left">
          <p className="text-sm font-medium">Find EU Business Contact</p>
          <p className="text-xs text-muted-foreground">Search importers, agents & partners</p>
        </div>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Discussion Threads</h2>
        <div className="space-y-2.5">
          {threads.map((t, i) => (
            <button key={i} onClick={() => openThread(t)} className="wireframe-card flex w-full items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.replies} replies · {t.sector}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet Modal */}
      {modal && (
        <div className="fixed inset-0 z-50" onClick={close}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 mx-auto max-w-lg rounded-t-2xl bg-background p-6 shadow-xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modal === "expert" && "Ask an Expert"}
                {modal === "consult" && "Book Consultation"}
                {modal === "contact" && "Find EU Business Contact"}
                {modal === "webinar" && selectedWebinar?.title}
                {modal === "thread" && selectedThread?.title}
              </h3>
              <button onClick={close} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal === "webinar" && selectedWebinar && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {selectedWebinar.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedWebinar.time}</span>
                </div>
                <p className="text-sm">{selectedWebinar.desc}</p>
              </div>
            )}

            {modal === "thread" && selectedThread && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{selectedThread.replies} replies · {selectedThread.sector}</p>
                <p className="text-sm">{selectedThread.preview}</p>
              </div>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  {modal === "expert" && "Live expert chat is launching in Q2 2026. Ask EU trade compliance questions directly to certified consultants."}
                  {modal === "consult" && "One-on-one consultation booking with IEU-CEPA trade specialists is coming soon."}
                  {modal === "contact" && "Search our database of verified EU importers, agents, and business partners."}
                  {modal === "webinar" && "Registration opens 1 week before the event."}
                  {modal === "thread" && "Full discussion forum with replies and upvoting is launching soon."}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                close();
                toast.success(modal === "webinar" ? "Reminder set!" : "You'll be notified when this feature launches!");
              }}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              {modal === "webinar" ? "Set Reminder" : "Notify Me When Available"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityScreen;

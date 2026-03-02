import { MessageCircle, Calendar, Video, Search, Users, ChevronRight, Clock, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  const [selectedWebinar, setSelectedWebinar] = useState<typeof webinars[0] | null>(null);
  const [selectedThread, setSelectedThread] = useState<typeof threads[0] | null>(null);
  const [showExpertSheet, setShowExpertSheet] = useState(false);
  const [showConsultSheet, setShowConsultSheet] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">Community Hub</h1>
      <p className="text-sm text-muted-foreground">
        Connect with experts, peers, and EU business contacts.
      </p>

      {/* Top Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="quick-action-btn" onClick={() => setShowExpertSheet(true)}>
          <MessageCircle className="h-6 w-6 text-primary" />
          <span>Ask an Expert</span>
        </button>
        <button className="quick-action-btn" onClick={() => setShowConsultSheet(true)}>
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
            <button key={i} onClick={() => setSelectedWebinar(w)} className="wireframe-card flex w-full items-center gap-3 text-left">
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

      {/* Find EU Contact */}
      <button onClick={() => setShowContactSearch(true)} className="wireframe-card flex w-full items-center gap-3 border-2 border-dashed border-primary/30">
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
            <button key={i} onClick={() => setSelectedThread(t)} className="wireframe-card flex w-full items-center gap-3 text-left">
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

      {/* Ask Expert Sheet */}
      <Sheet open={showExpertSheet} onOpenChange={setShowExpertSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Ask an Expert</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  Live expert chat is launching in Q2 2026. You'll be able to ask EU trade compliance questions directly to certified consultants.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowExpertSheet(false); toast.success("You'll be notified when expert chat launches!"); }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Notify Me When Available
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Book Consultation Sheet */}
      <Sheet open={showConsultSheet} onOpenChange={setShowConsultSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Book Consultation</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  One-on-one consultation booking with IEU-CEPA trade specialists is coming soon. Get personalized compliance guidance for your business.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowConsultSheet(false); toast.success("You'll be notified when consultation booking launches!"); }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Notify Me When Available
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Webinar Detail Sheet */}
      <Sheet open={!!selectedWebinar} onOpenChange={() => setSelectedWebinar(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{selectedWebinar?.title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {selectedWebinar?.date}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedWebinar?.time}</span>
            </div>
            <p className="text-sm">{selectedWebinar?.desc}</p>
            <div className="flex items-center gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">Registration opens 1 week before the event.</p>
            </div>
            <button
              onClick={() => { setSelectedWebinar(null); toast.success("Reminder set! We'll notify you when registration opens."); }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Set Reminder
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Thread Detail Sheet */}
      <Sheet open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{selectedThread?.title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">{selectedThread?.replies} replies · {selectedThread?.sector}</p>
            <p className="text-sm">{selectedThread?.preview}</p>
            <div className="flex items-center gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Forum Coming Soon</p>
                <p className="text-xs text-muted-foreground">Full discussion forum with replies and upvoting is launching soon.</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedThread(null); toast.success("You'll be notified when the forum launches!"); }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Notify Me When Available
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Contact Search Sheet */}
      <Sheet open={showContactSearch} onOpenChange={setShowContactSearch}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Find EU Business Contact</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  Search our database of verified EU importers, agents, and business partners matched to your product and sector.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowContactSearch(false); toast.success("You'll be notified when contact search launches!"); }}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Notify Me When Available
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CommunityScreen;

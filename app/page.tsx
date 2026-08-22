"use client";

import {
  Children,
  cloneElement,
  createContext,
  FormEvent,
  isValidElement,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { Toaster, toast } from "sonner";
import { Language, translate } from "./i18n";

type LocaleValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LocaleContext = createContext<LocaleValue>({
  language: "en",
  setLanguage: () => undefined,
});

function useLocale() {
  return useContext(LocaleContext);
}

function localizeNode(node: ReactNode, language: Language): ReactNode {
  if (typeof node === "string") {
    const leading = node.match(/^\s*/)?.[0] ?? "";
    const trailing = node.match(/\s*$/)?.[0] ?? "";
    const core = node.trim();
    return core ? `${leading}${translate(language, core)}${trailing}` : node;
  }

  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  const localizedProps: Record<string, unknown> = {};

  for (const attribute of ["aria-label", "placeholder", "title"]) {
    if (typeof props[attribute] === "string") {
      localizedProps[attribute] = translate(language, props[attribute]);
    }
  }

  if ("children" in props) {
    localizedProps.children = Children.map(props.children as ReactNode, (child) =>
      localizeNode(child, language),
    );
  }

  return cloneElement(element, localizedProps);
}

function Localized({ children }: { children: ReactNode }) {
  const { language } = useLocale();
  return <>{Children.map(children, (child) => localizeNode(child, language))}</>;
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLocale();

  return (
    <label className="language-switcher">
      <span className="sr-only">Choose website language</span>
      <Icon name="language" size={17} />
      <select
        value={language}
        aria-label="Choose website language"
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="en">English</option>
        <option value="ur">اردو</option>
        <option value="roman">Roman Urdu</option>
      </select>
    </label>
  );
}

type IconName =
  | "arrow"
  | "bat"
  | "bell"
  | "bookmark"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "compass"
  | "download"
  | "filter"
  | "home"
  | "language"
  | "map"
  | "menu"
  | "message"
  | "pin"
  | "plus"
  | "qr"
  | "search"
  | "send"
  | "shield"
  | "smartphone"
  | "store"
  | "team"
  | "user";

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    bat: <><path d="m5 16 6-6" /><path d="m8 19-3-3-2 2 3 3 2-2Z" /><path d="m10 11 4-7 4 4-7 4" /><circle cx="19" cy="5" r="1.4" fill="currentColor" stroke="none" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
    filter: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><path d="M14 4v4M6 10v4M11 16v4" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    language: <><path d="M4 5h8M8 3v2c0 4-2 7-5 9M5 9c2 3 4 4 7 5" /><path d="m14 21 4-10 4 10M15.5 17h5" /></>,
    map: <><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15M16 6v15" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    message: <path d="M4 5h16v12H8l-4 4V5Z" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    qr: <><rect x="3" y="3" width="6" height="6" /><rect x="15" y="3" width="6" height="6" /><rect x="3" y="15" width="6" height="6" /><path d="M15 15h2v2h-2zM19 15h2v6h-2M15 19h2v2h-2" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    send: <><path d="m3 11 18-8-8 18-2-8-8-2Z" /><path d="m11 13 4-4" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.8 8.5 7 10 4.2-1.5 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    smartphone: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M10 18h4" /></>,
    store: <><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2Z" /></>,
    team: <><circle cx="12" cy="8" r="3" /><circle cx="5" cy="10" r="2" /><circle cx="19" cy="10" r="2" /><path d="M6 20v-1c0-3 2.7-5 6-5s6 2 6 5v1M2 19c0-2 1.3-3.5 3.2-4M22 19c0-2-1.3-3.5-3.2-4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="Loobay home">
      <Image src="/loobay-mark.svg" alt="" width={42} height={42} priority />
      {!compact && <span>Loobay</span>}
    </a>
  );
}

const coreFeatures = [
  { icon: "compass" as IconName, tone: "purple", title: "Find or host a game", copy: "Browse nearby games, search by area, filter the details, or post your own match with a time and place.", tags: ["Nearby", "Search & filters", "Host a game"] },
  { icon: "user" as IconName, tone: "blue", title: "Discover the right players", copy: "Search by name or username, see location, sport and skill level, then open a profile or start a conversation.", tags: ["Player search", "Skill level", "Direct message"] },
  { icon: "team" as IconName, tone: "green", title: "Build your team", copy: "Create a club, manage its roster, explore nearby squads and send a challenge when your side is ready.", tags: ["Team profiles", "Rosters", "Challenges"] },
  { icon: "send" as IconName, tone: "orange", title: "Recruit for every role", copy: "Publish an opening with the position, level and players needed, then keep track of each application.", tags: ["Open roles", "Applications", "Team needs"] },
  { icon: "store" as IconName, tone: "amber", title: "Buy and sell sports gear", copy: "Browse local equipment, search by item, brand or area, view it on the map and manage your own listings.", tags: ["Marketplace", "Map view", "My listings"] },
  { icon: "message" as IconName, tone: "pink", title: "Keep everyone connected", copy: "Use messages, challenge alerts and notifications to turn a plan into a game without losing the thread.", tags: ["Messages", "Alerts", "Challenge inbox"] },
];

const featureGroups = [
  { label: "Play & organize", items: ["Personalized home dashboard", "Nearby game feed", "Find nearby games", "Host or post a game", "Upcoming match card", "Joined and organized games", "Upcoming, past & cancelled tabs", "Match format and team type", "Date, time, venue and organizer", "Need-opponent status"] },
  { label: "Players & profiles", items: ["My profile and profile editing", "Player discovery", "Name & username search", "Player filters", "Direct player messaging", "Sport and skill level", "Primary sport", "Availability status", "Reliability, games & no-shows", "Unique Loobay ID & QR"] },
  { label: "Teams & competition", items: ["My team", "Create and manage teams", "Team inbox", "Search by club or area", "5–50 km distance filters", "Team identity, motto and level", "View team roster", "Send and manage challenges", "Recruitment posts by role", "Player count, skill & application status"] },
  { label: "Social, gear & support", items: ["Messages", "Notifications with unread count", "Sports marketplace", "Browse and My listings", "Search item, brand or area", "Marketplace filters", "Map-based discovery", "Sell a gear item", "Saved content", "English, Urdu & Roman Urdu"] },
];

function MiniNav({ active }: { active: "home" | "find" | "games" | "teams" }) {
  const items: { icon: IconName; label: string; id: typeof active }[] = [
    { icon: "home", label: "Home", id: "home" }, { icon: "compass", label: "Find", id: "find" },
    { icon: "calendar", label: "My games", id: "games" }, { icon: "team", label: "Teams", id: "teams" },
  ];
  return (
    <Localized>
      <div className="mini-nav">
        {items.map((item) => <div className={item.id === active ? "mini-nav-item active" : "mini-nav-item"} key={item.id}><Icon name={item.icon} size={18} /><span>{item.label}</span></div>)}
        <div className="mini-nav-item"><Icon name="menu" size={18} /><span>Menu</span></div>
      </div>
    </Localized>
  );
}

function HomePhone() {
  return (
    <Localized><div className="phone phone-home" aria-label="Loobay home screen preview">
      <div className="phone-speaker" />
      <div className="phone-screen">
        <div className="phone-status"><span>9:41</span><span>● ● ▰</span></div>
        <div className="phone-greeting">
          <div className="avatar avatar-photo">P</div>
          <div><strong>Hi, Player!</strong><span><Icon name="pin" size={12} /> Nearby area · Demo</span></div>
          <div className="phone-bell"><Icon name="bell" size={19} /><b>3</b></div>
        </div>
        <div className="upcoming-card">
          <div className="upcoming-top"><span><Icon name="bat" size={13} /> Upcoming match</span><b>Sun, 23 Aug</b></div>
          <strong>T5 Match</strong><p><Icon name="pin" size={15} /> Local Sports Ground</p>
        </div>
        <div className="quick-actions">
          <div><span className="quick-icon lilac"><Icon name="bat" size={20} /></span><b>Find games</b></div>
          <div><span className="quick-icon mint"><Icon name="plus" size={20} /></span><b>Host game</b></div>
          <div><span className="quick-icon blue"><Icon name="team" size={20} /></span><b>Teams</b></div>
          <div><span className="quick-icon sand"><Icon name="store" size={20} /></span><b>Gear</b></div>
        </div>
        <div className="nearby-head"><strong>Near you</strong><span>See all</span></div>
        <div className="nearby-empty"><span className="empty-icon"><Icon name="bat" size={25} /></span><b>Your next game is nearby</b><p>Find players and get on the field.</p><button type="button">Find a game</button></div>
        <MiniNav active="home" />
      </div>
    </div></Localized>
  );
}

function PlayerCard({ initial, name, handle, color }: { initial: string; name: string; handle: string; color: string }) {
  return <Localized><div className="player-row"><span className="player-avatar" style={{ background: color }}>{initial}</span><div><strong>{name}</strong><span>@{handle} · 3 km away</span><small>Cricket · Intermediate</small></div><Icon name="message" size={21} /><Icon name="chevron" size={18} /></div></Localized>;
}

function AppPreview() {
  const [tab, setTab] = useState<"players" | "teams">("players");
  return (
    <Localized><div className="network-demo" data-reveal="right">
      <div className="demo-toolbar"><div><span className="eyebrow">THE LOCAL NETWORK</span><h3>{tab === "players" ? "Discover players" : "Nearby teams"}</h3></div><div className="segmented" role="tablist" aria-label="Preview type"><button type="button" role="tab" aria-selected={tab === "players"} className={tab === "players" ? "active" : ""} onClick={() => setTab("players")}>Players</button><button type="button" role="tab" aria-selected={tab === "teams"} className={tab === "teams" ? "active" : ""} onClick={() => setTab("teams")}>Teams</button></div></div>
      <div className="demo-search"><Icon name="search" size={20} /><span>Search {tab === "players" ? "name or username" : "club or area"}</span><button type="button" aria-label="Open filters"><Icon name="filter" size={20} /></button></div>
      {tab === "players" ? <div className="player-list"><PlayerCard initial="A" name="Demo Player A" handle="player01" color="#f2e2ff" /><PlayerCard initial="B" name="Demo Player B" handle="player02" color="#5924c9" /><PlayerCard initial="C" name="Demo Player C" handle="player03" color="#e9eef5" /></div> : (
        <div className="team-list">{["Northside Strikers", "City Sports Club"].map((team) => <div className="team-row" key={team}><div className="team-line"><span>{team.charAt(0)}</span><div><strong>{team}</strong><small><Icon name="pin" size={13} /> Nearby area · 2 km away</small></div></div><p>PLAY · CONNECT · GROW</p><div className="team-tags"><span><Icon name="bat" size={13} /> Cricket</span><span>Intermediate</span></div><div className="team-buttons"><button type="button">View roster</button><button type="button"><Icon name="bat" size={15} /> Send challenge</button></div></div>)}</div>
      )}
    </div></Localized>
  );
}

function GamesPanel() {
  const [active, setActive] = useState("Upcoming");
  return (
    <Localized><div className="games-panel" data-reveal="fade"><span className="eyebrow">YOUR ACTIVITY</span><h3>My games</h3><p>Everything you have joined or organized.</p><div className="game-tabs" role="tablist">{["Upcoming", "Past", "Cancelled"].map((item) => <button type="button" role="tab" aria-selected={active === item} className={active === item ? "active" : ""} onClick={() => setActive(item)} key={item}>{item}</button>)}</div>
      {active === "Upcoming" ? <div className="match-card" key={active}><div className="match-tags"><span><Icon name="bat" size={13} /> T5</span><span><Icon name="team" size={13} /> Team match</span></div><strong>Need opponent</strong><p><Icon name="calendar" size={16} /> Tomorrow · 4:11 PM</p><p><Icon name="pin" size={16} /> Local Sports Ground · Nearby area</p><div><span className="tiny-avatar">D</span><span>Demo Captain</span><button type="button">View <Icon name="chevron" size={14} /></button></div></div> : <div className="tab-empty" key={active}><span><Icon name={active === "Past" ? "clock" : "calendar"} size={25} /></span><strong>No {active.toLowerCase()} games</strong><p>Your game history stays organized here.</p></div>}
    </div></Localized>
  );
}

function GearPanel() {
  return (
    <Localized><div className="gear-panel" data-reveal="right"><div className="gear-title"><div><span className="eyebrow">SPORTS GEAR</span><h3>Sports market</h3><p>Bats, balls, pads — buy or sell near you.</p></div><span><Icon name="map" size={25} /></span></div><div className="gear-search"><Icon name="search" size={20} /><span>Search item, brand or area...</span><button type="button" aria-label="Filter marketplace"><Icon name="filter" size={19} /></button></div><div className="gear-tabs"><strong>Browse</strong><span>My listings</span></div>
      <div className="gear-cards" data-reveal-group="rise">
        <article><div className="gear-illustration"><Image src="/market-cricket.jpg" alt="Cricket bat, ball and wickets used for a fictional marketplace listing" fill sizes="(max-width: 700px) 100vw, 220px" /></div><span>CRICKET · DEMO</span><strong>Pre-owned cricket set</strong><p>Nearby area · 4 km</p><b>Rs. 8,500</b></article>
        <article><div className="gear-illustration"><Image src="/market-football.jpg" alt="Football used for a fictional marketplace listing" fill sizes="(max-width: 700px) 100vw, 220px" /></div><span>FOOTBALL · DEMO</span><strong>Training football</strong><p>Nearby area · 7 km</p><b>Rs. 2,200</b></article>
        <article><div className="gear-illustration"><Image src="/market-badminton.jpg" alt="Badminton racket and shuttlecock used for a fictional marketplace listing" fill sizes="(max-width: 700px) 100vw, 220px" /></div><span>BADMINTON · DEMO</span><strong>Racket & shuttle</strong><p>Nearby area · 5 km</p><b>Rs. 3,400</b></article>
      </div><button className="sell-button" type="button"><Icon name="plus" size={18} /> Sell an item</button>
    </div></Localized>
  );
}

function FeatureCard({ feature, index }: { feature: typeof coreFeatures[number]; index: number }) {
  return <Localized><article className={`feature-card feature-${feature.tone}`}><div className="feature-index">0{index + 1}</div><span className="feature-icon"><Icon name={feature.icon} size={25} /></span><h3>{feature.title}</h3><p>{feature.copy}</p><div className="feature-tags">{feature.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article></Localized>;
}

type DownloadStats = {
  downloads: { total: number; android: number; ios: number };
  availability: { android: boolean; ios: boolean };
};

function DownloadSection() {
  const [stats, setStats] = useState<DownloadStats>({
    downloads: { total: 0, android: 0, ios: 0 },
    availability: { android: true, ios: false },
  });
  const [loading, setLoading] = useState(true);
  const [activeDownload, setActiveDownload] = useState<"android" | "ios" | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/downloads", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: DownloadStats) => {
        if (active && data.downloads && data.availability) setStats(data);
      })
      .catch(() => {
        if (active) setDownloadMessage("Download status is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function startDownload(platform: "android" | "ios") {
    if (!stats.availability[platform]) return;
    setActiveDownload(platform);
    setDownloadMessage("");
    try {
      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await response.json() as { ok?: boolean; tracked?: boolean; count?: number; total?: number; url?: string; message?: string };
      if (!response.ok || !data.ok || !data.url) throw new Error(data.message || "The download could not start.");
      if (typeof data.count === "number" && typeof data.total === "number") {
        setStats((current) => ({
          ...current,
          downloads: {
            ...current.downloads,
            [platform]: data.count as number,
            total: data.total as number,
          },
        }));
      }
      setDownloadMessage("Your official Loobay download is starting.");
      window.setTimeout(() => window.location.assign(data.url as string), 350);
    } catch (error) {
      setDownloadMessage(error instanceof Error ? error.message : "The download could not start.");
    } finally {
      setActiveDownload(null);
    }
  }

  return (
    <Localized>
      <section className="download-section section-shell" id="access">
        <div className="download-intro" data-reveal="left">
          <span className="eyebrow">GET LOOBAY</span>
          <h2>Take your local sports network with you.</h2>
          <p>Use the official release links below. A download is counted only when a real Android or iOS destination has been connected.</p>
          <div className="download-total"><span><Icon name="download" size={21} /></span><div><strong>{loading ? "—" : stats.downloads.total.toLocaleString()}</strong><small>Official downloads started</small></div></div>
        </div>
        <div className="download-options" data-reveal-group="rise">
          <article className={stats.availability.android ? "download-card available" : "download-card"}>
            <div className="platform-icon android-icon"><Icon name="smartphone" size={27} /></div>
            <div className="platform-copy"><small>ANDROID</small><strong>Download the app</strong><span>{stats.downloads.android.toLocaleString()} downloads</span></div>
            <button type="button" disabled={loading || !stats.availability.android || activeDownload !== null} onClick={() => startDownload("android")}><Icon name="download" size={17} />{activeDownload === "android" ? "Starting..." : stats.availability.android ? "Download Android" : "Android build coming soon"}</button>
          </article>
          <article className={stats.availability.ios ? "download-card available" : "download-card"}>
            <div className="platform-icon ios-icon"><Icon name="smartphone" size={27} /></div>
            <div className="platform-copy"><small>IPHONE & IPAD</small><strong>Open the App Store</strong><span>{stats.downloads.ios.toLocaleString()} downloads</span></div>
            <button type="button" disabled={loading || !stats.availability.ios || activeDownload !== null} onClick={() => startDownload("ios")}><Icon name="download" size={17} />{activeDownload === "ios" ? "Opening..." : stats.availability.ios ? "Download on iOS" : "iOS link coming soon"}</button>
          </article>
          {downloadMessage && <p className="download-message" role="status">{downloadMessage}</p>}
          <p className="release-safety"><Icon name="shield" size={15} />Only official Loobay release links are used. No unrelated app build is offered.</p>
        </div>
      </section>
    </Localized>
  );
}

function IssueSection() {
  const { language } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  async function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setReference(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      consent: formData.get("consent") === "yes",
    };
    const toastId = toast.loading(translate(language, "Sending your issue..."), {
      dismissible: false,
      duration: Infinity,
    });
    let failureMessage = translate(language, "Your report could not be submitted.");

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null) as {
        ok?: boolean;
        reference?: string;
        message?: string;
      } | null;

      if (!response.ok || !data?.ok || !data.reference) {
        failureMessage = translate(
          language,
          data?.message || "Your report could not be submitted.",
        );
        throw new Error(failureMessage);
      }

      form.reset();
      setReference(data.reference);
      toast.success(translate(language, "Issue submitted"), {
        id: toastId,
        closeButton: true,
        dismissible: true,
        description: (
          <span className="toast-reference">
            {translate(language, "Reference:")} <strong>{data.reference}</strong>
          </span>
        ),
        duration: 8_000,
      });
    } catch {
      toast.error(translate(language, "Couldn’t submit issue"), {
        id: toastId,
        closeButton: true,
        dismissible: true,
        description: failureMessage,
        duration: 10_000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Localized>
      <section className="support-section section-shell" id="support">
        <div className="support-copy" data-reveal="left"><span className="eyebrow">REAL SUPPORT FOR REAL PLAYERS</span><h2>Found an issue?<br />Tell the Loobay team.</h2><p>Report a bug, account problem, game or team issue, marketplace concern, or anything else that gets in the way of playing.</p><div className="support-promises" data-reveal-group="rise"><div><span><Icon name="shield" size={18} /></span><p><strong>Private by default</strong>Your report is stored for support follow-up and is never displayed publicly.</p></div><div><span><Icon name="message" size={18} /></span><p><strong>Easy to track</strong>Every accepted report receives a unique reference number.</p></div></div></div>
        <form className="issue-form" data-reveal="right" aria-busy={submitting} onSubmit={submitIssue}>
          <div className="form-heading"><span><Icon name="message" size={19} /></span><div><strong>Submit an issue</strong><small>Fields marked * are required</small></div></div>
          <div className="form-row"><label><span>Name <small>(optional)</small></span><input name="name" type="text" maxLength={80} autoComplete="name" placeholder="Your name" /></label><label><span>Email *</span><input name="email" type="email" maxLength={160} autoComplete="email" placeholder="you@example.com" required /></label></div>
          <label><span>Issue category *</span><select name="category" defaultValue="" required><option value="" disabled>Select a category</option><option value="bug">App bug</option><option value="account">Account or profile</option><option value="download">App download</option><option value="game">Game or match</option><option value="team">Team or recruitment</option><option value="marketplace">Marketplace</option><option value="safety">Safety or conduct</option><option value="privacy">Privacy</option><option value="feedback">Product feedback</option><option value="other">Other</option></select></label>
          <label><span>What happened? *</span><textarea name="message" minLength={10} maxLength={2000} rows={5} placeholder="Please explain the issue and what you expected to happen..." required /></label>
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree that Loobay may store these details to investigate and respond to my report. Please do not include passwords, payment data or other sensitive information.</span></label>
          <button className="issue-submit" type="submit" aria-busy={submitting} disabled={submitting}>{submitting ? "Submitting..." : "Submit issue"}<Icon name="send" size={17} /></button>
          {reference && <div className="issue-result success"><span><Icon name="check" size={16} /></span><div><strong>Reference: <b>{reference}</b></strong></div></div>}
        </form>
      </section>
    </Localized>
  );
}

const faqs = [
  ["Is Loobay only for cricket?", "No. The current version is focused on cricket, while the wider Loobay platform is designed to support multiple sports as it grows."],
  ["What is Loobay?", "Loobay is a local sports network that brings players, games, teams, challenges, conversations and nearby sports gear into one place."],
  ["Can I use Loobay without a team?", "Yes. Create a player profile, set your sport and skill level, then discover nearby games, players and teams as an individual."],
  ["How does team recruitment work?", "Teams can publish the role, level and number of players they need. Players can apply, and the recruitment post keeps the application status clear."],
  ["Can teams challenge one another?", "Yes. Browse nearby teams, review their roster and level, then send a challenge directly from the team experience."],
  ["Does Loobay include sports equipment?", "Yes. The sports marketplace lets people browse, search, filter, map, list and sell gear in their local area."],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return <Localized><div className="faq-list" data-reveal="right">{faqs.map(([question, answer], index) => <div className={open === index ? "faq-item open" : "faq-item"} key={question}><button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><span><Icon name="plus" size={20} /></span></button><div className="faq-answer"><p>{answer}</p></div></div>)}</div></Localized>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("loobay-language");
    if (savedLanguage === "en" || savedLanguage === "ur" || savedLanguage === "roman") {
      const timer = window.setTimeout(() => setLanguage(savedLanguage), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const isUrdu = language === "ur";
    document.documentElement.lang = language === "en" ? "en" : language === "ur" ? "ur" : "ur-Latn";
    document.documentElement.dir = isUrdu ? "rtl" : "ltr";
    window.localStorage.setItem("loobay-language", language);
  }, [language]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]"),
    );

    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  function closeMenu() { setMenuOpen(false); }

  return (
    <LocaleContext.Provider value={{ language, setLanguage }}>
    <Localized><main id="top" dir={language === "ur" ? "rtl" : "ltr"}>
      <header className={scrolled ? "site-header scrolled" : "site-header"}><div className="header-inner"><Logo /><nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Main navigation"><a href="#features" onClick={closeMenu}>Features</a><a href="#experience" onClick={closeMenu}>Experience</a><a href="#how" onClick={closeMenu}>How it works</a><a href="#all-features" onClick={closeMenu}>Everything inside</a><a href="#support" onClick={closeMenu}>Support</a></nav><LanguageSwitcher /><a className="header-cta" href="#access">Download <Icon name="download" size={17} /></a><button className="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button></div></header>

      <section className="hero section-shell">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-copy"><div className="hero-kicker"><span><Icon name="pin" size={14} /></span> Your local sports network</div><h1>Find your people.<br /><em>Play your game.</em></h1><p>Loobay puts nearby players, matches, teams and sports gear in one place—so less time is spent organizing and more time is spent playing.</p><div className="hero-actions"><a className="button button-primary" href="#access">Download Loobay <Icon name="download" size={18} /></a><a className="button button-secondary" href="#features"><span className="play-dot">▶</span> Explore Loobay</a></div><div className="hero-proof"><div className="avatar-stack"><span>P</span><span>C</span><span>T</span><span>+</span></div><p><strong>Built for the whole local game</strong><br />Players · Captains · Clubs</p></div></div>
        <div className="hero-visual"><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="float-card float-player"><span className="status-dot" /><div><small>PLAYER STATUS</small><strong>Available today</strong></div></div><div className="float-card float-match"><span><Icon name="bat" size={19} /></span><div><small>UP NEXT</small><strong>T5 Match · 4:11 PM</strong></div></div><div className="float-card float-team"><span><Icon name="team" size={19} /></span><div><strong>15 km</strong><small>Team radius</small></div></div><HomePhone /></div>
      </section>

      <section className="connection-strip" aria-label="Loobay capabilities"><div><span><Icon name="bat" size={17} /> Find games</span><i>✦</i><span><Icon name="team" size={17} /> Build teams</span><i>✦</i><span><Icon name="message" size={17} /> Meet players</span><i>✦</i><span><Icon name="store" size={17} /> Trade gear</span><i>✦</i><span><Icon name="send" size={17} /> Send challenges</span></div></section>

      <section className="why-section section-shell"><div className="why-label" data-reveal="left"><span>WHY LOOBAY</span><div /></div><div className="why-copy" data-reveal="up"><h2>The group chat was never<br />a sports platform.</h2><p>Games get buried, teams lose track, and the right player is always in another chat. Loobay gives your local sports community one shared place to move from “who’s in?” to kickoff.</p></div><div className="why-stats" data-reveal-group="rise"><div><strong>01</strong><span>Place for your entire sports life</span></div><div><strong>04</strong><span>Ways to connect: games, players, teams & gear</span></div><div><strong>∞</strong><span>More reasons to get out and play</span></div></div></section>

      <section className="sport-scope section-shell" data-reveal-group="rise">
        <div className="scope-badge"><span><Icon name="bat" size={19} /></span><div><small>CURRENT RELEASE</small><strong>Cricket focused</strong></div></div>
        <div className="scope-copy"><span className="eyebrow">THE BIGGER LOOBAY VISION</span><h2>Cricket-first today.<br /><em>Multi-sport by design.</em></h2><p>This current version of Loobay is built around cricket. The platform itself is not limited to one sport—it is designed to bring the same games, players, teams, recruitment, messaging and marketplace experience to multiple sports as Loobay grows.</p></div>
        <div className="scope-path"><div><span>NOW</span><strong>Cricket</strong><small>The focus of this release</small></div><i><Icon name="arrow" size={20} /></i><div><span>VISION</span><strong>Multiple sports</strong><small>One connected local platform</small></div></div>
      </section>

      <section className="features-section" id="features"><div className="section-shell"><div className="section-heading centered" data-reveal="up"><span className="eyebrow">EVERYTHING A GAME NEEDS</span><h2>One app. Every side of sport.</h2><p>From the first search to the final score—and the people and gear in between.</p></div><div className="feature-grid" data-reveal-group="fade">{coreFeatures.map((feature, index) => <FeatureCard feature={feature} index={index} key={feature.title} />)}</div></div></section>

      <section className="experience-section section-shell" id="experience"><div className="experience-copy" data-reveal="left"><span className="eyebrow">YOUR SPORTS CIRCLE, WIDENED</span><h2>Good games start with the right people.</h2><p>See who plays what, where they are, and the level they play at. Profile signals such as availability, reliability and no-shows help everyone arrive with clearer expectations.</p><ul className="check-list" data-reveal-group="rise"><li><span><Icon name="check" size={15} /></span> Search by name or username</li><li><span><Icon name="check" size={15} /></span> View sport, level and location</li><li><span><Icon name="check" size={15} /></span> Message a player directly</li><li><span><Icon name="check" size={15} /></span> Share a QR or unique Loobay ID</li></ul></div><AppPreview /></section>

      <section className="organize-section"><div className="section-shell organize-inner"><GamesPanel /><div className="organize-copy" data-reveal="right"><span className="eyebrow">FROM PLAN TO PLAY</span><h2>Your fixtures, finally organized.</h2><p>Whether you joined it or organized it, every game has a home. Check the next match at a glance and keep upcoming, past and cancelled fixtures neatly separated.</p><div className="organize-points" data-reveal-group="rise"><div><span><Icon name="calendar" size={20} /></span><div><strong>Every game in one timeline</strong><p>Date, time, format, host and location stay together.</p></div></div><div><span><Icon name="bookmark" size={20} /></span><div><strong>Save what matters</strong><p>Keep interesting games, teams and listings close.</p></div></div><div><span><Icon name="bell" size={20} /></span><div><strong>Stay ahead of the start</strong><p>Upcoming match cards and notifications keep plans visible.</p></div></div></div></div></div></section>

      <section className="market-section section-shell"><div className="market-copy" data-reveal="left"><span className="eyebrow">THE KIT HAS A SECOND INNINGS</span><h2>Local gear for the local game.</h2><p>Find the equipment you need nearby or put unused kit back into play. Search by item, brand or area, switch to the map, apply filters and manage every listing.</p><div className="market-actions" data-reveal-group="rise"><span>Browse</span><span>Search</span><span>Map</span><span>Sell</span></div></div><GearPanel /></section>

      <section className="how-section" id="how"><div className="section-shell"><div className="section-heading split-heading" data-reveal="up"><div><span className="eyebrow">HOW IT WORKS</span><h2>From profile to play<br />in four simple moves.</h2></div><p>Loobay keeps the path short, whether you are looking for a casual game or building a regular team.</p></div><div className="steps-grid" data-reveal-group="rise"><article><span>01</span><div className="step-icon"><Icon name="user" size={25} /></div><h3>Set your player profile</h3><p>Add your location, sport, ability and availability. Your Loobay ID makes the profile easy to share.</p></article><article><span>02</span><div className="step-icon"><Icon name="compass" size={25} /></div><h3>Explore what is nearby</h3><p>Search games, people and clubs, then tune results with area, distance and other filters.</p></article><article><span>03</span><div className="step-icon"><Icon name="send" size={25} /></div><h3>Join, host or challenge</h3><p>Enter a game, post your own, recruit the missing role or invite another team to compete.</p></article><article><span>04</span><div className="step-icon"><Icon name="bat" size={25} /></div><h3>Turn up and play</h3><p>Keep the details in My games, stay connected through messages and build your local reputation.</p></article></div></div></section>

      <section className="all-features section-shell" id="all-features"><div className="section-heading centered" data-reveal="up"><span className="eyebrow">NOTHING LEFT ON THE BENCH</span><h2>Everything inside Loobay.</h2><p>A complete view of the tools shown across the app.</p></div><div className="demo-notice" data-reveal="up"><span><Icon name="shield" size={17} /></span><p>All profiles, names, handles, IDs, locations, matches and listings shown on this website are fictional temporary examples.</p></div><div className="feature-directory" data-reveal-group="rise">{featureGroups.map((group, groupIndex) => <article key={group.label}><div className="directory-title"><span>0{groupIndex + 1}</span><h3>{group.label}</h3></div><ul>{group.items.map((item) => <li key={item}><span><Icon name="check" size={13} /></span>{item}</li>)}</ul></article>)}</div></section>

      <section className="trust-section"><div className="section-shell trust-inner"><div className="trust-copy" data-reveal="left"><span className="eyebrow">PLAY WITH MORE CONTEXT</span><h2>A profile that says more than a name.</h2><p>Loobay profiles bring the useful details to the surface: where someone plays, their primary sport and level, whether they are available, and their participation record.</p></div><div className="profile-card" data-reveal="right"><div className="demo-label"><Icon name="shield" size={13} /> Fictional demo profile</div><div className="profile-top"><span className="profile-avatar">P</span><div><strong>Demo Player</strong><span>@player_demo</span></div><Icon name="qr" size={27} /></div><div className="loobay-id"><Icon name="bookmark" size={18} /> Loobay ID DEMO-2048</div><p><Icon name="pin" size={15} /> Nearby area · Approximate</p><div className="available"><i /> Available today</div><div className="profile-stats"><div><strong>100%</strong><span>Reliable</span></div><div><strong>12</strong><span>Games</span></div><div><strong>0</strong><span>No-shows</span></div></div><div className="profile-sport"><span><Icon name="bat" size={21} /></span><div><strong>Cricket</strong><small>Intermediate · Primary sport</small></div></div></div></div></section>

      <DownloadSection />

      <IssueSection />

      <section className="faq-section section-shell"><div className="faq-heading" data-reveal="left"><span className="eyebrow">QUICK ANSWERS</span><h2>Before you step onto the field.</h2><p>What players and teams need to know about the Loobay experience.</p></div><FAQ /></section>

      <footer className="site-footer"><div className="section-shell footer-grid"><div><Logo /><p>One local sports network for players, games, teams and gear.</p><span>Where sports connect.</span></div><div><strong>Explore</strong><a href="#features">Features</a><a href="#experience">Players & teams</a><a href="#how">How it works</a><a href="#all-features">Everything inside</a></div><div><strong>In the app</strong><a href="#experience">Discover players</a><a href="#experience">Nearby teams</a><a href="#experience">My games</a><a href="#experience">Sports market</a></div><div><strong>Stay connected</strong><a href="#access">Download Loobay</a><a href="#support">Submit an issue</a><span className="placeholder-contact">Contact details coming soon</span></div></div><div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} Loobay. All rights reserved.</span><span>Made for the love of the game.</span></div></footer>
    </main></Localized>
    <Toaster
      className="loobay-toaster"
      position={language === "ur" ? "top-left" : "top-right"}
      offset={language === "ur" ? { top: 98, left: 24 } : { top: 98, right: 24 }}
      mobileOffset={language === "ur" ? { top: 84, left: 16 } : { top: 84, right: 16 }}
      dir={language === "ur" ? "rtl" : "ltr"}
      theme="light"
      richColors
      gap={10}
      visibleToasts={2}
      containerAriaLabel={translate(language, "Notifications")}
      toastOptions={{
        closeButtonAriaLabel: translate(language, "Dismiss notification"),
        classNames: {
          toast: "loobay-toast",
          title: "loobay-toast-title",
          description: "loobay-toast-description",
          closeButton: "loobay-toast-close",
        },
      }}
    />
    </LocaleContext.Provider>
  );
}

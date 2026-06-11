interface TabItem {
  id: string;
  label: string;
}

interface NewsTabsProps {
  activeTab: string | null;
  onTabChange: (tabId: string) => void;
}

const CATEGORY_TABS: TabItem[] = [
  { id: "indian-market", label: "Indian Stock Market" },
  { id: "ipo", label: "Indian IPOs" },
  { id: "global", label: "Global Markets" },
  { id: "earnings", label: "Earnings India" },
];

export function NewsTabs({ activeTab, onTabChange }: NewsTabsProps) {
  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-1.5 p-1.5 rounded-2xl border border-white/10 bg-slate-950/65 backdrop-blur-xl shadow-inner">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 via-emerald-600/25 to-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-md"
                  : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default NewsTabs;

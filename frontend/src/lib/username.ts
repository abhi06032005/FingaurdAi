const ADJECTIVES = [
  "Bullish", "Bearish", "Golden", "Shadow", "Alpha", "Apex", "Nifty", "Quantum",
  "Rogue", "Delta", "Slick", "Wise", "Dynamic", "Prudent", "Stealth", "Turbo",
  "Chart", "Market", "Profit", "Option"
];

const NOUNS = [
  "Bull", "Bear", "Scalper", "Whale", "Trader", "Stalker", "Hunter", "Oracle",
  "Analyst", "Sniper", "Hustler", "Wizard", "Broker", "Shark", "Wolf", "Rider",
  "Ninja", "Maven", "Guru", "Pathfinder"
];

export function generateRandomUsername(isGuest: boolean = false): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100 to 999
  
  if (isGuest) {
    return `Guest_${adj}${noun}_${num}`;
  }
  return `${adj}${noun}_${num}`;
}

export function getOrSetUsername(userId: string | null | undefined): string {
  if (typeof window === "undefined") return "Anonymous";

  if (userId) {
    const key = `finguard_username_${userId}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const newUsername = generateRandomUsername(false);
    localStorage.setItem(key, newUsername);
    localStorage.setItem("finguard_active_username", newUsername);
    return newUsername;
  } else {
    const key = "finguard_guest_username";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const newUsername = generateRandomUsername(true);
    localStorage.setItem(key, newUsername);
    localStorage.setItem("finguard_active_username", newUsername);
    return newUsername;
  }
}

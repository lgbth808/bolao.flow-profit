export const BRAZIL_FLAG = "🇧🇷";
export const DEFAULT_OPPONENT_FLAG = "🏁";

export function normalizeFlagKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export const WORLD_CUP_2026_TEAMS = [
  { name: "África do Sul", flag: "🇿🇦", aliases: ["Africa do Sul", "South Africa"] },
  { name: "Alemanha", flag: "🇩🇪", aliases: ["Germany"] },
  { name: "Argélia", flag: "🇩🇿", aliases: ["Algeria"] },
  { name: "Arábia Saudita", flag: "🇸🇦", aliases: ["Arabia Saudita", "Saudi Arabia"] },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Austrália", flag: "🇦🇺", aliases: ["Australia"] },
  { name: "Áustria", flag: "🇦🇹", aliases: ["Austria"] },
  { name: "Bélgica", flag: "🇧🇪", aliases: ["Belgica", "Belgium"] },
  {
    name: "Bósnia e Herzegovina",
    flag: "🇧🇦",
    aliases: ["Bosnia", "Bosnia e Herzegovina", "Bosnia and Herzegovina"]
  },
  { name: "Brasil", flag: BRAZIL_FLAG, aliases: ["Brazil"] },
  { name: "Cabo Verde", flag: "🇨🇻", aliases: ["Cape Verde"] },
  { name: "Canadá", flag: "🇨🇦", aliases: ["Canada"] },
  { name: "Colômbia", flag: "🇨🇴", aliases: ["Colombia"] },
  { name: "Coreia do Sul", flag: "🇰🇷", aliases: ["Coreia", "South Korea"] },
  { name: "Costa Rica", flag: "🇨🇷" },
  {
    name: "Costa do Marfim",
    flag: "🇨🇮",
    aliases: ["Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"]
  },
  { name: "Croácia", flag: "🇭🇷", aliases: ["Croacia", "Croatia"] },
  { name: "Curaçao", flag: "🇨🇼", aliases: ["Curacao"] },
  { name: "Egito", flag: "🇪🇬", aliases: ["Egypt"] },
  { name: "Equador", flag: "🇪🇨", aliases: ["Ecuador"] },
  { name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", aliases: ["Escocia", "Scotland"] },
  { name: "Espanha", flag: "🇪🇸", aliases: ["Spain"] },
  { name: "Estados Unidos", flag: "🇺🇸", aliases: ["EUA", "USA", "United States"] },
  { name: "França", flag: "🇫🇷", aliases: ["Franca", "France"] },
  { name: "Gana", flag: "🇬🇭", aliases: ["Ghana"] },
  { name: "Haiti", flag: "🇭🇹" },
  { name: "Holanda", flag: "🇳🇱", aliases: ["Países Baixos", "Paises Baixos", "Netherlands"] },
  { name: "Inglaterra", flag: "🏴", aliases: ["England"] },
  { name: "Irã", flag: "🇮🇷", aliases: ["Ira", "Iran"] },
  { name: "Jamaica", flag: "🇯🇲" },
  { name: "Japão", flag: "🇯🇵", aliases: ["Japao", "Japan"] },
  { name: "Jordânia", flag: "🇯🇴", aliases: ["Jordania", "Jordan"] },
  { name: "Marrocos", flag: "🇲🇦", aliases: ["Morocco"] },
  { name: "México", flag: "🇲🇽", aliases: ["Mexico"] },
  { name: "Noruega", flag: "🇳🇴", aliases: ["Noroega", "Norway"] },
  { name: "Nova Zelândia", flag: "🇳🇿", aliases: ["Nova Zelandia", "New Zealand"] },
  { name: "Panamá", flag: "🇵🇦", aliases: ["Panama"] },
  { name: "Paraguai", flag: "🇵🇾", aliases: ["Paraguay"] },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Qatar", flag: "🇶🇦", aliases: ["Catar"] },
  {
    name: "RD Congo",
    flag: "🇨🇩",
    aliases: ["DR Congo", "Congo DR", "República Democrática do Congo"]
  },
  { name: "República Tcheca", flag: "🇨🇿", aliases: ["Republica Tcheca", "Tchéquia", "Czech Republic"] },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Suíça", flag: "🇨🇭", aliases: ["Suica", "Switzerland"] },
  { name: "Tunísia", flag: "🇹🇳", aliases: ["Tunisia"] },
  { name: "Turquia", flag: "🇹🇷", aliases: ["Turkey"] },
  { name: "Uruguai", flag: "🇺🇾", aliases: ["Uruguay"] },
  { name: "Uzbequistão", flag: "🇺🇿", aliases: ["Uzbequistao", "Uzbekistan"] }
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const EXTRA_OPPONENT_FLAGS: Record<string, string> = {
  africa: "🇿🇦",
  bolivia: "🇧🇴",
  chile: "🇨🇱",
  costa: "🇨🇷",
  dinamarca: "🇩🇰",
  estados: "🇺🇸",
  italia: "🇮🇹",
  nigeria: "🇳🇬",
  peru: "🇵🇪",
  servia: "🇷🇸",
  venezuela: "🇻🇪"
};

const OPPONENT_FLAGS: Record<string, string> = {
  ...Object.fromEntries(
    WORLD_CUP_2026_TEAMS.flatMap((team) =>
      [team.name, ...(team.aliases ?? [])].map((name) => [
        normalizeFlagKey(name),
        team.flag
      ])
    )
  ),
  ...EXTRA_OPPONENT_FLAGS
};

export function getOpponentFlag(opponent?: string) {
  if (!opponent) {
    return DEFAULT_OPPONENT_FLAG;
  }

  const normalized = normalizeFlagKey(opponent);
  const exactFlag = OPPONENT_FLAGS[normalized];

  if (exactFlag) {
    return exactFlag;
  }

  const matchedKey = Object.keys(OPPONENT_FLAGS).find((key) =>
    normalized.includes(key)
  );

  return matchedKey ? OPPONENT_FLAGS[matchedKey] : DEFAULT_OPPONENT_FLAG;
}

/* Original illustrations for speaking tasks 3, 4 and 8 (static SVG markup, no user input). */
import { SCENES_A, SCENE_ALT_A } from "./scenes-extra-a";
import { SCENES_B, SCENE_ALT_B } from "./scenes-extra-b";
function person(x: number, y: number, shirt: string, o: { skin?: string; scale?: number; armL?: number[]; armR?: number[]; hair?: string; step?: boolean } = {}): string {
 const skin = o.skin || "#E8B48C", s = o.scale || 1;
 return `<g transform="translate(${x} ${y}) scale(${s})">
  <line x1="-7" y1="40" x2="-9" y2="70" stroke="#2D3A5C" stroke-width="7" stroke-linecap="round"/><line x1="7" y1="40" x2="${o.step ? 16 : 9}" y2="70" stroke="#2D3A5C" stroke-width="7" stroke-linecap="round"/>
  <rect x="-15" y="0" width="30" height="44" rx="11" fill="${shirt}"/>
  <line x1="-13" y1="8" x2="${o.armL ? o.armL[0] : -22}" y2="${o.armL ? o.armL[1] : 34}" stroke="${shirt}" stroke-width="7" stroke-linecap="round"/>
  <line x1="13" y1="8" x2="${o.armR ? o.armR[0] : 22}" y2="${o.armR ? o.armR[1] : 34}" stroke="${shirt}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="0" cy="-12" r="12" fill="${skin}"/>${o.hair ? `<path d="M-12 -14 a12 12 0 0 1 24 0 q-12 -6 -24 0z" fill="${o.hair}"/>` : ""}
 </g>`;
}
export function sceneSvg(name: string): string {
 if (name === "market") return `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AA7BF"/><stop offset="1" stop-color="#D9DFEA"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#sky)"/>
  <g fill="#6F7C96"><ellipse cx="470" cy="40" rx="120" ry="34"/><ellipse cx="580" cy="56" rx="90" ry="30"/><ellipse cx="380" cy="30" rx="70" ry="22"/></g>
  <g stroke="#7486A8" stroke-width="2" stroke-linecap="round">${Array.from({ length: 26 }, (_, i) => { const x = 360 + (i * 37) % 280, y = 70 + (i * 53) % 170; return `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 16}"/>`; }).join("")}</g>
  <rect y="240" width="640" height="140" fill="#93BF7F"/><path d="M0 300 Q320 270 640 300 L640 380 L0 380Z" fill="#E6D8BC"/>
  <g transform="translate(20 150)"><rect x="18" y="20" width="6" height="90" fill="#7A5634"/><rect x="0" y="0" width="92" height="32" rx="6" fill="#3B5BA9"/><text x="46" y="21" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#fff">MARKET</text></g>
  <g transform="translate(120 150)"><rect x="0" y="60" width="150" height="40" fill="#B07A4A"/><rect x="4" y="30" width="5" height="70" fill="#5A4030"/><rect x="141" y="30" width="5" height="70" fill="#5A4030"/>
   <path d="M-6 30 L156 30 L146 6 L4 6Z" fill="#E24B4B"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${12 + i * 30} 30 L${27 + i * 30} 30 L${24 + i * 28} 6 L${12 + i * 28} 6Z" fill="#fff"/>`).join("")}
   ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${18 + i * 22}" cy="56" r="8" fill="${i % 2 ? "#F2A03D" : "#D73A3A"}"/>`).join("")}</g>
  <g transform="translate(330 150) rotate(-14 75 30)"><path d="M-6 30 L156 30 L146 6 L4 6Z" fill="#2F8F9D"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${12 + i * 30} 30 L${27 + i * 30} 30 L${24 + i * 28} 6 L${12 + i * 28} 6Z" fill="#F4F1E6"/>`).join("")}</g>
  <g transform="translate(330 150)"><rect x="0" y="62" width="150" height="38" fill="#B07A4A"/><rect x="141" y="22" width="5" height="78" fill="#5A4030"/><rect x="10" y="40" width="5" height="62" fill="#5A4030" transform="rotate(-25 12 100)"/>
   ${[0, 1, 2, 3].map(i => `<ellipse cx="${30 + i * 30}" cy="56" rx="13" ry="7" fill="#D9A55A"/>`).join("")}</g>
  ${person(330, 178, "#6B4EF0", { armL: [-34, -6], armR: [-26, -2], hair: "#3A2A1E" })}
  <g transform="translate(520 196)">${[0, 1, 2].map(i => `<rect x="${i * 30}" y="20" width="22" height="26" rx="3" fill="#596A8C"/><circle cx="${11 + i * 30}" cy="10" r="10" fill="${["#F06292", "#FFD54F", "#BA68C8"][i]}"/><circle cx="${4 + i * 30}" cy="16" r="7" fill="${["#EC407A", "#FFCA28", "#AB47BC"][i]}"/>`).join("")}</g>
  ${person(560, 250, "#2F6BFF", { armR: [30, -10], armL: [-8, 20], skin: "#C98E64", hair: "#1E1A17" })}
  <g transform="translate(588 218)"><line x1="0" y1="0" x2="10" y2="-40" stroke="#333" stroke-width="3"/><path d="M-26 -36 Q10 -76 46 -44 Z" fill="#1F2A44"/></g>
  ${person(250, 262, "#F2A03D", { scale: .75, armR: [14, -38], armL: [-14, 20], hair: "#8A5A2B" })}
  <g>${([[260, 120, "#E53935"], [290, 96, "#43A047"], [236, 104, "#1E88E5"]] as [number, number, string][]).map(([x, y, c]) => `<path d="M${x} ${y + 26} Q${x - 8} ${y + 70} ${263} 228" stroke="#555" stroke-width="1.2" fill="none"/><ellipse cx="${x}" cy="${y}" rx="15" ry="19" fill="${c}"/>`).join("")}</g>
  <g transform="translate(110 318)"><ellipse cx="0" cy="0" rx="30" ry="14" fill="#8D5B32"/><circle cx="30" cy="-10" r="12" fill="#8D5B32"/><path d="M36 -20 l6 -10 l4 12z" fill="#6E4524"/><line x1="-20" y1="10" x2="-24" y2="26" stroke="#8D5B32" stroke-width="6" stroke-linecap="round"/><line x1="18" y1="10" x2="24" y2="26" stroke="#8D5B32" stroke-width="6" stroke-linecap="round"/><path d="M-30 -4 q-14 -10 -18 -24" stroke="#8D5B32" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M40 -6 q10 4 20 0 q10 -4 20 0" stroke="#C0563C" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-4 -8 Q60 30 160 26" stroke="#D63C48" stroke-width="2.5" fill="none"/></g>
  ${person(270, 300, "#13B5C6", { armL: [-20, 0], armR: [20, 0], step: true, hair: "#C4A16B" })}
  <g transform="translate(246 252)"><rect x="0" y="16" width="48" height="22" fill="#C99A62"/><rect x="4" y="-4" width="40" height="22" fill="#B98A52"/><rect x="8" y="-22" width="32" height="20" fill="#D6AC74"/></g>
 </svg>`;
 if (name === "oddbike") return `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="380" fill="#EFE7DA"/><rect y="300" width="640" height="80" fill="#C9B79C"/>
  <g stroke="#B9A88E" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${i * 100}" y1="300" x2="${i * 100 - 40}" y2="380"/>`).join("")}</g>
  <g fill="none" stroke="#2D3A5C" stroke-width="7"><circle cx="150" cy="270" r="58"/><circle cx="330" cy="270" r="58"/></g>
  <g stroke="#2D3A5C" stroke-width="3">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="150" y1="270" x2="${150 + Math.cos(a) * 55}" y2="${270 + Math.sin(a) * 55}"/><line x1="330" y1="270" x2="${330 + Math.cos(a) * 55}" y2="${270 + Math.sin(a) * 55}"/>`; }).join("")}</g>
  <g stroke="#6B4EF0" stroke-width="9" stroke-linecap="round" fill="none"><path d="M150 270 L220 270 L300 190 L190 190 Z"/><path d="M220 270 L190 160"/><path d="M300 190 L330 270"/><path d="M296 175 L310 140"/></g>
  <rect x="172" y="148" width="40" height="12" rx="6" fill="#2D3A5C"/>
  <path d="M300 140 L330 132" stroke="#2D3A5C" stroke-width="7" stroke-linecap="round"/>
  <g transform="translate(332 120)"><path d="M0 0 Q30 -6 54 -36 L70 -10 Q36 0 0 8Z" fill="#D9A23A"/><ellipse cx="62" cy="-23" rx="10" ry="16" fill="#B8862A" transform="rotate(25 62 -23)"/></g>
  <g transform="translate(312 135)"><line x1="0" y1="0" x2="-6" y2="-70" stroke="#333" stroke-width="3"/><path d="M-60 -64 Q-6 -120 50 -70 Z" fill="#E0559B"/><path d="M-60 -64 Q-40 -74 -26 -64 Q-10 -76 6 -66 Q22 -78 34 -66 Q42 -74 50 -70" fill="none" stroke="#B53C7C" stroke-width="2"/></g>
  <line x1="330" y1="230" x2="420" y2="240" stroke="#8A97B3" stroke-width="6"/>
  <g transform="translate(400 170)"><path d="M0 20 Q0 90 60 90 L150 90 Q210 90 210 20 Z" fill="#FFFFFF" stroke="#8A97B3" stroke-width="4"/><rect x="-8" y="12" width="226" height="12" rx="6" fill="#F5F5F5" stroke="#8A97B3" stroke-width="3"/>
   <path d="M20 90 l-6 24 l10 0 l2 -10z M190 90 l6 24 l-10 0 l-2 -10z" fill="#D9A23A"/>
   <g transform="translate(120 -4)"><ellipse cx="0" cy="10" rx="20" ry="12" fill="#FFD54F"/><circle cx="12" cy="-6" r="10" fill="#FFD54F"/><path d="M20 -6 l10 3 l-10 3z" fill="#F57C00"/><circle cx="14" cy="-8" r="2" fill="#222"/></g></g>
  <circle cx="520" cy="300" r="22" fill="none" stroke="#2D3A5C" stroke-width="6"/>
  <g transform="translate(470 120) rotate(8)"><rect x="0" y="0" width="74" height="40" rx="6" fill="#FFF8E1" stroke="#A1887F" stroke-width="2"/><circle cx="10" cy="20" r="4" fill="#A1887F"/><text x="44" y="27" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#5D4037">$75</text></g>
  <path d="M484 140 Q470 150 460 182" stroke="#A1887F" stroke-width="1.5" fill="none"/>
 </svg>`;
 return SCENES_A[name] ?? SCENES_B[name] ?? "";
}

const ALT: Record<string, string> = { market: "Illustration of an outdoor market as rain begins", oddbike: "Illustration of an unusual object at a second-hand market", ...SCENE_ALT_A, ...SCENE_ALT_B };
/** Screen-reader description for a scene name. */
export const sceneAlt = (name: string): string => ALT[name] ?? "Illustration for this speaking task";

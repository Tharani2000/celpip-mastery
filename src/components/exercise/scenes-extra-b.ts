/* Extra original illustrations for speaking task 8 (static SVG markup, no user input). */
function tag(x: number, y: number, price: string, rot: number, ax: number, ay: number): string {
 return `<path d="M${x + 8} ${y + 8} Q${ax + 10} ${ay + 20} ${ax} ${ay}" stroke="#A1887F" stroke-width="1.5" fill="none"/>
  <g transform="translate(${x} ${y}) rotate(${rot})"><rect x="0" y="0" width="74" height="40" rx="6" fill="#FFF8E1" stroke="#A1887F" stroke-width="2"/><circle cx="10" cy="20" r="4" fill="#A1887F"/><text x="44" y="27" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#5D4037">${price}</text></g>`;
}
function wheel(cx: number, cy: number, r: number, spokes: number): string {
 return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2D3A5C" stroke-width="6"/><g stroke="#2D3A5C" stroke-width="2.5">${Array.from({ length: spokes }, (_, i) => { const a = i * 2 * Math.PI / spokes; return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * (r - 2)).toFixed(1)}" y2="${(cy + Math.sin(a) * (r - 2)).toFixed(1)}"/>`; }).join("")}</g><circle cx="${cx}" cy="${cy}" r="5" fill="#8A97B3"/>`;
}
const BUNT = ["#E24B4B", "#F2A03D", "#3B5BA9", "#43A047", "#BA68C8"];
function bunting(): string {
 return `<path d="M0 40 Q320 80 640 40" stroke="#7A5634" stroke-width="2" fill="none"/>${Array.from({ length: 10 }, (_, i) => { const x = 30 + i * 62, y = 46 + Math.sin((i / 9) * Math.PI) * 18; return `<path d="M${x} ${y.toFixed(1)} l22 0 l-11 22z" fill="${BUNT[i % 5]}"/>`; }).join("")}`;
}
const floorLines = (y: number) => `<g stroke="rgba(0,0,0,.12)" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${i * 100}" y1="${y}" x2="${i * 100 - 40}" y2="380"/>`).join("")}</g>`;

export const SCENES_B: Record<string, string> = {
 oddchair: `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="oddchair-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3F2"/><stop offset="1" stop-color="#F3EBDD"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#oddchair-sky)"/>
  <rect x="0" y="120" width="640" height="130" fill="#C9A27A"/><g stroke="#B28A62" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${i * 90}" y1="120" x2="${i * 90}" y2="250"/>`).join("")}</g>
  <rect x="0" y="250" width="640" height="130" fill="#BFB5A3"/>
  ${bunting()}
  <g transform="translate(450 80)"><rect x="0" y="0" width="140" height="44" rx="6" fill="#F6E7B4" stroke="#7A5634" stroke-width="3"/><text x="70" y="28" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="#7A5634">GARAGE SALE</text></g>
  <g stroke="#7B4B8A" stroke-width="10" stroke-linecap="round" fill="none"><path d="M215 235 L330 235"/><path d="M215 235 L205 300"/><path d="M330 235 L338 300"/></g>
  <rect x="205" y="140" width="14" height="90" rx="5" fill="#E8A33D"/><rect x="195" y="105" width="34" height="42" rx="10" fill="#E8A33D"/>
  <rect x="205" y="226" width="140" height="22" rx="8" fill="#E8A33D"/>
  <g fill="#C97F1E"><circle cx="212" cy="150" r="3"/><circle cx="212" cy="168" r="3"/><circle cx="212" cy="186" r="3"/></g>
  ${wheel(200, 312, 42, 10)}${wheel(340, 312, 42, 10)}
  <line x1="232" y1="226" x2="232" y2="125" stroke="#5A4030" stroke-width="5"/><line x1="332" y1="226" x2="332" y2="125" stroke="#5A4030" stroke-width="5"/>
  <path d="M200 70 L360 70 L395 125 L170 125Z" fill="#2F8F9D"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${200 + i * 32} 70 L${216 + i * 32} 70 L${224 + i * 38} 125 L${208 + i * 38} 125Z" fill="#F4F1E6" opacity=".85"/>`).join("")}
  <path d="M170 125 L395 125" stroke="#1F6B76" stroke-width="4"/>
  <rect x="262" y="198" width="52" height="28" rx="8" fill="#6B4EF0"/><path d="M270 198 L286 170 L306 198Z" fill="#9C86FF"/>
  <g transform="translate(352 200)"><rect x="0" y="0" width="16" height="22" rx="3" fill="#F4F1E6" stroke="#8A97B3" stroke-width="2"/><path d="M16 5 q9 1 0 12" fill="none" stroke="#8A97B3" stroke-width="2"/></g>
  <g transform="translate(40 250)"><rect x="0" y="24" width="90" height="50" fill="#B07A4A"/><rect x="6" y="2" width="22" height="26" fill="#E53935"/><rect x="30" y="-6" width="22" height="34" fill="#1E88E5"/><rect x="54" y="6" width="22" height="22" fill="#43A047"/></g>
  <g transform="translate(470 275)"><rect x="0" y="0" width="110" height="70" rx="4" fill="#9A6B3E"/><rect x="6" y="6" width="98" height="14" fill="#7A5634"/><circle cx="30" cy="-12" r="14" fill="#D9A55A"/><rect x="62" y="-26" width="30" height="26" rx="4" fill="#E0559B"/></g>
  ${tag(408, 190, "$40", 8, 346, 236)}
 </svg>`,
 oddlamp: `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="oddlamp-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1E3C8"/><stop offset="1" stop-color="#E4D2AE"/></linearGradient>
  <radialGradient id="oddlamp-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient></defs>
  <rect width="640" height="380" fill="url(#oddlamp-wall)"/><rect y="300" width="640" height="80" fill="#A98B66"/>
  ${floorLines(300)}
  <g transform="translate(20 100)"><rect x="0" y="0" width="150" height="14" fill="#7A5634"/><rect x="10" y="-60" width="30" height="60" fill="#3B5BA9"/><rect x="44" y="-48" width="24" height="48" fill="#E24B4B"/><rect x="72" y="-56" width="34" height="56" fill="#43A047"/><rect x="110" y="-40" width="26" height="40" fill="#F2A03D"/></g>
  <circle cx="290" cy="120" r="110" fill="url(#oddlamp-glow)"/>
  <rect x="290" y="300" width="100" height="14" rx="6" fill="#2D3A5C"/><rect x="334" y="105" width="12" height="200" fill="#2D3A5C"/>
  <g transform="translate(240 120)"><path d="M0 0 L100 0 L82 -60 L18 -60Z" fill="#F2A03D" stroke="#C97F1E" stroke-width="3"/><path d="M18 -60 L82 -60 L86 -52 L14 -52Z" fill="#FFC56B"/></g>
  <circle cx="290" cy="116" r="9" fill="#FFF3B0"/>
  <rect x="280" y="160" width="110" height="8" rx="2" fill="#7A5634"/><rect x="280" y="205" width="110" height="8" rx="2" fill="#7A5634"/><rect x="280" y="250" width="110" height="8" rx="2" fill="#7A5634"/>
  <rect x="284" y="130" width="14" height="30" fill="#E53935"/><rect x="300" y="138" width="12" height="22" fill="#1E88E5"/><rect x="314" y="134" width="14" height="26" fill="#FBC02D"/>
  <rect x="284" y="178" width="22" height="27" fill="#8E24AA"/><rect x="308" y="182" width="14" height="23" fill="#00897B" transform="rotate(8 315 205)"/><rect x="326" y="186" width="30" height="19" fill="#6D4C41"/>
  <rect x="288" y="224" width="30" height="26" fill="#EF6C00"/><rect x="322" y="230" width="18" height="20" fill="#5C6BC0"/>
  <g transform="translate(396 100)"><path d="M0 40 L48 40 L42 80 L6 80Z" fill="#C0563C"/><rect x="-3" y="36" width="54" height="9" rx="3" fill="#A8442C"/><path d="M24 36 Q20 0 6 -14 M24 36 Q28 -10 44 -18 M24 36 Q24 -20 24 -34" stroke="#2E7D32" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="6" cy="-16" rx="12" ry="7" fill="#43A047"/><ellipse cx="46" cy="-20" rx="12" ry="7" fill="#43A047"/><ellipse cx="24" cy="-38" rx="9" ry="12" fill="#66BB6A"/></g>
  <path d="M396 140 L346 140" stroke="#2D3A5C" stroke-width="4"/>
  <g transform="translate(240 300)"><path d="M0 0 L22 0 L26 -22 L-4 -22Z" fill="#8D5B32"/><path d="M11 -22 q-4 -22 -14 -26 M11 -22 q8 -20 20 -22" stroke="#2E7D32" stroke-width="3" fill="none"/></g>
  <path d="M340 308 Q430 330 470 300" stroke="#2D3A5C" stroke-width="3" fill="none"/><rect x="466" y="292" width="14" height="14" rx="3" fill="#F4F1E6" stroke="#8A97B3" stroke-width="2"/>
  <g transform="translate(470 230)"><rect x="0" y="40" width="130" height="14" fill="#B07A4A"/><rect x="8" y="54" width="8" height="46" fill="#7A5634"/><rect x="114" y="54" width="8" height="46" fill="#7A5634"/><circle cx="26" cy="26" r="14" fill="#E0559B"/><rect x="52" y="12" width="26" height="28" rx="4" fill="#26A69A"/><rect x="90" y="20" width="28" height="20" rx="3" fill="#FFD54F"/></g>
  <g transform="translate(540 90)"><rect x="0" y="0" width="70" height="52" rx="3" fill="#FFFFFF" stroke="#7A5634" stroke-width="4"/><path d="M8 44 L24 24 L38 36 L50 20 L62 44Z" fill="#7FB77E"/><circle cx="52" cy="14" r="5" fill="#F2A03D"/></g>
  ${tag(432, 190, "$55", -6, 346, 215)}
 </svg>`,
 oddtoaster: `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="oddtoaster-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0F5"/><stop offset="1" stop-color="#EAF4FA"/></linearGradient>
  <linearGradient id="oddtoaster-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9564B"/><stop offset="1" stop-color="#B83A31"/></linearGradient>
  <linearGradient id="oddtoaster-panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B4A8C"/><stop offset="1" stop-color="#1B2D5C"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#oddtoaster-sky)"/>
  <circle cx="570" cy="60" r="28" fill="#FFD54F"/><g stroke="#FFD54F" stroke-width="4" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${(570 + Math.cos(a) * 36).toFixed(1)}" y1="${(60 + Math.sin(a) * 36).toFixed(1)}" x2="${(570 + Math.cos(a) * 48).toFixed(1)}" y2="${(60 + Math.sin(a) * 48).toFixed(1)}"/>`; }).join("")}</g>
  <g fill="#FFFFFF"><ellipse cx="120" cy="60" rx="60" ry="20"/><ellipse cx="170" cy="72" rx="44" ry="16"/></g>
  <rect y="240" width="640" height="140" fill="#9CC48A"/>
  <g transform="translate(20 120)"><rect x="0" y="0" width="12" height="124" fill="#7A5634"/><rect x="150" y="0" width="12" height="124" fill="#7A5634"/><path d="M-12 0 L174 0 L156 -36 L6 -36Z" fill="#43A047"/>${[0, 1, 2].map(i => `<path d="M${-6 + i * 62} 0 L${22 + i * 62} 0 L${14 + i * 48} -36 L${2 + i * 48} -36Z" fill="#F4F1E6" opacity=".8"/>`).join("")}</g>
  <rect x="150" y="196" width="320" height="22" fill="#B07A4A"/><rect x="170" y="218" width="12" height="60" fill="#7A5634"/><rect x="438" y="218" width="12" height="60" fill="#7A5634"/>
  <rect x="226" y="98" width="62" height="10" rx="3" fill="#2D3A5C"/><rect x="306" y="98" width="62" height="10" rx="3" fill="#2D3A5C"/>
  <path d="M232 98 L240 82 L250 98Z M254 98 L262 78 L274 98Z" fill="#E6B873"/><rect x="316" y="82" width="44" height="18" rx="3" fill="#E6B873" transform="rotate(-6 338 91)"/>
  <rect x="200" y="106" width="220" height="92" rx="20" fill="url(#oddtoaster-body)" stroke="#8E2A24" stroke-width="3"/><rect x="214" y="110" width="192" height="10" rx="5" fill="#F27B70" opacity=".6"/>
  <rect x="214" y="136" width="130" height="30" rx="6" fill="#2D3A5C"/><g stroke="#8A97B3" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<line x1="${222 + i * 10}" y1="142" x2="${222 + i * 10}" y2="160"/>`).join("")}</g>
  <g transform="translate(374 150)"><circle r="22" fill="#F4F1E6" stroke="#8A97B3" stroke-width="3"/><circle r="14" fill="#CFD8DC"/><line x1="0" y1="0" x2="8" y2="-12" stroke="#2D3A5C" stroke-width="4" stroke-linecap="round"/>${[-60, -30, 0, 30, 60].map(a => `<line x1="${(Math.sin(a * Math.PI / 180) * 26).toFixed(1)}" y1="${(-Math.cos(a * Math.PI / 180) * 26).toFixed(1)}" x2="${(Math.sin(a * Math.PI / 180) * 31).toFixed(1)}" y2="${(-Math.cos(a * Math.PI / 180) * 31).toFixed(1)}" stroke="#2D3A5C" stroke-width="2"/>`).join("")}</g>
  <circle cx="404" cy="182" r="6" fill="#FFD54F"/>
  <path d="M400 130 L440 96" stroke="#CFD8DC" stroke-width="3"/><circle cx="440" cy="96" r="4" fill="#CFD8DC"/>
  <g transform="translate(250 24) rotate(-10)"><rect x="0" y="0" width="120" height="70" rx="4" fill="url(#oddtoaster-panel)" stroke="#CFD8DC" stroke-width="4"/><g stroke="#6F8FD0" stroke-width="1.5">${[1, 2, 3].map(i => `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="70"/>`).join("")}<line x1="0" y1="23" x2="120" y2="23"/><line x1="0" y1="46" x2="120" y2="46"/></g></g>
  <path d="M300 92 L300 106" stroke="#444" stroke-width="3"/>
  <path d="M420 190 L450 215 L436 218" stroke="#444" stroke-width="3" fill="none"/>
  <path d="M450 215 Q480 250 520 240" stroke="#444" stroke-width="3" fill="none"/><rect x="516" y="232" width="18" height="16" rx="3" fill="#FFFFFF" stroke="#8A97B3" stroke-width="2"/>
  <path d="M232 197 l2 8 l-6 4 l8 2 l-2 8" stroke="#6D4C41" stroke-width="2" fill="none"/>
  <g transform="translate(480 262)"><ellipse cx="30" cy="30" rx="30" ry="12" fill="#C99A62"/><rect x="2" y="0" width="56" height="30" fill="#E6C48C"/><ellipse cx="30" cy="0" rx="28" ry="10" fill="#F2D8A6"/></g>
  <g transform="translate(64 296)"><rect x="0" y="0" width="70" height="40" rx="4" fill="#9A6B3E"/><circle cx="20" cy="-10" r="12" fill="#E0559B"/><rect x="40" y="-22" width="22" height="22" rx="3" fill="#26A69A"/></g>
  ${tag(250, 226, "$25", -5, 300, 198)}
 </svg>`,
 oddumbrella: `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="oddumbrella-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C6B8F"/><stop offset="1" stop-color="#9AA7BF"/></linearGradient>
  <linearGradient id="oddumbrella-led" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF4F9A"/><stop offset=".5" stop-color="#FFD54F"/><stop offset="1" stop-color="#3DDCFF"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#oddumbrella-bg)"/>
  <g stroke="#B9C6E0" stroke-width="2" stroke-linecap="round" opacity=".7">${Array.from({ length: 30 }, (_, i) => { const x = 20 + (i * 71) % 620, y = (i * 47) % 260; return `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 16}"/>`; }).join("")}</g>
  <rect y="290" width="640" height="90" fill="#6F7C96"/>${floorLines(290)}
  <g transform="translate(20 130)"><rect x="0" y="0" width="12" height="160" fill="#4A3A2A"/><rect x="170" y="0" width="12" height="160" fill="#4A3A2A"/><path d="M-12 0 L194 0 L176 -40 L6 -40Z" fill="#F2A03D"/><text x="91" y="-14" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">RAINY DAY FLEA</text></g>
  <g transform="translate(330 20)"><path d="M0 120 Q0 10 130 10 Q260 10 260 120 Q227 100 195 120 Q162 100 130 120 Q98 100 65 120 Q32 100 0 120Z" fill="#3FA796"/>${[0, 1, 2, 3].map(i => `<path d="M130 10 Q${[40, 100, 160, 220][i]} 50 ${[32, 98, 162, 227][i]} 112" stroke="#2A7D6F" stroke-width="2" fill="none"/>`).join("")}<path d="M12 106 Q130 66 248 106" stroke="url(#oddumbrella-led)" stroke-width="7" fill="none" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<circle cx="${22 + i * 27}" cy="${(108 - Math.sin((i + .5) / 9 * Math.PI) * 36).toFixed(0)}" r="3" fill="#FFFFFF"/>`).join("")}<rect x="126" y="-8" width="8" height="18" fill="#2D3A5C"/></g>
  <rect x="456" y="135" width="10" height="185" fill="#8A5A2B"/><path d="M456 320 q-2 20 -24 20 q-22 0 -22 -16 l8 0 q0 8 14 8 q14 0 14 -12z" fill="#8A5A2B"/>
  <line x1="466" y1="204" x2="486" y2="204" stroke="#8A5A2B" stroke-width="5"/>
  <g transform="translate(486 190)"><path d="M0 0 L40 0 L34 50 L6 50Z" fill="#FFFFFF" stroke="#8A97B3" stroke-width="3"/><rect x="-6" y="-6" width="52" height="9" rx="4" fill="#F5F5F5" stroke="#8A97B3" stroke-width="3"/><path d="M8 20 L32 20" stroke="#D9A23A" stroke-width="4"/></g>
  <line x1="430" y1="238" x2="456" y2="232" stroke="#8A5A2B" stroke-width="5"/>
  <g transform="translate(404 238)"><circle r="26" fill="#C9A227"/><circle r="22" fill="#CFE6F5"/><path d="M-14 8 L8 -14" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>
  <g transform="translate(466 262)"><rect x="0" y="0" width="28" height="18" rx="3" fill="#2D3A5C"/><circle cx="14" cy="9" r="4" fill="#FFD54F"/></g>
  <g transform="translate(220 270)"><rect x="0" y="0" width="120" height="14" fill="#B07A4A"/><rect x="8" y="14" width="8" height="30" fill="#7A5634"/><rect x="104" y="14" width="8" height="30" fill="#7A5634"/><rect x="14" y="-26" width="26" height="26" rx="3" fill="#E24B4B"/><circle cx="64" cy="-12" r="12" fill="#BA68C8"/><rect x="86" y="-30" width="22" height="30" rx="3" fill="#43A047"/></g>
  ${tag(530, 110, "$18", 7, 464, 150)}
 </svg>`,
};

export const SCENE_ALT_B: Record<string, string> = {
 oddchair: "A yellow wooden chair at a garage sale that has two bicycle wheels fixed to its legs and a small teal-and-white striped awning above it, with a $40 price tag.",
 oddlamp: "A tall floor lamp with an orange shade that has three bookshelves built into its pole and a potted plant on top, standing in a second-hand shop with a $55 price tag.",
 oddtoaster: "A red toaster on a market table with a radio dial and speaker grille on its front and a small solar panel tilted on top, with a $25 price tag.",
 oddumbrella: "A green umbrella on a wooden pole with a cup-holder, a round mirror and a coloured LED strip along its edge, shown at a rainy-day flea market with an $18 price tag.",
};

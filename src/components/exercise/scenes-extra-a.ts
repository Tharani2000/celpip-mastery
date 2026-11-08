/* Original illustrations (set A) for speaking tasks 3 and 4: static SVG markup, no user input. */
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

const parkday = `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="parkday-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD0F5"/><stop offset="1" stop-color="#DDF1FB"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#parkday-sky)"/>
  <circle cx="70" cy="60" r="30" fill="#FFD54F"/>
  <g fill="#fff"><ellipse cx="190" cy="50" rx="50" ry="16"/><ellipse cx="225" cy="42" rx="34" ry="14"/></g>
  <g fill="#4A5568"><ellipse cx="520" cy="40" rx="110" ry="34"/><ellipse cx="590" cy="64" rx="80" ry="28"/><ellipse cx="440" cy="62" rx="70" ry="24"/></g>
  <g stroke="#6B7A99" stroke-width="2" stroke-linecap="round"><line x1="500" y1="82" x2="494" y2="98"/><line x1="530" y1="90" x2="524" y2="106"/><line x1="560" y1="84" x2="554" y2="100"/></g>
  <rect y="190" width="640" height="190" fill="#7CC36B"/>
  <path d="M0 330 Q300 290 640 330 L640 380 L0 380Z" fill="#E6D8BC"/>
  <g transform="translate(60 100)"><rect x="-8" y="60" width="16" height="100" fill="#7A5634"/><circle cx="0" cy="40" r="52" fill="#3E9A4D"/><circle cx="-32" cy="68" r="34" fill="#4CAF5B"/><circle cx="34" cy="66" r="34" fill="#4CAF5B"/></g>
  <g transform="translate(150 225)"><rect x="0" y="0" width="70" height="8" fill="#8D5B32"/><rect x="4" y="8" width="6" height="26" fill="#5A4030"/><rect x="60" y="8" width="6" height="26" fill="#5A4030"/><rect x="0" y="-26" width="70" height="6" fill="#8D5B32"/><rect x="6" y="-26" width="4" height="26" fill="#8D5B32"/><rect x="60" y="-26" width="4" height="26" fill="#8D5B32"/></g>
  ${person(185, 190, "#8E44AD", { armL: [-6, 22], armR: [8, 22], hair: "#222", skin: "#C98E64" })}
  <g transform="translate(176 212) rotate(-8)"><rect x="0" y="0" width="26" height="18" fill="#F4F1E6" stroke="#8A97B3" stroke-width="2"/></g>
  <g transform="translate(340 290)"><path d="M0 0 L130 0 L150 50 L-20 50Z" fill="#E24B4B"/><path d="M0 0 L26 0 L8 50 L-20 50Z M52 0 L78 0 L60 50 L34 50Z M104 0 L130 0 L150 50 L112 50Z" fill="#fff" opacity=".85"/>
   <g transform="translate(95 -10)"><rect x="0" y="0" width="34" height="22" rx="4" fill="#B07A4A"/><path d="M4 0 Q17 -22 30 0" stroke="#7A5634" stroke-width="4" fill="none"/></g>
   <circle cx="30" cy="-2" r="9" fill="#F2A03D"/><circle cx="52" cy="2" r="8" fill="#D73A3A"/></g>
  ${person(350, 235, "#2F6BFF", { armL: [-26, 0], armR: [16, 24], hair: "#3A2A1E" })}
  ${person(420, 245, "#F06292", { armR: [28, -14], armL: [-10, 24], hair: "#8A5A2B", skin: "#C98E64" })}
  <g transform="translate(500 90)"><path d="M0 0 L28 -30 L56 0 L28 38Z" fill="#E53935"/><path d="M28 -30 L28 38 M0 0 L56 0" stroke="#fff" stroke-width="2"/><path d="M28 38 Q10 90 40 130 Q60 170 70 200" stroke="#555" stroke-width="1.5" fill="none"/>
   <path d="M20 90 l12 6 l-12 6z M42 140 l12 6 l-12 6z" fill="#FFD54F"/></g>
  ${person(575, 215, "#FFD54F", { scale: .7, armL: [-16, -14], armR: [-20, -30], skin: "#E8B48C", hair: "#5A3A22", step: true })}
  <g transform="translate(540 296)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#C98A3C"/><circle cx="24" cy="-8" r="10" fill="#C98A3C"/><path d="M28 -18 l6 -10 l4 12z" fill="#A66E26"/><line x1="-14" y1="8" x2="-16" y2="22" stroke="#C98A3C" stroke-width="5" stroke-linecap="round"/><line x1="12" y1="8" x2="16" y2="22" stroke="#C98A3C" stroke-width="5" stroke-linecap="round"/><path d="M-22 -4 q-12 -10 -14 -20" stroke="#C98A3C" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <circle cx="500" cy="318" r="9" fill="#E53935"/><circle cx="500" cy="318" r="9" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>
  ${person(270, 240, "#13B5C6", { scale: .85, step: true, armL: [-20, 14], armR: [22, 8], hair: "#C4A16B" })}
  <g transform="translate(250 330)"><ellipse cx="0" cy="0" rx="22" ry="5" fill="#3E7F3E" opacity=".35"/></g>
 </svg>`;

const busstop = `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="busstop-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C99A"/><stop offset="1" stop-color="#FCE8CF"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#busstop-sky)"/>
  <circle cx="540" cy="70" r="28" fill="#FFB74D"/>
  <g fill="#8C97B0"><rect x="20" y="70" width="60" height="150"/><rect x="90" y="110" width="50" height="110"/><rect x="150" y="50" width="70" height="170"/><rect x="230" y="100" width="56" height="120"/></g>
  <g fill="#FFE9A8">${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${164 + c * 30}" y="${64 + r * 40}" width="16" height="22"/>`).join("")).join("")}${[0, 1].map(r => `<rect x="${30 + (r % 2) * 24}" y="${90 + r * 50}" width="14" height="20"/>`).join("")}</g>
  <rect y="215" width="640" height="30" fill="#BDB6A6"/>
  <rect y="245" width="640" height="135" fill="#5A6070"/>
  <g stroke="#F4F1E6" stroke-width="4" stroke-dasharray="30 24"><line x1="0" y1="315" x2="640" y2="315"/></g>
  <rect y="338" width="640" height="42" fill="#4B5160"/>
  <g transform="translate(360 150)"><rect x="0" y="0" width="230" height="8" fill="#2F8F9D"/><rect x="4" y="8" width="5" height="68" fill="#4A5568"/><rect x="221" y="8" width="5" height="68" fill="#4A5568"/><rect x="9" y="8" width="212" height="62" fill="#CFE9F0" opacity=".55"/><rect x="20" y="70" width="190" height="7" fill="#8D5B32"/></g>
  <g transform="translate(330 120)"><rect x="0" y="0" width="6" height="110" fill="#4A5568"/><rect x="-14" y="-6" width="34" height="28" rx="4" fill="#2F6BFF"/><circle cx="3" cy="8" r="8" fill="#fff"/><path d="M0 4 h6 M3 4 v10" stroke="#2F6BFF" stroke-width="2"/></g>
  ${person(395, 175, "#E24B4B", { armL: [-6, 20], armR: [10, 20], hair: "#222", skin: "#C98E64" })}
  ${person(440, 177, "#6B4EF0", { armL: [-26, -10], armR: [22, 16], hair: "#8A5A2B" })}
  <g transform="translate(468 188)"><circle cx="0" cy="0" r="4" fill="#fff"/><rect x="-8" y="-10" width="16" height="3" rx="1" fill="#555"/></g>
  <g transform="translate(500 235)"><rect x="0" y="-8" width="34" height="50" rx="4" fill="#C0563C"/><rect x="8" y="-20" width="18" height="12" rx="3" fill="none" stroke="#555" stroke-width="3"/></g>
  ${person(520, 195, "#43A047", { armL: [-10, 20], armR: [30, 18], hair: "#1E1A17", skin: "#8D5B32" })}
  <g transform="translate(560 262)"><rect x="0" y="0" width="30" height="40" rx="8" fill="#F2A03D"/><rect x="6" y="-8" width="18" height="10" rx="4" fill="#F2A03D"/></g>
  ${person(575, 215, "#FFD54F", { scale: .6, armL: [-8, 20], armR: [-30, -4], hair: "#5A3A22" })}
  ${person(250, 268, "#13B5C6", { step: true, armL: [-24, 12], armR: [22, -20], hair: "#C4A16B" })}
  <g transform="translate(278 256)"><rect x="0" y="0" width="14" height="18" rx="3" fill="#fff" stroke="#8A97B3" stroke-width="2"/><path d="M2 0 Q7 -8 12 0" fill="none" stroke="#8A97B3" stroke-width="2"/><path d="M8 -4 q4 -8 -2 -14 M13 -2 q4 -8 -2 -12" stroke="#bbb" stroke-width="2" fill="none"/></g>
  <g transform="translate(20 268)"><path d="M0 40 L160 40 L160 10 Q160 0 150 0 L30 0 Q10 0 0 18Z" fill="#F2C230"/><rect x="24" y="8" width="100" height="22" fill="#CFE9F0"/><circle cx="40" cy="42" r="12" fill="#2D3A5C"/><circle cx="130" cy="42" r="12" fill="#2D3A5C"/><rect x="150" y="14" width="10" height="8" fill="#FFF59D"/></g>
  <g transform="translate(600 228)"><rect x="-4" y="0" width="22" height="10" rx="3" fill="#8A97B3"/><ellipse cx="6" cy="-4" rx="9" ry="7" fill="#9AA5B8"/><circle cx="12" cy="-8" r="2" fill="#222"/></g>
  <g transform="translate(430 296) scale(1.3)"><rect x="0" y="0" width="150" height="46" rx="10" fill="#E24B4B"/><rect x="10" y="8" width="130" height="18" fill="#CFE9F0"/><circle cx="26" cy="48" r="10" fill="#2D3A5C"/><circle cx="124" cy="48" r="10" fill="#2D3A5C"/><text x="75" y="40" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="700" fill="#fff">BUS</text></g>
 </svg>`;

const kitchen = `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="kitchen-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE9C8"/><stop offset="1" stop-color="#F7D9A8"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#kitchen-wall)"/>
  <rect y="290" width="640" height="90" fill="#C98A5A"/>
  <g stroke="#B57747" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${i * 90}" y1="290" x2="${i * 90 - 30}" y2="380"/>`).join("")}</g>
  <g transform="translate(440 40)"><rect x="0" y="0" width="150" height="110" fill="#9ED5F0" stroke="#8D5B32" stroke-width="8"/><line x1="75" y1="0" x2="75" y2="110" stroke="#8D5B32" stroke-width="5"/><line x1="0" y1="55" x2="150" y2="55" stroke="#8D5B32" stroke-width="5"/><ellipse cx="40" cy="30" rx="26" ry="9" fill="#fff"/>
   <g transform="translate(100 62)"><rect x="0" y="8" width="38" height="34" fill="#C99A62"/><rect x="0" y="8" width="38" height="6" fill="#B98A52"/></g></g>
  <g transform="translate(20 50)"><rect x="0" y="0" width="190" height="8" fill="#8D5B32"/><rect x="6" y="-26" width="28" height="26" fill="#E24B4B"/><rect x="40" y="-34" width="26" height="34" fill="#F2C230"/><rect x="72" y="-24" width="30" height="24" fill="#43A047"/><rect x="110" y="-30" width="24" height="30" fill="#6B4EF0"/></g>
  <g transform="translate(250 40)"><circle cx="40" cy="40" r="38" fill="#fff" stroke="#4A5568" stroke-width="5"/><line x1="40" y1="40" x2="40" y2="14" stroke="#222" stroke-width="3"/><line x1="40" y1="40" x2="58" y2="48" stroke="#222" stroke-width="3"/></g>
  <rect x="0" y="210" width="640" height="14" fill="#8D5B32"/>
  <rect x="0" y="224" width="260" height="70" fill="#3B5BA9"/><rect x="270" y="224" width="140" height="70" fill="#3B5BA9"/>
  <g transform="translate(290 150)"><rect x="0" y="40" width="110" height="20" fill="#4A5568"/><circle cx="25" cy="40" r="10" fill="#222"/><circle cx="85" cy="40" r="10" fill="#222"/><path d="M5 -10 L5 40 L85 40 L85 -10Z" fill="#CBD2DD" stroke="#8A97B3" stroke-width="3"/><rect x="0" y="-16" width="90" height="10" rx="4" fill="#8A97B3"/><rect x="88" y="0" width="22" height="6" rx="3" fill="#4A5568"/>
   <ellipse cx="45" cy="-16" rx="52" ry="8" fill="#fff"/><g fill="#fff" opacity=".9"><circle cx="20" cy="-30" r="9"/><circle cx="48" cy="-36" r="12"/><circle cx="76" cy="-28" r="9"/></g>
   <path d="M30 -48 q-8 -14 2 -24 M60 -52 q-8 -14 2 -24" stroke="#aaa" stroke-width="3" fill="none"/></g>
  <rect x="270" y="230" width="140" height="6" fill="#2D3A5C"/>
  <g transform="translate(20 100)"><rect x="0" y="0" width="120" height="200" rx="10" fill="#E8EDF3" stroke="#8A97B3" stroke-width="3"/><line x1="0" y1="70" x2="120" y2="70" stroke="#8A97B3" stroke-width="3"/><rect x="104" y="20" width="5" height="30" rx="2" fill="#8A97B3"/><rect x="104" y="90" width="5" height="40" rx="2" fill="#8A97B3"/><rect x="14" y="16" width="26" height="22" fill="#F2A03D"/></g>
  <g transform="translate(130 150)"><path d="M0 0 L100 0 L100 70 L0 70 Z" fill="none"/></g>
  ${person(170, 190, "#E24B4B", { armL: [-26, 4], armR: [20, 20], hair: "#222", skin: "#C98E64" })}
  <g transform="translate(150 232)"><rect x="0" y="0" width="50" height="8" fill="#B98A52"/><rect x="8" y="-8" width="14" height="8" fill="#43A047"/><circle cx="38" cy="-4" r="5" fill="#F06292"/></g>
  ${person(470, 260, "#13B5C6", { scale: .7, armL: [-20, 4], armR: [22, 0], hair: "#C4A16B" })}
  <g transform="translate(445 292)"><circle cx="0" cy="0" r="14" fill="#fff" stroke="#8A97B3" stroke-width="3"/><circle cx="36" cy="0" r="14" fill="#fff" stroke="#8A97B3" stroke-width="3"/><circle cx="72" cy="0" r="14" fill="#fff" stroke="#8A97B3" stroke-width="3"/></g>
  <g transform="translate(520 310)"><ellipse cx="0" cy="0" rx="34" ry="14" fill="#8D5B32"/><circle cx="34" cy="-12" r="13" fill="#8D5B32"/><path d="M40 -24 l7 -12 l4 14z" fill="#6E4524"/><line x1="-22" y1="10" x2="-26" y2="30" stroke="#8D5B32" stroke-width="7" stroke-linecap="round"/><line x1="20" y1="10" x2="26" y2="30" stroke="#8D5B32" stroke-width="7" stroke-linecap="round"/><path d="M-34 -4 q-14 -10 -16 -26" stroke="#8D5B32" stroke-width="6" fill="none" stroke-linecap="round"/>
   <path d="M44 -6 q8 14 4 24" stroke="#F06292" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  ${person(330, 270, "#6B4EF0", { step: true, armL: [-28, 8], armR: [26, -4], hair: "#8A5A2B" })}
  <g transform="translate(570 212)"><rect x="0" y="0" width="40" height="40" rx="6" fill="#fff" stroke="#8A97B3" stroke-width="3"/><circle cx="20" cy="20" r="11" fill="#E8EDF3"/></g>
  <g transform="translate(596 115)"><rect x="0" y="0" width="34" height="46" rx="4" fill="#fff" stroke="#8A97B3" stroke-width="3"/><circle cx="17" cy="14" r="6" fill="#F2A03D"/><circle cx="17" cy="14" r="2.5" fill="#fff"/><rect x="6" y="28" width="22" height="8" rx="2" fill="#CBD2DD"/></g>
  <g transform="translate(405 210)"><rect x="0" y="-26" width="42" height="26" fill="#C99A62"/><path d="M0 -26 L21 -42 L42 -26Z" fill="#B98A52"/></g>
 </svg>`;

const lobby = `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lobby-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E4F5"/><stop offset="1" stop-color="#CFC8E6"/></linearGradient></defs>
  <rect width="640" height="380" fill="url(#lobby-wall)"/>
  <rect y="290" width="640" height="90" fill="#9CA6BD"/>
  <g stroke="#8892AB" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${i * 110}" y1="290" x2="${i * 110 - 40}" y2="380"/>`).join("")}<line x1="0" y1="335" x2="640" y2="335"/></g>
  <g transform="translate(20 60)"><rect x="0" y="0" width="190" height="110" fill="#4A5568"/>${[0, 1, 2, 3, 4].map(i => [0, 1].map(r => `<rect x="${8 + i * 36}" y="${10 + r * 48}" width="30" height="38" fill="#CBD2DD" stroke="#8A97B3" stroke-width="2"/><circle cx="${23 + i * 36}" cy="${40 + r * 48}" r="3" fill="#4A5568"/>`).join("")).join("")}<rect x="150" y="12" width="26" height="12" fill="#F2C230"/></g>
  <g transform="translate(250 40)"><rect x="0" y="0" width="140" height="250" fill="#8A97B3"/><rect x="10" y="10" width="55" height="240" fill="#CBD2DD"/><rect x="75" y="10" width="55" height="240" fill="#CBD2DD"/><rect x="62" y="-22" width="16" height="16" fill="#43A047"/><path d="M63 -12 l6 -8 l6 8z" fill="#fff"/></g>
  <g transform="translate(410 70)"><rect x="0" y="0" width="210" height="170" fill="#BEE3F8" stroke="#8D5B32" stroke-width="8"/><line x1="105" y1="0" x2="105" y2="170" stroke="#8D5B32" stroke-width="5"/><ellipse cx="50" cy="40" rx="30" ry="10" fill="#fff"/><rect x="0" y="130" width="210" height="40" fill="#8CC9A0" opacity=".7"/></g>
  <g transform="translate(455 20)"><circle cx="30" cy="30" r="26" fill="#fff" stroke="#4A5568" stroke-width="4"/><line x1="30" y1="30" x2="30" y2="12" stroke="#222" stroke-width="3"/><line x1="30" y1="30" x2="44" y2="34" stroke="#222" stroke-width="3"/></g>
  <g transform="translate(520 205)"><rect x="0" y="50" width="30" height="40" fill="#C0563C"/><path d="M-14 50 Q15 -30 44 50Z" fill="#43A047"/><path d="M-2 50 Q15 0 32 50Z" fill="#66BB6A"/></g>
  <g transform="translate(560 230)"><rect x="0" y="30" width="50" height="60" rx="4" fill="#B07A4A"/></g>
  <g transform="translate(130 258)"><rect x="0" y="0" width="150" height="38" fill="#8D5B32"/><rect x="0" y="-8" width="150" height="10" fill="#B98A52"/><rect x="100" y="-24" width="30" height="16" rx="2" fill="#2D3A5C"/><rect x="104" y="-20" width="22" height="8" fill="#9ED5F0"/></g>
  ${person(165, 215, "#E24B4B", { scale: .9, armL: [-14, 24], armR: [20, 6], hair: "#222", skin: "#C98E64" })}
  <g transform="translate(20 230)"><path d="M0 40 Q0 70 30 70 L70 70 Q100 70 100 40Z" fill="#E8EDF3" stroke="#8A97B3" stroke-width="2" opacity="0"/></g>
  <g transform="translate(300 300)"><path d="M0 40 L24 -10 L48 40Z" fill="#F2C230" stroke="#B38A00" stroke-width="3"/><rect x="21" y="8" width="6" height="16" fill="#222"/><circle cx="24" cy="30" r="3" fill="#222"/></g>
  <g transform="translate(260 330)"><ellipse cx="60" cy="0" rx="90" ry="14" fill="#9ED5F0" opacity=".55"/></g>
  ${person(100, 255, "#13B5C6", { step: true, armL: [-26, 14], armR: [10, 24], hair: "#C4A16B" })}
  <g transform="translate(38 290)"><rect x="0" y="0" width="8" height="40" fill="#8D5B32"/><path d="M-4 40 l16 0 l-4 16 l-8 0z" fill="#F2C230"/></g>
  ${person(380, 240, "#6B4EF0", { armL: [-30, 12], armR: [-26, 0], hair: "#3A2A1E", step: true })}
  <g transform="translate(335 232)"><rect x="0" y="0" width="46" height="34" fill="#C99A62"/><rect x="4" y="-30" width="40" height="30" fill="#B98A52"/><rect x="8" y="-56" width="34" height="26" fill="#D6AC74"/><rect x="14" y="-68" width="24" height="12" fill="#C99A62"/></g>
  ${person(570, 200, "#43A047", { armL: [-6, 20], armR: [22, 28], hair: "#1E1A17", skin: "#8D5B32" })}
  <g transform="translate(540 270)"><rect x="0" y="0" width="36" height="28" rx="8" fill="#E24B4B"/><circle cx="8" cy="34" r="7" fill="#2D3A5C"/><circle cx="28" cy="34" r="7" fill="#2D3A5C"/><path d="M0 0 L-10 -24" stroke="#4A5568" stroke-width="4"/></g>
  <g transform="translate(594 258)"><circle cx="0" cy="-14" r="9" fill="#F5C58A"/><path d="M-9 -4 Q0 12 9 -4Z" fill="#FFD54F"/></g>
  <g transform="translate(625 160)"><line x1="0" y1="0" x2="-10" y2="60" stroke="#555" stroke-width="1.5"/><ellipse cx="0" cy="-6" rx="14" ry="18" fill="#F06292"/></g>
  <g transform="translate(260 310) "><rect x="0" y="0" width="60" height="30" fill="#fff" opacity="0"/></g>
  <g transform="translate(420 300)"><rect x="0" y="-6" width="46" height="14" rx="4" fill="#fff" stroke="#8A97B3" stroke-width="2"/><path d="M6 -6 l0 -10 l34 0 l0 10" fill="none" stroke="#8A97B3" stroke-width="2"/></g>
  <g transform="translate(200 310)"><circle cx="0" cy="0" r="8" fill="#E53935"/><circle cx="14" cy="6" r="8" fill="#F2A03D"/></g>
 </svg>`;

export const SCENES_A: Record<string, string> = { parkday, busstop, kitchen, lobby };

export const SCENE_ALT_A: Record<string, string> = {
 parkday: "A sunny park with a picnic, a kite, a child chasing a dog and a jogger, while dark rain clouds gather on the right.",
 busstop: "A busy street bus stop with people waiting, a woman hurrying across the road with a coffee, and a pigeon, as a red bus pulls in from the right and a yellow taxi waits on the left.",
 kitchen: "A family kitchen where one person cooks while a pot boils over, a child sets the table, a dog begs, and a delivery box sits outside the window.",
 lobby: "An apartment building lobby with a resident carrying a tall stack of boxes toward a wet floor sign, a mopping cleaner, a receptionist, a stroller and a package delivery."
};

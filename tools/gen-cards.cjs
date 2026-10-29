#!/usr/bin/env node
/**
 * Generates the two profile cards as local SVGs, so the README never depends
 * on a third-party renderer (and never breaks when that renderer is blocked).
 *
 *   assets/github-stats.svg     420 x 190
 *   assets/top-languages.svg    420 x 190
 *
 * Typography and motion are borrowed from assets/xiaogao-code.svg so the
 * three cards read as one terminal session: same embedded JetBrains Mono
 * faces, same type scale (15 / 15.5 / 13.5), same fade-in + typing cursor.
 *
 * Usage:  GITHUB_TOKEN=... node tools/gen-cards.cjs
 * The token is optional but strongly recommended: without it the REST API is
 * limited to 60 requests per hour, which is not enough for the commit counts.
 */

const fs = require('node:fs');
const path = require('node:path');

const USER = process.env.GH_USER || 'Ashleycurry';
const TOKEN = process.env.GITHUB_TOKEN || '';
const API = 'https://api.github.com';
const OUT_DIR = path.join(__dirname, '..', 'assets');

const C = {
  bg: '#1C1B19',
  border: '#3F3D39',
  title: '#38BDF8',
  text: '#E6E4DE',
  muted: '#8B8880',
  accent: '#7DD3FC',
};

// Reuse the exact woff2 faces embedded in the terminal panel, so the cards keep
// JetBrains Mono even on machines that never installed it. If the panel is
// missing we fall back to the same stack without the embedded payload.
const PANEL_SVG = path.join(__dirname, '..', 'assets', 'xiaogao-code.svg');
const FONT_STACK = "JBM,'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";

function fontCss() {
  let faces = '';
  try {
    const src = fs.readFileSync(PANEL_SVG, 'utf8');
    faces = (src.match(/@font-face\{[^}]*\}/g) || []).join('');
  } catch {
    faces = '';
  }
  const embed = faces.includes('woff2') ? faces : '';
  return `<style>${embed}text{font-family:${FONT_STACK}}</style>`;
}

// Type scale copied verbatim from assets/xiaogao-code.svg.
const FS = { title: 15, body: 15.5, meta: 13.5, ringBig: 22, ringSmall: 11 };

// Character advance of JetBrains Mono at a given font size (0.6em).
const advance = (size) => size * 0.6;

const LANG_COLORS = {
  'C': '#555555', 'C++': '#f34b7d', 'C#': '#178600', 'Python': '#3572A5',
  'Java': '#b07219', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
  'HTML': '#e34c26', 'CSS': '#563d7c', 'SCSS': '#c6538c', 'Shell': '#89e051',
  'Batchfile': '#C1F12E', 'PowerShell': '#012456', 'CMake': '#DA3434',
  'Makefile': '#427819', 'Dockerfile': '#384d54', 'Assembly': '#6E4C13',
  'Verilog': '#b2b7f8', 'VHDL': '#adb2cb', 'MATLAB': '#e16737',
  'Jupyter Notebook': '#DA5B0B', 'Go': '#00ADD8', 'Rust': '#dea584',
  'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138', 'Kotlin': '#A97BFF',
  'Dart': '#00B4AB', 'Lua': '#000080', 'Vue': '#41b883', 'TeX': '#3D6117',
  'Markdown': '#083fa1', 'Objective-C': '#438eff', 'R': '#198CE7',
  'Scala': '#c22d40', 'Haskell': '#5e5086', 'Processing': '#0096D8',
  'M': '#555555', 'Objective-C++': '#6866fb', 'QML': '#44a51c',
};

const ICONS = {
  star: 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.751.751 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z',
  commits: 'M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z',
  prs: 'M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z',
  issues: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z',
};

function headers() {
  const h = { 'User-Agent': `${USER}-profile-card-generator`, Accept: 'application/vnd.github+json' };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function api(url, { allowFail = false } = {}) {
  const res = await fetch(url, { headers: headers() });
  if (res.status === 204 || res.status === 409) return { body: null, res };
  if (!res.ok) {
    if (allowFail) return { body: null, res };
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return { body: await res.json(), res };
}

async function listRepos() {
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const { body } = await api(`${API}/users/${USER}/repos?per_page=100&type=owner&page=${page}`);
    if (!body || body.length === 0) break;
    repos.push(...body);
    if (body.length < 100) break;
  }
  return repos.filter((r) => !r.fork);
}

async function countCommitsBy(repo) {
  const url = `${API}/repos/${repo.full_name}/commits?author=${encodeURIComponent(USER)}&per_page=1`;
  const { body, res } = await api(url, { allowFail: true });
  if (res.status === 204 || res.status === 409) return 0;
  const link = res.headers.get('link');
  if (link) {
    const m = /[?&]page=(\d+)>;\s*rel="last"/.exec(link);
    if (m) return Number(m[1]);
  }
  return Array.isArray(body) ? body.length : 0;
}

async function countSearch(q) {
  const { body } = await api(`${API}/search/issues?q=${encodeURIComponent(q)}&per_page=1`, { allowFail: true });
  return body && typeof body.total_count === 'number' ? body.total_count : 0;
}

const pct = (x, median) => 1 - Math.pow(2, -x / median);

function computeRank({ commits, prs, issues, stars, followers }) {
  const score =
    (2 * pct(commits, 1000) +
      3 * pct(prs, 50) +
      1 * pct(issues, 25) +
      4 * pct(stars, 50) +
      1 * pct(followers, 10)) / 11;
  const percentile = (1 - score) * 100;
  const thresholds = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const levels = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
  let idx = 0;
  for (let i = 0; i < thresholds.length; i++) if (percentile >= thresholds[i]) idx = i;
  return { level: levels[idx], percentile };
}

function shortNum(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function arcPath(cx, cy, r, fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  if (f >= 0.9999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  }
  const a = f * 2 * Math.PI - Math.PI / 2;
  const x = (cx + r * Math.cos(a)).toFixed(2);
  const y = (cy + r * Math.sin(a)).toFixed(2);
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

// --- motion primitives, same vocabulary as assets/xiaogao-code.svg ---------
// Every element starts at opacity 0 and fades in with a frozen 0.4s tween;
// titles additionally reveal left-to-right through an animated clipPath and
// carry a blinking underscore, exactly like the "Welcome to my GitHub!" line.

const fade = (begin, dur = 0.4) =>
  `<animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;

const hideAt = (t) =>
  `<animate attributeName="opacity" from="1" to="0" begin="${t}s" dur="0.01s" fill="freeze"/>`;

function typingTitle(id, text, x, y, begin, charsPerSec = 20) {
  // Measured at 8.96px/char for a 15px JetBrains Mono title, i.e. the nominal
  // 0.6em advance; 1.02 keeps the clip a couple of pixels past the last glyph
  // without letting the cursor visibly outrun the text.
  const adv = advance(FS.title) * 1.02;
  const dur = (text.length / charsPerSec).toFixed(2);
  const end = (begin + Number(dur)).toFixed(2);
  const width = (text.length * adv).toFixed(1);
  const xs = Array.from({ length: text.length + 1 }, (_, i) => (x + i * adv).toFixed(1)).join(';');

  const defs =
    `<clipPath id="${id}"><rect x="${x}" y="${y - FS.title - 4}" width="0" height="${FS.title + 8}">` +
    `<animate attributeName="width" from="0" to="${width}" begin="${begin}s" dur="${dur}s" fill="freeze"/></rect></clipPath>`;

  const body =
    `<text x="${x}" y="${y}" font-size="${FS.title}" font-weight="700" fill="${C.title}" opacity="0" clip-path="url(#${id})">` +
    `${fade(begin, 0.2)}${esc(text)}</text>\n  ` +
    `<g opacity="0">${fade(begin, 0.01)}${hideAt(end)}` +
    `<text x="${x}" y="${y}" font-size="${FS.title}" font-weight="700" fill="${C.title}">` +
    `<animate attributeName="x" values="${xs}" calcMode="discrete" begin="${begin}s" dur="${dur}s" fill="freeze"/>` +
    `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1.06s" begin="${begin}s" repeatCount="indefinite"/>` +
    `_</text></g>`;

  return { defs, body };
}

function statRow(y, icon, label, value, begin) {
  const anim = fade(begin);
  return [
    `<g transform="translate(25, ${y - 11})" opacity="0">${anim}`,
    `<path d="${ICONS[icon]}" fill="${C.accent}"/>`,
    `</g>`,
    `<text x="47" y="${y}" font-size="${FS.body}" fill="${C.text}" opacity="0">${anim}${esc(label)}: <tspan font-weight="700">${esc(value)}</tspan></text>`,
  ].join('');
}

function statsSvg({ stars, commits, prs, issues, followers, rank }) {
  const W = 420;
  const H = 190;
  const cx = 352;
  const cy = 100;
  const r = 40;
  const sweep = (100 - rank.percentile) / 100;
  const title = `${USER}'s GitHub Stats`;
  const t = typingTitle('tStats', title, 25, 33, 0.2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="statsTitle">
  <title id="statsTitle">${esc(title)}</title>
  ${fontCss()}
  <defs>${t.defs}</defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  ${t.body}
  ${statRow(68, 'star', 'Total Stars', shortNum(stars), 0.9)}
  ${statRow(96, 'commits', 'Total Commits', shortNum(commits), 1.05)}
  ${statRow(124, 'prs', 'Total PRs', shortNum(prs), 1.2)}
  ${statRow(152, 'issues', 'Total Issues', shortNum(issues), 1.35)}
  <g opacity="0">${fade(0.75, 0.6)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="9" opacity="0.55"/>
    <path d="${arcPath(cx, cy, r, sweep)}" fill="none" stroke="${C.title}" stroke-width="9"/>
  </g>
  <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="${FS.ringBig}" font-weight="700" fill="${C.title}" opacity="0">${fade(1.3, 0.5)}${esc(rank.level)}</text>
  <text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="${FS.ringSmall}" fill="${C.muted}" opacity="0">${fade(1.4, 0.5)}Rank</text>
  <text x="25" y="176" font-size="${FS.meta}" fill="${C.muted}" opacity="0">${fade(1.5)}${shortNum(followers)} follower${followers === 1 ? '' : 's'}</text>
</svg>
`;
}

function langsSvg(langs) {
  const W = 420;
  const H = 190;
  const rows = langs.slice(0, 7);
  const restPct = langs.slice(7).reduce((s, l) => s + l.percent, 0);

  // Donut: one dasharray segment per slice, walked clockwise from 12 o'clock.
  // Everything below the seventh place is folded into a neutral "other" arc so
  // the ring always closes at 360 degrees.
  const cx = 350;
  const cy = 97;
  const r = 40;
  const CIRC = 2 * Math.PI * r;
  const slices = rows.map((l) => ({ percent: l.percent, color: LANG_COLORS[l.name] || C.muted }));
  if (restPct > 0.05) slices.push({ percent: restPct, color: C.border });

  let walked = 0;
  const arcs = slices
    .map((s) => {
      const len = (CIRC * s.percent) / 100;
      // A fixed gap would swallow thin slices whole (Python is only ~3px of
      // arc), so the separator shrinks with the slice and never exceeds 30%.
      const gap = Math.min(2.2, len * 0.3);
      const visible = Math.max(len - gap, 0.6);
      const seg =
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="9" ` +
        `stroke-dasharray="${visible.toFixed(2)} ${CIRC.toFixed(2)}" stroke-dashoffset="${(-walked).toFixed(2)}" ` +
        `transform="rotate(-90 ${cx} ${cy})"/>`;
      walked += len;
      return seg;
    })
    .join('');

  const body = rows
    .map((l, i) => {
      const y = 60 + i * 18;
      const anim = fade((0.9 + i * 0.12).toFixed(2));
      const color = LANG_COLORS[l.name] || C.muted;
      return [
        `<g opacity="0">${anim}<circle cx="28" cy="${y - 5}" r="4.5" fill="${color}"/></g>`,
        `<text x="42" y="${y}" font-size="${FS.body}" fill="${C.text}" opacity="0">${anim}${esc(l.name)}</text>`,
        `<text x="296" y="${y}" text-anchor="end" font-size="${FS.meta}" fill="${C.muted}" opacity="0">${anim}${l.percent.toFixed(2)}%</text>`,
      ].join('');
    })
    .join('\n  ');

  const title = 'Most Used Languages';
  const t = typingTitle('tLangs', title, 25, 33, 0.2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="langsTitle">
  <title id="langsTitle">${esc(title)}</title>
  ${fontCss()}
  <defs>${t.defs}</defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  ${t.body}
  ${body}
  <g opacity="0">${fade(0.75, 0.6)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="9" opacity="0.55"/>
    ${arcs}
  </g>
  <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="${FS.ringBig}" font-weight="700" fill="${C.text}" opacity="0">${fade(1.3, 0.5)}${langs.length}</text>
  <text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="${FS.ringSmall}" fill="${C.muted}" opacity="0">${fade(1.4, 0.5)}Langs</text>
</svg>
`;
}

async function main() {
  console.log(`fetching ${USER} ...`);
  const { body: user } = await api(`${API}/users/${USER}`);
  const repos = await listRepos();
  console.log(`  repos (non-fork): ${repos.length}`);

  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  const langBytes = new Map();
  let commits = 0;
  for (const repo of repos) {
    const [c, langs] = await Promise.all([
      countCommitsBy(repo),
      api(`${API}/repos/${repo.full_name}/languages`, { allowFail: true }),
    ]);
    commits += c;
    if (langs.body) {
      for (const [name, bytes] of Object.entries(langs.body)) {
        langBytes.set(name, (langBytes.get(name) || 0) + bytes);
      }
    }
    console.log(`  ${repo.name}: ${c} commits, ${langs.body ? Object.keys(langs.body).length : 0} langs`);
  }

  const [prs, issues] = await Promise.all([
    countSearch(`is:pr author:${USER}`),
    countSearch(`is:issue author:${USER}`),
  ]);
  const followers = user.followers || 0;

  const totalBytes = [...langBytes.values()].reduce((a, b) => a + b, 0) || 1;
  const langs = [...langBytes.entries()]
    .map(([name, bytes]) => ({ name, bytes, percent: (bytes / totalBytes) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);

  const rank = computeRank({ commits, prs, issues, stars, followers });
  const stats = { stars, commits, prs, issues, followers, rank };

  console.log('');
  console.log(`  stars=${stars} commits=${commits} prs=${prs} issues=${issues} followers=${followers}`);
  console.log(`  rank=${rank.level} (percentile ${rank.percentile.toFixed(1)})`);
  console.log(`  languages: ${langs.slice(0, 8).map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join(', ')}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const statsPath = path.join(OUT_DIR, 'github-stats.svg');
  const langsPath = path.join(OUT_DIR, 'top-languages.svg');
  fs.writeFileSync(statsPath, statsSvg(stats), 'utf8');
  fs.writeFileSync(langsPath, langsSvg(langs), 'utf8');
  console.log('');
  console.log(`written: ${statsPath}`);
  console.log(`written: ${langsPath}`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});

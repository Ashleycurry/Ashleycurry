#!/usr/bin/env node
/**
 * Generates the two profile cards as local SVGs, so the README never depends
 * on a third-party renderer (and never breaks when that renderer is blocked).
 *
 *   assets/github-stats.svg     437 x 190
 *   assets/top-languages.svg    405 x 190
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

const FONT = "'Segoe UI', Ubuntu, Sans-Serif";

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

function statRow(y, icon, label, value) {
  return [
    `<g transform="translate(25, ${y - 11})">`,
    `<path d="${ICONS[icon]}" fill="${C.accent}" transform="scale(1)"/>`,
    `</g>`,
    `<text x="47" y="${y}" font-size="14" fill="${C.text}">${esc(label)}: <tspan font-weight="700">${esc(value)}</tspan></text>`,
  ].join('');
}

function statsSvg({ stars, commits, prs, issues, followers, rank }) {
  const W = 437;
  const H = 190;
  const cx = 370;
  const cy = 100;
  const r = 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="statsTitle">
  <title id="statsTitle">${esc(USER)}'s GitHub Stats</title>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <text x="25" y="35" font-family="${FONT}" font-size="18" font-weight="600" fill="${C.title}">${esc(USER)}'s GitHub Stats</text>
  ${statRow(68, 'star', 'Total Stars', shortNum(stars))}
  ${statRow(96, 'commits', 'Total Commits', shortNum(commits))}
  ${statRow(124, 'prs', 'Total PRs', shortNum(prs))}
  ${statRow(152, 'issues', 'Total Issues', shortNum(issues))}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="8" opacity="0.55"/>
  <path d="${arcPath(cx, cy, r, (100 - rank.percentile) / 100)}" fill="none" stroke="${C.title}" stroke-width="8" stroke-linecap="round"/>
  <text x="${cx}" y="${cy + 9}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" fill="${C.title}">${esc(rank.level)}</text>
  <text x="${cx}" y="${cy + 27}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="${C.muted}">Rank</text>
  <text x="25" y="176" font-family="${FONT}" font-size="12" fill="${C.muted}">${shortNum(followers)} follower${followers === 1 ? '' : 's'}</text>
</svg>
`;
}

function langsSvg(langs) {
  const W = 405;
  const H = 190;
  const rows = langs.slice(0, 8);
  const body = rows
    .map((l, i) => {
      const y = 58 + i * 17;
      const color = LANG_COLORS[l.name] || C.muted;
      return [
        `<circle cx="30" cy="${y - 4.5}" r="5" fill="${color}"/>`,
        `<text x="45" y="${y}" font-family="${FONT}" font-size="13" fill="${C.text}">${esc(l.name)}</text>`,
        `<text x="380" y="${y}" text-anchor="end" font-family="${FONT}" font-size="13" fill="${C.muted}">${l.percent.toFixed(2)}%</text>`,
      ].join('');
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="langsTitle">
  <title id="langsTitle">Most Used Languages</title>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <text x="25" y="32" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.title}">Most Used Languages</text>
  ${body}
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

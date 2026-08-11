#!/usr/bin/env node
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESUME_PATH = path.join(__dirname, "../src/data/resume-data.ts");
const PORT = 4322;

function readResume() {
  const src = fs.readFileSync(RESUME_PATH, "utf-8");
  // The file format is: // comment\nexport const RESUME_DATA = <JSON object>;
  const match = src.match(/export const RESUME_DATA\s*=\s*(\{[\s\S]*\});\s*$/);
  if (!match) throw new Error("Could not parse resume-data.ts — expected `export const RESUME_DATA = {...};`");
  return JSON.parse(match[1]);
}

function writeResume(data) {
  const body = JSON.stringify(data, null, 2);
  const src = `// Edit this file via \`pnpm admin\` (http://localhost:${PORT}) or directly.\nexport const RESUME_DATA = ${body};\n`;
  fs.writeFileSync(RESUME_PATH, src);
}

function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHTML(data) {
  const dataJson = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Portfolio Editor</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1a1a1a;min-height:100vh}

    .header{background:#fff;border-bottom:1px solid #e5e7eb;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:12px}
    .header h1{font-size:17px;font-weight:600;white-space:nowrap}
    .header-right{display:flex;align-items:center;gap:10px}
    .site-link{font-size:13px;color:#6b7280;text-decoration:none}
    .site-link:hover{color:#1a1a1a}
    .save-btn{background:#1a1a1a;color:#fff;border:none;border-radius:6px;padding:8px 20px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
    .save-btn:hover{background:#333}
    .save-btn:disabled{opacity:.6;cursor:default}

    .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;z-index:1000;transform:translateY(12px);opacity:0;transition:all .2s;pointer-events:none}
    .toast.show{transform:translateY(0);opacity:1}
    .toast.success{background:#16a34a;color:#fff}
    .toast.error{background:#dc2626;color:#fff}

    .tabs{background:#fff;border-bottom:1px solid #e5e7eb;padding:0 24px;display:flex;gap:2px;overflow-x:auto}
    .tab{padding:12px 14px;font-size:13px;font-weight:500;color:#6b7280;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;user-select:none}
    .tab.active{color:#1a1a1a;border-bottom-color:#1a1a1a}
    .tab:hover:not(.active){color:#374151}

    .content{max-width:760px;margin:0 auto;padding:28px 24px}
    .panel{display:none}
    .panel.active{display:block}

    .field{margin-bottom:16px}
    .field>label{display:block;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
    .field input,.field textarea,.field select{width:100%;padding:8px 11px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;font-family:inherit;color:#1a1a1a;outline:none;background:#fff;transition:border-color .15s}
    .field input:focus,.field textarea:focus,.field select:focus{border-color:#1a1a1a;box-shadow:0 0 0 3px rgba(0,0,0,.06)}
    .field textarea{min-height:80px;resize:vertical;line-height:1.5}
    .hint{font-size:12px;color:#9ca3af;margin-top:4px}

    .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:540px){.row{grid-template-columns:1fr}}

    .card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:10px}
    .card-header{padding:13px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;gap:12px}
    .card-header-left{display:flex;flex-direction:column;gap:2px;min-width:0}
    .card-title{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-subtitle{font-size:12px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-header-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
    .card-body{padding:16px;border-top:1px solid #f3f4f6;display:none}
    .card.open .card-body{display:block}
    .chevron{font-size:11px;color:#9ca3af;transition:transform .15s;display:inline-block}
    .card.open .chevron{transform:rotate(180deg)}

    .remove-btn{background:none;border:1px solid #e5e7eb;border-radius:4px;color:#9ca3af;font-size:12px;cursor:pointer;padding:4px 9px;line-height:1}
    .remove-btn:hover{border-color:#dc2626;color:#dc2626}

    .add-btn{width:100%;padding:10px;border:1.5px dashed #d1d5db;border-radius:6px;background:none;color:#6b7280;font-size:13px;cursor:pointer;margin-top:6px;transition:all .15s}
    .add-btn:hover{border-color:#6b7280;color:#1a1a1a;background:#fafafa}

    .checkbox-row{display:flex;align-items:center;gap:8px}
    .checkbox-row input{width:auto}
    .checkbox-row label{font-size:14px;color:#374151;cursor:pointer}

    .sub-list{display:flex;flex-direction:column;gap:8px}
    .sub-item{display:flex;gap:8px;align-items:center}
    .sub-item input,.sub-item select{flex:1;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-family:inherit}
    .sub-item select{flex:0 0 120px}

    .tags{display:flex;flex-wrap:wrap;gap:6px;min-height:32px}
    .tag{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:100px;padding:4px 10px;font-size:13px;display:flex;align-items:center;gap:6px}
    .tag-x{background:none;border:none;cursor:pointer;color:#9ca3af;font-size:15px;line-height:1;padding:0 0 1px}
    .tag-x:hover{color:#dc2626}
    .tag-input-row{display:flex;gap:8px;margin-top:8px}
    .tag-input-row input{flex:1}
    .tag-input-row button{padding:8px 14px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap}
    .tag-input-row button:hover{background:#e5e7eb}

    .section-label{font-size:13px;font-weight:600;color:#374151;margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6}
  </style>
</head>
<body>

<div class="header">
  <h1>Portfolio Editor</h1>
  <div class="header-right">
    <a class="site-link" href="http://localhost:4321" target="_blank">View site →</a>
    <button class="save-btn" id="save-btn" onclick="saveAll()">Save Changes</button>
  </div>
</div>

<div class="tabs" id="tabs">
  <div class="tab active" data-panel="identity">Identity</div>
  <div class="tab" data-panel="contact">Contact</div>
  <div class="tab" data-panel="work">Work</div>
  <div class="tab" data-panel="education">Education</div>
  <div class="tab" data-panel="skills">Skills</div>
  <div class="tab" data-panel="projects">Projects</div>
  <div class="tab" data-panel="photos">Photos</div>
  <div class="tab" data-panel="hackathons">Hackathons</div>
</div>

<div class="content">

  <!-- IDENTITY -->
  <div id="panel-identity" class="panel active">
    <div class="field">
      <label>Full Name / Title</label>
      <input id="name" type="text" />
      <div class="hint">Shown in the browser tab and as the page heading</div>
    </div>
    <div class="row">
      <div class="field"><label>Initials</label><input id="initials" type="text" maxlength="3" /></div>
      <div class="field"><label>Location</label><input id="location" type="text" /></div>
    </div>
    <div class="row">
      <div class="field"><label>Site URL</label><input id="url" type="url" /></div>
      <div class="field"><label>Google Maps Link</label><input id="locationLink" type="url" /></div>
    </div>
    <div class="field">
      <label>Short Description</label>
      <input id="description" type="text" />
      <div class="hint">One-line tagline shown below your name</div>
    </div>
    <div class="field">
      <label>About / Summary</label>
      <textarea id="summary" rows="5"></textarea>
      <div class="hint">Supports markdown links: [text](url)</div>
    </div>
    <div class="row">
      <div class="field">
        <label>Avatar URL</label>
        <input id="avatarUrl" type="text" />
        <div class="hint">Put your photo in /public and use /filename.png</div>
      </div>
      <div class="field">
        <label>OG Image URL</label>
        <input id="ogImage" type="text" />
        <div class="hint">Social preview image</div>
      </div>
    </div>
  </div>

  <!-- CONTACT -->
  <div id="panel-contact" class="panel">
    <div class="row">
      <div class="field"><label>Email</label><input id="contact-email" type="email" /></div>
      <div class="field"><label>Phone</label><input id="contact-tel" type="tel" /></div>
    </div>
    <div class="section-label">Social Links</div>
    ${["GitHub", "LinkedIn", "X", "Youtube"]
      .map(
        (name) => `
    <div class="card" style="margin-bottom:8px">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-header-left"><span class="card-title">${name}</span></div>
        <span class="chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="field"><label>Profile URL</label><input id="social-${name.toLowerCase()}-url" type="url" /></div>
        <div class="checkbox-row">
          <input id="social-${name.toLowerCase()}-navbar" type="checkbox" />
          <label for="social-${name.toLowerCase()}-navbar">Show in navigation bar</label>
        </div>
      </div>
    </div>`
      )
      .join("")}
  </div>

  <!-- WORK -->
  <div id="panel-work" class="panel">
    <div id="work-list"></div>
    <button class="add-btn" onclick="addWork()">+ Add Position</button>
  </div>

  <!-- EDUCATION -->
  <div id="panel-education" class="panel">
    <div id="education-list"></div>
    <button class="add-btn" onclick="addEducation()">+ Add School</button>
  </div>

  <!-- SKILLS -->
  <div id="panel-skills" class="panel">
    <div class="field">
      <label>Skills</label>
      <div class="hint" style="margin-bottom:10px">Type a skill and press Enter or click Add. The site includes icons for common skills automatically.</div>
      <div id="skills-tags" class="tags"></div>
      <div class="tag-input-row">
        <input id="skills-input" type="text" placeholder="React, Figma, Python…"
          onkeydown="if(event.key==='Enter'){event.preventDefault();addSkill()}" />
        <button onclick="addSkill()">Add</button>
      </div>
    </div>
  </div>

  <!-- PROJECTS -->
  <div id="panel-projects" class="panel">
    <div id="projects-list"></div>
    <button class="add-btn" onclick="addProject()">+ Add Project</button>
  </div>

  <!-- PHOTOS -->
  <div id="panel-photos" class="panel">
    <p class="hint" style="margin-bottom:16px">Put photos in <code>public/photos/</code> and reference them as <code>/photos/filename.jpg</code>.</p>
    <div id="photos-list" class="sub-list"></div>
    <button class="add-btn" style="margin-top:10px" onclick="addPhoto()">+ Add Photo</button>
  </div>

  <!-- HACKATHONS -->
  <div id="panel-hackathons" class="panel">
    <div id="hackathons-list"></div>
    <button class="add-btn" onclick="addHackathon()">+ Add Hackathon</button>
  </div>

</div>

<div id="toast" class="toast"></div>

<script>
const DATA = ${dataJson};
let skills = [];

// ── Tabs ──────────────────────────────────────────────────
document.getElementById('tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
});

function toggleCard(card) { card.classList.toggle('open'); }

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
function setVal(id, v) { const el = $(id); if (el) el.value = v ?? ''; }
function setChk(id, v) { const el = $(id); if (el) el.checked = !!v; }
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Populate ──────────────────────────────────────────────
function populate() {
  setVal('name', DATA.name); setVal('initials', DATA.initials);
  setVal('url', DATA.url); setVal('location', DATA.location);
  setVal('locationLink', DATA.locationLink); setVal('description', DATA.description);
  setVal('summary', DATA.summary); setVal('avatarUrl', DATA.avatarUrl);
  setVal('ogImage', DATA.ogImage);
  setVal('contact-email', DATA.contact.email);
  setVal('contact-tel', DATA.contact.tel);
  for (const [key, s] of Object.entries(DATA.contact.social || {})) {
    setVal('social-' + key.toLowerCase() + '-url', s.url);
    setChk('social-' + key.toLowerCase() + '-navbar', s.navbar);
  }
  skills = [...(DATA.skills || [])];
  renderSkills();
  (DATA.work || []).forEach(renderWork);
  (DATA.education || []).forEach(renderEducation);
  (DATA.projects || []).forEach(renderProject);
  (DATA.photos || []).forEach(renderPhoto);
  (DATA.hackathons || []).forEach(renderHackathon);
}

// ── Skills ────────────────────────────────────────────────
function renderSkills() {
  $('skills-tags').innerHTML = skills.map((s, i) =>
    \`<div class="tag">\${esc(s)}<button class="tag-x" onclick="removeSkill(\${i})">×</button></div>\`
  ).join('');
}
function addSkill() {
  const input = $('skills-input');
  const v = input.value.trim();
  if (v && !skills.includes(v)) { skills.push(v); renderSkills(); }
  input.value = ''; input.focus();
}
function removeSkill(i) { skills.splice(i, 1); renderSkills(); }

// ── Work ──────────────────────────────────────────────────
function renderWork(item = {}) {
  const list = $('work-list');
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = \`
    <div class="card-header" onclick="toggleCard(this.parentElement)">
      <div class="card-header-left">
        <span class="card-title w-company-label">\${esc(item.company) || 'New Position'}</span>
        <span class="card-subtitle">\${esc(item.title) || ''}</span>
      </div>
      <div class="card-header-right">
        <button class="remove-btn" onclick="event.stopPropagation();this.closest('.card').remove()">Remove</button>
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="field"><label>Company</label>
          <input class="w-company" type="text" value="\${esc(item.company)}"
            oninput="this.closest('.card').querySelector('.w-company-label').textContent=this.value||'New Position'" /></div>
        <div class="field"><label>Job Title</label><input class="w-title" type="text" value="\${esc(item.title)}" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Start</label><input class="w-start" type="text" value="\${esc(item.start)}" placeholder="January 2022" /></div>
        <div class="field"><label>End (blank = Present)</label><input class="w-end" type="text" value="\${esc(item.end)}" placeholder="Leave blank for Present" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Location</label><input class="w-location" type="text" value="\${esc(item.location)}" /></div>
        <div class="field"><label>Company URL</label><input class="w-href" type="url" value="\${esc(item.href)}" /></div>
      </div>
      <div class="field"><label>Logo URL</label><input class="w-logo" type="text" value="\${esc(item.logoUrl)}" placeholder="https://… or /logos/company.png" /></div>
      <div class="field"><label>Badges (comma-separated)</label><input class="w-badges" type="text" value="\${esc((item.badges||[]).join(', '))}" placeholder="Remote, Founder" /></div>
      <div class="field"><label>Description</label><textarea class="w-desc">\${esc(item.description)}</textarea></div>
    </div>\`;
  list.appendChild(d);
}
function addWork() { renderWork({}); }
function collectWork() {
  return [...document.querySelectorAll('#work-list .card')].map(c => ({
    company: c.querySelector('.w-company')?.value || '',
    title: c.querySelector('.w-title')?.value || '',
    start: c.querySelector('.w-start')?.value || '',
    end: c.querySelector('.w-end')?.value || null,
    location: c.querySelector('.w-location')?.value || '',
    href: c.querySelector('.w-href')?.value || '',
    logoUrl: c.querySelector('.w-logo')?.value || '',
    badges: (c.querySelector('.w-badges')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    description: c.querySelector('.w-desc')?.value || '',
  }));
}

// ── Education ─────────────────────────────────────────────
function renderEducation(item = {}) {
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = \`
    <div class="card-header" onclick="toggleCard(this.parentElement)">
      <div class="card-header-left">
        <span class="card-title e-school-label">\${esc(item.school) || 'New School'}</span>
        <span class="card-subtitle">\${esc(item.degree) || ''}</span>
      </div>
      <div class="card-header-right">
        <button class="remove-btn" onclick="event.stopPropagation();this.closest('.card').remove()">Remove</button>
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="field"><label>School</label>
          <input class="e-school" type="text" value="\${esc(item.school)}"
            oninput="this.closest('.card').querySelector('.e-school-label').textContent=this.value||'New School'" /></div>
        <div class="field"><label>Degree</label><input class="e-degree" type="text" value="\${esc(item.degree)}" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Start Year</label><input class="e-start" type="text" value="\${esc(item.start)}" /></div>
        <div class="field"><label>End Year</label><input class="e-end" type="text" value="\${esc(item.end)}" /></div>
      </div>
      <div class="row">
        <div class="field"><label>School URL</label><input class="e-href" type="url" value="\${esc(item.href)}" /></div>
        <div class="field"><label>Logo URL</label><input class="e-logo" type="text" value="\${esc(item.logoUrl)}" /></div>
      </div>
    </div>\`;
  $('education-list').appendChild(d);
}
function addEducation() { renderEducation({}); }
function collectEducation() {
  return [...document.querySelectorAll('#education-list .card')].map(c => ({
    school: c.querySelector('.e-school')?.value || '',
    degree: c.querySelector('.e-degree')?.value || '',
    start: c.querySelector('.e-start')?.value || '',
    end: c.querySelector('.e-end')?.value || '',
    href: c.querySelector('.e-href')?.value || '',
    logoUrl: c.querySelector('.e-logo')?.value || '',
  }));
}

// ── Projects ──────────────────────────────────────────────
function projectLinkOptions(selected) {
  return ['Website','Source','GitHub','AppStore','PlayStore'].map(t =>
    \`<option \${t===selected?'selected':''}>\${t}</option>\`).join('');
}
function renderProjectLink(l = {}) {
  return \`<div class="sub-item">
    <select class="pl-type" style="flex:0 0 110px">\${projectLinkOptions(l.type)}</select>
    <input class="pl-href" type="url" value="\${esc(l.href)}" placeholder="https://…" />
    <button class="remove-btn" onclick="this.closest('.sub-item').remove()">×</button>
  </div>\`;
}
function renderProject(item = {}) {
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = \`
    <div class="card-header" onclick="toggleCard(this.parentElement)">
      <div class="card-header-left">
        <span class="card-title p-title-label">\${esc(item.title) || 'New Project'}</span>
        <span class="card-subtitle">\${esc(item.dates) || ''}</span>
      </div>
      <div class="card-header-right">
        <button class="remove-btn" onclick="event.stopPropagation();this.closest('.card').remove()">Remove</button>
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="field"><label>Title</label>
          <input class="p-title" type="text" value="\${esc(item.title)}"
            oninput="this.closest('.card').querySelector('.p-title-label').textContent=this.value||'New Project'" /></div>
        <div class="field"><label>Dates</label><input class="p-dates" type="text" value="\${esc(item.dates)}" placeholder="Jan 2024 – Present" /></div>
      </div>
      <div class="field"><label>Project URL</label><input class="p-href" type="url" value="\${esc(item.href)}" /></div>
      <div class="field"><label>Description</label><textarea class="p-desc">\${esc(item.description)}</textarea></div>
      <div class="field"><label>Technologies (comma-separated)</label>
        <input class="p-tech" type="text" value="\${esc((item.technologies||[]).join(', '))}" placeholder="React, TypeScript, Tailwind" /></div>
      <div class="row">
        <div class="field"><label>Image path</label><input class="p-image" type="text" value="\${esc(item.image)}" placeholder="/projects/myproject.png" /></div>
        <div class="field"><label>Video URL</label><input class="p-video" type="url" value="\${esc(item.video)}" /></div>
      </div>
      <div class="checkbox-row" style="margin-bottom:14px">
        <input class="p-active" type="checkbox" \${item.active?'checked':''} id="p-active-\${Math.random().toString(36).slice(2)}" />
        <label>Currently active / in progress</label>
      </div>
      <div class="field">
        <label>Links</label>
        <div class="p-links sub-list">\${(item.links||[]).map(renderProjectLink).join('')}</div>
        <button class="add-btn" style="margin-top:6px" onclick="this.previousElementSibling.insertAdjacentHTML('beforeend', renderProjectLink())">+ Add Link</button>
      </div>
    </div>\`;
  $('projects-list').appendChild(d);
}
function addProject() { renderProject({}); }
function collectProjects() {
  return [...document.querySelectorAll('#projects-list .card')].map(c => ({
    title: c.querySelector('.p-title')?.value || '',
    href: c.querySelector('.p-href')?.value || '',
    dates: c.querySelector('.p-dates')?.value || '',
    description: c.querySelector('.p-desc')?.value || '',
    technologies: (c.querySelector('.p-tech')?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
    image: c.querySelector('.p-image')?.value || '',
    video: c.querySelector('.p-video')?.value || '',
    active: c.querySelector('.p-active')?.checked || false,
    links: [...c.querySelectorAll('.p-links .sub-item')].map(row => ({
      type: row.querySelector('.pl-type')?.value || 'Website',
      href: row.querySelector('.pl-href')?.value || '',
    })).filter(l => l.href),
  }));
}

// ── Photos ────────────────────────────────────────────────
function renderPhoto(item = {}) {
  const d = document.createElement('div');
  d.className = 'sub-item';
  d.innerHTML = \`
    <input class="ph-src" type="text" value="\${esc(item.src)}" placeholder="/photos/photo1.jpg" style="flex:2" />
    <input class="ph-alt" type="text" value="\${esc(item.alt)}" placeholder="Alt text" style="flex:1" />
    <button class="remove-btn" onclick="this.closest('.sub-item').remove()">×</button>\`;
  $('photos-list').appendChild(d);
}
function addPhoto() { renderPhoto({}); }
function collectPhotos() {
  return [...document.querySelectorAll('#photos-list .sub-item')].map(r => ({
    src: r.querySelector('.ph-src')?.value || '',
    alt: r.querySelector('.ph-alt')?.value || '',
  })).filter(p => p.src);
}

// ── Hackathons ────────────────────────────────────────────
function renderHackathon(item = {}) {
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = \`
    <div class="card-header" onclick="toggleCard(this.parentElement)">
      <div class="card-header-left">
        <span class="card-title h-title-label">\${esc(item.title)||'New Hackathon'}</span>
        <span class="card-subtitle">\${esc(item.location)||''}</span>
      </div>
      <div class="card-header-right">
        <button class="remove-btn" onclick="event.stopPropagation();this.closest('.card').remove()">Remove</button>
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="field"><label>Title</label>
          <input class="h-title" type="text" value="\${esc(item.title)}"
            oninput="this.closest('.card').querySelector('.h-title-label').textContent=this.value||'New Hackathon'" /></div>
        <div class="field"><label>Dates</label><input class="h-dates" type="text" value="\${esc(item.dates)}" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Location</label><input class="h-location" type="text" value="\${esc(item.location)}" /></div>
        <div class="field"><label>Award / Win</label><input class="h-win" type="text" value="\${esc(item.win)}" placeholder="1st Place, Best Design…" /></div>
      </div>
      <div class="field"><label>Image URL</label><input class="h-image" type="text" value="\${esc(item.image)}" /></div>
      <div class="field"><label>Description</label><textarea class="h-desc">\${esc(item.description)}</textarea></div>
    </div>\`;
  $('hackathons-list').appendChild(d);
}
function addHackathon() { renderHackathon({}); }
function collectHackathons() {
  return [...document.querySelectorAll('#hackathons-list .card')].map(c => ({
    title: c.querySelector('.h-title')?.value || '',
    dates: c.querySelector('.h-dates')?.value || '',
    location: c.querySelector('.h-location')?.value || '',
    win: c.querySelector('.h-win')?.value || null,
    image: c.querySelector('.h-image')?.value || '',
    description: c.querySelector('.h-desc')?.value || '',
    links: [],
  }));
}

// ── Save ──────────────────────────────────────────────────
async function saveAll() {
  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const payload = {
    name: $('name').value,
    initials: $('initials').value,
    url: $('url').value,
    location: $('location').value,
    locationLink: $('locationLink').value,
    description: $('description').value,
    summary: $('summary').value,
    avatarUrl: $('avatarUrl').value,
    ogImage: $('ogImage').value,
    contact: {
      email: $('contact-email').value,
      tel: $('contact-tel').value,
      social: {
        GitHub:   { url: $('social-github-url').value,   navbar: $('social-github-navbar').checked },
        LinkedIn: { url: $('social-linkedin-url').value, navbar: $('social-linkedin-navbar').checked },
        X:        { url: $('social-x-url').value,        navbar: $('social-x-navbar').checked },
        Youtube:  { url: $('social-youtube-url').value,  navbar: $('social-youtube-navbar').checked },
      },
    },
    skills: [...skills],
    work: collectWork(),
    education: collectEducation(),
    projects: collectProjects(),
    photos: collectPhotos(),
    hackathons: collectHackathons(),
  };

  try {
    const res = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.ok) {
      showToast('Saved! The site will hot-reload.');
    } else {
      showToast('Error: ' + json.error, 'error');
    }
  } catch (e) {
    showToast('Could not connect to admin server: ' + e.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Save Changes';
}

populate();
</script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "")) {
    try {
      const data = readResume();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(buildHTML(data));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error reading resume.json: " + e.message);
    }
  } else if (req.method === "POST" && req.url === "/save") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        writeResume(data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Portfolio Admin Editor`);
  console.log(`  ──────────────────────`);
  console.log(`  http://localhost:${PORT}\n`);
});

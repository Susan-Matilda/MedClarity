/**
 * MedClarity – app.js
 * Features: Auth (in-memory + sessionStorage), Report Analysis (Canvas),
 * Web Speech API, Geolocation, Canvas Profile Card, Drag-and-Drop, Share API
 * NO localStorage used anywhere in this file.
 */

'use strict';

/* ============================================================
   0.  GLOBAL STATE
============================================================ */
// In-memory account store (prototype — resets on page refresh; not a real backend)
const _accounts = new Map();

let _session = null;         // current logged-in user object
let platformVoices = [];
let dynamicSpeechRecognition = null;
let isDictating = false;
let currentAuthMode = 'signin';

// In-memory preferences (replaces localStorage for preferences)
let _prefs = { name: '', lang: '', hospital: '' };

/* ============================================================
   1.  TOAST SYSTEM
============================================================ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ============================================================
   2.  PAGE ROUTING
============================================================ */
function switchPage(pageId) {
  const views = ['view-home', 'view-upload', 'view-speech', 'view-geolocation', 'view-preferences'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== pageId);
  });
  document.querySelectorAll('.feature-tab').forEach(tab => {
    const active = tab.dataset.page === pageId;
    tab.classList.toggle('active', active);
    active ? tab.setAttribute('aria-current', 'page') : tab.removeAttribute('aria-current');
  });
  // Close dropdown if open
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToHomeSection(sectionId) {
  switchPage('view-home');
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

/* ============================================================
   3.  NAV DROPDOWN (Features)
============================================================ */
function toggleNavDropdown(el) {
  el.classList.toggle('open');
}
// Close on outside click
document.addEventListener('click', e => {
  document.querySelectorAll('.nav-dropdown').forEach(d => {
    if (!d.contains(e.target)) d.classList.remove('open');
  });
});

/* ============================================================
   4.  AUTH MODULE  (in-memory accounts + sessionStorage session)
============================================================ */
function openAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.add('open');
  document.getElementById('authEmail').focus();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function closeAuthModalOnOutsideClick(e) {
  if (e.target === document.getElementById('authModal')) closeAuthModal();
}

function toggleAuthTab(mode) {
  currentAuthMode = mode;
  const tIn  = document.getElementById('tabSignIn');
  const tUp  = document.getElementById('tabSignUp');
  const nf   = document.getElementById('authNameField');
  const ni   = document.getElementById('authName');
  const sb   = document.getElementById('authSubmitBtn');
  const cf   = document.getElementById('authConfirmField');
  const ci   = document.getElementById('authConfirmPassword');
  const pw   = document.getElementById('authPassword');
  const pr   = document.getElementById('passwordRules');

  clearAuthValidation();
  pw.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';

  const activeClass  = 'w-1/2 pb-3 brand font-bold text-sm text-blue-700 border-b-2 border-blue-700 transition';
  const inactiveClass = 'w-1/2 pb-3 brand font-bold text-sm text-slate-400 hover:text-slate-600 transition';

  if (mode === 'signin') {
    tIn.className = activeClass; tUp.className = inactiveClass;
    nf.classList.add('hidden'); ni.removeAttribute('required');
    cf.classList.add('hidden'); ci.removeAttribute('required');
    pr.classList.add('hidden');
    sb.textContent = 'Sign In';
  } else {
    tUp.className = activeClass; tIn.className = inactiveClass;
    nf.classList.remove('hidden'); ni.setAttribute('required', 'required');
    cf.classList.remove('hidden'); ci.setAttribute('required', 'required');
    pr.classList.remove('hidden');
    sb.textContent = 'Create Account';
  }
}

/* --- Field validation helpers --- */
function setAuthFieldState(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + 'Error');
  field.classList.remove('input-invalid', 'input-valid');
  field.removeAttribute('aria-invalid');
  if (message) {
    field.classList.add('input-invalid');
    field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
    return false;
  }
  if (field.value.trim()) field.classList.add('input-valid');
  if (error) error.textContent = '';
  return true;
}

function validateAuthField(fieldId) {
  const value = document.getElementById(fieldId).value.trim();
  if (fieldId === 'authName') {
    if (currentAuthMode === 'signin') return true;
    if (value.length < 2) return setAuthFieldState(fieldId, 'Enter your full name (at least 2 characters).');
    if (!/^[\p{L}][\p{L}\s.'-]+$/u.test(value)) return setAuthFieldState(fieldId, 'Name can only contain letters, spaces, and . \' -');
  }
  if (fieldId === 'authEmail') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)) return setAuthFieldState(fieldId, 'Enter a valid email address (e.g. you@gmail.com).');
  }
  if (fieldId === 'authPassword') {
    if (!value) return setAuthFieldState(fieldId, 'Please enter a password.');
    if (currentAuthMode === 'signup' && (
      value.length < 8 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) ||
      !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)
    )) return setAuthFieldState(fieldId, 'Use 8+ characters with uppercase, lowercase, a number and a symbol (e.g. @).');
  }
  if (fieldId === 'authConfirmPassword') {
    if (currentAuthMode === 'signin') return true;
    if (!value) return setAuthFieldState(fieldId, 'Please confirm your password.');
    if (value !== document.getElementById('authPassword').value) return setAuthFieldState(fieldId, 'Passwords do not match. Please re-enter.');
  }
  return setAuthFieldState(fieldId, '');
}

function validateAuthForm() {
  const fields = currentAuthMode === 'signup'
    ? ['authName', 'authEmail', 'authPassword', 'authConfirmPassword']
    : ['authEmail', 'authPassword'];
  const results = fields.map(validateAuthField);
  const firstInvalid = fields.find((_, i) => !results[i]);
  if (firstInvalid) document.getElementById(firstInvalid).focus();
  return results.every(Boolean);
}

function clearAuthValidation() {
  ['authName', 'authEmail', 'authPassword', 'authConfirmPassword'].forEach(id => {
    const f = document.getElementById(id); if (!f) return;
    const e = document.getElementById(id + 'Error');
    f.classList.remove('input-invalid', 'input-valid');
    f.removeAttribute('aria-invalid');
    if (e) e.textContent = '';
  });
}

/* --- Simple password hash (SHA-256 via SubtleCrypto) --- */
async function hashPassword(email, password) {
  const input = new TextEncoder().encode(email.toLowerCase() + '::medclarity::' + password);
  if (window.crypto && window.crypto.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', input);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  // Fallback FNV-1a
  let h = 2166136261;
  input.forEach(byte => { h ^= byte; h = Math.imul(h, 16777619); });
  return 'fallback-' + (h >>> 0).toString(16);
}

/* --- Auth submit handler --- */
async function handleAuthSubmit(e) {
  e.preventDefault();
  if (!validateAuthForm()) return;

  const name  = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('authPassword').value;

  if (currentAuthMode === 'signup') {
    if (_accounts.has(email)) {
      setAuthFieldState('authEmail', 'An account with this email already exists. Please sign in instead.');
      document.getElementById('authEmail').focus();
      return;
    }
    const hash = await hashPassword(email, pass);
    _accounts.set(email, { name, email, hash, createdAt: new Date().toISOString() });
    _session = { name, email };
    showToast('✓ Account created! Welcome, ' + name + '.', 'success');
  } else {
    const account = _accounts.get(email);
    if (!account) {
      setAuthFieldState('authEmail', 'No account found with this email. Please create an account first.');
      document.getElementById('authEmail').focus();
      return;
    }
    const hash = await hashPassword(email, pass);
    if (account.hash !== hash) {
      setAuthFieldState('authPassword', 'Incorrect password. Please try again.');
      document.getElementById('authPassword').focus();
      return;
    }
    _session = { name: account.name, email: account.email };
    showToast('✓ Welcome back, ' + account.name + '!', 'success');
  }

  // Persist session in sessionStorage so it survives soft refreshes
  try { sessionStorage.setItem('mc_session', JSON.stringify(_session)); } catch(_) {}

  document.getElementById('authForm').reset();
  clearAuthValidation();
  closeAuthModal();
  updateAuthUI();
}

function handleLogout() {
  _session = null;
  try { sessionStorage.removeItem('mc_session'); } catch(_) {}
  showToast('You have been signed out.', 'info');
  updateAuthUI();
}

function updateAuthUI() {
  const profileDiv  = document.getElementById('authProfile');
  const authBtn     = document.getElementById('btnNavAuth');
  const navUserName = document.getElementById('navUserName');

  if (_session) {
    navUserName.textContent = _session.name;
    profileDiv.classList.remove('hidden');
    authBtn.classList.add('hidden');
    // Pre-fill preferences name
    const prefName = document.getElementById('prefName');
    if (prefName && !prefName.value) prefName.value = _session.name;
  } else {
    profileDiv.classList.add('hidden');
    authBtn.classList.remove('hidden');
  }
}

/* ============================================================
   5.  FILE SYSTEM ACCESS + DRAG-AND-DROP API
============================================================ */
async function openFilePickerNative() {
  if (!('showOpenFilePicker' in window)) {
    createFallbackFileInput();
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Medical Reports',
        accept: {
          'image/*':        ['.png', '.jpg', '.jpeg'],
          'text/plain':     ['.txt'],
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
      }],
      multiple: false
    });
    processPlatformFile(await handle.getFile());
  } catch (err) {
    if (err.name !== 'AbortError') showToast('Could not open file: ' + err.message, 'error');
  }
}

function createFallbackFileInput() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.pdf,.png,.jpg,.jpeg,.txt,.docx';
  inp.onchange = e => { if (e.target.files.length > 0) processPlatformFile(e.target.files[0]); };
  inp.click();
}

async function processPlatformFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['pdf','docx','txt','png','jpg','jpeg'];
  if (!allowed.includes(ext)) {
    showAnalysisError('This file type cannot be analyzed. Please choose a PDF, Word (DOCX), plain text, or image file.');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showAnalysisError('This file is larger than 15 MB. Please choose a smaller report.');
    return;
  }

  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
  document.getElementById('fileType').textContent = file.type || 'unknown type';
  document.getElementById('fileDetails').classList.remove('hidden');
  document.getElementById('analysisDashboard').classList.add('hidden');
  document.getElementById('analysisError').classList.add('hidden');
  document.getElementById('analysisLoading').classList.remove('hidden');

  try {
    let analysis;
    if (file.type.startsWith('image/') || ['png','jpg','jpeg'].includes(ext)) {
      analysis = await analyzeMedicalImage(file);
    } else {
      const text = await extractReportText(file, ext);
      if (!text || text.trim().length < 20) throw new Error('Very little readable text was found. If this is a scanned image, upload a JPG or PNG instead.');
      analysis = analyzeReportText(text);
      // Share summary to Voice page
      const ta = document.getElementById('speechText');
      if (ta) ta.value = analysis.summary;
    }
    renderAnalysisDashboard(analysis);
    showToast('✓ Report read successfully! See your results below.', 'success');
  } catch (err) {
    showAnalysisError(err.message || 'The report could not be read. Please try another file.');
  } finally {
    document.getElementById('analysisLoading').classList.add('hidden');
  }
}

async function extractReportText(file, ext) {
  if (ext === 'txt') return file.text();
  if (ext === 'pdf') {
    if (!window.pdfjsLib) throw new Error('PDF reader is loading. Please wait a moment and try again.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      pages.push(content.items.map(i => i.str).join(' '));
    }
    return pages.join('\n');
  }
  if (ext === 'docx') {
    if (!window.mammoth) throw new Error('Word reader is loading. Please wait a moment and try again.');
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  throw new Error('Older .doc files are not supported. Please save the report as DOCX, PDF, or TXT and try again.');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, s = ['Bytes','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

/* ============================================================
   6.  REPORT ANALYSIS ENGINE
============================================================ */
function analyzeReportText(rawText) {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  const termGroups = {
    'Blood health':   ['hemoglobin','platelet','white blood cell','wbc','red blood cell','rbc','cbc'],
    'Blood sugar':    ['glucose','blood sugar','hba1c','a1c'],
    'Heart health':   ['cholesterol','triglyceride','hdl','ldl','blood pressure','heart rate'],
    'Kidney health':  ['creatinine','urea','egfr','kidney'],
    'Liver health':   ['bilirubin','albumin','alt','ast','liver'],
    'Thyroid':        ['thyroid','tsh','t3','t4'],
    'Inflammation':   ['crp','esr','inflammation']
  };

  const matchedGroups = [];
  let termCount = 0;
  Object.entries(termGroups).forEach(([group, terms]) => {
    const matched = terms.filter(t => new RegExp('\\b' + t.replace(/\s+/g,'\\s+') + '\\b','i').test(lower));
    if (matched.length) matchedGroups.push({ group, terms: matched });
    termCount += matched.length;
  });

  const readings = text.match(/\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|mmol\/L|mEq\/L|U\/L|IU\/L|mmHg|bpm|%|cells?\/\w+|\/µ?L|cm|mm)\b/gi) || [];
  const flagPattern = /\b(?:abnormal|elevated|high|low|decreased|positive|negative|critical|urgent|follow[- ]?up|out of range)\b/gi;
  const flags = text.match(flagPattern) || [];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const important = sentences.filter(s => /impression|conclusion|overall|normal|abnormal|recommend|follow|indicat|diagnos|result/i.test(s));
  const chosen = (important.length ? important : sentences).slice(0, 3).map(s => s.trim());
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const summary = chosen.join(' ').slice(0, 700) || 'The report has readable medical information, but no clear conclusion was found automatically. Please read it with your doctor.';

  const findings = matchedGroups.slice(0, 4).map(item => ({
    icon: 'fa-circle-check', color: 'text-blue-600',
    title: item.group,
    detail: 'This report mentions: ' + item.terms.slice(0, 3).join(', ') + '.'
  }));

  if (flags.length) findings.unshift({
    icon: 'fa-triangle-exclamation', color: 'text-amber-500',
    title: 'Words that need attention',
    detail: 'The report uses these words: ' + Array.from(new Set(flags.map(f => f.toLowerCase()))).slice(0, 6).join(', ') + '. Please ask your doctor what they mean for you.'
  });

  if (!findings.length) findings.push({
    icon: 'fa-circle-info', color: 'text-slate-400',
    title: 'General report',
    detail: 'No common lab test category was identified. This could be a prescription or a general letter.'
  });

  return {
    kind: 'text', summary, findings, termCount,
    readingCount: readings.length, flagCount: flags.length, wordCount,
    chart: [Math.min(termCount, 20), Math.min(readings.length, 20), Math.min(flags.length, 20), Math.min(Math.ceil(wordCount / 50), 20)]
  };
}

function analyzeMedicalImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas');
      const scale = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
      c.width  = Math.max(1, Math.round(img.naturalWidth  * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, sq = 0;
      for (let i = 0; i < px.length; i += 16) {
        const b = px[i] * .299 + px[i+1] * .587 + px[i+2] * .114;
        sum += b; sq += b * b;
      }
      const n = px.length / 16;
      const avg = sum / n;
      const contrast = Math.sqrt(Math.max(0, sq / n - avg * avg));
      const resScore = Math.min(100, Math.round((img.naturalWidth * img.naturalHeight / 2000000) * 100));
      const briScore = Math.max(0, Math.round(100 - Math.abs(145 - avg) * .7));
      const conScore = Math.min(100, Math.round(contrast * 2.2));
      URL.revokeObjectURL(url);
      const good = briScore >= 60 && conScore >= 40;
      resolve({
        kind: 'image', termCount: 0, readingCount: 0, flagCount: 0, wordCount: 0,
        summary: `This image is ${img.naturalWidth} × ${img.naturalHeight} pixels. The brightness and contrast are ${good ? 'good for reading' : 'possibly too low for reading — try uploading a clearer photo'}. To read text from the report, please upload a PDF or text file instead.`,
        findings: [
          { icon: 'fa-expand',            color: 'text-blue-500', title: 'Image size',    detail: `${img.naturalWidth} × ${img.naturalHeight} px — Quality score: ${resScore}%` },
          { icon: 'fa-sun',               color: 'text-amber-500', title: 'Brightness',  detail: `${briScore}% — ${briScore >= 60 ? 'Good' : 'May be too dark or too bright'}` },
          { icon: 'fa-circle-half-stroke', color: 'text-indigo-500', title: 'Contrast', detail: `${conScore}% — ${conScore >= 40 ? 'Clear enough to read' : 'May be hard to read'}` }
        ],
        chart: [resScore / 5, briScore / 5, conScore / 5, Math.min(20, file.size / 250000)]
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The image could not be opened. Please try a different PNG or JPG.')); };
    img.src = url;
  });
}

/* ============================================================
   7.  CANVAS API – ANALYSIS BAR CHART
============================================================ */
function renderAnalysisDashboard(analysis) {
  document.getElementById('metricTerms').textContent   = analysis.termCount;
  document.getElementById('metricReadings').textContent = analysis.readingCount;
  document.getElementById('metricFlags').textContent   = analysis.flagCount;
  document.getElementById('metricWords').textContent   = analysis.wordCount;
  document.getElementById('analysisSummary').textContent = analysis.summary;

  const container = document.getElementById('analysisFindings');
  container.innerHTML = '';
  analysis.findings.forEach(f => {
    const row = document.createElement('div');
    row.className = 'flex gap-3 rounded-lg bg-slate-50 px-3 py-3';
    row.innerHTML = `<i class="fa-solid ${f.icon} ${f.color} mt-1 text-lg"></i>
      <div>
        <p class="brand text-sm font-bold text-slate-800">${f.title}</p>
        <p class="mt-0.5 text-sm leading-5 text-slate-600">${f.detail}</p>
      </div>`;
    container.appendChild(row);
  });

  document.getElementById('analysisDashboard').classList.remove('hidden');
  requestAnimationFrame(() => drawAnalysisChart(analysis.chart, analysis.kind));
}

function drawAnalysisChart(values, kind) {
  const canvas = document.getElementById('analysisCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const dw = canvas.clientWidth || 520;
  const dh = Math.round(dw * 0.56);
  canvas.width  = dw * dpr;
  canvas.height = dh * dpr;
  ctx.scale(dpr, dpr);

  const labels = kind === 'image'
    ? ['Resolution', 'Brightness', 'Contrast', 'File size']
    : ['Health terms', 'Measurements', 'Review flags', 'Text depth'];
  const colors = ['#2563eb','#4f46e5','#f59e0b','#0d9488'];
  const p = { top: 32, right: 20, bottom: 58, left: 40 };
  const W = dw - p.left - p.right;
  const H = dh - p.top  - p.bottom;

  ctx.clearRect(0, 0, dw, dh);

  // Grid lines
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = p.top + H * i / 4;
    ctx.beginPath(); ctx.moveTo(p.left, y); ctx.lineTo(dw - p.right, y); ctx.stroke();
    // Y-axis label
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px DM Sans, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(20 - 5 * i)), p.left - 6, y + 4);
  }

  const slot = W / values.length;
  values.forEach((val, i) => {
    const norm = Math.max(0, Math.min(20, val));
    const bh = norm / 20 * H;
    const bw = Math.min(64, slot * 0.55);
    const x  = p.left + slot * i + (slot - bw) / 2;
    const y  = p.top + H - bh;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, y + bh);
    grad.addColorStop(0, colors[i]);
    grad.addColorStop(1, colors[i] + '99');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, Math.max(4, bh), 8);
    ctx.fill();

    // Value label above bar
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px Sora, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(val * 10) / 10), x + bw / 2, Math.max(20, y - 8));

    // X-axis label (wrap long labels)
    ctx.fillStyle = '#475569'; ctx.font = '11px DM Sans, sans-serif';
    const words = labels[i].split(' ');
    if (words.length === 1) {
      ctx.fillText(words[0], x + bw / 2, dh - 22);
    } else {
      ctx.fillText(words[0], x + bw / 2, dh - 34);
      ctx.fillText(words.slice(1).join(' '), x + bw / 2, dh - 20);
    }
  });

  // Chart title
  ctx.fillStyle = '#64748b'; ctx.font = '11px DM Sans, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Report Signal Overview (scale 0–20)', p.left, 18);
}

function showAnalysisError(msg) {
  document.getElementById('analysisLoading').classList.add('hidden');
  document.getElementById('analysisDashboard').classList.add('hidden');
  const box = document.getElementById('analysisError');
  box.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i>${msg}`;
  box.classList.remove('hidden');
  showToast(msg, 'error');
}

/* ============================================================
   8.  CANVAS API – PATIENT PROFILE CARD (replaces localStorage prefs display)
============================================================ */
function drawProfileCard() {
  const canvas = document.getElementById('profileCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 520, H = 240;
  canvas.width  = W * (window.devicePixelRatio || 1);
  canvas.height = H * (window.devicePixelRatio || 1);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  // Card background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1d4ed8');
  bg.addColorStop(1, '#0891b2');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Decorative circle
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.arc(W - 60, 50, 90, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(50, H - 20, 70, 0, Math.PI * 2); ctx.fill();

  // Avatar circle
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.beginPath(); ctx.arc(68, 80, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Sora, sans-serif';
  ctx.textAlign = 'center';
  const initials = (_prefs.name || 'Me').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  ctx.fillText(initials, 68, 90);

  // Name
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Sora, sans-serif';
  ctx.fillText(_prefs.name || 'Patient', 126, 68);

  // Sub-labels
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '14px DM Sans, sans-serif';
  ctx.fillText('Language: ' + (_prefs.lang || 'Not set'), 126, 96);
  ctx.fillText('Hospital: ' + (_prefs.hospital || 'Not set'), 126, 118);

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 148); ctx.lineTo(W - 24, 148); ctx.stroke();

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.font = '12px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MedClarity · Patient Literacy Platform · ' + new Date().getFullYear(), W / 2, 172);

  // Badge
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.roundRect(W - 130, H - 42, 106, 28, 14); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ Preferences Saved', W - 77, H - 23);
}

/* ============================================================
   9.  PREFERENCES MODULE (in-memory, no localStorage)
============================================================ */
function savePreferences() {
  const name     = document.getElementById('prefName').value.trim();
  const lang     = document.getElementById('prefLang').value;
  const hospital = document.getElementById('prefHospital').value.trim();

  if (!name && !lang && !hospital) {
    showToast('Please fill in at least one field before saving.', 'error');
    showPrefStatus('Please enter your name, language, or hospital first.', false);
    return;
  }

  _prefs = { name: name || _prefs.name, lang: lang || _prefs.lang, hospital: hospital || _prefs.hospital };
  showToast('✓ Your preferences have been saved!', 'success');
  showPrefStatus('Done! Your Patient Profile Card has been updated below.', true);
  drawProfileCard();
}

function clearPreferences() {
  _prefs = { name: '', lang: '', hospital: '' };
  document.getElementById('prefName').value    = '';
  document.getElementById('prefLang').value    = '';
  document.getElementById('prefHospital').value = '';
  showToast('Preferences cleared.', 'info');
  showPrefStatus('All preferences have been cleared. Fill in and save again.', false);
  drawProfileCard();
}

function showPrefStatus(msg, isSuccess) {
  const el = document.getElementById('prefStatus');
  el.classList.remove('hidden');
  el.textContent = msg;
  el.className = isSuccess
    ? 'mt-5 text-base rounded-xl p-4 border bg-green-50 text-green-700 border-green-200'
    : 'mt-5 text-base rounded-xl p-4 border bg-amber-50 text-amber-700 border-amber-200';
}

/* ============================================================
   10. WEB SPEECH API – SYNTHESIS + DICTATION
============================================================ */
function setupVoiceSynthetics() {
  if (!('speechSynthesis' in window)) return;
  const update = () => {
    platformVoices = window.speechSynthesis.getVoices();
    const sel = document.getElementById('voiceSelect'); if (!sel) return;
    sel.innerHTML = '';
    platformVoices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})${v.default ? ' — System Default' : ''}`;
      sel.appendChild(opt);
    });
  };
  update();
  if (window.speechSynthesis.onvoiceschanged !== undefined)
    window.speechSynthesis.onvoiceschanged = update;
}

function readReportAloud() {
  const text = document.getElementById('speechText').value.trim();
  if (!text) { showToast('Please type or paste some text first.', 'error'); return; }
  if (!('speechSynthesis' in window)) { showToast('Your browser does not support text-to-speech.', 'error'); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const idx = document.getElementById('voiceSelect').value;
  if (platformVoices[idx]) utt.voice = platformVoices[idx];
  utt.rate = 0.92; utt.pitch = 1;
  utt.onstart = () => {
    document.getElementById('speechStatus').classList.remove('hidden');
    document.getElementById('speechStatusText').textContent = 'Reading aloud…';
    document.getElementById('btnReadAloud').classList.add('opacity-50');
  };
  utt.onend = () => {
    document.getElementById('speechStatus').classList.add('hidden');
    document.getElementById('btnReadAloud').classList.remove('opacity-50');
    showToast('✓ Done reading aloud.', 'success');
  };
  window.speechSynthesis.speak(utt);
}

function stopReading() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    document.getElementById('speechStatus').classList.add('hidden');
    document.getElementById('btnReadAloud').classList.remove('opacity-50');
    showToast('Reading stopped.', 'info');
  }
}

function setupVoiceRecognitionEngine() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  dynamicSpeechRecognition = new SR();
  dynamicSpeechRecognition.continuous = true;
  dynamicSpeechRecognition.interimResults = false;
  dynamicSpeechRecognition.lang = 'en-US';
  dynamicSpeechRecognition.onresult = e => {
    const t = e.results[e.results.length - 1][0].transcript;
    const ta = document.getElementById('speechText');
    ta.value = (ta.value.trim() + ' ' + t).trim();
    showToast('Speech added to text box.', 'success');
  };
  dynamicSpeechRecognition.onerror = () => stopDictationRuntime();
  dynamicSpeechRecognition.onend  = () => stopDictationRuntime();
}

function toggleDictation() {
  if (!dynamicSpeechRecognition) { showToast('Microphone not available in this browser.', 'error'); return; }
  if (!isDictating) {
    dynamicSpeechRecognition.start();
    isDictating = true;
    document.getElementById('micIcon').className = 'fa-solid fa-microphone-lines text-red-400 animate-ping';
    showToast('Microphone on — start speaking!', 'info');
  } else {
    dynamicSpeechRecognition.stop();
    stopDictationRuntime();
  }
}

function stopDictationRuntime() {
  isDictating = false;
  const mi = document.getElementById('micIcon');
  if (mi) mi.className = 'fa-solid fa-microphone text-white';
}

/* ============================================================
   11. WEB SHARE API
============================================================ */
function shareReport() {
  const text = document.getElementById('speechText').value.trim();
  if (!text) { showToast('There is no text to share yet.', 'error'); return; }
  if (navigator.share) {
    navigator.share({ title: 'My MedClarity Report Summary', text, url: window.location.href })
      .then(() => showToast('✓ Shared successfully!', 'success'))
      .catch(err => { if (err.name !== 'AbortError') showToast('Could not share: ' + err.message, 'error'); });
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('📋 Text copied to clipboard!', 'success'))
      .catch(() => showToast('Clipboard not available. Please copy the text manually.', 'error'));
  }
}

/* ============================================================
   12. GEOLOCATION API
============================================================ */
async function updatePermissionStatusIndicator() {
  if (!navigator.permissions) return;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    modifyPermissionBadge(status.state);
    status.onchange = () => modifyPermissionBadge(status.state);
  } catch(_) {}
}

function modifyPermissionBadge(state) {
  const badge = document.getElementById('permissionBadge');
  if (!badge) return;
  if (state === 'granted') {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-700';
    badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Location: Allowed';
  } else if (state === 'denied') {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700';
    badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Location: Blocked';
  } else {
    badge.className = 'hidden';
  }
}

function getMyLocation() {
  if (!navigator.geolocation) { showToast('Location is not available in this browser.', 'error'); return; }
  ['hospitalEmptyState','locationResult','locationError'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('hospitalLoading').classList.remove('hidden');
  showToast('📍 Finding hospitals near you…', 'info');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      document.getElementById('mapsLink').href = `https://www.google.com/maps?q=${lat},${lng}`;
      document.getElementById('hospitalSearchLink').href = `https://www.google.com/maps/search/hospitals+near+me/@${lat},${lng},14z`;
      document.getElementById('hospitalMap').src =
        `https://www.google.com/maps?q=hospitals+near+${lat},${lng}&output=embed`;
      document.getElementById('hospitalList').innerHTML =
        '<div class="rounded-2xl border border-blue-100 bg-white p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-600 text-xl"></i><p class="mt-2 text-sm text-slate-500">Loading nearby hospitals…</p></div>';
      findNearbyHospitals(lat, lng);
      showToast('✓ Location found! Loading hospitals…', 'success');
      updatePermissionStatusIndicator();
    },
    err => {
      const msgs = {
        [err.PERMISSION_DENIED]: 'Location access was blocked. Please allow it in your browser settings and try again.',
        [err.POSITION_UNAVAILABLE]: 'Your current position could not be found.',
        [err.TIMEOUT]: 'Finding your location took too long. Please try again.'
      };
      const msg = msgs[err.code] || 'Your location could not be retrieved.';
      document.getElementById('hospitalLoading').classList.add('hidden');
      document.getElementById('hospitalEmptyState').classList.remove('hidden');
      document.getElementById('locationError').classList.remove('hidden');
      document.getElementById('locationErrorText').textContent = msg;
      showToast(msg, 'error');
      updatePermissionStatusIndicator();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

async function findNearbyHospitals(lat, lng) {
  const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:8000,${lat},${lng});way["amenity"="hospital"](around:8000,${lat},${lng});relation["amenity"="hospital"](around:8000,${lat},${lng}););out center tags;`;
  const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let data = null;
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep + '?data=' + encodeURIComponent(query));
      if (!r.ok) continue;
      data = await r.json();
      break;
    } catch (_) {}
  }

  document.getElementById('hospitalLoading').classList.add('hidden');
  document.getElementById('locationResult').classList.remove('hidden');

  if (!data) { renderHospitalFallback(lat, lng, 'The live hospital directory is temporarily unavailable. You can still explore using the Google Map.'); return; }

  const hospitals = data.elements.map(el => {
    const hLat = el.lat ?? el.center?.lat;
    const hLng = el.lon ?? el.center?.lon;
    if (hLat == null || hLng == null) return null;
    return {
      name: el.tags?.name || el.tags?.['name:en'] || 'Hospital',
      emergency: el.tags?.emergency === 'yes',
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      address: formatHospitalAddress(el.tags || {}),
      lat: hLat, lng: hLng,
      distance: distanceInKm(lat, lng, hLat, hLng)
    };
  }).filter(Boolean).sort((a,b) => a.distance - b.distance).slice(0, 8);

  if (!hospitals.length) { renderHospitalFallback(lat, lng, 'No hospitals were found within 8 km. Use the Google Map to search a wider area.'); return; }

  document.getElementById('hospitalCount').textContent = hospitals.length;
  document.getElementById('locationStatus').textContent = 'Nearest first · within 8 km';
  const list = document.getElementById('hospitalList');
  list.innerHTML = '';
  hospitals.forEach((h, i) => list.appendChild(createHospitalCard(h, i)));
}

function createHospitalCard(h, i) {
  const card = document.createElement('article');
  card.className = 'hospital-card rounded-2xl border border-slate-200 bg-white p-5';
  card.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center brand text-sm font-extrabold">${String(i+1).padStart(2,'0')}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <h3 class="brand text-base font-bold text-slate-900">${h.name}</h3>
          <span class="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            ${h.distance < 1 ? Math.round(h.distance * 1000) + ' m' : h.distance.toFixed(1) + ' km'}
          </span>
        </div>
        <p class="mt-1 text-sm leading-5 text-slate-500">${h.address}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noopener"
             class="brand rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 transition">
            <i class="fa-solid fa-diamond-turn-right mr-1"></i>Get Directions
          </a>
          ${h.emergency ? '<span class="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-bold text-red-600"><i class="fa-solid fa-truck-medical mr-1"></i>Emergency Care</span>' : ''}
          ${h.phone ? `<a href="tel:${h.phone.replace(/[^+\d]/g,'')}" class="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"><i class="fa-solid fa-phone mr-1"></i>Call</a>` : ''}
        </div>
      </div>
    </div>`;
  return card;
}

function formatHospitalAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const locality = tags['addr:suburb'] || tags['addr:city'] || tags['addr:town'] || tags['addr:village'];
  return [street, locality, tags['addr:postcode']].filter(Boolean).join(', ') || 'Address available in Google Maps';
}

function distanceInKm(lat1, lng1, lat2, lng2) {
  const r2d = v => v * Math.PI / 180;
  const dLat = r2d(lat2 - lat1), dLng = r2d(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r2d(lat1)) * Math.cos(r2d(lat2)) * Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function renderHospitalFallback(lat, lng, msg) {
  document.getElementById('hospitalCount').textContent = '0';
  document.getElementById('locationStatus').textContent = 'Google Maps is available';
  const list = document.getElementById('hospitalList');
  list.innerHTML = `
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-base leading-6 text-amber-900">
      <p>${msg}</p>
      <a href="https://www.google.com/maps/search/hospitals+near+me/@${lat},${lng},13z"
         target="_blank" rel="noopener"
         class="brand mt-4 inline-block rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">
        Open Hospitals in Google Maps
      </a>
    </div>`;
}

/* ============================================================
   13. DRAG AND DROP SETUP
============================================================ */
function setupDragAndDrop() {
  const dz = document.getElementById('dropZone');
  if (!dz) return;
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragenter', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()=> dz.classList.remove('drag-over'));
  dz.addEventListener('drop',      e => {
    e.preventDefault(); dz.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) processPlatformFile(e.dataTransfer.files[0]);
  });
}

/* ============================================================
   14. BOOTSTRAP
============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Restore session if available
  try {
    const s = sessionStorage.getItem('mc_session');
    if (s) _session = JSON.parse(s);
  } catch(_) {}
  updateAuthUI();

  setupVoiceSynthetics();
  setupVoiceRecognitionEngine();
  updatePermissionStatusIndicator();
  setupDragAndDrop();

  // Draw initial empty profile canvas
  drawProfileCard();

  // Auth field live validation
  ['authName','authEmail','authPassword','authConfirmPassword'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('blur',  () => validateAuthField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('input-invalid')) validateAuthField(id);
      if (id === 'authPassword' && currentAuthMode === 'signup') {
        const c = document.getElementById('authConfirmPassword');
        if (c && c.value) validateAuthField('authConfirmPassword');
      }
    });
  });
});
"use strict";
/* =====================================================================
   NLE MANAGER — No Limit Events
   Dossiers (devis → événement), planning, logistique, équipe,
   factures, trésorerie, parc matériel. Données partagées (db).
   ===================================================================== */

const LOGO = "logo.png";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = p => (p || "x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const fmt = n => (isFinite(n) ? n : 0).toLocaleString("fr-FR", {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " €";
const fmt0 = n => (isFinite(n) ? n : 0).toLocaleString("fr-FR", {maximumFractionDigits: 0}) + " €";
const pf = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? x : 0; };
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const addDays = (iso, n) => { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
const fd = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR") : "—";
const fdShort = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {day: "numeric", month: "short"}) : "—";
const getPath = (o, p) => p.split(".").reduce((a, k) => a == null ? a : a[k], o);
const setPath = (o, p, v) => { const ks = p.split("."); let a = o; ks.slice(0, -1).forEach(k => { if (a[k] == null) a[k] = {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };

/* ---------------- Icônes ---------------- */
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6.5A7 7 0 1 0 18 17.5"/><path d="M4 10h10M4 14h10"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
};

/* ---------------- Constantes métier ---------------- */
const SLIDE_NAME = "TOBOGGAN AQUATIQUE GÉANT — 46 × 6,5 × 12 m";
const SLIDE_SPECS = ["Longueur 46 m · largeur 6,5 m · hauteur 12 m — structure en 3 parties", "5 souffleries de 1 500 W — alimentation 220 V / 16 A — puissance nécessaire ≈ 8 kW"];
const CK_STATUS = [
  ["a_prevoir", "À prévoir"], ["prevu", "Prévu"], ["charge", "Chargé"], ["retour_ok", "Revenu OK"], ["abime", "Revenu abîmé"], ["non_necessaire", "Non nécessaire"]
];
const REQ_STATUS = [["a_confirmer", "À confirmer"], ["ok", "Confirmé par le client"], ["na", "Non concerné"]];
const ROLES = ["Montage", "Surveillance", "Démontage", "Transport", "Autre"];
const PAY_METHODS = ["Virement", "Chèque", "Espèces", "CB", "Mandat administratif", "Autre"];
const DEP_CATS = ["Carburant", "Péage", "Main-d'œuvre", "Repas", "Hébergement", "Location matériel", "Entretien / réparation", "Assurance", "Stockage", "Publicité", "Frais bancaires", "Achat matériel", "Autre"];
const MAT_CATS = ["Structure", "Électricité", "Eau", "Sécurité", "Fixation", "Transport", "Outillage", "Divers"];
const MAT_STATES = [["ok", "OK"], ["verifier", "À vérifier"], ["reparer", "À réparer"], ["hs", "Hors service"]];

const DEFAULT_OPTIONS = [
  {name: "Groupe électrogène", price: 350}, {name: "Rallonges électriques", price: 40}, {name: "Tuyaux d'arrivée d'eau", price: 60},
  {name: "Barriérage", price: 150}, {name: "Personnel de surveillance (jour)", price: 280},
  {name: "Installation la veille", price: 250}, {name: "Désinstallation le lendemain", price: 250}
];
const DEFAULT_SETTINGS = {
  base: 3500, extra: 1200, forfait: 450, kmrate: 1.8, kmcost: 0.9, labor: 35, valid: 30,
  vatRegime: "franchise", vat: 0, acompte: 30, soldeDays: 7,
  coname: "NO LIMIT EVENTS", coaddr: "48 rue Alfred et Edmé Sommier, 77950 Maincy",
  cotel: "", comail: "", cosiret: "", cotva: "", iban: "", bic: "",
  pay: "Acompte de 30 % à la commande, solde au plus tard 7 jours avant l'événement.",
  legal: "Devis gratuit. En cas de retard de paiement : pénalités au taux de 3 fois le taux d'intérêt légal et indemnité forfaitaire de recouvrement de 40 € (art. L441-10 C. com.). Pas d'escompte pour paiement anticipé.",
  cgl: "", options: DEFAULT_OPTIONS
};
const VAT_FRANCHISE = "TVA non applicable, art. 293 B du CGI";


/* ---------------- État ---------------- */
const ST = {settings: clone(DEFAULT_SETTINGS), dossiers: {}, staff: {}, materiel: {}, depenses: {}, paiements: {}, factures: {}, loaded: {}};
const UI = {view: "home", dossierId: null, tab: "devis", filter: "actifs", q: "", calMonth: null, tresoMode: "annee", tresoRef: null};
let ME = null;            // utilisateur connecté
let CUR = null;           // dossier en cours d'édition (copie locale)
let dirty = false, saveTimer = null;
let STORE = null;         // adaptateur base de données
let DL = null;            // capability downloads

/* =====================================================================
   STOCKAGE — base partagée (db) ou repli local
   ===================================================================== */
function localStore() {
  const KEY = "nle_local_db";
  let data = {}; try { data = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  const subs = {};
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  const emit = c => (subs[c] || []).forEach(fn => fn(c));
  const snap = c => ({docs: Object.entries(data[c] || {}).map(([id, v]) => ({id, exists: true, data: () => v}))});
  return {
    mode: "local",
    watch(c, cb) { (subs[c] = subs[c] || []).push(() => cb(snap(c))); setTimeout(() => cb(snap(c)), 0); },
    async set(c, id, v) { (data[c] = data[c] || {})[id] = clone(v); persist(); emit(c); },
    async del(c, id) { if (data[c]) delete data[c][id]; persist(); emit(c); },
    async list(c) { return snap(c).docs.map(d => d.data()); },
    async lock() { return true; }
  };
}
function fbStore() {
  const F = window.NLEFB;
  return {
    mode: "cloud",
    watch(c, cb, err) { F.watch(c, cb, err); },
    set(c, id, v) { return F.set(c, id, clone(v)); },
    del(c, id) { return F.del(c, id); },
    list(c) { return F.list(c); },
    async lock(name) {
      for (let i = 0; i < 6; i++) { if (await F.lock(name)) return true; await new Promise(r => setTimeout(r, 900 + Math.random() * 600)); }
      return false;
    }
  };
}
async function save(coll, obj) {
  if (coll === "dossiers" || coll === "staff" || coll === "materiel") { obj.updatedAt = new Date().toISOString(); obj.updatedBy = ME ? ME.name : ""; }
  ST[coll][obj.id] = clone(obj);
  try { await STORE.set(coll, obj.id, obj); }
  catch (e) { handleWriteError(e); throw e; }
}
async function saveSettings(s) {
  ST.settings = clone(s);
  try { await STORE.set("config", "settings", s); } catch (e) { handleWriteError(e); }
}
async function remove(coll, id) {
  delete ST[coll][id];
  try { await STORE.del(coll, id); } catch (e) { handleWriteError(e); }
}
function handleWriteError(e) {
  const c = e && e.code;
  if (c === "permission-denied") toast("Enregistrement refusé : ton compte n'est pas autorisé (ou facture déjà émise).");
  else if (c === "quota_exceeded") toast("Base pleine : supprime d'anciens éléments pour continuer.");
  else toast("Échec de l'enregistrement, réessaie dans un instant.");
}

/* =====================================================================
   CONNEXION (Firebase Auth)
   ===================================================================== */
const AUTH_ERR = {"auth/invalid-credential": "Email ou mot de passe incorrect.", "auth/wrong-password": "Email ou mot de passe incorrect.", "auth/user-not-found": "Email ou mot de passe incorrect.", "auth/invalid-email": "Adresse email invalide.", "auth/too-many-requests": "Trop d'essais. Attends quelques minutes.", "auth/network-request-failed": "Pas de connexion internet."};
function initLogin() {
  let last = ""; try { last = localStorage.getItem("nle_last_email") || ""; } catch (e) {}
  if (last) { $("#lgUser").value = last; }
  $("#lgForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const email = $("#lgUser").value.trim(), pass = $("#lgPass").value;
    $("#lgErr").textContent = ""; const b = $("#lgForm button[type=submit]"); b.disabled = true; b.textContent = "Connexion…";
    try { await window.NLEFB.signIn(email, pass, $("#lgKeep").checked); try { localStorage.setItem("nle_last_email", email); } catch (e) {} }
    catch (e) { $("#lgErr").textContent = AUTH_ERR[e.code] || "Connexion impossible (" + (e.code || "erreur") + ")."; $("#lgPass").value = ""; }
    b.disabled = false; b.textContent = "Se connecter";
  });
}
function showLogin(msg) { $("#app").hidden = true; $("#login").hidden = false; $("#lgErr").textContent = msg || ""; }
function enterApp(u) {
  ME = {key: u.uid, name: u.name};
  $("#login").hidden = true; $("#app").hidden = false;
  $("#whoAmI").textContent = ME.name;
  boot();
}
async function logout() { flushSave(); try { await window.NLEFB.signOut(); } catch (e) {} location.reload(); }
$("#btnLogout").addEventListener("click", logout);

/* =====================================================================
   DÉMARRAGE + SYNCHRO
   ===================================================================== */
let booted = false;
async function boot() {
  if (booted) return; booted = true;
  renderNav(); render();
  DL = null;
  STORE = fbStore();
  $("#syncDot").title = "Synchronisé (fonctionne aussi hors connexion)";
  ["dossiers", "staff", "materiel", "depenses", "paiements", "factures", "config"].forEach(c => {
    STORE.watch(c, snap => onSnap(c, snap), () => toast("Connexion à la base interrompue. Recharge la page."));
  });
}
let renderTimer = null;
function onSnap(c, snap) {
  if (c === "config") {
    snap.docs.forEach(d => { if (d.id === "settings") ST.settings = Object.assign(clone(DEFAULT_SETTINGS), d.data()); });
  } else {
    const m = {}; snap.docs.forEach(d => { m[d.id] = d.data(); }); ST[c] = m;
  }
  ST.loaded[c] = true;
  autoFillLogistics();
  if (c === "dossiers" && CUR && UI.view === "dossier") {
    const remote = ST.dossiers[CUR.id];
    const typing = document.activeElement && $("#view").contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (remote && !dirty && !typing && JSON.stringify(remote) !== JSON.stringify(CUR)) { CUR = clone(remote); }
    else if (remote && (dirty || typing)) { scheduleRender(); return; }
  }
  scheduleRender();
}
const autoFilled = new Set();
function autoFillLogistics() {
  if (!ST.loaded.dossiers || !ST.loaded.materiel || !ST.loaded.config || !Object.keys(ST.materiel).length) return;
  Object.values(ST.dossiers).forEach(d => {
    if (d.status !== "Accepté" || autoFilled.has(d.id) || (d.checklist && d.checklist.length && d.needs && d.needs.length)) return;
    autoFilled.add(d.id);
    const x = clone(d); autoDates(x); ensureLogistics(x); logTo(x, "Matériel, besoins en personnel et points client générés");
    if (CUR && CUR.id === x.id) CUR = clone(x);
    save("dossiers", x).catch(() => {});
  });
}
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    const typing = document.activeElement && $("#view").contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (typing && (UI.view === "dossier" || UI.view === "settings")) { renderNav(); return; }
    render(true);
  }, 120);
}

/* =====================================================================
   CALCULS DEVIS
   ===================================================================== */
function computeTotals(q) {
  const days = Math.max(1, q.event.days || 1);
  const locBrut = (pf(q.slide.base) + pf(q.slide.extra) * Math.max(0, days - 1)) * Math.max(1, q.slide.qty || 1);
  const locRem = r2(locBrut * pf(q.slide.disc) / 100);
  const loc = locBrut - locRem;
  let trans = 0, kmFact = 0, kmFee = 0;
  if (q.trans.mode !== "pickup") {
    kmFact = pf(q.trans.km) * 2 * Math.max(1, q.trans.trips || 1);
    kmFee = kmFact * pf(q.trans.kmrate);
    const calcT = pf(q.trans.forfait) + kmFee;
    trans = (q.trans.override !== "" && q.trans.override != null && !isNaN(parseFloat(q.trans.override))) ? pf(q.trans.override) : calcT;
  }
  const labor = q.labor.mode === "separate" ? pf(q.labor.tech) * (pf(q.labor.hinst) + pf(q.labor.hun)) * pf(q.labor.rate) : 0;
  let optsBrut = 0, optsRem = 0, offered = 0, partial = 0; const optLines = [];
  q.opts.forEach(o => {
    if (!o.on) return;
    const b = pf(o.qty) * pf(o.pu), r = r2(b * pf(o.rem) / 100);
    optsBrut += b; optsRem += r;
    if (pf(o.rem) >= 100) offered += r; else partial += r;
    optLines.push({name: o.name, qty: pf(o.qty), pu: pf(o.pu), rem: pf(o.rem), remAmt: r, ht: b - r});
  });
  const opts = optsBrut - optsRem;
  const brut = locBrut + trans + labor + optsBrut;
  const totalRem = locRem + optsRem;
  const ht = r2(loc + trans + labor + opts);
  const vatRate = ST.settings.vatRegime === "franchise" ? 0 : pf(q.vat);
  const vat = r2(ht * vatRate / 100);
  const ttc = r2(ht + vat);
  const c = q.costs || {};
  const cost = ["amort", "staff", "trans", "fuel", "toll", "gen", "other"].reduce((a, k) => a + pf(c[k]), 0);
  const marge = ht - cost, margePct = ht > 0 ? marge / ht * 100 : 0;
  return {days, locBrut, locRem, loc, trans, kmFact, kmFee, labor, optsBrut, optsRem, offered, partial, opts, optLines, brut, totalRem, ht, vatRate, vat, ttc, cost, marge, margePct};
}
function quoteLines(q, t) {
  const L = [];
  const sub = SLIDE_SPECS.slice();
  sub.push("Installation et désinstallation par notre équipe" + (q.labor.mode === "included" ? " (main-d'œuvre incluse)" : ""));
  sub.push("Prévoir une arrivée d'eau à proximité");
  L.push({title: SLIDE_NAME + " · Location " + t.days + " jour" + (t.days > 1 ? "s" : ""), sub, qty: Math.max(1, q.slide.qty || 1), pu: t.locBrut / Math.max(1, q.slide.qty || 1), rem: pf(q.slide.disc), remAmt: t.locRem, remLabel: "Remise commerciale", ht: t.loc});
  if (q.trans.mode === "pickup") L.push({title: "Retrait par le client", sub: ["Matériel retiré et restitué au dépôt de Maincy"], qty: 1, pu: 0, rem: 0, remAmt: 0, ht: 0});
  else if (t.trans > 0) {
    const lbl = {full: "Livraison + installation + désinstallation", deliv: "Livraison", inst: "Installation", uninst: "Désinstallation"}[q.trans.mode];
    const s = ["Départ : " + ST.settings.coaddr]; if (t.kmFact) s.push(t.kmFact.toLocaleString("fr-FR") + " km facturables (" + q.trans.trips + " trajet(s) aller-retour)");
    L.push({title: lbl, sub: s, qty: 1, pu: t.trans, rem: 0, remAmt: 0, ht: t.trans});
  }
  if (q.labor.mode === "separate" && t.labor > 0) L.push({title: "Main-d'œuvre installation / désinstallation", sub: [q.labor.tech + " technicien(s) × " + (pf(q.labor.hinst) + pf(q.labor.hun)) + " h × " + fmt(pf(q.labor.rate)) + "/h"], qty: 1, pu: t.labor, rem: 0, remAmt: 0, ht: t.labor});
  t.optLines.forEach(o => L.push({title: o.name, sub: [], qty: o.qty, pu: o.pu, rem: o.rem, remAmt: o.remAmt, remLabel: o.rem >= 100 ? "Offert" : "Remise", ht: o.ht}));
  return L;
}

/* =====================================================================
   DOSSIERS — modèle, phases, logistique par défaut
   ===================================================================== */
function nextDevisNum() {
  const y = new Date().getFullYear(); let max = 0;
  Object.values(ST.dossiers).forEach(d => { const m = (d.num || "").match(new RegExp("^DEV-" + y + "-(\\d+)$")); if (m) max = Math.max(max, +m[1]); });
  if (CUR && CUR.num) { const m = CUR.num.match(new RegExp("^DEV-" + y + "-(\\d+)$")); if (m && !ST.dossiers[CUR.id]) max = Math.max(max, +m[1]); }
  return "DEV-" + y + "-" + String(max + 1).padStart(3, "0");
}
function blankDossier() {
  const S = ST.settings;
  return {
    id: uid("d"), num: nextDevisNum(), status: "Brouillon", createdAt: todayISO(), createdBy: ME ? ME.name : "",
    client: {name: "", contact: "", tel: "", email: "", addr: "", cp: "", city: "", siren: ""},
    event: {name: "", addr: "", cp: "", city: "", start: "", end: "", days: 1, daysManual: false, setup: "", teardown: "", setupManual: false, teardownManual: false, onsiteName: "", onsiteTel: "", arrival: "", notes: "", state: ""},
    slide: {base: S.base, extra: S.extra, disc: 0, qty: 1},
    trans: {mode: "full", forfait: S.forfait, kmrate: S.kmrate, km: "", trips: 2, override: ""},
    labor: {mode: "included", tech: 4, rate: S.labor, hinst: 3, hun: 2},
    opts: (S.options || DEFAULT_OPTIONS).map(o => ({on: false, name: o.name, qty: 1, pu: o.price, rem: 0, custom: false})),
    vat: S.vatRegime === "franchise" ? 0 : S.vat,
    costs: {amort: "", staff: "", trans: "", fuel: "", toll: "", gen: "", other: ""},
    checklist: [], reqs: [], needs: [], notes: "", log: []
  };
}
function optOn(d, re) { return d.opts.some(o => o.on && re.test(o.name)); }
function optQty(d, re) { const o = d.opts.find(o => o.on && re.test(o.name)); return o ? pf(o.qty) : 0; }
function autoDates(d) {
  const e = d.event;
  if (e.start && e.end && !e.daysManual) { const n = daysBetween(e.start, e.end) + 1; if (n > 0) e.days = n; }
  if (!e.setupManual) e.setup = e.start ? (optOn(d, /veille/i) ? addDays(e.start, -1) : e.start) : "";
  if (!e.teardownManual) e.teardown = (e.end || e.start) ? (optOn(d, /lendemain/i) ? addDays(e.end || e.start, 1) : (e.end || e.start)) : "";
}
function occRange(d) {
  const e = d.event; const a = e.setup || e.start, b = e.teardown || e.end || e.start;
  return a ? [a, b || a] : null;
}
function paidFor(dId) { return Object.values(ST.paiements).filter(p => p.dossierId === dId).reduce((a, p) => a + pf(p.amount), 0); }
function facturesFor(dId) { return Object.values(ST.factures).filter(f => f.dossierId === dId).sort((a, b) => (a.num || "").localeCompare(b.num || "")); }
function depensesFor(dId) { return Object.values(ST.depenses).filter(x => x.dossierId === dId); }
function phase(d) {
  if (d.status === "Brouillon") return {k: "brouillon", l: "Brouillon", c: "p-grey", cal: "c-grey"};
  if (d.status === "Envoyé") return {k: "envoye", l: "Devis envoyé", c: "p-sky", cal: "c-grey"};
  if (d.status === "Refusé") return {k: "refuse", l: "Refusé", c: "p-red", cal: "c-grey"};
  const st = d.event.state;
  if (st === "annule") return {k: "annule", l: "Annulé", c: "p-red", cal: "c-grey"};
  if (st === "cloture") return {k: "cloture", l: "Clôturé", c: "p-grey", cal: "c-grey"};
  if (st === "realise") return {k: "realise", l: "Réalisé", c: "p-violet", cal: "c-violet"};
  const t = computeTotals(d), paid = paidFor(d.id);
  if (t.ttc > 0 && paid >= t.ttc - 0.01) return {k: "solde", l: "Soldé", c: "p-lime", cal: "c-lime"};
  if (paid > 0) return {k: "acompte", l: "Acompte reçu", c: "p-amber", cal: "c-amber"};
  return {k: "confirme", l: "Confirmé", c: "p-pink", cal: ""};
}
const isActive = d => d.status === "Accepté" && !["annule", "cloture"].includes(d.event.state);
function defaultChecklist(d) {
  const mats = Object.values(ST.materiel).sort((a, b) => MAT_CATS.indexOf(a.cat) - MAT_CATS.indexOf(b.cat) || (a.order || 0) - (b.order || 0));
  return mats.map(m => {
    let status = "non_necessaire";
    if (m.include === "always") status = "a_prevoir";
    else if (m.include === "option" && m.option && d.opts.some(o => o.on && o.name === m.option)) status = "a_prevoir";
    let qty = pf(m.perEvent) || 1;
    if (m.include === "option" && m.option) { const o = d.opts.find(o => o.on && o.name === m.option); if (o && /surveillance/i.test(o.name) === false && pf(o.qty) > 1) qty = pf(o.qty); }
    return {id: uid("c"), matId: m.id, label: m.name, cat: m.cat || "Divers", qty, status, note: ""};
  });
}
function defaultReqs() {
  return [
    "Alimentation électrique ≈ 8 kW (220 V / 16 A) pour 5 souffleries",
    "Arrivée d'eau à proximité, débit suffisant",
    "Accès véhicule + remorque jusqu'à l'emplacement",
    "Terrain plat, stable et dégagé",
    "Zone d'ancrage ou de lestage réglementaire",
    "Contact sur place le jour J (nom + téléphone)"
  ].map(label => ({id: uid("r"), label, status: "a_confirmer"}));
}
function defaultNeeds(d) {
  autoDates(d);
  const e = d.event, N = [];
  N.push({id: uid("n"), role: "Montage", date: e.setup || "", time: "", days: 1, hours: pf(d.labor.hinst) || 3, count: pf(d.labor.tech) || 4, assigned: []});
  const surv = optQty(d, /surveillance/i);
  if (surv > 0) N.push({id: uid("n"), role: "Surveillance", date: e.start || "", time: "", days: Math.max(1, e.days || 1), hours: 8, count: surv, assigned: []});
  N.push({id: uid("n"), role: "Démontage", date: e.teardown || "", time: "", days: 1, hours: pf(d.labor.hun) || 2, count: pf(d.labor.tech) || 4, assigned: []});
  return N;
}
function ensureLogistics(d) {
  if (!d.checklist || !d.checklist.length) d.checklist = defaultChecklist(d);
  if (!d.reqs || !d.reqs.length) d.reqs = defaultReqs();
  if (!d.needs || !d.needs.length) d.needs = defaultNeeds(d);
}
function ckStats(d) {
  const L = (d.checklist || []).filter(c => c.status !== "non_necessaire");
  const ready = L.filter(c => c.status !== "a_prevoir").length;
  return {total: L.length, todo: L.length - ready, ready};
}
function needStats(d) {
  let need = 0, asg = 0, conf = 0;
  (d.needs || []).forEach(n => { need += pf(n.count); asg += Math.min(n.assigned.length, pf(n.count)); conf += n.assigned.filter(a => a.confirmed).length; });
  return {need, asg, conf, missing: Math.max(0, need - asg)};
}
function reqStats(d) { const L = d.reqs || []; return {total: L.filter(r => r.status !== "na").length, todo: L.filter(r => r.status === "a_confirmer").length}; }
function teamCost(d) {
  let c = 0;
  (d.needs || []).forEach(n => n.assigned.forEach(a => { const s = ST.staff[a.staffId]; if (s) c += pf(s.rate) * pf(n.hours) * Math.max(1, pf(n.days) || 1); }));
  return c;
}
function profit(d) {
  const t = computeTotals(d), deps = depensesFor(d.id);
  const depTot = deps.reduce((a, x) => a + pf(x.amount), 0);
  const hasMO = deps.some(x => x.cat === "Main-d'œuvre");
  const team = hasMO ? 0 : teamCost(d);
  const res = t.ht - depTot - team;
  return {ca: t.ht, depTot, team, res, pct: t.ht > 0 ? res / t.ht * 100 : 0, hasMO};
}
function logTo(d, msg) { d.log = d.log || []; d.log.unshift({at: new Date().toISOString(), by: ME ? ME.name : "", msg}); d.log = d.log.slice(0, 120); }
function dossierTitle(d) { return d.event.name || d.client.name || d.client.contact || "Dossier sans nom"; }
function clientLabel(d) { return d.client.name || d.client.contact || "Client à renseigner"; }

/* =====================================================================
   ALERTES
   ===================================================================== */
function computeAlerts() {
  const A = [], T = todayISO(), S = ST.settings;
  const Ds = Object.values(ST.dossiers);
  Ds.forEach(d => {
    const go = {id: d.id};
    if (d.status === "Envoyé") {
      const exp = addDays(d.sentAt || d.createdAt, pf(S.valid) || 30);
      const left = daysBetween(T, exp);
      if (left < 0) A.push({lvl: "warn", t: "Devis " + d.num + " expiré", d: clientLabel(d) + " · sans réponse depuis le " + fd(d.sentAt || d.createdAt), go});
      else if (left <= 5) A.push({lvl: "warn", t: "Devis " + d.num + " expire dans " + left + " j", d: clientLabel(d) + " · relancer le client", go});
    }
    if (!isActive(d)) return;
    const t = computeTotals(d), paid = paidFor(d.id), ph = phase(d);
    const start = d.event.start;
    const left = start ? daysBetween(T, start) : null;
    if (!start) A.push({lvl: "info", t: dossierTitle(d) + " : dates à définir", d: "Devis accepté, l'événement n'a pas encore de date", go: {id: d.id, tab: "event"}});
    const acompte = r2(t.ttc * pf(S.acompte) / 100);
    if (paid < acompte - 0.01 && daysBetween(d.acceptedAt || d.createdAt, T) >= 3) A.push({lvl: "warn", t: "Acompte à encaisser · " + dossierTitle(d), d: "Acompte attendu " + fmt(acompte) + " · reçu " + fmt(paid), go: {id: d.id, tab: "pay"}});
    if (left != null && left >= 0 && left <= pf(S.soldeDays || 7) + 3 && paid < t.ttc - 0.01) A.push({lvl: left <= pf(S.soldeDays || 7) ? "crit" : "warn", t: "Solde à encaisser · " + dossierTitle(d), d: "Reste " + fmt(t.ttc - paid) + " · événement dans " + left + " j", go: {id: d.id, tab: "pay"}});
    if (left != null && left >= 0 && left <= 10) {
      const c = ckStats(d), n = needStats(d), r = reqStats(d);
      if (c.todo) A.push({lvl: left <= 3 ? "crit" : "warn", t: c.todo + " élément(s) de matériel à prévoir", d: dossierTitle(d) + " · J-" + left, go: {id: d.id, tab: "mat"}});
      if (n.missing) A.push({lvl: left <= 3 ? "crit" : "warn", t: "Il manque " + n.missing + " personne(s)", d: dossierTitle(d) + " · J-" + left, go: {id: d.id, tab: "team"}});
      if (r.todo) A.push({lvl: "warn", t: r.todo + " point(s) à confirmer avec le client", d: dossierTitle(d) + " · électricité, eau, accès…", go: {id: d.id, tab: "event"}});
    }
    if (left != null && left < -2 && ph.k !== "realise" && ph.k !== "solde") A.push({lvl: "info", t: dossierTitle(d) + " est passé", d: "Marque-le comme réalisé et contrôle le retour du matériel", go: {id: d.id, tab: "event"}});
  });
  // Conflits de dates (un seul toboggan)
  const act = Ds.filter(isActive).map(d => ({d, r: occRange(d)})).filter(x => x.r);
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
    const a = act[i], b = act[j];
    if (a.r[0] <= b.r[1] && b.r[0] <= a.r[1]) A.push({lvl: "crit", t: "Conflit de dates : toboggan réservé deux fois", d: dossierTitle(a.d) + " et " + dossierTitle(b.d) + " se chevauchent", go: {id: a.d.id, tab: "event"}});
  }
  Object.values(ST.materiel).forEach(m => {
    if (m.state === "reparer" || m.state === "hs") A.push({lvl: m.state === "hs" ? "crit" : "warn", t: m.name + " : " + (m.state === "hs" ? "hors service" : "à réparer"), d: "Parc matériel", go: {view: "parc"}});
    if (m.nextCheck && daysBetween(T, m.nextCheck) <= 30) A.push({lvl: daysBetween(T, m.nextCheck) < 0 ? "crit" : "warn", t: "Contrôle à prévoir : " + m.name, d: "Échéance le " + fd(m.nextCheck), go: {view: "parc"}});
  });
  const rank = {crit: 0, warn: 1, info: 2};
  return A.sort((a, b) => rank[a.lvl] - rank[b.lvl]);
}
function conflictsFor(d) {
  const r = occRange(d); if (!r || !isActive(d)) return [];
  return Object.values(ST.dossiers).filter(x => x.id !== d.id && isActive(x)).filter(x => { const o = occRange(x); return o && r[0] <= o[1] && o[0] <= r[1]; });
}

/* =====================================================================
   NAVIGATION
   ===================================================================== */
const NAV = [["home", "Accueil", IC.home], ["dossiers", "Dossiers", IC.file], ["planning", "Planning", IC.cal], ["treso", "Trésorerie", IC.euro], ["more", "Plus", IC.more]];
const NAV_TOP = [["home", "Accueil"], ["dossiers", "Dossiers"], ["planning", "Planning"], ["treso", "Trésorerie"], ["team", "Équipe"], ["parc", "Parc matériel"], ["settings", "Paramètres"]];
function renderNav() {
  const v = UI.view === "dossier" ? "dossiers" : UI.view;
  const alerts = computeAlerts().filter(a => a.lvl !== "info").length;
  $("#botTabs").innerHTML = NAV.map(([k, l, ic]) => {
    const on = k === v || (k === "more" && ["team", "parc", "settings", "more"].includes(v));
    return `<button data-nav="${k}" class="${on ? "on" : ""}" aria-label="${l}">${ic}<span>${l}</span>${k === "home" && alerts ? `<span class="dot">${alerts}</span>` : ""}</button>`;
  }).join("");
  $("#topTabs").innerHTML = NAV_TOP.map(([k, l]) => `<button data-nav="${k}" class="${k === v ? "on" : ""}">${l}${k === "home" && alerts ? `<span class="dot">${alerts}</span>` : ""}</button>`).join("");
}
function go(view, opts = {}) {
  if (UI.view === "dossier" && view !== "dossier") flushSave();
  UI.view = view;
  if (view === "dossier") {
    UI.dossierId = opts.id; UI.tab = opts.tab || "devis";
    const d = ST.dossiers[opts.id]; CUR = d ? clone(d) : CUR; dirty = false;
  } else CUR = null;
  render(); window.scrollTo(0, 0);
}
document.addEventListener("click", e => {
  const n = e.target.closest("[data-nav]"); if (n) { go(n.dataset.nav); return; }
  const o = e.target.closest("[data-open]"); if (o) { go("dossier", {id: o.dataset.open, tab: o.dataset.tab || undefined}); return; }
  const a = e.target.closest("[data-go]"); if (a) { const g = JSON.parse(a.dataset.go); if (g.view) go(g.view); else go("dossier", {id: g.id, tab: g.tab}); }
});
function render(fromSnap) {
  renderNav();
  const V = $("#view");
  const loading = !ST.loaded.dossiers;
  const fn = {home: vHome, dossiers: vDossiers, dossier: vDossier, planning: vPlanning, treso: vTreso, team: vTeam, parc: vParc, settings: vSettings, more: vMore}[UI.view] || vHome;
  if (UI.view === "dossier" && !CUR) { UI.view = "dossiers"; return render(); }
  V.innerHTML = loading ? `<div class="empty"><b>Chargement des données…</b>Synchronisation avec la base partagée.</div>` : fn();
  if (!loading && UI.view === "dossier") afterDossierRender();
}

/* =====================================================================
   VUE : ACCUEIL
   ===================================================================== */
function yearTotals(y) {
  const Ds = Object.values(ST.dossiers).filter(d => d.status === "Accepté" && d.event.state !== "annule");
  const inYear = d => ((d.event.start || d.acceptedAt || d.createdAt || "").slice(0, 4) === String(y));
  const ca = Ds.filter(inYear).reduce((a, d) => a + computeTotals(d).ht, 0);
  const enc = Object.values(ST.paiements).filter(p => (p.date || "").startsWith(y)).reduce((a, p) => a + pf(p.amount), 0);
  const dep = Object.values(ST.depenses).filter(p => (p.date || "").startsWith(y)).reduce((a, p) => a + pf(p.amount), 0);
  const due = Ds.reduce((a, d) => a + Math.max(0, computeTotals(d).ttc - paidFor(d.id)), 0);
  return {ca, enc, dep, due, res: enc - dep};
}
function vHome() {
  const y = new Date().getFullYear(), Y = yearTotals(y), A = computeAlerts(), T = todayISO();
  const up = Object.values(ST.dossiers).filter(d => isActive(d) && (!d.event.start || (d.event.teardown || d.event.end || d.event.start) >= T))
    .sort((a, b) => (a.event.start || "9999").localeCompare(b.event.start || "9999")).slice(0, 6);
  const pend = Object.values(ST.dossiers).filter(d => d.status === "Envoyé" || d.status === "Brouillon").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const hello = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";
  return `
  <div class="pg-h"><div><h1>${hello} ${esc(ME.name)}</h1><p class="sub">${new Date().toLocaleDateString("fr-FR", {weekday: "long", day: "numeric", month: "long", year: "numeric"})}</p></div>
    <div class="act"><button class="btn btn-p" id="btnNewD">${IC.plus}Nouveau devis</button></div></div>
  <div class="kpis">
    <div class="kpi"><span>CA signé ${y}</span><b>${fmt0(Y.ca)}</b><small>HT, devis acceptés</small></div>
    <div class="kpi"><span>Encaissé ${y}</span><b>${fmt0(Y.enc)}</b><small>paiements reçus</small></div>
    <div class="kpi"><span>Reste à encaisser</span><b>${fmt0(Y.due)}</b><small>sur dossiers en cours</small></div>
    <div class="kpi"><span>Dépenses ${y}</span><b>${fmt0(Y.dep)}</b><small>Résultat : <b class="${Y.res >= 0 ? "pos" : "neg"}">${fmt0(Y.res)}</b></small></div>
  </div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:14px;align-items:start">
    <section>
      <div class="sec-t"><h2>À traiter</h2><span class="meta">${A.length} point(s)</span></div>
      ${A.length ? `<div class="alerts">${A.slice(0, 12).map(a => `<div class="alert ${a.lvl}" data-go='${esc(JSON.stringify(a.go))}'><div><p class="t">${esc(a.t)}</p><p class="d">${esc(a.d)}</p></div><span class="go">›</span></div>`).join("")}</div>`
      : `<div class="card empty"><b>Rien d'urgent</b>Tout est prévu, payé et confirmé.</div>`}
    </section>
    <section>
      <div class="sec-t"><h2>Prochains événements</h2><button class="btn btn-o btn-sm" data-nav="planning" style="margin-left:auto">Planning</button></div>
      ${up.length ? `<div class="dl">${up.map(dRow).join("")}</div>` : `<div class="card empty"><b>Aucun événement confirmé</b>Passe un devis en « Accepté » pour le voir ici.</div>`}
      <div class="sec-t" style="margin-top:16px"><h2>Devis en cours</h2><span class="meta">${pend.length}</span></div>
      ${pend.length ? `<div class="dl">${pend.slice(0, 5).map(dRow).join("")}</div>` : `<div class="card empty"><b>Aucun devis en attente</b></div>`}
    </section>
  </div>`;
}
function dRow(d) {
  const t = computeTotals(d), ph = phase(d), paid = paidFor(d.id);
  const c = ckStats(d), n = needStats(d), cf = conflictsFor(d).length;
  const dates = d.event.start ? (d.event.end && d.event.end !== d.event.start ? fdShort(d.event.start) + " → " + fdShort(d.event.end) : fd(d.event.start)) : "Dates à définir";
  return `<div class="drow" data-open="${d.id}">
    <div class="a"><span class="n">${esc(d.num)}</span><span class="c">${esc(dossierTitle(d))}</span><span class="pill ${ph.c}">${ph.l}</span>${cf ? `<span class="pill p-red">Conflit de dates</span>` : ""}</div>
    <div class="m"><span>${esc(clientLabel(d))}</span><span>${esc(dates)}</span><span><b>${fmt(t.ttc)}</b> ${t.vatRate ? "TTC" : "net"}</span>${d.status === "Accepté" ? `<span>Payé <b>${fmt(paid)}</b></span>` : ""}</div>
    ${d.status === "Accepté" ? `<div class="prog"><span>Matériel <b>${c.ready}/${c.total}</b></span><span>Équipe <b>${n.asg}/${n.need}</b></span><span>Client <b>${reqStats(d).total - reqStats(d).todo}/${reqStats(d).total}</b></span></div>` : ""}
  </div>`;
}

/* =====================================================================
   VUE : LISTE DES DOSSIERS
   ===================================================================== */
function vDossiers() {
  const F = [["actifs", "En cours"], ["devis", "Devis"], ["confirmes", "Confirmés"], ["termines", "Terminés"], ["tous", "Tous"]];
  const q = UI.q.toLowerCase();
  let L = Object.values(ST.dossiers);
  const f = UI.filter;
  L = L.filter(d => {
    const k = phase(d).k;
    if (f === "devis") return ["brouillon", "envoye"].includes(k);
    if (f === "confirmes") return isActive(d) && !["realise"].includes(k);
    if (f === "termines") return ["realise", "cloture", "refuse", "annule"].includes(k);
    if (f === "actifs") return !["cloture", "refuse", "annule"].includes(k);
    return true;
  }).filter(d => !q || [d.num, d.client.name, d.client.contact, d.event.name, d.event.city, ...facturesFor(d.id).map(x => x.num)].join(" ").toLowerCase().includes(q));
  L.sort((a, b) => (b.event.start || b.createdAt || "").localeCompare(a.event.start || a.createdAt || ""));
  return `
  <div class="pg-h"><div><h1>Dossiers</h1><p class="sub">Un dossier = un devis, son événement, sa logistique et ses paiements</p></div>
    <div class="act"><button class="btn btn-p" id="btnNewD">${IC.plus}Nouveau devis</button></div></div>
  <div class="row" style="margin-bottom:10px"><input class="search" id="dSearch" placeholder="Rechercher : client, n° de devis ou facture, ville…" value="${esc(UI.q)}" aria-label="Rechercher"></div>
  <div class="chips">${F.map(([k, l]) => `<button class="chip ${UI.filter === k ? "on" : ""}" data-filter="${k}">${l}</button>`).join("")}</div>
  ${L.length ? `<div class="dl">${L.map(dRow).join("")}</div>` : `<div class="card empty"><b>${q ? "Aucun résultat" : "Aucun dossier ici"}</b>${q ? "Essaie un autre mot." : "Crée un devis pour démarrer."}</div>`}`;
}
document.addEventListener("click", e => {
  const f = e.target.closest("[data-filter]"); if (f) { UI.filter = f.dataset.filter; render(); }
  if (e.target.closest("#btnNewD")) newDossier();
});
document.addEventListener("input", e => {
  if (e.target.id === "dSearch") { UI.q = e.target.value; const pos = e.target.selectionStart; render(); const s = $("#dSearch"); s.focus(); try { s.setSelectionRange(pos, pos); } catch (x) {} }
});
async function newDossier() {
  const d = blankDossier();
  logTo(d, "Devis créé");
  await save("dossiers", d);
  go("dossier", {id: d.id, tab: "devis"});
}

/* =====================================================================
   VUE : DOSSIER
   ===================================================================== */
const DTABS = [["devis", "Devis"], ["event", "Événement"], ["mat", "Matériel"], ["team", "Équipe"], ["pay", "Factures & paiements"], ["dep", "Dépenses"], ["notes", "Notes"]];
function vDossier() {
  const d = CUR, ph = phase(d), t = computeTotals(d);
  const c = ckStats(d), n = needStats(d), r = reqStats(d), cf = conflictsFor(d);
  const badge = {mat: c.todo, team: n.missing, event: r.todo + cf.length};
  const accepted = d.status === "Accepté";
  return `
  <div class="dh">
    <button class="back" data-nav="dossiers" aria-label="Retour aux dossiers">${IC.back}</button>
    <div class="tt"><h1>${esc(dossierTitle(d))}</h1>
      <div class="row"><span class="pill p-grey num">${esc(d.num)}</span><span class="pill ${ph.c}">${ph.l}</span><span class="muted" style="font-size:13px;font-weight:700">${esc(clientLabel(d))} · ${fmt(t.ttc)}</span></div></div>
    <div class="row">${statusButtons(d)}</div>
  </div>
  ${cf.length ? `<div class="lock" style="background:var(--red-soft);color:var(--red)">Conflit : le toboggan est déjà réservé sur ces dates pour ${cf.map(x => esc(dossierTitle(x))).join(", ")}.</div>` : ""}
  <div class="dtabs" role="tablist">${DTABS.map(([k, l]) => {
    const dis = !accepted && ["mat", "team"].includes(k);
    return `<button role="tab" data-dtab="${k}" class="${UI.tab === k ? "on" : ""}" ${dis ? 'title="Disponible une fois le devis accepté"' : ""}>${l}${badge[k] && accepted ? `<span class="b">${badge[k]}</span>` : ""}</button>`;
  }).join("")}</div>
  <div id="dtab">${dossierTab()}</div>`;
}
function statusButtons(d) {
  const S = d.status;
  if (S === "Brouillon") return `<button class="btn btn-o btn-sm" data-st="Envoyé">Marquer envoyé</button><button class="btn btn-g btn-sm" data-st="Accepté">Accepté</button>`;
  if (S === "Envoyé") return `<button class="btn btn-g btn-sm" data-st="Accepté">Accepté</button><button class="btn btn-o btn-sm" data-st="Refusé">Refusé</button>`;
  if (S === "Refusé") return `<button class="btn btn-o btn-sm" data-st="Envoyé">Réouvrir</button>`;
  return "";
}
function dossierTab() {
  const accepted = CUR.status === "Accepté";
  if (!accepted && ["mat", "team"].includes(UI.tab)) return `<div class="card empty"><b>Disponible une fois le devis accepté</b>La liste du matériel et les besoins en personnel sont générés automatiquement à l'acceptation.<div style="margin-top:12px"><button class="btn btn-g" data-st="Accepté">Passer le devis en accepté</button></div></div>`;
  return ({devis: tDevis, event: tEvent, mat: tMat, team: tTeam, pay: tPay, dep: tDep, notes: tNotes}[UI.tab] || tDevis)();
}
function rerenderTab() { const el = $("#dtab"); if (el) { el.innerHTML = dossierTab(); afterDossierRender(); } }
function rerenderDossier() { const y = window.scrollY; $("#view").innerHTML = vDossier(); afterDossierRender(); window.scrollTo(0, y); renderNav(); }
function afterDossierRender() { if (UI.tab === "devis") updateTotals(); }

document.addEventListener("click", async e => {
  const tb = e.target.closest("[data-dtab]"); if (tb) { flushSave(); UI.tab = tb.dataset.dtab; rerenderDossier(); return; }
  const st = e.target.closest("[data-st]"); if (st && CUR) { await setStatus(st.dataset.st); }
});
async function setStatus(s) {
  const d = CUR; const prev = d.status;
  d.status = s;
  if (s === "Envoyé" && !d.sentAt) d.sentAt = todayISO();
  if (s === "Accepté") {
    d.acceptedAt = d.acceptedAt || todayISO();
    autoDates(d); ensureLogistics(d);
  }
  logTo(d, "Statut : " + prev + " → " + s);
  await saveCur(true);
  toast(s === "Accepté" ? "Devis accepté : événement ajouté au planning, matériel et équipe générés" : "Devis " + d.num + " : " + s);
  rerenderDossier();
}

/* ---------- binding générique des champs du dossier ---------- */
function onField(e) {
  const t = e.target; if (!CUR || !t.dataset || !t.dataset.f || !$("#view").contains(t)) return;
  const p = t.dataset.f;
  let v = t.type === "checkbox" ? t.checked : t.value;
  if (t.dataset.t === "n") v = t.value === "" ? "" : pf(t.value);
  setPath(CUR, p, v);
  if (p === "event.days") CUR.event.daysManual = true;
  if (p === "event.start" || p === "event.end") CUR.event.daysManual = false;
  if (p === "event.setup") CUR.event.setupManual = !!v;
  if (p === "event.teardown") CUR.event.teardownManual = !!v;
  if (/^event\.(start|end)$/.test(p) || /^opts\.\d+\.on$/.test(p)) {
    autoDates(CUR);
    const sd = $('[data-f="event.days"]'); if (sd && document.activeElement !== sd) sd.value = CUR.event.days;
    const su = $('[data-f="event.setup"]'); if (su && !CUR.event.setupManual) su.value = CUR.event.setup;
    const sd2 = $('[data-f="event.teardown"]'); if (sd2 && !CUR.event.teardownManual) sd2.value = CUR.event.teardown;
  }
  if (t.tagName === "SELECT" && t.dataset.cls) t.className = "s-" + v;
  if (UI.tab === "devis") updateTotals();
  scheduleSave();
  if (t.dataset.rr) rerenderTab();
}
document.addEventListener("input", e => { if (e.target.tagName !== "SELECT" && e.target.type !== "checkbox") onField(e); });
document.addEventListener("change", e => { if (e.target.tagName === "SELECT" || e.target.type === "checkbox" || e.target.type === "date") onField(e); });
function scheduleSave() { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(() => saveCur(), 900); }
function flushSave() { if (dirty && CUR) { clearTimeout(saveTimer); saveCur(); } }
async function saveCur(now) {
  if (!CUR) return; clearTimeout(saveTimer);
  const d = CUR;
  try { await save("dossiers", d); } catch (e) {}
  if (CUR === d) dirty = false;
}
window.addEventListener("pagehide", flushSave);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSave(); });

/* ---------- Onglet DEVIS ---------- */
function F(label, path, opts = {}) {
  const v = getPath(CUR, path);
  const type = opts.type || "text";
  const attrs = `id="f-${path.replace(/\./g, "-")}" data-f="${path}" ${opts.n ? 'data-t="n" inputmode="decimal"' : ""} ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ""} ${opts.dis ? "disabled" : ""}`;
  return `<div class="${opts.span ? "span2" : ""}" style="min-width:0"><label class="l" for="f-${path.replace(/\./g, "-")}">${label}</label>${opts.area ? `<textarea rows="${opts.rows || 3}" ${attrs}>${esc(v)}</textarea>` : `<input type="${type}" ${attrs} value="${esc(v ?? "")}" ${opts.n ? 'step="any"' : ""}>`}${opts.hint ? `<p class="hint">${opts.hint}</p>` : ""}</div>`;
}
function tDevis() {
  const d = CUR, facs = facturesFor(d.id);
  return `
  ${facs.length ? `<div class="lock">Facture(s) déjà émise(s) : ${facs.map(f => esc(f.num)).join(", ")}. Modifier le devis ne change pas les factures émises (fais un avoir si besoin).</div>` : ""}
  <div class="row" style="margin-bottom:12px">
    <button class="btn btn-p" data-pdf="devis">${IC.eye}Aperçu et PDF du devis</button>
    <button class="btn btn-o" id="btnDup">Dupliquer</button>
    ${!facs.length ? `<button class="btn btn-d" id="btnDelD" style="margin-left:auto">Supprimer</button>` : ""}
  </div>
  <div class="fs"><h3>Client</h3><div class="grid g2">
    ${F("Société / organisme", "client.name", {span: 1, ph: "Mairie de Melun, comité des fêtes…"})}
    ${F("Contact", "client.contact", {ph: "Prénom Nom"})}${F("Téléphone", "client.tel", {type: "tel", ph: "06…"})}
    ${F("Email", "client.email", {type: "email", ph: "contact@…"})}${F("SIREN (client pro)", "client.siren", {ph: "9 chiffres", hint: "Mention obligatoire sur les factures entre pros"})}
    ${F("Adresse", "client.addr", {span: 1})}${F("Code postal", "client.cp")}${F("Ville", "client.city")}
  </div></div>
  <div class="fs"><h3>Événement <span class="r">dates et lieu modifiables plus tard</span></h3><div class="grid g2">
    ${F("Nom de l'événement", "event.name", {span: 1, ph: "Fête de la ville, festival…"})}
    ${F("Lieu / adresse", "event.addr", {span: 1})}${F("Code postal", "event.cp")}${F("Ville", "event.city")}
    ${F("Début", "event.start", {type: "date"})}${F("Fin", "event.end", {type: "date"})}
    ${F("Jours de location", "event.days", {n: 1, hint: "Calculé depuis les dates, modifiable"})}
  </div></div>
  <div class="fs"><h3>Toboggan</h3>
    <p style="font-weight:800;color:var(--navy)">${SLIDE_NAME}</p>
    <p class="hint" style="margin-bottom:10px">3 parties · 5 souffleries 1 500 W · 220 V / 16 A · ≈ 8 kW · arrivée d'eau à prévoir</p>
    <div class="grid g4">${F("Prix 1er jour HT", "slide.base", {n: 1})}${F("Jour supp. HT", "slide.extra", {n: 1})}${F("Remise (%)", "slide.disc", {n: 1})}${F("Quantité", "slide.qty", {n: 1})}</div>
    <p class="hint" id="slideRemLine" style="margin-top:8px"></p>
  </div>
  <div class="fs"><h3>Livraison / installation</h3>
    <label class="l" for="f-trans-mode">Prestation</label>
    <select id="f-trans-mode" data-f="trans.mode">${[["full", "Livraison + installation + désinstallation"], ["deliv", "Livraison seule"], ["inst", "Installation seule"], ["uninst", "Désinstallation seule"], ["pickup", "Retrait par le client"]].map(([k, l]) => `<option value="${k}" ${d.trans.mode === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <div class="grid g3" style="margin-top:10px">
      ${F("Forfait HT", "trans.forfait", {n: 1})}${F("Tarif / km", "trans.kmrate", {n: 1})}${F("Distance aller (km)", "trans.km", {n: 1, hint: "Depuis Maincy"})}
      ${F("Trajets A/R", "trans.trips", {n: 1, hint: "2 = livraison + reprise"})}
      <div style="min-width:0"><label class="l">Calculé</label><input id="transCalc" disabled></div>
      ${F("Montant retenu HT", "trans.override", {n: 1, ph: "auto", hint: "Laisse vide pour le calcul auto"})}
    </div>
  </div>
  <div class="fs"><h3>Main-d'œuvre</h3>
    <div class="seg">${[["included", "Incluse dans le prix"], ["separate", "Facturée séparément"]].map(([k, l]) => `<button type="button" data-labor="${k}" class="${d.labor.mode === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="grid g4" style="margin-top:10px">${F("Techniciens", "labor.tech", {n: 1})}${F("€ / h / pers.", "labor.rate", {n: 1})}${F("Heures montage", "labor.hinst", {n: 1})}${F("Heures démontage", "labor.hun", {n: 1})}</div>
    <p class="hint" id="laborLine" style="margin-top:8px"></p>
  </div>
  <div class="fs"><h3>Options <span class="r" id="optCount"></span></h3>
    <div class="opt opt-h"><span></span><span>Option</span><span>Qté</span><span>PU HT</span><span>Rem. %</span><span>Total HT</span></div>
    ${d.opts.map((o, i) => `<div class="opt">
      <span class="sw"><input type="checkbox" data-f="opts.${i}.on" ${o.on ? "checked" : ""} aria-label="Activer ${esc(o.name)}"><i></i></span>
      <span class="on">${esc(o.name)}${o.custom ? ` <button class="muted" data-delopt="${i}" aria-label="Retirer">✕</button>` : ""}</span>
      <span class="mini mq"><small>Qté</small><input data-f="opts.${i}.qty" data-t="n" inputmode="decimal" value="${esc(o.qty)}" aria-label="Quantité"></span>
      <span class="mini mpu"><small>PU HT</small><input data-f="opts.${i}.pu" data-t="n" inputmode="decimal" value="${esc(o.pu)}" aria-label="Prix unitaire"></span>
      <span class="mini mrm"><small>Rem. %</small><input data-f="opts.${i}.rem" data-t="n" inputmode="decimal" value="${esc(o.rem)}" aria-label="Remise"></span>
      <span class="tt" id="optT${i}">—</span></div>`).join("")}
    <div class="row" style="margin-top:10px"><input id="optNew" placeholder="Autre prestation…" style="flex:1"><button class="btn btn-o btn-sm" id="btnAddOpt">Ajouter</button></div>
  </div>
  <div class="fs"><h3>TVA</h3>
    ${ST.settings.vatRegime === "franchise" ? `<p><b>Franchise en base de TVA</b> — la mention « ${VAT_FRANCHISE} » est ajoutée automatiquement sur les devis et factures.</p><p class="hint">Change le régime dans Paramètres si tu deviens assujetti.</p>`
      : `<div class="grid g2">${F("Taux de TVA (%)", "vat", {n: 1})}</div>`}
  </div>
  <div class="fs internal"><h3>Coûts prévus <span class="tagint">JAMAIS SUR LE DEVIS</span></h3>
    <div class="grid g4">${F("Amortissement", "costs.amort", {n: 1})}${F("Salaires", "costs.staff", {n: 1})}${F("Transport", "costs.trans", {n: 1})}${F("Carburant", "costs.fuel", {n: 1})}${F("Péages", "costs.toll", {n: 1})}${F("Groupe élec.", "costs.gen", {n: 1})}${F("Autres", "costs.other", {n: 1})}</div>
    <div class="mbox" id="margeBox"></div>
  </div>
  <div class="totbox" id="totBox"></div>`;
}
function updateTotals() {
  if (!CUR || UI.tab !== "devis") return;
  const d = CUR, t = computeTotals(d);
  const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  s("transCalc", d.trans.mode === "pickup" ? "Retrait client" : fmt(pf(d.trans.forfait) + t.kmFee) + (t.kmFact ? " · " + t.kmFact + " km" : ""));
  s("laborLine", d.labor.mode === "separate" ? "Main-d'œuvre facturée : " + fmt(t.labor) : "Incluse dans le prix du toboggan (" + pf(d.labor.tech) + " techniciens, " + (pf(d.labor.hinst) + pf(d.labor.hun)) + " h au total).");
  s("slideRemLine", t.locRem > 0 ? "Remise affichée sur le devis : " + pf(d.slide.disc).toLocaleString("fr-FR") + " % soit − " + fmt(t.locRem) + " (prix brut " + fmt(t.locBrut) + " → " + fmt(t.loc) + ")" : "");
  s("optCount", d.opts.filter(o => o.on).length + " active(s)");
  d.opts.forEach((o, i) => s("optT" + i, o.on ? (pf(o.rem) >= 100 ? "Offert" : fmt(pf(o.qty) * pf(o.pu) * (1 - pf(o.rem) / 100))) : "—"));
  const tb = $("#totBox"); if (tb) tb.innerHTML = totLinesHTML(t);
  const mb = $("#margeBox"); if (mb) mb.innerHTML = `<div><b>${fmt(t.cost)}</b><span>Coûts prévus</span></div><div><b>${fmt(t.ht)}</b><span>CA HT</span></div><div><b class="${t.marge >= 0 ? "pos" : "neg"}">${fmt(t.marge)}</b><span>Marge ${t.cost ? t.margePct.toFixed(0) + " %" : ""}</span></div>`;
}
function totLinesHTML(t) {
  const fr = ST.settings.vatRegime === "franchise";
  return `${t.totalRem > 0 ? `<div class="l"><span>Total brut HT</span><span>${fmt(t.brut)}</span></div>` : ""}
    ${t.locRem > 0 ? `<div class="l rem"><span>Remise toboggan (${pf(CUR.slide.disc).toLocaleString("fr-FR")} %)</span><span>− ${fmt(t.locRem)}</span></div>` : ""}
    ${t.offered > 0 ? `<div class="l rem"><span>Options offertes</span><span>− ${fmt(t.offered)}</span></div>` : ""}
    ${t.partial > 0 ? `<div class="l rem"><span>Remises sur options</span><span>− ${fmt(t.partial)}</span></div>` : ""}
    <div class="l"><span>Total HT</span><span>${fmt(t.ht)}</span></div>
    ${fr ? `<div class="l sm"><span>${VAT_FRANCHISE}</span><span></span></div>` : `<div class="l"><span>TVA ${t.vatRate.toLocaleString("fr-FR")} %</span><span>${fmt(t.vat)}</span></div>`}
    <div class="l big"><span>${fr ? "Net à payer" : "Total TTC"}</span><span>${fmt(t.ttc)}</span></div>
    <div class="l sm"><span>Acompte ${pf(ST.settings.acompte)} %</span><span>${fmt(r2(t.ttc * pf(ST.settings.acompte) / 100))}</span></div>`;
}
document.addEventListener("click", async e => {
  if (!CUR) return;
  const lb = e.target.closest("[data-labor]"); if (lb) { CUR.labor.mode = lb.dataset.labor; $$("[data-labor]").forEach(b => b.classList.toggle("on", b === lb)); updateTotals(); scheduleSave(); }
  const dl = e.target.closest("[data-delopt]"); if (dl) { CUR.opts.splice(+dl.dataset.delopt, 1); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnAddOpt")) { const n = $("#optNew").value.trim(); if (!n) { toast("Donne un nom à la prestation"); return; } CUR.opts.push({on: true, name: n, qty: 1, pu: 0, rem: 0, custom: true}); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnDup")) {
    flushSave();
    const c = clone(CUR); c.id = uid("d"); c.num = nextDevisNum(); c.status = "Brouillon"; c.createdAt = todayISO(); c.createdBy = ME.name;
    delete c.sentAt; delete c.acceptedAt; c.checklist = []; c.reqs = []; c.needs = []; c.log = []; c.event.state = ""; logTo(c, "Dupliqué depuis " + CUR.num);
    await save("dossiers", c); toast("Dupliqué : " + c.num); go("dossier", {id: c.id});
  }
  if (e.target.closest("#btnDelD")) {
    const d = CUR;
    confirmBox("Supprimer " + d.num + " ?", "Le dossier, sa logistique et ses notes seront supprimés pour Alex et Adeline. Les paiements et dépenses liés restent dans la trésorerie.", "Supprimer", async () => {
      await remove("dossiers", d.id); CUR = null; toast(d.num + " supprimé"); go("dossiers");
    });
  }
  const pd = e.target.closest("[data-pdf]"); if (pd) { flushSave(); openPdfPreview(pd.dataset.pdf, pd.dataset.fid); }
});

/* ---------- Onglet ÉVÉNEMENT ---------- */
function tEvent() {
  const d = CUR, e = d.event, cf = conflictsFor(d), r = reqStats(d);
  const ph = phase(d);
  return `
  <div class="fs"><h3>Dates et lieu</h3><div class="grid g2">
    ${F("Nom de l'événement", "event.name", {span: 1})}
    ${F("Lieu / adresse", "event.addr", {span: 1})}${F("Code postal", "event.cp")}${F("Ville", "event.city")}
    ${F("Début", "event.start", {type: "date"})}${F("Fin", "event.end", {type: "date"})}
    ${F("Montage", "event.setup", {type: "date", hint: "Auto : la veille si l'option est cochée"})}${F("Démontage", "event.teardown", {type: "date", hint: "Auto : le lendemain si l'option est cochée"})}
    ${F("Arrivée de l'équipe", "event.arrival", {type: "time"})}${F("Jours de location", "event.days", {n: 1})}
  </div>
  ${cf.length ? `<p class="hint" style="color:var(--red);font-weight:800;margin-top:8px">Chevauche : ${cf.map(x => esc(dossierTitle(x)) + " (" + fd(occRange(x)[0]) + " → " + fd(occRange(x)[1]) + ")").join(", ")}</p>` : ""}
  </div>
  <div class="fs"><h3>Contact sur place</h3><div class="grid g2">${F("Nom", "event.onsiteName")}${F("Téléphone", "event.onsiteTel", {type: "tel"})}${F("Accès, consignes, horaires", "event.notes", {area: 1, span: 1, ph: "Portail, code, parking remorque, horaires d'ouverture au public…"})}</div></div>
  ${d.status === "Accepté" ? `
  <div class="fs"><h3>Ce que le client doit fournir <span class="r">${r.total - r.todo}/${r.total} confirmé(s)</span></h3>
    ${(d.reqs || []).map((q, i) => `<div class="ck req"><span class="lb">${esc(q.label)}</span>
      <select data-f="reqs.${i}.status" data-cls="1" class="s-${q.status}" aria-label="Statut">${REQ_STATUS.map(([k, l]) => `<option value="${k}" ${q.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>`).join("")}
    <div class="row" style="margin-top:10px"><input id="reqNew" placeholder="Autre point à confirmer…" style="flex:1"><button class="btn btn-o btn-sm" id="btnAddReq">Ajouter</button></div>
  </div>
  <div class="fs"><h3>Avancement</h3>
    <p class="hint" style="margin-bottom:10px">Phase actuelle : <span class="pill ${ph.c}">${ph.l}</span> — Confirmé, Acompte reçu et Soldé se mettent à jour avec les paiements.</p>
    <div class="row">
      <button class="btn ${e.state === "realise" ? "btn-n" : "btn-o"} btn-sm" data-evstate="realise">Événement réalisé</button>
      <button class="btn ${e.state === "cloture" ? "btn-n" : "btn-o"} btn-sm" data-evstate="cloture">Clôturer le dossier</button>
      <button class="btn ${e.state === "annule" ? "btn-d" : "btn-o"} btn-sm" data-evstate="annule">Annulé</button>
      ${e.state ? `<button class="btn btn-o btn-sm" data-evstate="">Remettre en cours</button>` : ""}
    </div>
  </div>
  <div class="row"><button class="btn btn-o" data-pdf="mission">${IC.eye}Fiche mission équipe (PDF)</button></div>` : `<p class="hint">La liste « ce que le client doit fournir » apparaît une fois le devis accepté.</p>`}`;
}
document.addEventListener("click", async e => {
  if (!CUR) return;
  if (e.target.closest("#btnAddReq")) { const v = $("#reqNew").value.trim(); if (!v) return; CUR.reqs.push({id: uid("r"), label: v, status: "a_confirmer"}); scheduleSave(); rerenderTab(); }
  const es = e.target.closest("[data-evstate]"); if (es) { CUR.event.state = es.dataset.evstate; logTo(CUR, "Événement : " + (es.dataset.evstate || "remis en cours")); await saveCur(); rerenderDossier(); }
});

/* ---------- Onglet MATÉRIEL ---------- */
function tMat() {
  const d = CUR, c = ckStats(d);
  const cats = [...new Set(d.checklist.map(x => x.cat))].sort((a, b) => MAT_CATS.indexOf(a) - MAT_CATS.indexOf(b));
  const pct = c.total ? Math.round(c.ready / c.total * 100) : 0;
  return `
  <div class="fs"><h3>Matériel pour cet événement <span class="r">${c.ready}/${c.total} prêt(s)</span></h3>
    <div class="bar ${c.todo ? "warn" : ""}" style="margin-bottom:10px"><i style="width:${pct}%"></i></div>
    <div class="legend">${CK_STATUS.map(([k, l]) => `<span class="pill st-${k}" style="border:1.5px solid">${l}</span>`).join("")}</div>
    <p class="hint">« Non nécessaire » = pas prévu pour cet événement. Au retour, passe chaque ligne en « Revenu OK » ou « Revenu abîmé » (l'état remonte dans le parc).</p>
    ${cats.map(cat => `<p class="ck-cat">${esc(cat)}</p>` + d.checklist.map((x, i) => x.cat !== cat ? "" : `
      <div class="ck"><span class="lb">${esc(x.label)}${x.note ? `<small>${esc(x.note)}</small>` : ""}</span>
        <input class="q" data-f="checklist.${i}.qty" data-t="n" inputmode="decimal" value="${esc(x.qty)}" aria-label="Quantité">
        <select data-f="checklist.${i}.status" data-cls="1" data-ckret="${i}" class="s-${x.status}" aria-label="Statut">${CK_STATUS.map(([k, l]) => `<option value="${k}" ${x.status === k ? "selected" : ""}>${l}</option>`).join("")}</select>
        <button class="x" data-delck="${i}" aria-label="Retirer la ligne">✕</button></div>`).join("")).join("")}
    <div class="grid g2" style="margin-top:12px">
      <input id="ckNew" placeholder="Ajouter une ligne (ex. bâche supplémentaire)">
      <div class="row"><select id="ckCat" style="flex:1">${MAT_CATS.map(c => `<option>${c}</option>`).join("")}</select><button class="btn btn-o btn-sm" id="btnAddCk">Ajouter</button></div>
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn btn-o btn-sm" id="btnCkSync">Ajouter ce qui manque depuis le parc</button>
      <button class="btn btn-o btn-sm" id="btnCkAll">Tout « Prévu » → « Chargé »</button>
      <button class="btn btn-o btn-sm" data-pdf="mission">Fiche mission (PDF)</button>
    </div>
  </div>`;
}
document.addEventListener("click", e => {
  if (!CUR) return;
  const dc = e.target.closest("[data-delck]"); if (dc) { CUR.checklist.splice(+dc.dataset.delck, 1); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnAddCk")) { const v = $("#ckNew").value.trim(); if (!v) return; CUR.checklist.push({id: uid("c"), label: v, cat: $("#ckCat").value, qty: 1, status: "a_prevoir", note: ""}); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnCkSync")) {
    const have = new Set(CUR.checklist.map(c => c.matId).filter(Boolean));
    const add = defaultChecklist(CUR).filter(c => !have.has(c.matId));
    CUR.checklist.push(...add); scheduleSave(); rerenderTab(); toast(add.length ? add.length + " ligne(s) ajoutée(s)" : "Rien à ajouter, tout le parc est déjà listé");
  }
  if (e.target.closest("#btnCkAll")) { let n = 0; CUR.checklist.forEach(c => { if (c.status === "prevu") { c.status = "charge"; n++; } }); scheduleSave(); rerenderTab(); toast(n + " ligne(s) passée(s) en Chargé"); }
});
document.addEventListener("change", async e => {
  const s = e.target.closest("[data-ckret]"); if (!s || !CUR) return;
  const x = CUR.checklist[+s.dataset.ckret];
  if (x && x.matId && ST.materiel[x.matId] && (x.status === "abime" || x.status === "retour_ok")) {
    const m = clone(ST.materiel[x.matId]);
    if (x.status === "abime" && m.state !== "hs") { m.state = "reparer"; m.notes = ((m.notes || "") + "\n" + fd(todayISO()) + " : revenu abîmé de " + dossierTitle(CUR) + ".").trim(); await save("materiel", m); toast(m.name + " marqué « À réparer » dans le parc"); }
  }
});

/* ---------- Onglet ÉQUIPE ---------- */
function tTeam() {
  const d = CUR, n = needStats(d), staff = Object.values(ST.staff).sort((a, b) => a.name.localeCompare(b.name));
  const cost = teamCost(d);
  return `
  <div class="fs"><h3>Besoins en personnel <span class="r">${n.asg}/${n.need} affecté(s) · ${n.conf} confirmé(s)</span></h3>
    ${!staff.length ? `<div class="lock">Ajoute d'abord tes intervenants dans « Équipe » pour pouvoir les affecter.</div>` : ""}
    ${d.needs.map((x, i) => {
      const miss = Math.max(0, pf(x.count) - x.assigned.length), allConf = x.assigned.length >= pf(x.count) && x.assigned.every(a => a.confirmed);
      const pill = miss ? `<span class="pill p-red">Manque ${miss}</span>` : allConf ? `<span class="pill p-lime">Complet et confirmé</span>` : `<span class="pill p-amber">À confirmer</span>`;
      const free = staff.filter(s => !x.assigned.some(a => a.staffId === s.id));
      return `<div class="need">
        <div class="h"><b>${esc(x.role)}</b>${pill}<button class="x muted" data-delneed="${i}" style="margin-left:auto;font-weight:800" aria-label="Supprimer ce besoin">✕</button></div>
        <div class="grid g4">
          <div><label class="l">Rôle</label><select data-f="needs.${i}.role" data-rr="1">${ROLES.map(r => `<option ${x.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
          <div><label class="l">Date</label><input type="date" data-f="needs.${i}.date" value="${esc(x.date)}"></div>
          <div><label class="l">Heure</label><input type="time" data-f="needs.${i}.time" value="${esc(x.time)}"></div>
          <div><label class="l">Personnes</label><input data-f="needs.${i}.count" data-t="n" inputmode="numeric" value="${esc(x.count)}"></div>
          <div><label class="l">Heures / jour</label><input data-f="needs.${i}.hours" data-t="n" inputmode="decimal" value="${esc(x.hours)}"></div>
          <div><label class="l">Nb de jours</label><input data-f="needs.${i}.days" data-t="n" inputmode="numeric" value="${esc(x.days)}"></div>
        </div>
        <div class="asg">${x.assigned.map((a, j) => { const s = ST.staff[a.staffId]; return `<span class="p ${a.confirmed ? "ok" : ""}">${esc(s ? s.name : "Personne supprimée")}<button class="cf" data-conf="${i}.${j}" aria-label="${a.confirmed ? "Confirmé" : "Marquer confirmé"}" title="${a.confirmed ? "Confirmé" : "Marquer confirmé"}">✓</button><button data-unasg="${i}.${j}" aria-label="Retirer">✕</button></span>`; }).join("")}
          ${free.length ? `<select data-asg="${i}" style="width:auto;padding:6px 10px;font-size:13.5px;font-weight:800"><option value="">+ Affecter…</option>${free.map(s => `<option value="${s.id}">${esc(s.name)}${s.role ? " · " + esc(s.role) : ""}</option>`).join("")}</select>` : ""}
        </div></div>`;
    }).join("")}
    <div class="row"><button class="btn btn-o btn-sm" id="btnAddNeed">${IC.plus}Ajouter un besoin</button><button class="btn btn-o btn-sm" id="btnRegenNeeds">Recalculer depuis le devis</button></div>
  </div>
  <div class="fs"><h3>Coût équipe estimé</h3><p><b class="num" style="font-size:20px">${fmt(cost)}</b> <span class="muted">selon les tarifs horaires des personnes affectées</span></p>
    <p class="hint">Si tu enregistres les salaires en dépense « Main-d'œuvre » sur ce dossier, c'est la dépense réelle qui compte dans la rentabilité (pas de double comptage).</p></div>`;
}
document.addEventListener("click", e => {
  if (!CUR || UI.tab !== "team") return;
  const cf = e.target.closest("[data-conf]"); if (cf) { const [i, j] = cf.dataset.conf.split(".").map(Number); const a = CUR.needs[i].assigned[j]; a.confirmed = !a.confirmed; scheduleSave(); rerenderTab(); }
  const un = e.target.closest("[data-unasg]"); if (un) { const [i, j] = un.dataset.unasg.split(".").map(Number); CUR.needs[i].assigned.splice(j, 1); scheduleSave(); rerenderTab(); }
  const dn = e.target.closest("[data-delneed]"); if (dn) { CUR.needs.splice(+dn.dataset.delneed, 1); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnAddNeed")) { CUR.needs.push({id: uid("n"), role: "Autre", date: CUR.event.start || "", time: "", days: 1, hours: 4, count: 1, assigned: []}); scheduleSave(); rerenderTab(); }
  if (e.target.closest("#btnRegenNeeds")) {
    const old = CUR.needs; const fresh = defaultNeeds(CUR);
    fresh.forEach(f => { const o = old.find(x => x.role === f.role); if (o) f.assigned = o.assigned; });
    CUR.needs = fresh; scheduleSave(); rerenderTab(); toast("Besoins recalculés, affectations conservées");
  }
});
document.addEventListener("change", e => {
  const s = e.target.closest("[data-asg]"); if (!s || !CUR || !s.value) return;
  CUR.needs[+s.dataset.asg].assigned.push({staffId: s.value, confirmed: false}); scheduleSave(); rerenderTab();
});

/* ---------- Onglet FACTURES & PAIEMENTS ---------- */
function facAmountPaid(fid) { return Object.values(ST.paiements).filter(p => p.factureId === fid).reduce((a, p) => a + pf(p.amount), 0); }
function tPay() {
  const d = CUR, t = computeTotals(d), paid = paidFor(d.id), facs = facturesFor(d.id);
  const pays = Object.values(ST.paiements).filter(p => p.dossierId === d.id).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const acompte = r2(t.ttc * pf(ST.settings.acompte) / 100);
  const facTot = facs.reduce((a, f) => a + pf(f.amount), 0);
  const pct = t.ttc ? Math.min(100, Math.round(paid / t.ttc * 100)) : 0;
  const hasAc = facs.some(f => f.type === "acompte"), hasSolde = facs.some(f => f.type === "solde" || f.type === "totale");
  return `
  <div class="kpis">
    <div class="kpi"><span>Montant du devis</span><b>${fmt(t.ttc)}</b><small>${t.vatRate ? "TTC" : "net, TVA non applicable"}</small></div>
    <div class="kpi"><span>Encaissé</span><b class="pos">${fmt(paid)}</b><small>${pct} %</small></div>
    <div class="kpi"><span>Reste à encaisser</span><b>${fmt(Math.max(0, t.ttc - paid))}</b><small>acompte attendu ${fmt(acompte)}</small></div>
    <div class="kpi"><span>Facturé</span><b>${fmt(facTot)}</b><small>${facs.length} facture(s)</small></div>
  </div>
  <div class="fs"><h3>Factures</h3>
    ${d.status !== "Accepté" ? `<p class="hint">Les factures se créent une fois le devis accepté.</p>` : `
    <div class="row" style="margin-bottom:10px">
      <button class="btn btn-p btn-sm" data-emit="acompte" ${hasAc || hasSolde ? "disabled" : ""}>Facture d'acompte ${pf(ST.settings.acompte)} %</button>
      <button class="btn btn-p btn-sm" data-emit="${hasAc ? "solde" : "totale"}" ${hasSolde ? "disabled" : ""}>${hasAc ? "Facture de solde" : "Facture totale"}</button>
      <button class="btn btn-o btn-sm" data-emit="avoir" ${facs.length ? "" : "disabled"}>Avoir</button>
    </div>`}
    ${facs.length ? `<div class="tbl-w"><table class="tb"><tr><th>N°</th><th>Type</th><th>Date</th><th class="r">Montant</th><th>État</th><th></th></tr>
      ${facs.map(f => { const fp = facAmountPaid(f.id); const st = f.type === "avoir" ? `<span class="pill p-violet">Avoir</span>` : fp >= pf(f.amount) - 0.01 ? `<span class="pill p-lime">Payée</span>` : fp > 0 ? `<span class="pill p-amber">Partielle</span>` : `<span class="pill p-red">À payer</span>`;
        return `<tr><td><b>${esc(f.num)}</b></td><td>${esc(facTypeLabel(f.type))}</td><td>${fd(f.date)}</td><td class="r">${fmt(f.amount)}</td><td>${st}</td><td class="r"><button class="btn btn-o btn-sm" data-pdf="facture" data-fid="${f.id}">PDF</button></td></tr>`; }).join("")}</table></div>` : `<p class="hint">Aucune facture émise.</p>`}
    <p class="hint" style="margin-top:8px">Une facture émise ne se modifie plus (numérotation continue FAC-année-n°). Pour corriger : émets un avoir.</p>
  </div>
  <div class="fs"><h3>Paiements reçus <span class="r">${fmt(paid)}</span></h3>
    <div class="bar" style="margin-bottom:10px"><i style="width:${pct}%"></i></div>
    ${pays.length ? `<div class="tbl-w"><table class="tb"><tr><th>Date</th><th>Mode</th><th>Facture</th><th class="r">Montant</th><th></th></tr>
      ${pays.map(p => `<tr><td>${fd(p.date)}</td><td>${esc(p.method)}</td><td>${p.factureId && ST.factures[p.factureId] ? esc(ST.factures[p.factureId].num) : "—"}</td><td class="r"><b>${fmt(p.amount)}</b></td><td class="r"><button class="btn btn-o btn-sm" data-delpay="${p.id}" aria-label="Supprimer">✕</button></td></tr>`).join("")}</table></div>` : `<p class="hint">Aucun paiement enregistré.</p>`}
    <div class="row" style="margin-top:10px"><button class="btn btn-g btn-sm" id="btnAddPay">${IC.plus}Enregistrer un paiement</button></div>
  </div>`;
}
const facTypeLabel = t => ({acompte: "Acompte", solde: "Solde", totale: "Facture", avoir: "Avoir"}[t] || t);
document.addEventListener("click", e => {
  if (!CUR) return;
  const em = e.target.closest("[data-emit]"); if (em) emitDialog(em.dataset.emit);
  if (e.target.closest("#btnAddPay")) payDialog();
  const dp = e.target.closest("[data-delpay]"); if (dp) { const p = ST.paiements[dp.dataset.delpay]; confirmBox("Supprimer ce paiement ?", fmt(p.amount) + " du " + fd(p.date), "Supprimer", async () => { await remove("paiements", p.id); logTo(CUR, "Paiement supprimé : " + fmt(p.amount)); await saveCur(); rerenderDossier(); }); }
});
function payDialog() {
  const d = CUR, t = computeTotals(d), paid = paidFor(d.id);
  const facs = facturesFor(d.id).filter(f => f.type !== "avoir" && facAmountPaid(f.id) < pf(f.amount) - 0.01);
  const sug = facs[0] ? r2(pf(facs[0].amount) - facAmountPaid(facs[0].id)) : r2(Math.max(0, t.ttc - paid));
  modal(`<div class="mdl-h"><h2>Paiement reçu</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    <div class="grid g2">
      <div><label class="l" for="pAmt">Montant (€)</label><input id="pAmt" inputmode="decimal" value="${sug}"></div>
      <div><label class="l" for="pDate">Date</label><input id="pDate" type="date" value="${todayISO()}"></div>
      <div><label class="l" for="pMeth">Mode</label><select id="pMeth">${PAY_METHODS.map(m => `<option>${m}</option>`).join("")}</select></div>
      <div><label class="l" for="pFac">Facture réglée</label><select id="pFac"><option value="">Aucune</option>${facturesFor(d.id).filter(f => f.type !== "avoir").map(f => `<option value="${f.id}" ${facs[0] && facs[0].id === f.id ? "selected" : ""}>${esc(f.num)} · ${fmt(f.amount)}</option>`).join("")}</select></div>
      <div class="span2"><label class="l" for="pNote">Note</label><input id="pNote" placeholder="Réf. virement, n° chèque…"></div>
    </div>
    <div class="mdl-f"><button class="btn btn-o" data-close>Annuler</button><button class="btn btn-g" id="pOk">Enregistrer</button></div>`);
  $("#pOk").onclick = async () => {
    const amt = pf($("#pAmt").value); if (!amt) { toast("Indique le montant"); return; }
    const p = {id: uid("p"), dossierId: d.id, factureId: $("#pFac").value || "", date: $("#pDate").value || todayISO(), amount: amt, method: $("#pMeth").value, note: $("#pNote").value.trim(), by: ME.name, createdAt: new Date().toISOString()};
    await save("paiements", p); logTo(CUR, "Paiement reçu : " + fmt(amt) + " (" + p.method + ")"); await saveCur(); closeModal(); toast("Paiement enregistré"); rerenderDossier();
  };
}
function emitDialog(type) {
  const d = CUR, t = computeTotals(d), S = ST.settings;
  const facs = facturesFor(d.id);
  const acFac = facs.filter(f => f.type === "acompte");
  const acTot = acFac.reduce((a, f) => a + pf(f.amount), 0);
  let amount = 0, title = "";
  if (type === "acompte") { amount = r2(t.ttc * pf(S.acompte) / 100); title = "Facture d'acompte"; }
  if (type === "solde") { amount = r2(t.ttc - acTot); title = "Facture de solde"; }
  if (type === "totale") { amount = t.ttc; title = "Facture"; }
  if (type === "avoir") { title = "Avoir"; }
  const due = type === "acompte" ? todayISO() : (d.event.start ? addDays(d.event.start, -pf(S.soldeDays || 7)) : addDays(todayISO(), 30));
  modal(`<div class="mdl-h"><h2>${title}</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    ${type === "avoir" ? `<div class="grid g2">
      <div class="span2"><label class="l" for="eRef">Facture concernée</label><select id="eRef">${facs.filter(f => f.type !== "avoir").map(f => `<option value="${f.id}">${esc(f.num)} · ${fmt(f.amount)}</option>`).join("")}</select></div>
      <div><label class="l" for="eAmt">Montant de l'avoir (€)</label><input id="eAmt" inputmode="decimal" placeholder="ex. 200"></div>
      <div><label class="l" for="eDate">Date</label><input id="eDate" type="date" value="${todayISO()}"></div>
      <div class="span2"><label class="l" for="eWhy">Motif</label><input id="eWhy" placeholder="Annulation, geste commercial, erreur…"></div></div>`
    : `<div class="totbox" style="margin-bottom:12px">
        <div class="l"><span>Devis ${esc(d.num)}</span><span>${fmt(t.ttc)}</span></div>
        ${type === "solde" ? acFac.map(f => `<div class="l rem"><span>Acompte ${esc(f.num)}</span><span>− ${fmt(f.amount)}</span></div>`).join("") : ""}
        <div class="l big"><span>À facturer</span><span>${fmt(amount)}</span></div></div>
      <div class="grid g2"><div><label class="l" for="eDate">Date de facture</label><input id="eDate" type="date" value="${todayISO()}"></div>
      <div><label class="l" for="eDue">Échéance</label><input id="eDue" type="date" value="${due}"></div></div>
      ${!d.event.start ? `<p class="hint" style="color:var(--amber);font-weight:800;margin-top:8px">Les dates de l'événement ne sont pas encore définies : la facture indiquera « date de prestation à définir ».</p>` : ""}`}
    <p class="hint" style="margin-top:10px">Le numéro est attribué à l'émission. La facture ne pourra plus être modifiée.</p>
    <div class="mdl-f"><button class="btn btn-o" data-close>Annuler</button><button class="btn btn-p" id="eOk">Émettre ${type === "avoir" ? "l'avoir" : "la facture"}</button></div>`);
  $("#eOk").onclick = async () => {
    let amt = amount, ref = "", why = "";
    if (type === "avoir") { amt = -Math.abs(pf($("#eAmt").value)); ref = $("#eRef").value; why = $("#eWhy").value.trim(); if (!amt) { toast("Indique le montant"); return; } }
    $("#eOk").disabled = true; $("#eOk").textContent = "Numérotation…";
    const f = await emitInvoice(d, type, amt, $("#eDate").value || todayISO(), type === "avoir" ? "" : $("#eDue").value, ref, why);
    closeModal();
    if (f) { toast(f.num + " émise"); rerenderDossier(); openPdfPreview("facture", f.id); }
  };
}
async function emitInvoice(d, type, amount, date, due, ref, why) {
  const ok = await STORE.lock("factures");
  if (!ok) { toast("Une autre facture est en cours d'émission, réessaie dans quelques secondes."); return null; }
  const all = await STORE.list("factures");
  const y = date.slice(0, 4); let max = 0;
  all.forEach(f => { const m = (f.num || "").match(/^(?:FAC|AV)-(\d{4})-(\d+)$/); if (m && m[1] === y) max = Math.max(max, +m[2]); });
  const num = (type === "avoir" ? "AV" : "FAC") + "-" + y + "-" + String(max + 1).padStart(3, "0");
  const t = computeTotals(d), S = ST.settings;
  const prevAc = facturesFor(d.id).filter(f => f.type === "acompte").map(f => ({num: f.num, amount: f.amount}));
  const f = {
    id: uid("f"), num, type, dossierId: d.id, date, due: due || "", amount: r2(amount), ref, why, quoteNum: d.num, by: ME.name, createdAt: new Date().toISOString(),
    snap: {client: clone(d.client), event: clone(d.event), lines: quoteLines(d, t), totals: {brut: t.brut, locRem: t.locRem, slideDisc: pf(d.slide.disc), offered: t.offered, partial: t.partial, ht: t.ht, vatRate: t.vatRate, vat: t.vat, ttc: t.ttc}, prevAc, acPct: pf(S.acompte),
      co: {coname: S.coname, coaddr: S.coaddr, cotel: S.cotel, comail: S.comail, cosiret: S.cosiret, cotva: S.cotva, iban: S.iban, bic: S.bic, pay: S.pay, legal: S.legal, vatRegime: S.vatRegime},
      refNum: ref && ST.factures[ref] ? ST.factures[ref].num : ""}
  };
  await save("factures", f);
  logTo(d, (type === "avoir" ? "Avoir " : "Facture ") + num + " émise : " + fmt(f.amount));
  await saveCur();
  return f;
}

/* ---------- Onglet DÉPENSES ---------- */
function tDep() {
  const d = CUR, deps = depensesFor(d.id).sort((a, b) => (a.date || "").localeCompare(b.date || "")), p = profit(d);
  return `
  <div class="kpis">
    <div class="kpi"><span>CA HT</span><b>${fmt(p.ca)}</b></div>
    <div class="kpi"><span>Dépenses</span><b>${fmt(p.depTot)}</b></div>
    <div class="kpi"><span>Équipe (estimé)</span><b>${fmt(p.team)}</b><small>${p.hasMO ? "remplacé par les dépenses réelles" : "tarifs des affectés"}</small></div>
    <div class="kpi"><span>Résultat</span><b class="${p.res >= 0 ? "pos" : "neg"}">${fmt(p.res)}</b><small>${p.pct.toFixed(0)} % du CA · prévu ${computeTotals(d).cost ? fmt(computeTotals(d).marge) : "—"}</small></div>
  </div>
  <div class="fs"><h3>Dépenses liées à ce dossier</h3>
    ${deps.length ? depTable(deps, false) : `<p class="hint">Aucune dépense. Ajoute carburant, péages, salaires, repas… pour connaître la vraie rentabilité.</p>`}
    <div class="row" style="margin-top:10px"><button class="btn btn-g btn-sm" data-adddep="${d.id}">${IC.plus}Ajouter une dépense</button></div>
  </div>`;
}
function depTable(deps, showDossier) {
  return `<div class="tbl-w"><table class="tb"><tr><th>Date</th><th>Catégorie</th><th>Libellé</th>${showDossier ? "<th>Dossier</th>" : ""}<th>Par</th><th class="r">Montant</th><th></th></tr>
    ${deps.map(x => `<tr><td>${fd(x.date)}</td><td>${esc(x.cat)}</td><td>${esc(x.label)}</td>${showDossier ? `<td>${x.dossierId && ST.dossiers[x.dossierId] ? `<a href="#" data-open="${x.dossierId}" data-tab="dep">${esc(ST.dossiers[x.dossierId].num)}</a>` : "—"}</td>` : ""}<td>${esc(x.paidBy || x.by || "")}</td><td class="r"><b>${fmt(x.amount)}</b></td><td class="r"><button class="btn btn-o btn-sm" data-editdep="${x.id}" aria-label="Modifier">Modifier</button></td></tr>`).join("")}</table></div>`;
}
document.addEventListener("click", e => {
  const a = e.target.closest("[data-adddep]"); if (a) { e.preventDefault(); depDialog(null, a.dataset.adddep || ""); }
  const ed = e.target.closest("[data-editdep]"); if (ed) depDialog(ST.depenses[ed.dataset.editdep]);
  const lk = e.target.closest("a[data-open]"); if (lk) e.preventDefault();
});
function depDialog(x, dossierId) {
  const isNew = !x;
  x = x ? clone(x) : {id: uid("e"), date: todayISO(), cat: "Carburant", label: "", amount: "", dossierId: dossierId || "", paidBy: ME.name, by: ME.name};
  const Ds = Object.values(ST.dossiers).filter(d => d.status === "Accepté").sort((a, b) => (b.event.start || "").localeCompare(a.event.start || ""));
  modal(`<div class="mdl-h"><h2>${isNew ? "Nouvelle dépense" : "Modifier la dépense"}</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    <div class="grid g2">
      <div><label class="l" for="xAmt">Montant TTC (€)</label><input id="xAmt" inputmode="decimal" value="${esc(x.amount)}"></div>
      <div><label class="l" for="xDate">Date</label><input id="xDate" type="date" value="${esc(x.date)}"></div>
      <div><label class="l" for="xCat">Catégorie</label><select id="xCat">${DEP_CATS.map(c => `<option ${x.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div><label class="l" for="xBy">Payé par</label><select id="xBy">${["Alex", "Adeline", "Compte société"].map(c => `<option ${x.paidBy === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div class="span2"><label class="l" for="xLab">Libellé</label><input id="xLab" value="${esc(x.label)}" placeholder="Plein gasoil A6, péage Fontainebleau…"></div>
      <div class="span2"><label class="l" for="xDos">Dossier lié</label><select id="xDos"><option value="">Frais général (pas lié à un événement)</option>${Ds.map(d => `<option value="${d.id}" ${x.dossierId === d.id ? "selected" : ""}>${esc(d.num)} · ${esc(dossierTitle(d))}</option>`).join("")}</select></div>
    </div>
    <div class="mdl-f">${!isNew ? `<button class="btn btn-d" id="xDel">Supprimer</button>` : ""}<button class="btn btn-o" data-close>Annuler</button><button class="btn btn-g" id="xOk">Enregistrer</button></div>`);
  $("#xOk").onclick = async () => {
    x.amount = pf($("#xAmt").value); if (!x.amount) { toast("Indique le montant"); return; }
    x.date = $("#xDate").value || todayISO(); x.cat = $("#xCat").value; x.paidBy = $("#xBy").value; x.label = $("#xLab").value.trim(); x.dossierId = $("#xDos").value;
    await save("depenses", x); closeModal(); toast("Dépense enregistrée"); render();
  };
  if ($("#xDel")) $("#xDel").onclick = async () => { await remove("depenses", x.id); closeModal(); toast("Dépense supprimée"); render(); };
}

/* ---------- Onglet NOTES ---------- */
function tNotes() {
  const d = CUR;
  return `<div class="fs"><h3>Notes internes</h3>${F("Visible par Alex et Adeline uniquement", "notes", {area: 1, rows: 8, ph: "Infos client, négociation, souvenirs du montage…"})}</div>
  <div class="fs"><h3>Historique</h3>${(d.log || []).length ? `<div class="tbl-w"><table class="tb">${d.log.map(l => `<tr><td style="white-space:nowrap">${new Date(l.at).toLocaleString("fr-FR", {day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"})}</td><td><b>${esc(l.by)}</b></td><td>${esc(l.msg)}</td></tr>`).join("")}</table></div>` : `<p class="hint">Rien pour l'instant.</p>`}
  <p class="hint" style="margin-top:8px">Dernière modification : ${d.updatedAt ? new Date(d.updatedAt).toLocaleString("fr-FR") + " par " + esc(d.updatedBy || "?") : "—"}</p></div>`;
}

/* =====================================================================
   VUE : PLANNING
   ===================================================================== */
function vPlanning() {
  const ref = UI.calMonth || todayISO().slice(0, 7);
  const [Y, M] = ref.split("-").map(Number);
  const first = new Date(Y, M - 1, 1), startDow = (first.getDay() + 6) % 7;
  const gridStart = new Date(Y, M - 1, 1 - startDow);
  const T = todayISO();
  const Ds = Object.values(ST.dossiers).filter(d => (d.status === "Accepté" && d.event.state !== "annule") || d.status === "Envoyé");
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dt = new Date(gridStart); dt.setDate(gridStart.getDate() + i);
    const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const evs = [];
    Ds.forEach(d => {
      const r = occRange(d); if (!r || iso < r[0] || iso > r[1]) return;
      const e = d.event; let k = "on";
      if (iso < (e.start || r[0])) k = "setup"; else if (iso > (e.end || e.start || r[1])) k = "down";
      const ph = phase(d); const conf = conflictsFor(d).length;
      evs.push(`<span class="ev ${conf ? "c-red" : ph.cal} k-${k}" data-open="${d.id}" data-tab="event" title="${esc(dossierTitle(d))}">${k === "setup" ? "Montage · " : k === "down" ? "Démontage · " : d.status === "Envoyé" ? "Option · " : ""}${esc(dossierTitle(d))}</span>`);
    });
    cells.push(`<div class="d ${dt.getMonth() !== M - 1 ? "out" : ""} ${iso === T ? "today" : ""}"><span class="n">${dt.getDate()}</span>${evs.join("")}</div>`);
  }
  const monthName = first.toLocaleDateString("fr-FR", {month: "long", year: "numeric"});
  const mStart = ref + "-01", mEnd = ref + "-31";
  const list = Ds.filter(d => { const r = occRange(d); return r && r[0] <= mEnd && r[1] >= mStart; }).sort((a, b) => occRange(a)[0].localeCompare(occRange(b)[0]));
  const undated = Object.values(ST.dossiers).filter(d => isActive(d) && !d.event.start);
  return `
  <div class="pg-h"><div><h1>Planning</h1><p class="sub">Un seul toboggan : les chevauchements (montage et démontage compris) sont signalés en rouge</p></div></div>
  <div class="card card-p sec">
    <div class="cal-h"><button class="btn btn-o btn-sm" data-cal="-1" aria-label="Mois précédent">${IC.left}</button><h2>${monthName}</h2><button class="btn btn-o btn-sm" data-cal="0">Aujourd'hui</button><button class="btn btn-o btn-sm" data-cal="1" aria-label="Mois suivant">${IC.right}</button></div>
    <div class="cal">${["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(x => `<span class="dn">${x}</span>`).join("")}${cells.join("")}</div>
    <div class="legend" style="margin-top:10px"><span class="pill p-pink">Confirmé</span><span class="pill p-amber">Acompte reçu</span><span class="pill p-lime">Soldé</span><span class="pill p-violet">Réalisé</span><span class="pill p-grey">Devis envoyé (option)</span><span class="pill p-red">Conflit</span></div>
  </div>
  <div class="sec-t"><h2>Ce mois-ci</h2><span class="meta">${list.length} dossier(s)</span></div>
  ${list.length ? `<div class="dl">${list.map(dRow).join("")}</div>` : `<div class="card empty"><b>Aucun événement ce mois-ci</b></div>`}
  ${undated.length ? `<div class="sec-t" style="margin-top:16px"><h2>Confirmés sans date</h2></div><div class="dl">${undated.map(dRow).join("")}</div>` : ""}`;
}
document.addEventListener("click", e => {
  const c = e.target.closest("[data-cal]"); if (!c) return;
  const v = +c.dataset.cal;
  if (v === 0) UI.calMonth = todayISO().slice(0, 7);
  else { const [Y, M] = (UI.calMonth || todayISO().slice(0, 7)).split("-").map(Number); const d = new Date(Y, M - 1 + v, 1); UI.calMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  render();
});

/* =====================================================================
   VUE : TRÉSORERIE
   ===================================================================== */
function inPeriod(iso) {
  if (UI.tresoMode === "tout") return true;
  const ref = UI.tresoRef || (UI.tresoMode === "mois" ? todayISO().slice(0, 7) : todayISO().slice(0, 4));
  return (iso || "").startsWith(ref);
}
function periodLabel() {
  if (UI.tresoMode === "tout") return "Depuis le début";
  const ref = UI.tresoRef || (UI.tresoMode === "mois" ? todayISO().slice(0, 7) : todayISO().slice(0, 4));
  return UI.tresoMode === "mois" ? new Date(ref + "-15").toLocaleDateString("fr-FR", {month: "long", year: "numeric"}) : "Année " + ref;
}
function vTreso() {
  const P = Object.values(ST.paiements).filter(p => inPeriod(p.date));
  const E = Object.values(ST.depenses).filter(p => inPeriod(p.date));
  const ent = P.reduce((a, p) => a + pf(p.amount), 0), sor = E.reduce((a, p) => a + pf(p.amount), 0);
  const byCat = {}; E.forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + pf(x.amount));
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]); const maxC = cats.length ? cats[0][1] : 1;
  const mv = [...P.map(p => ({date: p.date, lbl: "Paiement " + (ST.dossiers[p.dossierId] ? dossierTitle(ST.dossiers[p.dossierId]) : "") + (p.factureId && ST.factures[p.factureId] ? " · " + ST.factures[p.factureId].num : ""), cat: p.method, amt: pf(p.amount), d: p.dossierId})),
    ...E.map(x => ({date: x.date, lbl: x.label || x.cat, cat: x.cat, amt: -pf(x.amount), d: x.dossierId, dep: x.id}))].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const prof = Object.values(ST.dossiers).filter(d => d.status === "Accepté" && d.event.state !== "annule" && inPeriod(d.event.start || d.acceptedAt || d.createdAt)).map(d => ({d, p: profit(d), paid: paidFor(d.id), t: computeTotals(d)}));
  const due = Object.values(ST.dossiers).filter(isActive).reduce((a, d) => a + Math.max(0, computeTotals(d).ttc - paidFor(d.id)), 0);
  return `
  <div class="pg-h"><div><h1>Trésorerie</h1><p class="sub">Rentrées, sorties et rentabilité · ${esc(periodLabel())}</p></div>
    <div class="act"><button class="btn btn-o" id="btnCsv">${IC.dl}Export CSV</button><button class="btn btn-g" data-adddep="">${IC.plus}Dépense</button></div></div>
  <div class="row" style="margin-bottom:12px">
    <div class="chips" style="margin:0">${[["mois", "Mois"], ["annee", "Année"], ["tout", "Tout"]].map(([k, l]) => `<button class="chip ${UI.tresoMode === k ? "on" : ""}" data-tmode="${k}">${l}</button>`).join("")}</div>
    ${UI.tresoMode !== "tout" ? `<button class="btn btn-o btn-sm" data-tnav="-1" aria-label="Période précédente">${IC.left}</button><button class="btn btn-o btn-sm" data-tnav="1" aria-label="Période suivante">${IC.right}</button>` : ""}
  </div>
  <div class="kpis">
    <div class="kpi"><span>Rentrées</span><b class="pos">${fmt(ent)}</b><small>${P.length} paiement(s)</small></div>
    <div class="kpi"><span>Sorties</span><b class="neg">${fmt(sor)}</b><small>${E.length} dépense(s)</small></div>
    <div class="kpi"><span>Solde</span><b class="${ent - sor >= 0 ? "pos" : "neg"}">${fmt(ent - sor)}</b><small>rentrées − sorties</small></div>
    <div class="kpi"><span>À encaisser</span><b>${fmt(due)}</b><small>tous dossiers en cours</small></div>
  </div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:14px;align-items:start">
    <section class="card card-p"><div class="sec-t"><h2>Mouvements</h2><span class="meta">${mv.length}</span></div>
      ${mv.length ? `<div class="tbl-w"><table class="tb"><tr><th>Date</th><th>Libellé</th><th class="r">Montant</th></tr>${mv.map(m => `<tr class="click" ${m.dep ? `data-editdep="${m.dep}"` : m.d ? `data-open="${m.d}" data-tab="pay"` : ""}><td style="white-space:nowrap">${fd(m.date)}</td><td>${esc(m.lbl)}<br><span class="muted" style="font-size:12px">${esc(m.cat)}</span></td><td class="r"><b class="${m.amt >= 0 ? "pos" : "neg"}">${m.amt >= 0 ? "+" : "−"} ${fmt(Math.abs(m.amt))}</b></td></tr>`).join("")}</table></div>` : `<div class="empty"><b>Aucun mouvement sur la période</b>Les paiements se saisissent dans chaque dossier, les dépenses ici.</div>`}
    </section>
    <section>
      <div class="card card-p sec"><div class="sec-t"><h2>Dépenses par catégorie</h2></div>
        ${cats.length ? cats.map(([c, v]) => `<div style="margin-bottom:8px"><div class="row" style="justify-content:space-between;font-size:13.5px;font-weight:700"><span>${esc(c)}</span><span class="num">${fmt(v)}</span></div><div class="bar bad"><i style="width:${Math.max(3, v / maxC * 100)}%"></i></div></div>`).join("") : `<p class="hint">Aucune dépense.</p>`}
      </div>
      <div class="card card-p"><div class="sec-t"><h2>Rentabilité par événement</h2></div>
        ${prof.length ? `<div class="tbl-w"><table class="tb"><tr><th>Dossier</th><th class="r">CA HT</th><th class="r">Coûts</th><th class="r">Résultat</th></tr>${prof.map(x => `<tr class="click" data-open="${x.d.id}" data-tab="dep"><td>${esc(dossierTitle(x.d))}<br><span class="muted" style="font-size:12px">${esc(x.d.num)} · payé ${fmt(x.paid)}/${fmt(x.t.ttc)}</span></td><td class="r">${fmt(x.p.ca)}</td><td class="r">${fmt(x.p.depTot + x.p.team)}</td><td class="r"><b class="${x.p.res >= 0 ? "pos" : "neg"}">${fmt(x.p.res)}</b></td></tr>`).join("")}</table></div>` : `<p class="hint">Aucun événement sur la période.</p>`}
      </div>
    </section>
  </div>`;
}
document.addEventListener("click", async e => {
  const m = e.target.closest("[data-tmode]"); if (m) { UI.tresoMode = m.dataset.tmode; UI.tresoRef = null; render(); }
  const n = e.target.closest("[data-tnav]"); if (n) {
    const v = +n.dataset.tnav;
    if (UI.tresoMode === "mois") { const [Y, M] = (UI.tresoRef || todayISO().slice(0, 7)).split("-").map(Number); const d = new Date(Y, M - 1 + v, 1); UI.tresoRef = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
    else UI.tresoRef = String(+(UI.tresoRef || todayISO().slice(0, 4)) + v);
    render();
  }
  if (e.target.closest("#btnCsv")) {
    const rows = [["Date", "Type", "Libellé", "Catégorie / mode", "Dossier", "Facture", "Montant"]];
    Object.values(ST.paiements).filter(p => inPeriod(p.date)).forEach(p => rows.push([p.date, "Rentrée", "Paiement", p.method, ST.dossiers[p.dossierId] ? ST.dossiers[p.dossierId].num : "", p.factureId && ST.factures[p.factureId] ? ST.factures[p.factureId].num : "", String(pf(p.amount)).replace(".", ",")]));
    Object.values(ST.depenses).filter(p => inPeriod(p.date)).forEach(x => rows.push([x.date, "Sortie", x.label, x.cat, ST.dossiers[x.dossierId] ? ST.dossiers[x.dossierId].num : "", "", String(-pf(x.amount)).replace(".", ",")]));
    rows.sort((a, b) => a === rows[0] ? -1 : b === rows[0] ? 1 : (a[0] || "").localeCompare(b[0] || ""));
    const csv = "﻿" + rows.map(r => r.map(c => '"' + String(c ?? "").replace(/"/g, '""') + '"').join(";")).join("\r\n");
    await offerFile("tresorerie-" + (UI.tresoMode === "tout" ? "complete" : (UI.tresoRef || (UI.tresoMode === "mois" ? todayISO().slice(0, 7) : todayISO().slice(0, 4)))) + ".csv", new Blob([csv], {type: "text/csv"}));
  }
});

/* =====================================================================
   VUE : ÉQUIPE
   ===================================================================== */
function vTeam() {
  const L = Object.values(ST.staff).sort((a, b) => a.name.localeCompare(b.name)), T = todayISO();
  const upcoming = id => Object.values(ST.dossiers).filter(isActive).flatMap(d => (d.needs || []).filter(n => n.assigned.some(a => a.staffId === id) && (!n.date || n.date >= T)).map(n => ({d, n, a: n.assigned.find(a => a.staffId === id)})))
    .sort((a, b) => (a.n.date || "9").localeCompare(b.n.date || "9"));
  return `
  <div class="pg-h"><div><h1>Équipe</h1><p class="sub">Intervenants, tarifs et missions à venir</p></div><div class="act"><button class="btn btn-p" id="btnAddStaff">${IC.plus}Ajouter</button></div></div>
  ${L.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))">${L.map(s => { const U = upcoming(s.id); return `<div class="card card-p">
    <div class="row"><h3 style="font-size:18px;color:var(--navy);flex:1">${esc(s.name)}</h3><button class="btn btn-o btn-sm" data-editstaff="${s.id}">Modifier</button></div>
    <p class="muted" style="font-size:13.5px;font-weight:700">${esc(s.role || "")}${s.kind ? " · " + esc(s.kind) : ""}${pf(s.rate) ? " · " + fmt(s.rate) + "/h" : ""}</p>
    ${s.tel ? `<p style="margin-top:4px;user-select:all" class="num">${esc(s.tel)}</p>` : ""}
    <p class="l" style="margin-top:10px">Missions à venir</p>
    ${U.length ? U.map(u => `<div class="row" style="justify-content:space-between;font-size:13.5px;padding:4px 0;border-bottom:1px solid var(--line);cursor:pointer" data-open="${u.d.id}" data-tab="team"><span><b>${esc(u.n.role)}</b> · ${esc(dossierTitle(u.d))}</span><span>${u.n.date ? fdShort(u.n.date) : "date ?"} ${u.a.confirmed ? '<span class="pill p-lime">OK</span>' : '<span class="pill p-amber">?</span>'}</span></div>`).join("") : `<p class="hint">Aucune mission prévue.</p>`}
  </div>`; }).join("")}</div>` : `<div class="card empty"><b>Aucun intervenant</b>Ajoute les personnes qui montent, surveillent et démontent le toboggan.</div>`}`;
}
document.addEventListener("click", e => {
  if (e.target.closest("#btnAddStaff")) staffDialog();
  const s = e.target.closest("[data-editstaff]"); if (s) staffDialog(ST.staff[s.dataset.editstaff]);
});
function staffDialog(s) {
  const isNew = !s; s = s ? clone(s) : {id: uid("s"), name: "", tel: "", role: "Montage", kind: "Extra / freelance", rate: "", notes: ""};
  modal(`<div class="mdl-h"><h2>${isNew ? "Nouvel intervenant" : esc(s.name)}</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    <div class="grid g2">
      <div class="span2"><label class="l" for="sName">Nom</label><input id="sName" value="${esc(s.name)}"></div>
      <div><label class="l" for="sTel">Téléphone</label><input id="sTel" type="tel" value="${esc(s.tel)}"></div>
      <div><label class="l" for="sRate">Tarif (€/h)</label><input id="sRate" inputmode="decimal" value="${esc(s.rate)}"></div>
      <div><label class="l" for="sRole">Poste habituel</label><select id="sRole">${ROLES.map(r => `<option ${s.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
      <div><label class="l" for="sKind">Statut</label><select id="sKind">${["Associé / gérant", "Salarié", "Extra / freelance", "Famille / bénévole"].map(r => `<option ${s.kind === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
      <div class="span2"><label class="l" for="sNotes">Notes</label><textarea id="sNotes" rows="2">${esc(s.notes)}</textarea></div>
    </div>
    <div class="mdl-f">${!isNew ? `<button class="btn btn-d" id="sDel">Supprimer</button>` : ""}<button class="btn btn-o" data-close>Annuler</button><button class="btn btn-g" id="sOk">Enregistrer</button></div>`);
  $("#sOk").onclick = async () => {
    s.name = $("#sName").value.trim(); if (!s.name) { toast("Indique un nom"); return; }
    s.tel = $("#sTel").value.trim(); s.rate = pf($("#sRate").value); s.role = $("#sRole").value; s.kind = $("#sKind").value; s.notes = $("#sNotes").value;
    await save("staff", s); closeModal(); toast(s.name + " enregistré"); render();
  };
  if ($("#sDel")) $("#sDel").onclick = async () => { await remove("staff", s.id); closeModal(); toast(s.name + " supprimé"); render(); };
}

/* =====================================================================
   VUE : PARC MATÉRIEL
   ===================================================================== */
function vParc() {
  const L = Object.values(ST.materiel).sort((a, b) => MAT_CATS.indexOf(a.cat) - MAT_CATS.indexOf(b.cat) || (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  const stPill = k => ({ok: "p-lime", verifier: "p-amber", reparer: "p-red", hs: "p-red"}[k] || "p-grey");
  const inc = m => m.include === "always" ? "À chaque événement" : m.include === "option" ? "Si option « " + (m.option || "?") + " »" : "Au cas par cas";
  return `
  <div class="pg-h"><div><h1>Parc matériel</h1><p class="sub">Sert de modèle à la liste de matériel de chaque événement</p></div><div class="act"><button class="btn btn-p" id="btnAddMat">${IC.plus}Ajouter</button></div></div>
  ${L.length ? `<div class="card"><div class="tbl-w"><table class="tb"><tr><th>Élément</th><th>Catégorie</th><th class="r">Possédé</th><th>Inclus</th><th>État</th><th>Contrôle</th></tr>
    ${L.map(m => `<tr class="click" data-editmat="${m.id}"><td><b>${esc(m.name)}</b>${m.serial ? `<br><span class="muted" style="font-size:12px">N° ${esc(m.serial)}</span>` : ""}</td><td>${esc(m.cat)}</td><td class="r">${esc(m.owned ?? "")}</td><td style="font-size:13px">${esc(inc(m))}</td><td><span class="pill ${stPill(m.state)}">${(MAT_STATES.find(s => s[0] === m.state) || ["", "OK"])[1]}</span></td><td style="white-space:nowrap">${m.nextCheck ? fd(m.nextCheck) : "—"}</td></tr>`).join("")}</table></div></div>`
    : `<div class="card empty"><b>Parc vide</b>Ajoute le toboggan, les souffleries, les rallonges… Chaque événement accepté reprendra cette liste.</div>`}`;
}
document.addEventListener("click", e => {
  if (e.target.closest("#btnAddMat")) matDialog();
  const m = e.target.closest("[data-editmat]"); if (m) matDialog(ST.materiel[m.dataset.editmat]);
});
function matDialog(m) {
  const isNew = !m; m = m ? clone(m) : {id: uid("m"), name: "", cat: "Divers", owned: 1, perEvent: 1, include: "always", option: "", state: "ok", serial: "", lastCheck: "", nextCheck: "", notes: "", order: 99};
  const opts = (ST.settings.options || []).map(o => o.name);
  modal(`<div class="mdl-h"><h2>${isNew ? "Nouvel élément" : esc(m.name)}</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    <div class="grid g2">
      <div class="span2"><label class="l" for="mName">Nom</label><input id="mName" value="${esc(m.name)}"></div>
      <div><label class="l" for="mCat">Catégorie</label><select id="mCat">${MAT_CATS.map(c => `<option ${m.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div><label class="l" for="mSerial">N° de série</label><input id="mSerial" value="${esc(m.serial)}"></div>
      <div><label class="l" for="mOwned">Quantité possédée</label><input id="mOwned" inputmode="numeric" value="${esc(m.owned)}"></div>
      <div><label class="l" for="mPer">Quantité par événement</label><input id="mPer" inputmode="numeric" value="${esc(m.perEvent)}"></div>
      <div><label class="l" for="mInc">Inclus dans la liste</label><select id="mInc"><option value="always" ${m.include === "always" ? "selected" : ""}>À chaque événement</option><option value="option" ${m.include === "option" ? "selected" : ""}>Si une option est cochée</option><option value="manual" ${m.include === "manual" ? "selected" : ""}>Au cas par cas</option></select></div>
      <div><label class="l" for="mOpt">Option liée</label><select id="mOpt"><option value="">—</option>${opts.map(o => `<option ${m.option === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>
      <div><label class="l" for="mState">État</label><select id="mState">${MAT_STATES.map(([k, l]) => `<option value="${k}" ${m.state === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div><label class="l" for="mLast">Dernier contrôle</label><input id="mLast" type="date" value="${esc(m.lastCheck)}"></div>
      <div><label class="l" for="mNext">Prochain contrôle</label><input id="mNext" type="date" value="${esc(m.nextCheck)}"></div>
      <div class="span2"><label class="l" for="mNotes">Notes / historique d'entretien</label><textarea id="mNotes" rows="3">${esc(m.notes)}</textarea></div>
    </div>
    <div class="mdl-f">${!isNew ? `<button class="btn btn-d" id="mDel">Supprimer</button>` : ""}<button class="btn btn-o" data-close>Annuler</button><button class="btn btn-g" id="mOk">Enregistrer</button></div>`);
  $("#mOk").onclick = async () => {
    m.name = $("#mName").value.trim(); if (!m.name) { toast("Indique un nom"); return; }
    Object.assign(m, {cat: $("#mCat").value, serial: $("#mSerial").value.trim(), owned: pf($("#mOwned").value), perEvent: pf($("#mPer").value) || 1, include: $("#mInc").value, option: $("#mOpt").value, state: $("#mState").value, lastCheck: $("#mLast").value, nextCheck: $("#mNext").value, notes: $("#mNotes").value});
    await save("materiel", m); closeModal(); toast(m.name + " enregistré"); render();
  };
  if ($("#mDel")) $("#mDel").onclick = async () => { await remove("materiel", m.id); closeModal(); toast(m.name + " supprimé"); render(); };
}

/* =====================================================================
   VUE : PLUS + PARAMÈTRES
   ===================================================================== */
function vMore() {
  return `<div class="pg-h"><h1>Plus</h1></div>
  <div class="grid" style="gap:10px">
    ${[["team", "Équipe", "Intervenants, tarifs, missions à venir"], ["parc", "Parc matériel", "Inventaire, état, contrôles"], ["settings", "Paramètres", "Tarifs, options, coordonnées, TVA, mentions"]].map(([k, l, s]) => `<button class="drow" data-nav="${k}" style="text-align:left"><span class="c" style="font-size:16px">${l}</span><span class="muted" style="font-size:13px">${s}</span></button>`).join("")}
    <button class="btn btn-o btn-blk" id="btnLogout2" style="margin-top:8px">Se déconnecter (${esc(ME.name)})</button>
  </div>`;
}
document.addEventListener("click", e => { if (e.target.closest("#btnLogout2")) logout(); });
let SETD = null;
function vSettings() {
  SETD = clone(ST.settings);
  const S = SETD, I = (l, k, o = {}) => `<div class="${o.span ? "span2" : ""}" style="min-width:0"><label class="l" for="s_${k}">${l}</label>${o.area ? `<textarea id="s_${k}" data-s="${k}" rows="${o.rows || 3}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ""}>${esc(S[k])}</textarea>` : `<input id="s_${k}" data-s="${k}" ${o.n ? 'data-t="n" inputmode="decimal"' : ""} value="${esc(S[k] ?? "")}">`}${o.hint ? `<p class="hint">${o.hint}</p>` : ""}</div>`;
  return `
  <div class="pg-h"><div><h1>Paramètres</h1><p class="sub">Communs à Alex et Adeline · s'appliquent aux nouveaux devis</p></div><div class="act"><button class="btn btn-g" id="btnSaveSet">Enregistrer</button></div></div>
  <div class="fs"><h3>Tarifs</h3><div class="grid g3">
    ${I("Toboggan 1er jour HT", "base", {n: 1})}${I("Jour supplémentaire HT", "extra", {n: 1})}${I("Forfait livraison/installation", "forfait", {n: 1})}
    ${I("Km facturé (€/km)", "kmrate", {n: 1})}${I("Coût réel du km", "kmcost", {n: 1, hint: "Pour les coûts prévus"})}${I("Main-d'œuvre (€/h/pers.)", "labor", {n: 1})}
    ${I("Validité des devis (jours)", "valid", {n: 1})}${I("Acompte (%)", "acompte", {n: 1})}${I("Solde exigible (jours avant)", "soldeDays", {n: 1})}
  </div></div>
  <div class="fs"><h3>Prix des options</h3><div class="grid g2">${(S.options || []).map((o, i) => `<div class="row"><input data-so="${i}.name" value="${esc(o.name)}" style="flex:2;min-width:0" aria-label="Nom de l'option"><input data-so="${i}.price" data-t="n" inputmode="decimal" value="${esc(o.price)}" style="flex:1;min-width:0" aria-label="Prix"><button class="btn btn-o btn-sm" data-delso="${i}" aria-label="Supprimer">✕</button></div>`).join("")}</div>
    <button class="btn btn-o btn-sm" id="btnAddSo" style="margin-top:10px">${IC.plus}Ajouter une option</button></div>
  <div class="fs"><h3>TVA</h3>
    <div class="seg" style="margin-bottom:10px">${[["franchise", "Franchise en base (pas de TVA)"], ["assujetti", "Assujetti à la TVA"]].map(([k, l]) => `<button type="button" data-vreg="${k}" class="${S.vatRegime === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="grid g2">${S.vatRegime === "assujetti" ? I("Taux par défaut (%)", "vat", {n: 1}) : `<p class="hint span2">Mention imprimée sur devis et factures : « ${VAT_FRANCHISE} ».</p>`}</div></div>
  <div class="fs"><h3>Coordonnées No Limit Events</h3><div class="grid g2">
    ${I("Raison sociale", "coname", {span: 1})}${I("Adresse", "coaddr", {span: 1})}${I("Téléphone", "cotel")}${I("Email", "comail")}${I("SIRET", "cosiret", {hint: "Obligatoire sur les factures"})}${I("N° TVA intracom.", "cotva")}
  </div></div>
  <div class="fs"><h3>Règlement</h3><div class="grid g2">${I("IBAN", "iban")}${I("BIC", "bic")}${I("Conditions de règlement", "pay", {span: 1})}</div></div>
  <div class="fs"><h3>Mentions et conditions</h3><div class="grid">
    ${I("Mentions légales (pied de page)", "legal", {area: 1})}
    ${I("Conditions générales de location (page 3 du devis)", "cgl", {area: 1, rows: 8, ph: "Colle ici tes CGL complètes."})}
  </div></div>
  <button class="btn btn-g btn-blk" id="btnSaveSet2">Enregistrer les paramètres</button>
  <div class="fs" style="margin-top:14px"><h3>Sauvegarde</h3>
    <p class="hint" style="margin-bottom:10px">Télécharge une copie complète des données (dossiers, factures, paiements, dépenses, équipe, parc). L'import ajoute ou remplace les éléments du fichier, sans rien supprimer.</p>
    <div class="row"><button class="btn btn-o" id="btnBackup">${IC.dl}Télécharger une sauvegarde</button>
    <label class="btn btn-o" for="impFile" style="cursor:pointer">Importer un fichier .json</label><input type="file" id="impFile" accept=".json,application/json" hidden></div></div>`;
}
document.addEventListener("input", e => {
  if (UI.view !== "settings" || !SETD) return;
  const t = e.target;
  if (t.dataset.s) SETD[t.dataset.s] = t.dataset.t === "n" ? pf(t.value) : t.value;
  if (t.dataset.so) { const [i, k] = t.dataset.so.split("."); SETD.options[+i][k] = k === "price" ? pf(t.value) : t.value; }
});
document.addEventListener("click", async e => {
  if (UI.view !== "settings" || !SETD) return;
  const v = e.target.closest("[data-vreg]"); if (v) { SETD.vatRegime = v.dataset.vreg; if (SETD.vatRegime === "assujetti" && !SETD.vat) SETD.vat = 20; ST.settings = clone(SETD); await saveSettings(SETD); render(); toast("Régime de TVA enregistré"); }
  const d = e.target.closest("[data-delso]"); if (d) { SETD.options.splice(+d.dataset.delso, 1); ST.settings = clone(SETD); render(); }
  if (e.target.closest("#btnAddSo")) { SETD.options.push({name: "Nouvelle option", price: 0}); ST.settings = clone(SETD); render(); }
  if (e.target.closest("#btnSaveSet") || e.target.closest("#btnSaveSet2")) { await saveSettings(SETD); toast("Paramètres enregistrés"); }
});

const COLLS = ["dossiers", "staff", "materiel", "depenses", "paiements", "factures"];
document.addEventListener("click", async e => {
  if (!e.target.closest("#btnBackup")) return;
  const out = {version: 1, exportedAt: new Date().toISOString(), config: {settings: ST.settings}};
  COLLS.forEach(c => out[c] = ST[c]);
  await offerFile("nle-sauvegarde-" + todayISO() + ".json", new Blob([JSON.stringify(out, null, 1)], {type: "application/json"}));
});
document.addEventListener("change", async e => {
  if (e.target.id !== "impFile" || !e.target.files[0]) return;
  let data; try { data = JSON.parse(await e.target.files[0].text()); } catch (x) { toast("Fichier illisible."); return; }
  const jobs = [];
  if (data.config && data.config.settings) jobs.push(["config", "settings", data.config.settings]);
  COLLS.forEach(c => Object.entries(data[c] || {}).forEach(([id, v]) => { if (c === "factures" && ST.factures[id]) return; jobs.push([c, id, Object.assign({}, v, {id: v.id || id})]); }));
  confirmBox("Importer " + jobs.length + " élément(s) ?", "Les éléments existants avec le même identifiant seront remplacés (sauf les factures déjà émises).", "Importer", async () => {
    let ok = 0; for (const [c, id, v] of jobs) { try { await STORE.set(c, id, v); ok++; } catch (x) {} }
    toast(ok + " élément(s) importé(s)"); e.target.value = "";
  });
});

/* =====================================================================
   PDF : devis, facture, fiche mission
   ===================================================================== */
function pdfHead(co, title, num, dline) {
  return `<div class="pd-band"><img src="${LOGO}" alt="">
    <div class="pd-co"><b>${esc(co.coname)}</b><br>${esc(co.coaddr)}<br>${[co.cotel, co.comail].filter(Boolean).map(esc).join(" · ")}<br>${co.cosiret ? "SIRET " + esc(co.cosiret) : ""}${co.cotva ? " · TVA " + esc(co.cotva) : ""}</div>
    <div class="pd-doc"><div class="t">${title}</div><div class="n">${esc(num)}</div><div class="d">${dline}</div></div></div>`;
}
function pdfParties(client, ev, days) {
  const dates = ev.start ? `Du <b>${fd(ev.start)}</b> au <b>${fd(ev.end || ev.start)}</b> — ${days} jour${days > 1 ? "s" : ""} de location` : `<span class="tbd">Dates à définir</span> — ${days} jour${days > 1 ? "s" : ""} de location`;
  const place = [ev.addr, [ev.cp, ev.city].filter(Boolean).join(" ")].filter(Boolean).map(esc).join("<br>");
  return `<div class="pd-2c">
    <div class="pd-blk"><h4>Client</h4><p><b>${esc(client.name || client.contact || "—")}</b><br>${client.name && client.contact ? esc(client.contact) + "<br>" : ""}${client.addr ? esc(client.addr) + "<br>" : ""}${[client.cp, client.city].filter(Boolean).map(esc).join(" ")}${client.cp || client.city ? "<br>" : ""}${[client.tel, client.email].filter(Boolean).map(esc).join(" · ")}${client.siren ? "<br>SIREN " + esc(client.siren) : ""}</p></div>
    <div class="pd-blk"><h4>Événement</h4><p><b>${esc(ev.name || "—")}</b><br>${place || '<span class="tbd">Lieu à confirmer</span>'}<br>${dates}</p></div></div>`;
}
function pdfLinesTable(lines, vatRate, fr) {
  return `<table class="pd-t"><tr><th>Désignation</th><th class="r">Qté</th><th class="r">PU HT</th><th class="r">Remise</th>${fr ? "" : '<th class="r">TVA</th>'}<th class="r">Total HT</th></tr>
    ${lines.map(l => `<tr><td class="des"><b>${esc(l.title)}</b>${l.sub && l.sub.length ? `<ul>${l.sub.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}${l.remAmt > 0 && l.rem < 100 ? `<div class="rm">${esc(l.remLabel || "Remise")} ${l.rem.toLocaleString("fr-FR")} % : − ${fmt(l.remAmt)}</div>` : ""}</td>
      <td class="r">${l.qty.toLocaleString("fr-FR")}</td><td class="r ${l.rem >= 100 ? "strike" : ""}">${fmt(l.pu)}</td><td class="r">${l.rem ? (l.rem >= 100 ? "100 %" : l.rem.toLocaleString("fr-FR") + " %") : "—"}</td>${fr ? "" : `<td class="r">${vatRate.toLocaleString("fr-FR")} %</td>`}
      <td class="r">${l.rem >= 100 ? '<span class="off">Offert</span>' : fmt(l.ht)}</td></tr>`).join("")}</table>`;
}
function pdfTotals(T, fr, extra) {
  return `<div class="pd-totw"><div class="pd-tot">
    ${T.locRem > 0 || T.offered > 0 || T.partial > 0 ? `<div class="l"><span>Total brut HT</span><span>${fmt(T.brut)}</span></div>` : ""}
    ${T.locRem > 0 ? `<div class="l rem"><span>Remise toboggan (${(T.slideDisc || 0).toLocaleString("fr-FR")} %)</span><span>− ${fmt(T.locRem)}</span></div>` : ""}
    ${T.offered > 0 ? `<div class="l rem"><span>Prestations offertes</span><span>− ${fmt(T.offered)}</span></div>` : ""}
    ${T.partial > 0 ? `<div class="l rem"><span>Remises sur options</span><span>− ${fmt(T.partial)}</span></div>` : ""}
    <div class="l ht"><span>TOTAL HT</span><span>${fmt(T.ht)}</span></div>
    ${fr ? "" : `<div class="l"><span>TVA ${T.vatRate.toLocaleString("fr-FR")} %</span><span>${fmt(T.vat)}</span></div>`}
    ${extra || `<div class="l ttc"><span>${fr ? "NET À PAYER" : "TOTAL TTC"}</span><span>${fmt(T.ttc)}</span></div>`}
    ${fr ? `<div class="l note"><span>${VAT_FRANCHISE}</span></div>` : ""}
  </div></div>`;
}
const CONDS = [
  "Le client garantit un <b>accès permettant l'arrivée du véhicule et de la remorque</b> jusqu'au lieu d'installation.",
  "Le terrain doit être suffisamment <b>plat, stable, dégagé et accessible</b>.",
  "Le client prévoit les <b>alimentations électriques</b> nécessaires au fonctionnement des 5 souffleries, pour une puissance totale d'environ <b>8 kW</b> (220 V / 16 A).",
  "Le client prévoit une <b>arrivée d'eau suffisamment proche</b>, avec un débit adapté au fonctionnement du toboggan aquatique.",
  "L'installation et la désinstallation nécessitent plusieurs personnes et sont réalisées selon les conditions prévues au présent devis.",
  "En cas de <b>météo incompatible</b> avec l'utilisation ou la manipulation de la structure (vent important, orage, conditions présentant un risque pour la sécurité), No Limit Events peut suspendre l'installation ou l'utilisation.",
  "Prévoir une zone permettant l'<b>ancrage ou le lestage réglementaire</b> de la structure."
];
function buildDevisPDF(d) {
  const S = ST.settings, t = computeTotals(d), fr = S.vatRegime === "franchise";
  const date = d.sentAt || d.createdAt || todayISO();
  const valid = addDays(date, pf(S.valid) || 30);
  const L = quoteLines(d, t);
  const T = {brut: t.brut, locRem: t.locRem, slideDisc: pf(d.slide.disc), offered: t.offered, partial: t.partial, ht: t.ht, vatRate: t.vatRate, vat: t.vat, ttc: t.ttc};
  const pages = S.cgl && S.cgl.trim() ? 3 : 2;
  const foot = n => `<div class="pd-foot">${esc(S.legal)}${fr ? " " + VAT_FRANCHISE + "." : ""}<br>${esc(S.coname)} — ${esc(S.coaddr)}${S.cosiret ? " — SIRET " + esc(S.cosiret) : ""} — Page ${n}/${pages}</div>`;
  return `<div class="pd">
  <div class="pd-page">${pdfHead(S, "DEVIS", d.num, "Date : " + fd(date) + "<br>Valable jusqu'au " + fd(valid))}
    ${pdfParties(d.client, d.event, t.days)}${pdfLinesTable(L, t.vatRate, fr)}${pdfTotals(T, fr)}${foot(1)}</div>
  <div class="pd-page"><div class="pd-band s"><img src="${LOGO}" alt=""><div class="pd-co"><b>${esc(S.coname)}</b><br>Devis ${esc(d.num)} — ${esc(d.client.name || d.client.contact || "Client")}</div><div class="pd-doc"><div class="d">${fd(date)}</div></div></div>
    <div class="pd-h3">Conditions techniques et d'installation</div><ul class="pd-cond">${CONDS.map(c => `<li>${c}</li>`).join("")}</ul>
    <div class="pd-h3">Règlement</div><div class="pd-blk"><p>${esc(S.pay)}<br>Acompte de ${pf(S.acompte)} % : <b>${fmt(r2(t.ttc * pf(S.acompte) / 100))}</b> · Solde : <b>${fmt(r2(t.ttc - r2(t.ttc * pf(S.acompte) / 100)))}</b>${S.iban ? "<br><b>IBAN :</b> " + esc(S.iban) : ""}${S.bic ? " · <b>BIC :</b> " + esc(S.bic) : ""}</p></div>
    <div class="pd-sign"><div class="pd-sig"><h4>Bon pour accord</h4><p>Nom : ......................................................<br>Date : ....................................................<br>Signature, précédée de la mention<br>« Bon pour accord » :</p></div>
      <div class="pd-sig"><h4>${esc(S.coname)}</h4><p>Devis établi le ${fd(date)}<br>Validité : ${pf(S.valid) || 30} jours</p></div></div>
    ${foot(2)}</div>
  ${pages === 3 ? `<div class="pd-page"><div class="pd-band s"><img src="${LOGO}" alt=""><div class="pd-co"><b>${esc(S.coname)}</b><br>Conditions générales de location</div></div><div class="pd-cgl">${esc(S.cgl)}</div>${foot(3)}</div>` : ""}
  </div>`;
}
function buildFacturePDF(f) {
  const s = f.snap, co = s.co, fr = co.vatRegime === "franchise", T = s.totals;
  const title = {acompte: "FACTURE D'ACOMPTE", solde: "FACTURE DE SOLDE", totale: "FACTURE", avoir: "AVOIR"}[f.type];
  const paid = facAmountPaid(f.id);
  const days = Math.max(1, s.event.days || 1);
  const prest = s.event.start ? "Date de prestation : " + fd(s.event.start) + (s.event.end && s.event.end !== s.event.start ? " au " + fd(s.event.end) : "") : "Date de prestation : à définir";
  const dline = "Date : " + fd(f.date) + (f.due ? "<br>Échéance : " + fd(f.due) : "") + "<br>Réf. devis " + esc(f.quoteNum) + (s.refNum ? "<br>Réf. facture " + esc(s.refNum) : "");
  let body = "";
  if (f.type === "acompte") {
    body = `<table class="pd-t"><tr><th>Désignation</th><th class="r">Montant HT</th></tr>
      <tr><td class="des"><b>Acompte de ${s.acPct} % sur le devis ${esc(f.quoteNum)}</b><ul><li>${esc(SLIDE_NAME)} — location ${days} jour${days > 1 ? "s" : ""}</li><li>Montant total du devis : ${fmt(T.ttc)}${fr ? "" : " TTC"}</li></ul></td><td class="r">${fmt(fr ? f.amount : r2(f.amount / (1 + T.vatRate / 100)))}</td></tr></table>
      <div class="pd-totw"><div class="pd-tot">${fr ? "" : `<div class="l"><span>TVA ${T.vatRate} %</span><span>${fmt(r2(f.amount - f.amount / (1 + T.vatRate / 100)))}</span></div>`}<div class="l ttc"><span>${fr ? "NET À PAYER" : "TOTAL TTC"}</span><span>${fmt(f.amount)}</span></div>${fr ? `<div class="l note"><span>${VAT_FRANCHISE}</span></div>` : ""}</div></div>`;
  } else if (f.type === "avoir") {
    body = `<table class="pd-t"><tr><th>Désignation</th><th class="r">Montant</th></tr><tr><td class="des"><b>Avoir sur facture ${esc(s.refNum || "")}</b>${f.why ? `<ul><li>Motif : ${esc(f.why)}</li></ul>` : ""}</td><td class="r">${fmt(f.amount)}</td></tr></table>
      <div class="pd-totw"><div class="pd-tot"><div class="l ttc"><span>MONTANT DE L'AVOIR</span><span>${fmt(f.amount)}</span></div>${fr ? `<div class="l note"><span>${VAT_FRANCHISE}</span></div>` : ""}</div></div>`;
  } else {
    const ac = f.type === "solde" ? s.prevAc.map(a => `<div class="l rem"><span>Acompte déjà facturé ${esc(a.num)}</span><span>− ${fmt(a.amount)}</span></div>`).join("") : "";
    const extra = `${fr ? "" : `<div class="l"><span>TOTAL TTC</span><span>${fmt(T.ttc)}</span></div>`}${ac}<div class="l ttc"><span>${f.type === "solde" ? "RESTE À PAYER" : fr ? "NET À PAYER" : "TOTAL TTC"}</span><span>${fmt(f.amount)}</span></div>`;
    body = pdfLinesTable(s.lines, T.vatRate, fr) + pdfTotals(T, fr, extra);
  }
  const paidBlock = f.type !== "avoir" && paid >= f.amount - 0.01 && paid > 0 ? `<p style="text-align:right;margin:-4px 0 10px"><span class="pd-paid">PAYÉE</span></p>` : "";
  return `<div class="pd"><div class="pd-page">${pdfHead(co, title, f.num, dline)}
    ${pdfParties(s.client, s.event, days)}
    <p style="font-size:8.6pt;color:#5C6B8A;margin:-8px 0 12px">${prest} · Catégorie : prestation de services${s.event.addr || s.event.city ? " · Lieu d'exécution : " + esc([s.event.addr, s.event.cp, s.event.city].filter(Boolean).join(" ")) : ""}</p>
    ${body}${paidBlock}
    ${f.type !== "avoir" ? `<div class="pd-blk"><h4>Règlement</h4><p>${f.due ? "À régler au plus tard le <b>" + fd(f.due) + "</b>. " : ""}${esc(co.pay)}${co.iban ? "<br><b>IBAN :</b> " + esc(co.iban) : ""}${co.bic ? " · <b>BIC :</b> " + esc(co.bic) : ""}${paid > 0 && paid < f.amount - 0.01 ? "<br>Déjà réglé : " + fmt(paid) + " · Reste dû : <b>" + fmt(f.amount - paid) + "</b>" : ""}</p></div>` : ""}
    <div class="pd-foot">${esc(co.legal)}${fr ? " " + VAT_FRANCHISE + "." : ""}<br>${esc(co.coname)} — ${esc(co.coaddr)}${co.cosiret ? " — SIRET " + esc(co.cosiret) : ""} — Page 1/1</div>
  </div></div>`;
}
function buildMissionPDF(d) {
  const S = ST.settings, e = d.event;
  const L = d.checklist.filter(x => x.status !== "non_necessaire");
  const cats = [...new Set(L.map(x => x.cat))];
  return `<div class="pd"><div class="pd-page">
    <div class="pd-band s"><img src="${LOGO}" alt=""><div class="pd-co"><b>FICHE MISSION</b><br>${esc(dossierTitle(d))} · ${esc(d.num)}</div><div class="pd-doc"><div class="d">Éditée le ${fd(todayISO())}</div></div></div>
    <div class="pd-2c"><div class="pd-blk"><h4>Lieu</h4><p><b>${esc(e.addr || "Lieu à confirmer")}</b><br>${esc([e.cp, e.city].filter(Boolean).join(" "))}<br>${e.notes ? esc(e.notes) : ""}</p></div>
      <div class="pd-blk"><h4>Dates</h4><p>Montage : <b>${fd(e.setup)}</b>${e.arrival ? " · arrivée " + esc(e.arrival) : ""}<br>Événement : <b>${fd(e.start)}</b> → <b>${fd(e.end || e.start)}</b><br>Démontage : <b>${fd(e.teardown)}</b><br>Contact sur place : <b>${esc(e.onsiteName || "—")}</b> ${esc(e.onsiteTel || "")}</p></div></div>
    <div class="pd-h3">Équipe</div>
    <table class="pd-t"><tr><th>Poste</th><th>Date</th><th>Heure</th><th>Personnes</th></tr>${d.needs.map(n => `<tr><td><b>${esc(n.role)}</b></td><td>${fd(n.date)}</td><td>${esc(n.time || "—")}</td><td>${n.assigned.map(a => ST.staff[a.staffId] ? esc(ST.staff[a.staffId].name) + (ST.staff[a.staffId].tel ? " (" + esc(ST.staff[a.staffId].tel) + ")" : "") : "").filter(Boolean).join(", ") || "—"}${n.assigned.length < pf(n.count) ? ` <b style="color:#D92D4B">· manque ${pf(n.count) - n.assigned.length}</b>` : ""}</td></tr>`).join("")}</table>
    <div class="pd-h3">Matériel à charger</div>
    <table class="pd-t"><tr><th>Élément</th><th class="r">Qté</th><th>Départ</th><th>Retour</th></tr>${cats.map(c => L.filter(x => x.cat === c).map(x => `<tr><td><b>${esc(x.label)}</b> <span style="color:#8794AE">· ${esc(c)}</span></td><td class="r">${x.qty}</td><td>☐</td><td>☐</td></tr>`).join("")).join("")}</table>
    <div class="pd-h3">Rappels sécurité</div><ul class="pd-cond">${CONDS.slice(5).map(c => `<li>${c}</li>`).join("")}<li>Vérifier les ancrages et la pression des souffleries avant ouverture au public.</li></ul>
    <div class="pd-foot">${esc(S.coname)} — document interne</div></div></div>`;
}
let PDF_CUR = null;
function openPdfPreview(kind, fid) {
  let html = "", name = "";
  if (kind === "devis") { html = buildDevisPDF(CUR); name = CUR.num + " - " + (CUR.client.name || CUR.client.contact || "client") + ".pdf"; }
  if (kind === "mission") { if (!CUR.checklist.length) ensureLogistics(CUR); html = buildMissionPDF(CUR); name = "Fiche mission " + CUR.num + ".pdf"; }
  if (kind === "facture") { const f = ST.factures[fid]; if (!f) return; html = buildFacturePDF(f); name = f.num + " - " + (f.snap.client.name || f.snap.client.contact || "client") + ".pdf"; }
  name = name.replace(/[\\/:*?"<>|]/g, "-");
  PDF_CUR = {html, name};
  modal(`<div class="mdl-h"><h2>${esc(name.replace(/\.pdf$/, ""))}</h2><button data-close aria-label="Fermer">${IC.x}</button></div>
    <div class="paper-w" id="paperW"><div class="paper-scale" id="paperS">${html}</div></div>
    <div class="mdl-f"><button class="btn btn-o" data-close>Fermer</button><button class="btn btn-p" id="btnPdfDl">${IC.dl}Télécharger le PDF</button></div>`, true);
  const fit = () => { const w = $("#paperW"), s = $("#paperS"); if (!w || !s) return; const k = (w.clientWidth - 20) / 794; s.style.transform = `scale(${k})`; s.style.width = "794px"; s.style.height = (s.scrollHeight * k) + "px"; s.parentElement.style.height = (s.firstElementChild.scrollHeight * k + 20) + "px"; };
  requestAnimationFrame(fit);
  $("#btnPdfDl").onclick = () => downloadPdf();
}
async function downloadPdf() {
  if (!PDF_CUR) return;
  const b = $("#btnPdfDl"); if (b) { b.disabled = true; b.textContent = "Génération…"; }
  try {
    if (typeof html2pdf === "undefined") throw new Error("lib");
    try { await document.fonts.ready; } catch (e) {}
    const host = $("#pdfHost"); host.innerHTML = PDF_CUR.html;
    const blob = await html2pdf().set({margin: 0, image: {type: "jpeg", quality: 0.94}, html2canvas: {scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 794}, jsPDF: {unit: "px", format: [794, 1122], orientation: "portrait", hotfixes: ["px_scaling"]}, pagebreak: {mode: ["legacy"]}}).from(host.firstElementChild).outputPdf("blob");
    host.innerHTML = "";
    await offerFile(PDF_CUR.name, blob);
  } catch (e) { toast("La génération du PDF a échoué. Recharge la page et réessaie."); }
  if (b) { b.disabled = false; b.innerHTML = IC.dl + "Télécharger le PDF"; }
}
async function offerFile(name, blob) {
  try {
    const file = new File([blob], name, {type: blob.type || (name.endsWith(".pdf") ? "application/pdf" : "text/plain")});
    if (/iPhone|iPad|Android/i.test(navigator.userAgent) && navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: name}); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast("Fichier téléchargé : " + name); }
  catch (e) { toast("Téléchargement impossible ici."); }
}

/* =====================================================================
   MODALES / TOAST
   ===================================================================== */
function modal(html, wide) {
  const m = $("#modal"); m.innerHTML = `<div class="mdl ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false;
  const f = m.querySelector("input,select,textarea"); if (f && !wide) setTimeout(() => f.focus(), 50);
}
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }
$("#modal").addEventListener("click", e => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });
function confirmBox(title, text, okLabel, fn) {
  modal(`<div class="mdl-h"><h2>${esc(title)}</h2></div><p>${esc(text)}</p><div class="mdl-f"><button class="btn btn-o" data-close>Annuler</button><button class="btn btn-d" id="cfOk">${esc(okLabel)}</button></div>`);
  $("#cfOk").onclick = async () => { closeModal(); await fn(); };
}
let toastT = null;
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

/* =====================================================================
   LANCEMENT
   ===================================================================== */
initLogin();
window.addEventListener("nle-auth", e => { const d = e.detail; if (d && d.uid) enterApp(d); else showLogin(d && d.error); });
if (window.NLEFB && window.NLEFB.state) window.dispatchEvent(new CustomEvent("nle-auth", {detail: window.NLEFB.state}));

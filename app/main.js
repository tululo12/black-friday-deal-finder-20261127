// DealLens: render + filter the 30 verified deals in window.DEALS.
// No network requests: everything renders from data.js.
(function () {
  "use strict";
  var DEALS = window.DEALS || [];

  var CATEGORIES = ["TVs", "Audio", "Computing", "Smart Home", "Gaming", "Home & Kitchen", "Toys"];
  var ICONS = {
    "TVs": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="2" y="4" width="20" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="1.8"/></svg>',
    "Audio": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 14a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="13" width="4" height="7" rx="1.5" fill="currentColor"/><rect x="17" y="13" width="4" height="7" rx="1.5" fill="currentColor"/></svg>',
    "Computing": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 19h20" stroke="currentColor" stroke-width="1.8"/></svg>',
    "Smart Home": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 11 12 3l9 8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 10v10h14V10" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    "Gaming": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="12.5" r="1.4" fill="currentColor"/><circle cx="16" cy="11" r="1.2" fill="currentColor"/><circle cx="18.5" cy="14" r="1.2" fill="currentColor"/></svg>',
    "Home & Kitchen": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 10h16v3a8 8 0 0 1-16 0z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V6h8v4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    "Toys": '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="12" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="12" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="8" y="4" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };

  function $(id) { return document.getElementById(id); }
  function money(n) {
    n = Math.round(n * 100) / 100; // drop float residue, e.g. 1300.0000000002
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: (n % 1 === 0 ? 0 : 2), maximumFractionDigits: 2 });
  }
  function pct(d) { return Math.round((1 - d.sale / d.usual) * 100); }
  function save(d) { return d.usual - d.sale; }
  function verdict(d) {
    if (d.lowestEver) return { label: "Lowest ever", cls: "lowest" };
    var p = pct(d);
    if (p >= 50) return { label: "Deep cut · " + p + "% off", cls: "deep" };
    if (p >= 30) return { label: "Strong deal · " + p + "% off", cls: "strong" };
    if (p >= 15) return { label: "Decent deal · " + p + "% off", cls: "decent" };
    return { label: "Modest cut · " + p + "% off", cls: "modest" };
  }

  // ---- stats ----
  var totalSave = DEALS.reduce(function (s, d) { return s + save(d); }, 0);
  var avgPct = DEALS.length ? Math.round(DEALS.reduce(function (s, d) { return s + pct(d); }, 0) / DEALS.length) : 0;
  var lowestCount = DEALS.filter(function (d) { return d.lowestEver; }).length;
  $("stat-deals").textContent = String(DEALS.length);
  $("stat-save").textContent = money(Math.round(totalSave));
  $("stat-avg").textContent = avgPct + "%";
  $("stat-lowest").textContent = String(lowestCount);
  var fsEl = $("finder-sum");
  if (fsEl) fsEl.textContent = DEALS.length + " deals · " + money(Math.round(totalSave)) + " you could save · " + avgPct + "% average discount · " + lowestCount + " lowest-ever prices";

  // ---- top picks: lowest-ever first, then biggest %, then biggest saving ----
  var picks = DEALS.slice().sort(function (a, b) {
    if (a.lowestEver !== b.lowestEver) return a.lowestEver ? -1 : 1;
    if (pct(b) !== pct(a)) return pct(b) - pct(a);
    return save(b) - save(a);
  }).slice(0, 3);
  var picksEl = $("picks");
  picks.forEach(function (d, i) {
    var v = verdict(d);
    var art = document.createElement("article");
    art.className = "pick";
    var rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = "#" + (i + 1);
    var h = document.createElement("h3");
    h.textContent = d.name;
    var price = document.createElement("div");
    var now = document.createElement("span");
    now.className = "pick-price";
    now.textContent = money(d.sale);
    var was = document.createElement("span");
    was.className = "pick-was";
    was.textContent = "was " + money(d.usual);
    price.appendChild(now);
    price.appendChild(was);
    var sv = document.createElement("span");
    sv.className = "pick-save";
    sv.textContent = "Save " + money(save(d)) + " (" + pct(d) + "% off) · " + v.label + " · " + d.store;
    var why = document.createElement("p");
    why.className = "pick-why";
    why.textContent = d.evidence;
    var link = document.createElement("a");
    link.href = d.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = d.linkKind === "store" ? "View at " + d.store + " ↗" : "Verify price ↗";
    art.appendChild(rank);
    art.appendChild(h);
    art.appendChild(price);
    art.appendChild(sv);
    art.appendChild(why);
    art.appendChild(link);
    picksEl.appendChild(art);
  });

  // ---- category pills ----
  var catsEl = $("cats");
  var state = { q: "", cat: "", store: "", min: 0, sort: "pct", lowest: false };
  function readParams() {
    var p = new URLSearchParams(window.location.search);
    state.q = p.get("q") || "";
    state.cat = p.get("cat") || "";
    state.store = p.get("store") || "";
    state.min = parseInt(p.get("min") || "0", 10) || 0;
    state.sort = p.get("sort") || "pct";
    state.lowest = p.get("lowest") === "1";
  }
  function writeParams() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat) p.set("cat", state.cat);
    if (state.store) p.set("store", state.store);
    if (state.min) p.set("min", String(state.min));
    if (state.sort !== "pct") p.set("sort", state.sort);
    if (state.lowest) p.set("lowest", "1");
    var qs = p.toString();
    history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
  }
  var allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "cat";
  allBtn.textContent = "All categories";
  allBtn.setAttribute("aria-pressed", "true");
  allBtn.addEventListener("click", function () { state.cat = ""; syncControls(); render(); });
  catsEl.appendChild(allBtn);
  CATEGORIES.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cat";
    b.textContent = c;
    b.setAttribute("aria-pressed", "false");
    b.dataset.cat = c;
    b.addEventListener("click", function () { state.cat = (state.cat === c ? "" : c); syncControls(); render(); });
    catsEl.appendChild(b);
  });

  // ---- controls ----
  var qEl = $("q"), storeEl = $("store"), minEl = $("mindisc"), sortEl = $("sort"), lowEl = $("lowest");
  qEl.addEventListener("input", function () { state.q = qEl.value.trim(); writeParams(); render(); });
  storeEl.addEventListener("change", function () { state.store = storeEl.value; writeParams(); render(); });
  minEl.addEventListener("change", function () { state.min = parseInt(minEl.value, 10); writeParams(); render(); });
  sortEl.addEventListener("change", function () { state.sort = sortEl.value; writeParams(); render(); });
  lowEl.addEventListener("change", function () { state.lowest = lowEl.checked; writeParams(); render(); });
  $("reset").addEventListener("click", resetAll);
  $("empty-reset").addEventListener("click", resetAll);
  function resetAll() {
    state = { q: "", cat: "", store: "", min: 0, sort: "pct", lowest: false };
    syncControls(); writeParams(); render();
  }
  function syncControls() {
    qEl.value = state.q;
    storeEl.value = state.store;
    minEl.value = String(state.min);
    sortEl.value = state.sort;
    lowEl.checked = state.lowest;
    var btns = catsEl.querySelectorAll(".cat");
    btns.forEach(function (b) {
      var c = b.dataset.cat || "";
      b.setAttribute("aria-pressed", String(state.cat === c));
    });
  }

  // ---- render grid ----
  var grid = $("grid"), countEl = $("count"), emptyEl = $("empty");
  function filtered() {
    var q = state.q.toLowerCase();
    var list = DEALS.filter(function (d) {
      if (state.cat && d.category !== state.cat) return false;
      if (state.store && d.store !== state.store) return false;
      if (pct(d) < state.min) return false;
      if (state.lowest && !d.lowestEver) return false;
      if (q) {
        var hay = (d.name + " " + d.category + " " + d.store + " " + d.evidence).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === "save") return save(b) - save(a);
      if (state.sort === "price") return a.sale - b.sale;
      if (state.sort === "name") return a.name.localeCompare(b.name);
      return pct(b) - pct(a);
    });
    return list;
  }
  function card(d) {
    var v = verdict(d);
    var art = document.createElement("article");
    art.className = "card";
    var top = document.createElement("div");
    top.className = "card-top";
    var tag = document.createElement("span");
    tag.className = "cat-tag";
    tag.textContent = d.category;
    var store = document.createElement("span");
    store.className = "store-tag";
    store.textContent = d.store;
    top.appendChild(tag);
    top.appendChild(store);
    var icon = document.createElement("div");
    icon.className = "icon";
    icon.innerHTML = ICONS[d.category] || "";
    icon.setAttribute("aria-hidden", "true");
    var h = document.createElement("h3");
    h.textContent = d.name;
    var prow = document.createElement("div");
    prow.className = "price-row";
    var now = document.createElement("span");
    now.className = "price";
    now.textContent = money(d.sale);
    var was = document.createElement("span");
    was.className = "was";
    was.textContent = money(d.usual);
    var sv = document.createElement("span");
    sv.className = "save";
    sv.textContent = "Save " + money(save(d));
    prow.appendChild(now);
    prow.appendChild(was);
    prow.appendChild(sv);
    var badge = document.createElement("span");
    badge.className = "verdict " + v.cls;
    badge.textContent = v.label;
    var cmp = null;
    if (d.compare) {
      var diff = Math.abs(d.sale - d.compare.sale);
      var verdict2 = d.compare.sale < d.sale
        ? d.compare.store + " has it " + money(diff) + " cheaper"
        : "cheapest here — " + d.compare.store + " lists it " + money(diff) + " higher";
      cmp = document.createElement("p");
      cmp.className = "compare";
      cmp.textContent = "Same product at " + d.compare.store + ": " + money(d.compare.sale) + " (" + d.compare.source + ") — " + verdict2 + ".";
    }
    var why = document.createElement("p");
    why.className = "why";
    why.textContent = d.evidence;
    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = "Checked " + d.checked + " · Source: " + d.source;
    var cta = document.createElement("div");
    cta.className = "cta";
    var a = document.createElement("a");
    a.href = d.link;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = d.linkKind === "store" ? "View at " + d.store + " ↗" : "Verify price ↗";
    cta.appendChild(a);
    if (d.linkKind === "source") {
      var note = document.createElement("span");
      note.className = "src-note";
      note.textContent = "Price verified via " + d.source + " — the store link is inside.";
      cta.appendChild(note);
    }
    art.appendChild(top);
    art.appendChild(icon);
    art.appendChild(h);
    art.appendChild(prow);
    art.appendChild(badge);
    if (cmp) art.appendChild(cmp);
    art.appendChild(why);
    art.appendChild(meta);
    art.appendChild(cta);
    return art;
  }
  function render() {
    var list = filtered();
    grid.textContent = "";
    list.forEach(function (d) { grid.appendChild(card(d)); });
    countEl.textContent = list.length === DEALS.length
      ? "Showing all " + DEALS.length + " verified deals."
      : "Showing " + list.length + " of " + DEALS.length + " deals.";
    emptyEl.hidden = list.length !== 0;
    writeParams();
  }

  readParams();
  syncControls();
  render();
})();

/* Minise Arte storefront app: routing, shop filters, product pages, bag and checkout.
   With the online backend (settings.api, see google-backend/Code.gs) the shop loads the
   catalogue published from admin.html and sends every order to it. Without it, orders go by WhatsApp. */
(function () {
  "use strict";

  var T = window.MINISE_T || {};
  // the store reads the catalogue from, and sends orders to, the Supabase database (settings.supabase)
  var SBC = (window.MINISE_SETTINGS || {}).supabase || {};
  var API = SBC.url && SBC.key ? String(SBC.url).replace(/\/+$/, "") : "";
  // call a database function; the public key only reaches what the database rules allow
  function rpc(name, body) {
    var h = { apikey: SBC.key, "Content-Type": "application/json" };
    if (/^eyJ/.test(SBC.key)) h.Authorization = "Bearer " + SBC.key; // older-style keys
    return fetch(API + "/rest/v1/rpc/" + name, { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  var LIVE_KEY = "minise_live";
  var liveVersion = "";
  // last catalogue published from the admin, saved by this browser on an earlier visit
  (function useSavedCatalogue() {
    if (!API) return;
    try {
      var c = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
      if (c && c.api === API && c.version && Array.isArray(c.products) && c.settings) {
        window.MINISE_PRODUCTS = c.products;
        window.MINISE_SETTINGS = Object.assign({}, c.settings, { supabase: SBC });
        liveVersion = c.version;
      }
    } catch (e) { /* use the built-in catalogue */ }
  })();
  function intlPhone(show) {
    var d = String(show || "").replace(/\D/g, "");
    if (d.indexOf("856") === 0) return d;
    return "856" + d.replace(/^0/, "");
  }
  var IG = "https://www.instagram.com/minise.arte/";
  var P, SET, WA, ACCOUNT, QR, OVR, bySlug;
  function applyData() {
    // products hidden in the admin page never reach the shop
    P = (window.MINISE_PRODUCTS || []).filter(function (p) { return !p.hid; });
    SET = window.MINISE_SETTINGS || {};
    WA = {
      mainShow: (SET.wa && SET.wa.mainShow) || "020 5524 6154",
      altShow: (SET.wa && SET.wa.altShow) || "020 5524 4246"
    };
    WA.main = intlPhone(WA.mainShow);
    WA.alt = intlPhone(WA.altShow);
    ACCOUNT = SET.account || "SOULINDA PHONEPHITHACK MS";
    QR = SET.qr || "images/laoqr.png";
    OVR = { hours: SET.hours, store_vte_addr: SET.addr };
    (SET.ann || []).forEach(function (a, i) { OVR["ann" + (i + 1)] = a; });
    bySlug = {};
    P.forEach(function (p) { bySlug[p.s] = p; });
  }
  applyData();

  /* ---------- storage (optional, per browser) ---------- */
  function load(k, json) {
    try { var v = localStorage.getItem(k); return json ? (v ? JSON.parse(v) : null) : v; } catch (e) { return null; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
  }

  var lang = load("minise_lang") === "lo" ? "lo" : "en";
  var bag = (load("minise_bag", true) || []).filter(function (it) { return it && bySlug[it.s]; });

  /* ---------- helpers ---------- */
  function t(k, vars) {
    var src = OVR[k] || T[k];
    var s = src ? (src[lang === "lo" ? 1 : 0] || "") : k;
    if (s.indexOf("020 5524 6154") > -1) s = s.split("020 5524 6154").join(WA.mainShow);
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return n.toLocaleString("en-US") + (lang === "lo" ? " ກີບ" : " ₭"); }
  function minPrice(p) { return p.o.length ? Math.min.apply(null, p.o.map(function (o) { return o.price; })) : null; }
  function priceText(p) {
    if (!p.o.length) return null;
    var pre = (p.o.length > 1 || p.from) ? t("from") + " " : "";
    return pre + money(minPrice(p));
  }
  function priceHTML(p) {
    var txt = priceText(p);
    return txt ? '<span class="pprice tn">' + esc(txt) + "</span>" : '<span class="pprice ask">' + esc(t("ask")) + "</span>";
  }
  function typeLabel(p) { return t("one_" + p.t[0]); }
  function fmtDate(iso) {
    var d = iso.split("-");
    if (lang === "lo") return d[2] + "/" + d[1] + "/" + d[0];
    var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+d[1] - 1];
    return (+d[2]) + " " + m + " " + d[0];
  }
  function img(src, alt, cls, eager) {
    return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="' + esc(src) + '" alt="' + esc(alt) + '"' +
      (eager ? "" : ' loading="lazy"') + ' decoding="async">';
  }
  function igPost(id) { return "https://www.instagram.com/p/" + id + "/"; }
  function waLink(text, num) { return "https://wa.me/" + (num || WA.main) + "?text=" + encodeURIComponent(text); }
  function byLikes(a, b) { return b.lk - a.lk; }
  // products pinned in the admin page (feat = 1, 2, 3…) lead the best-seller order
  function bestOrder(a, b) { return ((a.feat || 999) - (b.feat || 999)) || byLikes(a, b); }
  function newest(a, b) { return a.fp < b.fp ? 1 : a.fp > b.fp ? -1 : b.lk - a.lk; }
  function lastPostedDesc(a, b) { return a.lp < b.lp ? 1 : a.lp > b.lp ? -1 : 0; }

  var ICON = {
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12.5 4.2 4L19 7"/></svg>'
  };

  /* ---------- shared pieces ---------- */
  function badges(p) {
    var b = [];
    if (p.rts) b.push('<span class="badge rts">' + esc(t("b_rts")) + "</span>");
    if (p.day) b.push('<span class="badge day">' + esc(t("b_day")) + "</span>");
    if (p.so) b.unshift('<span class="badge old">' + esc(t("b_so")) + "</span>");
    if (!p.cur) b.push('<span class="badge old">' + esc(t("b_old")) + "</span>");
    return b.slice(0, 2).join("");
  }
  function card(p) {
    return '<a class="card" href="#p-' + p.s + '">' +
      '<div class="pimg">' + img(p.img[0], p.n, "a") + (p.img[1] ? img(p.img[1], "", "b") : "") +
      '<div class="badges">' + badges(p) + "</div>" + kitty("paw", "card-paw") + "</div>" +
      '<div class="pmeta"><span class="ptype">' + esc(typeLabel(p)) + '</span><span class="pname">' + esc(p.n) + "</span>" + priceHTML(p) + "</div></a>";
  }
  // the shop cat (js/cats.js); decorative, so screen readers skip it
  function kitty(pose, cls) { return window.MINISE_CAT ? '<span class="' + (cls || "kitty-wrap") + '">' + window.MINISE_CAT(pose) + "</span>" : ""; }
  function head(eyebrow, title, linkHref, linkText, tag, pose) {
    var h = tag || "h2";
    return '<div class="section-head"><div><p class="eyebrow">' + esc(eyebrow) + "</p><" + h + ">" + esc(title) + (pose ? " " + kitty(pose, "sec-kitty") : "") + "</" + h + "></div>" +
      (linkHref ? '<a class="link" href="' + linkHref + '">' + esc(linkText) + " →</a>" : "") + "</div>";
  }
  function stepsHTML() {
    var out = '<ol class="steps">';
    var poses = ["heart", "wave", "phone", "paint", "gift"];
    for (var i = 1; i <= 5; i++) out += "<li>" + kitty(poses[i - 1], "steps-kitty") + "<b>" + esc(t("s" + i)) + "</b><p>" + esc(t("s" + i + "p")) + "</p></li>";
    return out + "</ol>";
  }
  function faqHTML() {
    var out = '<div class="faq">';
    for (var i = 1; i <= 9; i++) out += "<details><summary>" + esc(t("q" + i)) + "</summary><p>" + esc(t("a" + i)) + "</p></details>";
    return out + "</div>";
  }
  function contactLine(num, show) {
    return '<div class="contact-line"><span>' + esc(t("whatsapp")) + '</span><span class="num">' + show + "</span>" +
      '<button class="mini-btn" type="button" data-copy="' + show + '">' + esc(t("copy")) + "</button>" +
      '<a class="link" href="https://wa.me/' + num + '" target="_blank" rel="noopener">wa.me</a></div>';
  }
  function visitHTML() {
    return '<div class="visit-grid">' +
      '<div class="store"><p class="eyebrow">' + esc(t("store_vte")) + "</p><h3>Morning Market Mall</h3><p>" + esc(t("store_vte_addr")) + "</p>" +
      "<p><b>" + esc(t("hours")) + "</b></p><p>" + esc(t("store_vte_p")) + "</p>" +
      contactLine(WA.main, WA.mainShow) + contactLine(WA.alt, WA.altShow) +
      '<a class="link" href="https://www.google.com/maps/search/?api=1&query=Morning+Market+Mall+Vientiane" target="_blank" rel="noopener">Google Maps →</a></div>' +
      '<div class="store"><p class="eyebrow">' + esc(t("store_au")) + "</p><h3>Melbourne</h3><p>" + esc(t("store_au_p")) + "</p>" +
      '<div class="contact-line"><a class="link" href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a>' +
      '<a class="link" href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></div></div>' +
      "</div>";
  }
  function promisesHTML() {
    var items = [["sparkle", "tr1"], ["swim", "tr2"], ["paint", "tr3"], ["gift", "tr4"]];
    return '<section class="promises"><div class="wrap promise-row">' + items.map(function (it) {
      return '<div class="promise">' + kitty(it[0], "promise-kitty") + "<div><b>" + esc(t(it[1])) + "</b><span>" + esc(t(it[1] + "p")) + "</span></div></div>";
    }).join("") + "</div></section>";
  }

  /* ---------- pages ---------- */
  function home() {
    var best = P.slice().sort(bestOrder).slice(0, 8);
    var fresh = P.slice().sort(newest).slice(0, 8);
    var heroPicks = [["glitzery-locket", 0], ["memory-link-italian-charm", 1], ["pearl-of-love", 0]].filter(function (h) { return bySlug[h[0]]; });
    best.forEach(function (b) { if (heroPicks.length < 3 && !heroPicks.some(function (h) { return h[0] === b.s; })) heroPicks.push([b.s, 0]); });
    var hero = heroPicks.map(function (h) {
      var p = bySlug[h[0]];
      return '<a class="pol" href="#p-' + p.s + '">' + img(p.img[h[1]] || p.img[0], p.n, "", true) + "<span>" + esc(p.n) + "</span></a>";
    }).join("");
    var types = ["locket", "bracelet", "necklace", "set", "earrings", "accessory"];
    var cats = types.map(function (ty) {
      var list = P.filter(function (p) { return p.t.indexOf(ty) > -1; });
      var pick = { locket: "beniga-bracelet-locket", set: "luna-sol-bracelet", earrings: "pearl-heart-studs", accessory: "lorra-mini-heart-locket" }[ty];
      var cover = (pick && bySlug[pick]) || list.slice().sort(byLikes).find(function (p) { return p.t[0] === ty; }) || list[0];
      if (!cover) return "";
      return '<a class="cat" href="#shop-' + ty + '"><div class="ph">' + img(cover.img[0], "") + kitty({ locket: "heart", bracelet: "wave", necklace: "sparkle", set: "gift", earrings: "drink", accessory: "shark" }[ty] || "peek", "tile-kitty") + "</div><div><b>" + esc(t("type_" + ty)) +
        '</b><span class="tn">' + list.length + " " + esc(t("designs")) + "</span></div></a>";
    }).join("");
    var keep = ["lorrens-mini-heart-locket", "secret-story-locket", "foreveryou-heart-locket", "beniga-bracelet-locket", "my-story-bracelet", "lillys-mini-heart-locket"]
      .filter(function (s) { return bySlug[s]; }).map(function (s) { return card(bySlug[s]); }).join("");
    var tags = ["photo", "pet", "clover", "butterfly", "flower", "couple", "italian", "christmas"].map(function (g) {
      var n = P.filter(function (p) { return p.g.indexOf(g) > -1; }).length;
      if (!n) return "";
      return '<a class="coll" href="#c-' + g + '"><b>' + esc(t("tag_" + g)) + '</b><span>' + n + "</span></a>";
    }).join("");
    var igPics = P.filter(function (p) { return p.ig.length; }).sort(lastPostedDesc).slice(0, 6).map(function (p) {
      return '<a href="' + igPost(p.ig[0]) + '" target="_blank" rel="noopener" aria-label="' + esc(p.n) + ' on Instagram">' + img(p.img[0], "") + "</a>";
    }).join("");

    return '<section class="hero"><div class="wrap hero-grid">' +
      '<div class="hero-copy">' + kitty("drink", "hero-kitty") + '<p class="eyebrow">' + esc(t("hero_eyebrow")) + "</p>" +
      "<h1>" + esc(t("hero_h1a")) + " <em>" + esc(t("hero_h1b")) + "</em></h1>" +
      '<p class="lead">' + esc(t("hero_lead")) + "</p>" +
      '<div class="hero-actions"><a class="btn" href="#shop">' + esc(t("hero_cta")) + '</a>' +
      '<a class="btn ghost" href="' + waLink(t("msg_hi")) + '" target="_blank" rel="noopener">' + esc(t("hero_wa")) + "</a></div>" +
      '<p class="proof"><span class="dot"></span>' + esc(t("hero_proof")) + "</p></div>" +
      '<div class="pol-stack">' + hero + kitty("sharkSleep", "pol-kitty") + "</div></div>" + kitty("walk", "walker") + "</section>" +
      promisesHTML() +
      '<section class="section"><div class="wrap">' + head(t("cat_eyebrow"), t("cat_h"), "", "", "", "search") + '<div class="cats">' + cats + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("best_eyebrow"), t("best_h"), "#shop", t("view_all"), "", "heart") + '<div class="grid">' + best.map(card).join("") + "</div></div></section>" +
      '<section class="section band"><div class="wrap keep-grid"><div class="keep-copy"><p class="eyebrow">' + esc(t("photo_eyebrow")) + "</p><h2>" + esc(t("photo_h")) + " " + kitty("gift", "sec-kitty") + "</h2>" +
      '<p class="lead">' + esc(t("photo_p")) + '</p><ul class="ticks">' +
      ["photo_l1", "photo_l2", "photo_l3"].map(function (k) { return "<li>" + ICON.tick + "<span>" + esc(t(k)) + "</span></li>"; }).join("") +
      '</ul><div><a class="btn" href="#c-photo">' + esc(t("photo_cta")) + '</a></div></div><div class="grid three">' + keep + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("new_eyebrow"), t("new_h"), "#shop", t("view_all"), "", "yay") + '<div class="grid">' + fresh.map(card).join("") + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("col_eyebrow"), t("col_h")) + '<div class="chips-row">' + tags + "</div></div></section>" +
      '<section class="section band"><div class="wrap">' + head(t("steps_eyebrow"), t("steps_h"), "#order", t("view_all"), "", "phone") + stepsHTML() + "</div></section>" +
      '<section class="section"><div class="wrap">' + head(t("visit_eyebrow"), t("visit_h"), "", "", "", "wave") + visitHTML() + "</div></section>" +
      '<section class="section tight"><div class="wrap">' + head("@minise.arte", t("ig_h"), IG, t("ig_cta"), "", "sharkPeek") + '<div class="ig-strip">' + igPics + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("faq_eyebrow"), t("faq_h"), "", "", "", "box") + faqHTML() + "</div></section>";
  }

  /* shop */
  var F = { type: "all", tag: "", av: "all", rts: false, sort: "best", q: "" };
  var TYPES = ["all", "locket", "bracelet", "necklace", "set", "earrings", "accessory"];
  var TAGS = ["photo", "pet", "clover", "butterfly", "flower", "couple", "italian", "christmas"];

  function filtered() {
    var q = F.q.trim().toLowerCase();
    var list = P.filter(function (p) {
      if (F.type !== "all" && p.t.indexOf(F.type) < 0) return false;
      if (F.tag && p.g.indexOf(F.tag) < 0) return false;
      if (F.av === "cur" && !p.cur) return false;
      if (F.av === "old" && p.cur) return false;
      if (F.rts && !p.rts) return false;
      if (q && (p.n + " " + p.en + " " + p.lo + " " + p.t.join(" ")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var price = function (p) { var m = minPrice(p); return m == null ? null : m; };
    var sorters = {
      best: bestOrder,
      "new": newest,
      lo: function (a, b) { var x = price(a), y = price(b); if (x == null) return 1; if (y == null) return -1; return x - y; },
      hi: function (a, b) { var x = price(a), y = price(b); if (x == null) return 1; if (y == null) return -1; return y - x; },
      az: function (a, b) { return a.n.localeCompare(b.n); }
    };
    return list.sort(sorters[F.sort] || byLikes);
  }
  function shopTitle() {
    if (F.tag) return t("tag_" + F.tag);
    if (F.type !== "all") return t("type_" + F.type);
    return t("shop_all");
  }
  function shop() {
    var typeBtns = TYPES.map(function (ty) {
      var n = ty === "all" ? P.length : P.filter(function (p) { return p.t.indexOf(ty) > -1; }).length;
      return '<button class="fbtn" type="button" data-ftype="' + ty + '" aria-pressed="' + (F.type === ty) + '">' + esc(ty === "all" ? t("shop_all") : t("type_" + ty)) + "<span>" + n + "</span></button>";
    }).join("");
    var tagBtns = TAGS.map(function (g) {
      var n = P.filter(function (p) { return p.g.indexOf(g) > -1; }).length;
      if (!n && F.tag !== g) return "";
      return '<button class="fbtn" type="button" data-ftag="' + g + '" aria-pressed="' + (F.tag === g) + '">' + esc(t("tag_" + g)) + "<span>" + n + "</span></button>";
    }).join("");
    var openFilters = window.matchMedia && window.matchMedia("(min-width: 901px)").matches;
    return '<section class="wrap"><div class="shop-head kittied">' + kitty("sharkPeek", "head-kitty") + '<p class="eyebrow">' + esc(t("shop_eyebrow")) + '</p><h1 id="shopTitle">' + esc(shopTitle()) + "</h1>" +
      '<p class="lead">' + esc(t("shop_lead")) + "</p></div>" +
      '<div class="shop-layout"><details class="filters"' + (openFilters ? " open" : "") + "><summary>" + esc(t("filters")) + " <span>＋</span></summary><div class=\"fbody\">" +
      '<div class="field"><label for="q">' + esc(t("search")) + '</label><input type="search" id="q" placeholder="' + esc(t("search_ph")) + '" value="' + esc(F.q) + '" autocomplete="off"></div>' +
      '<div class="fgroup"><h3>' + esc(t("category")) + '</h3><div class="flist">' + typeBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("collection")) + '</h3><div class="flist tags">' + tagBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("availability")) + '</h3><select id="fav" aria-label="' + esc(t("availability")) + '">' +
      ["all", "cur", "old"].map(function (v) { return '<option value="' + v + '"' + (F.av === v ? " selected" : "") + ">" + esc(t("av_" + v)) + "</option>"; }).join("") +
      '</select><label class="check"><input type="checkbox" id="frts"' + (F.rts ? " checked" : "") + "> " + esc(t("rts_only")) + "</label></div>" +
      kitty("sharkSleep", "filter-kitty") + "</div></details>" +
      '<div><div class="results-bar"><span class="count" id="count"></span><label class="check" for="fsort"><span class="sr">' + esc(t("sort")) + '</span><select id="fsort">' +
      ["best", "new", "lo", "hi", "az"].map(function (v) { return '<option value="' + v + '"' + (F.sort === v ? " selected" : "") + ">" + esc(t("so_" + v)) + "</option>"; }).join("") +
      '</select></label></div><div id="results"></div></div></div></section>';
  }
  function renderResults(how) {
    var list = filtered();
    var box = document.getElementById("results");
    if (!box) return;
    document.getElementById("count").textContent = list.length + " " + t("designs");
    document.getElementById("shopTitle").textContent = shopTitle();
    var note = F.av !== "cur" && list.some(function (p) { return !p.cur; }) ? '<p class="notice">' + esc(t("earlier_note")) + "</p>" : "";
    box.innerHTML = list.length ? note + '<div class="grid three">' + list.map(card).join("") + "</div>" :
      '<div class="empty">' + kitty("search", "empty-kitty") + "<p>" + esc(t("none")) + '</p><button class="btn ghost" type="button" data-clear>' + esc(t("clear")) + "</button></div>";
    document.querySelectorAll("[data-ftype]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ftype") === F.type)); });
    document.querySelectorAll("[data-ftag]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ftag") === F.tag)); });
    // a new page animates as a whole (route); a filter change pops the visible cards in
    if (how !== "page") { if (how !== "type") popCards(box); reveal(box); }
  }

  /* motion: pages fade up, cards pop in after a filter change, sections rise in as you scroll */
  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var seen = ("IntersectionObserver" in window) && !calm ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }) : null;
  var REVEAL = ".section-head, .cat, .card, .coll, .promise, .timeline li, .values > div, .steps li, .faq details, .ig-strip a, .visit-grid > *, .story-pics img";
  function reveal(root) {
    if (!seen) return;
    var vh = window.innerHeight;
    root.querySelectorAll(REVEAL).forEach(function (el) {
      if (el.dataset.rv) return;
      el.dataset.rv = "1";
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) return; // already on screen: the page animation shows it
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      el.classList.add("rv");
      seen.observe(el);
    });
  }
  function popCards(box) {
    if (calm) return;
    var vh = window.innerHeight, n = 0;
    box.querySelectorAll(".card").forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0 && n < 12) { c.style.setProperty("--i", n++); c.classList.add("pop"); c.dataset.rv = "1"; }
    });
  }
  function pageIn(main) {
    if (calm) return;
    main.classList.remove("page-in");
    void main.offsetWidth;
    main.classList.add("page-in");
    clearTimeout(pageIn._t);
    pageIn._t = setTimeout(function () { main.classList.remove("page-in"); }, 1000);
  }
  // the highlight behind the active menu item slides from page to page
  function movePill() {
    var nav = document.querySelector(".main-nav");
    if (!nav) return;
    var pill = nav.querySelector(".nav-pill");
    if (!pill) { pill = document.createElement("span"); pill.className = "nav-pill"; pill.setAttribute("aria-hidden", "true"); nav.insertBefore(pill, nav.firstChild); }
    var on = nav.querySelector('a[aria-current="page"]');
    if (!on) { pill.style.opacity = "0"; return; }
    pill.style.width = on.offsetWidth + "px";
    pill.style.height = on.offsetHeight + "px";
    pill.style.transform = "translate(" + on.offsetLeft + "px, " + on.offsetTop + "px)";
    pill.style.opacity = "1";
    if (!pill.classList.contains("ready")) setTimeout(function () { pill.classList.add("ready"); }, 60);
    var left = on.offsetLeft, right = left + on.offsetWidth;
    if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: Math.max(0, left - 24), behavior: calm ? "auto" : "smooth" });
  }

  /* product */
  var S = null; // product page state
  function features(p) {
    var f = [];
    if (p.day) f.push(["f_day", true]);
    if (p.rts) f.push(["f_rts", false]);
    if (p.polaroid) f.push(["f_polaroid", false]); else if (p.ph) f.push(["f_photo", false]);
    if (p.s925) f.push(["f_s925", false]);
    else if (p.stainless) f.push(["f_stainless", false]);
    if (p.waterproof) f.push(["f_water", false]);
    f.push(["f_box", false]);
    return '<ul class="feats">' + f.map(function (x) { return "<li" + (x[1] ? ' class="hot"' : "") + ">" + esc(t(x[0])) + "</li>"; }).join("") + "</ul>";
  }
  function describe(p, which) {
    var txt = which === "lo" ? p.lo : p.en;
    if (txt) return txt;
    if (which === "lo") return "";
    var bits = ["Handmade " + t("one_" + p.t[0]).toLowerCase() + " by Minise Arte" + (p.stainless ? " in stainless steel" : "") + "."];
    if (p.li) bits.push("Personalise it with " + (p.li[0] === p.li[1] ? p.li[0] : p.li[0] + "–" + p.li[1]) + " initial" + (p.li[1] > 1 ? "s" : "") + ".");
    return bits.join(" ");
  }
  function unitPrice(p, opt, addN) {
    if (!p.o.length) return null;
    return p.o[opt].price + (p.add ? addN * p.add.price : 0);
  }
  function product(slug) {
    var p = bySlug[slug];
    if (!p) return '<section class="wrap page-head">' + kitty("search", "empty-kitty") + "<h1>" + esc(t("not_found")) + '</h1><p><a class="btn" href="#shop">' + esc(t("back_shop")) + "</a></p></section>";
    S = { p: p, img: 0, opt: 0, addN: 0, qty: 1, col: "" };
    var thumbs = p.img.length > 1 ? '<div class="thumbs">' + p.img.map(function (src, i) {
      return '<button type="button" data-thumb="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(t("photo_n", { n: i + 1 })) + '">' + img(src, "") + "</button>";
    }).join("") + "</div>" : "";
    var priceBlock = priceBlockHTML();
    var opts = p.o.length > 1 ? '<div class="field"><span class="lbl">' + esc(t("option")) + '</span><div class="opts" role="radiogroup">' + p.o.map(function (o, i) {
      return '<label class="opt"><input type="radio" name="opt" value="' + i + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(lang === "lo" ? o.lo : o.en) + "<small>" + esc(money(o.price)) + "</small></span></label>";
    }).join("") + "</div></div>" : "";
    var addon = p.add ? '<div class="field"><span class="lbl">' + esc(lang === "lo" ? p.add.lo : p.add.en) + ' <span class="hint">(' + esc(t("addon_each", { p: money(p.add.price) })) + ')</span></span>' +
      '<div class="stepper"><button type="button" data-step="addN" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><output id="addN">0</output><button type="button" data-step="addN" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div></div>' : "";
    var ini = p.li ? '<div class="field"><label for="ini">' + esc(t("initials")) + '</label><input type="text" id="ini" maxlength="' + Math.max(p.li[1], 1) + '" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<span class="hint">' + esc(p.li[1] > 1 ? t("initials_hint", { n: p.li[1] }) : t("initials_hint1")) + '</span><span class="err" id="iniErr" hidden>' + esc(t("req_ini")) + "</span></div>" : "";
    var optIsColour = p.o.some(function (o) { return o.en === "Silver" || o.en === "Gold"; });
    var col = p.c.length > 1 && !optIsColour ? '<div class="field"><span class="lbl">' + esc(t("colour")) + '</span><div class="opts" role="radiogroup">' + p.c.map(function (c, i) {
      return '<label class="opt"><input type="radio" name="col" value="' + c + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(t(c)) + "</span></label>";
    }).join("") + "</div></div>" : "";
    if (p.c.length > 1 && !optIsColour) S.col = p.c[0];
    var photo = p.ph ? '<p class="notice">📷 ' + esc(t("photos_later")) + "</p>" : "";
    var related = P.filter(function (x) { return x !== p && x.t[0] === p.t[0]; })
      .sort(function (a, b) {
        var sa = a.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0, sb = b.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0;
        return (sb - sa) || ((b.cur - a.cur)) || byLikes(a, b);
      }).slice(0, 4);
    var otherLang = lang === "lo" ? describe(p, "en") : p.lo;
    return '<section class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#shop">' + esc(t("nav_shop")) + '</a><span>/</span><a href="#shop-' + p.t[0] + '">' + esc(t("type_" + p.t[0])) + "</a><span>/</span><span>" + esc(p.n) + "</span></nav>" +
      '<div class="pdp-grid"><div class="gallery">' + kitty(p.s.length % 2 ? "sharkPeek" : "peek", "gal-kitty") + '<div class="gmain">' + img(p.img[0], p.n, "", true).replace("<img", '<img id="gmain"') + "</div>" + thumbs + "</div>" +
      '<div class="pinfo"><div><p class="ptype">' + esc(typeLabel(p)) + "</p><h1>" + esc(p.n) + '</h1></div><div id="priceBlock">' + priceBlock + "</div>" + features(p) +
      (!p.cur ? '<p class="notice">' + esc(t("earlier_note")) + "</p>" : "") +
      '<form class="pform" id="pform" novalidate>' + opts + col + ini + addon + photo +
      '<div class="field"><label for="pnote">' + esc(t("note")) + '</label><textarea id="pnote" placeholder="' + esc(t("note_ph")) + '"></textarea></div>' +
      '<div class="field"><span class="lbl">' + esc(t("qty")) + '</span><div class="stepper"><button type="button" data-step="qty" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><output id="qty">1</output><button type="button" data-step="qty" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div></div>' +
      '<div class="actions">' + (p.so ? '<p class="notice">' + esc(t("so_note")) + '</p><button class="btn wide" type="submit" disabled>' + esc(t("so_btn")) : '<button class="btn wide" type="submit">' + esc(t("add"))) + '</button><a class="btn ghost wide" id="askWa" target="_blank" rel="noopener" href="#">' + esc(t("wa_this")) + "</a></div></form>" +
      '<div class="desc"><h2>' + esc(t("about")) + "</h2><p>" + esc(describe(p, lang) || describe(p, "en")) + "</p>" +
      (otherLang ? "<details><summary>" + esc(t("in_lao")) + "</summary><p>" + esc(otherLang) + "</p></details>" : "") + "</div>" +
      (p.ig.length ? '<p class="igproof">' + esc(t("ig_proof", { n: p.pc, d: fmtDate(p.lp) })) + ' <a class="link" href="' + igPost(p.ig[0]) + '" target="_blank" rel="noopener">' + esc(t("ig_view")) + " →</a></p>" : "") +
      "</div></div></section>" +
      (related.length ? '<section class="section tight"><div class="wrap">' + head(t("related"), t("type_" + p.t[0]), "#shop-" + p.t[0], t("view_all")) + '<div class="grid">' + related.map(card).join("") + "</div></div></section>" : "");
  }
  function priceBlockHTML() {
    var p = S.p;
    var u = unitPrice(p, S.opt, S.addN);
    if (u != null) {
      var label = p.o.length === 1 && p.o[0].en ? '<p class="price-note">' + esc(lang === "lo" ? p.o[0].lo : p.o[0].en) + "</p>" : "";
      var pre = p.from && p.o.length === 1 ? t("from") + " " : "";
      return '<p class="price-big tn">' + esc(pre + money(u)) + "</p>" + label;
    }
    var note = "";
    if (p.last) note = t("last_listed", { p: money(p.last), y: p.lastYear });
    else if (p.other) note = t("last_listed", { p: p.other.replace(/^(Price\/ລາຄາ|Price|ລາຄາ|PRICE)[^:]*:\s*/i, "").replace(/\s*\(.*$/, "").trim(), y: p.lp.slice(0, 4) });
    return '<p class="price-big ask">' + esc(t("ask")) + "</p>" + (note ? '<p class="price-note">' + esc(note) + "</p>" : "");
  }
  function currentSelection() {
    var p = S.p;
    var ini = document.getElementById("ini");
    var note = document.getElementById("pnote");
    return {
      s: p.s, opt: S.opt, addN: S.addN, qty: S.qty, col: S.col,
      ini: ini ? ini.value.trim().toUpperCase() : "",
      note: note ? note.value.trim() : ""
    };
  }
  function lineDetails(p, it) {
    var d = [];
    if (p.o.length > 1 || (p.o.length === 1 && p.o[0].en)) d.push(lang === "lo" ? p.o[it.opt].lo : p.o[it.opt].en);
    if (it.col) d.push(t("colour") + ": " + t(it.col));
    if (it.ini) d.push(t("initials") + ": " + it.ini);
    if (p.add && it.addN) d.push((lang === "lo" ? p.add.lo : p.add.en) + " × " + it.addN);
    if (it.note) d.push("“" + it.note + "”");
    return d;
  }
  function updateAskLink() {
    var a = document.getElementById("askWa");
    if (!a || !S) return;
    var it = currentSelection();
    var d = lineDetails(S.p, it);
    a.href = waLink(t("msg_ask") + " " + S.p.n + (d.length ? " (" + d.join(", ") + ")" : "") + (S.p.ig.length ? "\n" + igPost(S.p.ig[0]) : ""));
  }

  /* bag */
  function saveBag() { save("minise_bag", bag); updateBagCount(); }
  var lastCount = null;
  function updateBagCount() {
    var n = bag.reduce(function (s, it) { return s + it.qty; }, 0);
    var el = document.getElementById("bagCount");
    el.textContent = n;
    if (lastCount !== null && n > lastCount && !calm) {
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
      var pop = document.getElementById("bagPop");
      if (pop && window.MINISE_CAT) {
        if (!pop.firstChild) pop.innerHTML = window.MINISE_CAT("peek");
        pop.classList.remove("go"); void pop.offsetWidth; pop.classList.add("go");
      }
    }
    lastCount = n;
  }
  function bagTotals() {
    var sum = 0, unknown = 0;
    bag.forEach(function (it) {
      var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
      if (u == null) unknown += it.qty; else sum += u * it.qty;
    });
    return { sum: sum, unknown: unknown };
  }
  function bagLines(editable) {
    return bag.map(function (it, idx) {
      var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
      var d = lineDetails(p, it);
      return '<div class="line">' + img(p.img[0], p.n) + '<div class="info"><b>' + esc(p.n) + "</b>" +
        (d.length ? "<small>" + esc(d.join(" · ")) + "</small>" : "") +
        '<div class="row">' + (editable ?
          '<div class="stepper"><button type="button" data-bagstep="' + idx + '" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><output>' + it.qty + '</output><button type="button" data-bagstep="' + idx + '" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div>'
          : '<span class="tn">× ' + it.qty + "</span>") +
        '<span class="tn">' + esc(u == null ? t("to_confirm") : money(u * it.qty)) + "</span></div>" +
        (editable ? '<button class="remove" type="button" data-remove="' + idx + '">' + esc(t("remove")) + "</button>" : "") +
        "</div></div>";
    }).join("");
  }
  function totalHTML() {
    var tt = bagTotals();
    return '<div class="total"><span>' + esc(t("subtotal")) + '</span><b>' + esc(money(tt.sum)) + "</b></div>" +
      (tt.unknown ? '<p class="total-note">' + esc(t("plus_confirm")) + "</p>" : "");
  }
  var lastFocus = null;
  function openBag() {
    lastFocus = document.activeElement;
    renderDrawer();
    var sc = document.getElementById("scrim"), d = document.getElementById("drawer");
    clearTimeout(closeBag._t);
    sc.hidden = false; d.hidden = false;
    void d.offsetWidth;
    sc.classList.add("open"); d.classList.add("open");
    var c = d.querySelector("[data-close]");
    if (c) c.focus({ preventScroll: true });
    peekerUpdate();
  }
  function closeBag() {
    var sc = document.getElementById("scrim"), d = document.getElementById("drawer");
    sc.classList.remove("open"); d.classList.remove("open");
    clearTimeout(closeBag._t);
    // hide once the slide-out has finished
    closeBag._t = setTimeout(function () { if (!d.classList.contains("open")) { sc.hidden = true; d.hidden = true; peekerUpdate(); } }, calm ? 0 : 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function renderDrawer() {
    var d = document.getElementById("drawer");
    d.innerHTML = '<div class="drawer-head"><div class="drawer-title">' + (bag.length ? kitty("box", "drawer-kitty") : "") + '<h2 id="drawerTitle">' + esc(t("bag_h")) + '</h2></div><button class="icon-btn" type="button" data-close aria-label="' + esc(t("close")) + '">✕</button></div>' +
      '<div class="drawer-body">' + (bag.length ? bagLines(true) : '<div class="empty">' + kitty("sleep", "empty-kitty") + "<p>" + esc(t("bag_empty")) + "</p></div>") + "</div>" +
      '<div class="drawer-foot">' + (bag.length ? totalHTML() + '<a class="btn wide" href="#checkout" data-close>' + esc(t("checkout")) + "</a>" : "") +
      '<button class="btn ghost wide" type="button" data-close>' + esc(t("keep")) + "</button></div>";
  }

  /* checkout: pay first, then the order is sent straight to Minise (no WhatsApp needed) */
  var COUNTRIES = [
    // [key, calling code, pattern for the number without its leading 0, example]
    ["LA", "856", /^(20\d{8}|30\d{7}|2[1-9]\d{6})$/, "020 5555 1234"],
    ["TH", "66", /^([689]\d{8}|[2-7]\d{7})$/, "081 234 5678"],
    ["VN", "84", /^([35789]\d{8}|2\d{9})$/, "091 234 5678"],
    ["CN", "86", /^1[3-9]\d{9}$/, "131 2345 6789"],
    ["AU", "61", /^[2-478]\d{8}$/, "0412 345 678"],
    ["NZ", "64", /^(2\d{7,9}|[3-9]\d{7})$/, "021 123 4567"],
    ["US", "1", /^[2-9]\d{2}[2-9]\d{6}$/, "201 555 0123"],
    ["OT", "", /^\d{6,14}$/, ""]
  ];
  var PROVINCES = [
    ["Vientiane Capital", "ນະຄອນຫຼວງວຽງຈັນ"], ["Vientiane Province", "ແຂວງວຽງຈັນ"], ["Luang Prabang", "ຫຼວງພະບາງ"],
    ["Savannakhet", "ສະຫວັນນະເຂດ"], ["Champasak", "ຈຳປາສັກ"], ["Khammouane", "ຄຳມ່ວນ"], ["Bolikhamxay", "ບໍລິຄຳໄຊ"],
    ["Xayaboury", "ໄຊຍະບູລີ"], ["Xiengkhouang", "ຊຽງຂວາງ"], ["Oudomxay", "ອຸດົມໄຊ"], ["Luang Namtha", "ຫຼວງນ້ຳທາ"],
    ["Bokeo", "ບໍ່ແກ້ວ"], ["Phongsaly", "ຜົ້ງສາລີ"], ["Houaphanh", "ຫົວພັນ"], ["Saravane", "ສາລະວັນ"],
    ["Sekong", "ເຊກອງ"], ["Attapeu", "ອັດຕະປື"], ["Xaisomboun", "ໄຊສົມບູນ"]
  ];
  var VIAS = ["whatsapp", "phone", "facebook", "line", "instagram"];
  var DELS = ["d_pick", "d_anou", "d_mix", "d_houng", "d_abroad"];
  var CO = { slipImg: null, slipUrl: "", photos: [], sending: false, done: null };
  var slipImg = null; // kept for the receipt drawing
  var orderNo = "";
  function newOrderNo() {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return "MA-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + r;
  }
  // the order number stays the same while the customer is paying, even if the page redraws
  function currentOrderNo() {
    if (orderNo) return orderNo;
    try { orderNo = sessionStorage.getItem("minise_order_no") || ""; } catch (e) { orderNo = ""; }
    if (!/^MA-\d{6}-[A-Z0-9]{4}$/.test(orderNo)) {
      orderNo = newOrderNo();
      try { sessionStorage.setItem("minise_order_no", orderNo); } catch (e) { /* memory only */ }
    }
    return orderNo;
  }
  function needPhotos() { return bag.some(function (it) { var p = bySlug[it.s]; return p && p.ph; }); }
  function countryOf(key) { return COUNTRIES.find(function (c) { return c[0] === key; }) || COUNTRIES[0]; }
  // phone typed by the customer → "+85620…" or "" when it isn't a real number
  function readPhone() {
    var c = countryOf(fieldVal("coCc"));
    var code = c[0] === "OT" ? fieldVal("coCcOther").replace(/\D/g, "") : c[1];
    var digits = fieldVal("coPhone").replace(/\D/g, "");
    if (code && digits.indexOf(code) === 0 && digits.length > 9) digits = digits.slice(code.length); // typed with the country code
    digits = digits.replace(/^0+/, "");
    if (!code || !/^[1-9]\d{0,3}$/.test(code) || !c[2].test(digits) || (code + digits).length < 8 || (code + digits).length > 15) return "";
    var tail = digits.slice(-7); // 0000000, 1234567 and the like are never real
    if (/^(\d)\1+$/.test(tail) || "01234567890".indexOf(tail) > -1 || "09876543210".indexOf(tail) > -1) return "";
    return "+" + code + digits;
  }
  function prettyPhone(e164) {
    var m = /^\+856(20)(\d{4})(\d{4})$/.exec(e164);
    if (m) return "+856 " + m[1] + " " + m[2] + " " + m[3];
    m = /^\+856(30)(\d{3})(\d{4})$/.exec(e164) || /^\+856(2\d)(\d{3})(\d{3})$/.exec(e164);
    if (m) return "+856 " + m[1] + " " + m[2] + " " + m[3];
    var c = COUNTRIES.find(function (x) { return x[1] && e164.indexOf("+" + x[1]) === 0; });
    return c ? "+" + c[1] + " " + e164.slice(c[1].length + 1) : e164;
  }
  function fieldVal(id) { var el = document.getElementById(id); return el ? String(el.value || "").trim() : ""; }
  function delText() { var del = document.getElementById("coDel"); return del ? del.options[del.selectedIndex].text : ""; }
  function addressText() {
    var v = fieldVal("coDel");
    if (v === "d_pick") return "";
    if (v === "d_abroad") return [fieldVal("coCountry"), fieldVal("coAddr")].filter(Boolean).join(" · ");
    var prov = document.getElementById("coProv");
    var parts = [
      prov && prov.value ? t("prov") + ": " + prov.options[prov.selectedIndex].text : "",
      fieldVal("coDist") ? t("dist") + ": " + fieldVal("coDist") : "",
      fieldVal("coVill") ? t("vill_short") + ": " + fieldVal("coVill") : "",
      fieldVal("coBranch") ? t("branch_short") + ": " + fieldVal("coBranch") : "",
      fieldVal("coAddr")
    ];
    return parts.filter(Boolean).join(" · ");
  }
  function field(id, label, inner, hint) {
    return '<div class="field" id="' + id + 'F"><label for="' + id + '">' + esc(label) + "</label>" + inner +
      (hint ? '<span class="hint" id="' + id + 'H">' + esc(hint) + "</span>" : "") +
      '<span class="err" id="' + id + 'E" hidden></span></div>';
  }
  function stepHead(n, title) { return '<legend><span class="num">' + n + "</span>" + esc(title) + "</legend>"; }
  function checkout() {
    if (CO.done) return checkoutDone();
    if (!bag.length) return '<section class="wrap page-head">' + kitty("sleep", "empty-kitty") + '<p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + '</h1><p class="lead">' + esc(t("co_empty")) + '</p><p><a class="btn" href="#shop">' + esc(t("hero_cta")) + "</a></p></section>";
    var tt = bagTotals(), no = currentOrderNo(), photos = needPhotos(), n = 1;
    // items without a price can't be paid online: say so before asking for any details
    if (tt.unknown) {
      return '<section class="wrap"><div class="page-head"><p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + "</h1></div>" +
        '<div class="co-grid"><div class="co-form"><p class="notice warn">' + esc(t("need_price")) + '</p><a class="btn wide" href="' + esc(waLink(orderMessage({ bag: bag, total: tt.sum, unpaid: true }))) + '" target="_blank" rel="noopener">' + esc(t("need_price_wa")) + "</a></div>" +
        '<aside class="co-side"><div class="panel"><h2>' + esc(t("summary")) + "</h2>" + bagLines(true) + totalHTML() + "</div></aside></div></section>";
    }
    var cc = COUNTRIES.map(function (c) { return '<option value="' + c[0] + '">' + esc(t("cc_" + c[0])) + "</option>"; }).join("");
    var vias = VIAS.map(function (v) { return '<option value="' + v + '">' + esc(t("via_" + v)) + "</option>"; }).join("");
    var dels = DELS.map(function (k) { return '<option value="' + k + '">' + esc(t(k)) + "</option>"; }).join("");
    var provs = '<option value="">' + esc(t("prov_ph")) + "</option>" + PROVINCES.map(function (p, i) { return '<option value="' + i + '">' + esc(lang === "lo" ? p[1] : p[0]) + "</option>"; }).join("");
    var html = '<section class="wrap"><div class="page-head"><p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + '</h1><p class="lead">' + esc(t("co_p")) + "</p></div>" +
      '<div class="co-grid"><form class="co-form" id="coForm" novalidate>' +
      '<fieldset class="co-step">' + kitty("wave", "step-kitty") + stepHead(n++, t("st_details")) +
      field("coName", t("name"), '<input type="text" id="coName" autocomplete="name" maxlength="60" required>') +
      '<div class="field" id="coPhoneF"><label for="coPhone">' + esc(t("phone")) + '</label><div class="phone-row">' +
      '<select id="coCc" aria-label="' + esc(t("cc_label")) + '">' + cc + "</select>" +
      '<input type="text" id="coCcOther" class="cc-other" inputmode="numeric" maxlength="4" placeholder="+" aria-label="' + esc(t("cc_code")) + '" hidden>' +
      '<input type="tel" id="coPhone" autocomplete="tel-national" inputmode="tel" maxlength="20" required></div>' +
      '<span class="hint" id="coPhoneH"></span><span class="err" id="coPhoneE" hidden></span></div>' +
      field("coVia", t("via_label"), '<select id="coVia">' + vias + "</select>") +
      field("coHandle", t("handle_facebook"), '<input type="text" id="coHandle" maxlength="100" autocomplete="off">') +
      "</fieldset>" +
      '<fieldset class="co-step">' + stepHead(n++, t("st_delivery")) +
      field("coDel", t("delivery"), '<select id="coDel">' + dels + "</select>") +
      '<p class="notice" id="pickNote">' + esc(t("pick_note")) + "</p>" +
      '<p class="notice" id="abroadNote" hidden>' + esc(t("abroad_note")) + ' <a class="link" href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a></p>' +
      '<div class="row2" id="addrRow1">' + field("coProv", t("prov"), '<select id="coProv">' + provs + "</select>") + field("coDist", t("dist"), '<input type="text" id="coDist" maxlength="60">') + "</div>" +
      '<div class="row2" id="addrRow2">' + field("coVill", t("vill"), '<input type="text" id="coVill" maxlength="60">') + field("coBranch", t("branch"), '<input type="text" id="coBranch" maxlength="80" placeholder="' + esc(t("branch_ph")) + '">') + "</div>" +
      field("coCountry", t("country"), '<input type="text" id="coCountry" maxlength="60" autocomplete="country-name">') +
      field("coAddr", t("addr_more"), '<textarea id="coAddr" maxlength="300"></textarea>') +
      field("coNote", t("co_note"), '<textarea id="coNote" maxlength="500"></textarea>') +
      "</fieldset>";
    if (photos) {
      html += '<fieldset class="co-step">' + kitty("heart", "step-kitty") + stepHead(n++, t("st_photos")) +
        '<p class="hint">' + esc(t("photos_need")) + '</p><div class="field" id="coPhotosF"><label class="file-drop" for="coPhotos">' + esc(t("photos_add")) +
        '<input type="file" id="coPhotos" accept="image/*" multiple class="sr"></label><div class="previews" id="coPhotosPrev">' + photoPreviews() + '</div><span class="err" id="coPhotosE" hidden></span></div></fieldset>';
    }
    html += '<fieldset class="co-step">' + kitty("phone", "step-kitty") + stepHead(n++, t("st_pay")) +
      '<div class="paybox"><div class="pay-qr"><img src="' + esc(QR) + '" alt="LAO QR" width="220" height="220"><p class="hint">' + esc(t("acct")) + ": <b>" + esc(ACCOUNT) + "</b></p></div>" +
      '<ol class="pay-steps"><li>' + esc(t("pay1")) + "</li><li>" + esc(t("pay2")) + ' <b class="tn big">' + esc(money(tt.sum)) + "</b></li><li>" + esc(t("pay3")) + ' <b class="tn big">' + esc(no) + '</b> <button class="mini-btn" type="button" data-copy="' + esc(no) + '">' + esc(t("copy")) + "</button></li><li>" + esc(t("pay4")) + "</li></ol></div>" +
      '<div class="field" id="coSlipF"><label class="file-drop' + (CO.slipUrl ? " has" : "") + '" for="coSlip" id="coSlipL">' + esc(CO.slipUrl ? t("slip_change") : t("slip_req")) +
      '<input type="file" id="coSlip" accept="image/*" class="sr"></label><div class="previews" id="coSlipPrev">' + (CO.slipUrl ? '<img src="' + CO.slipUrl + '" alt="">' : "") + '</div><span class="hint">' + esc(t("slip_hint2")) + '</span><span class="err" id="coSlipE" hidden></span></div>' +
      field("rcRef", t("rc_ref"), '<input type="text" id="rcRef" maxlength="80" placeholder="' + esc(t("rc_ref_ph")) + '">') +
      "</fieldset>" +
      '<p class="alert-line" id="coMsg" role="alert" hidden></p>' +
      '<button class="btn wide big" type="submit" id="coSend">' + esc(t("send_order")) + "</button>" +
      '<p class="hint center">' + esc(t("send_note")) + "</p>" +
      "</form>" +
      '<aside class="co-side"><div class="panel"><h2>' + esc(t("summary")) + "</h2>" + bagLines(false) + totalHTML() + "</div></aside></div></section>";
    return html;
  }
  function photoPreviews() {
    return CO.photos.map(function (f, i) {
      return '<span class="pv"><img src="' + f.url + '" alt=""><button type="button" data-unphoto="' + i + '" aria-label="' + esc(t("remove")) + '">✕</button></span>';
    }).join("");
  }
  function refreshCheckout() {
    var del = document.getElementById("coDel");
    if (!del) return;
    var v = del.value, courier = v === "d_anou" || v === "d_mix" || v === "d_houng";
    var show = function (id, on) { var el = document.getElementById(id); if (el) el.hidden = !on; };
    show("pickNote", v === "d_pick"); show("abroadNote", v === "d_abroad");
    ["addrRow1", "addrRow2"].forEach(function (id) { show(id, courier); });
    show("coCountryF", v === "d_abroad");
    show("coAddrF", courier || v === "d_abroad");
    var addrLbl = document.querySelector("#coAddrF label");
    if (addrLbl) addrLbl.textContent = v === "d_abroad" ? t("addr_full") : t("addr_more");
    var c = countryOf(fieldVal("coCc"));
    show("coCcOther", c[0] === "OT");
    var ph = document.getElementById("coPhoneH");
    var okPhone = readPhone();
    if (ph) {
      ph.textContent = okPhone ? t("phone_ok", { p: prettyPhone(okPhone) }) : c[3] ? t("phone_eg", { eg: c[3] }) : t("phone_eg_other");
      ph.classList.toggle("ok", !!okPhone);
    }
    var via = fieldVal("coVia"), needHandle = via === "facebook" || via === "line" || via === "instagram";
    show("coHandleF", needHandle);
    var hl = document.querySelector("#coHandleF label");
    if (hl && needHandle) hl.textContent = t("handle_" + via);
  }
  function setErr(id, msg) {
    var e = document.getElementById(id + "E"), inp = document.getElementById(id);
    if (e) { e.textContent = msg || ""; e.hidden = !msg; }
    if (inp) inp.setAttribute("aria-invalid", String(!!msg));
    return !msg;
  }
  // check everything before sending; returns the first field with a problem
  function validateCheckout() {
    var bad = [];
    var chk = function (id, ok, msg) { if (!setErr(id, ok ? "" : msg)) bad.push(id); };
    chk("coName", fieldVal("coName").length >= 2, t("req"));
    var c = countryOf(fieldVal("coCc"));
    chk("coPhone", !!readPhone(), c[3] ? t("err_phone", { eg: c[3] }) : t("err_phone_other"));
    var via = fieldVal("coVia");
    if (via === "facebook" || via === "line" || via === "instagram") chk("coHandle", fieldVal("coHandle").length >= 2, t("req"));
    else setErr("coHandle", "");
    var v = fieldVal("coDel");
    if (v === "d_anou" || v === "d_mix" || v === "d_houng") {
      chk("coProv", fieldVal("coProv") !== "", t("req"));
      chk("coDist", fieldVal("coDist").length >= 2, t("req"));
      chk("coBranch", fieldVal("coBranch").length >= 2, t("req"));
    } else ["coProv", "coDist", "coBranch"].forEach(function (id) { setErr(id, ""); });
    if (v === "d_abroad") { chk("coCountry", fieldVal("coCountry").length >= 2, t("req")); chk("coAddr", fieldVal("coAddr").length >= 8, t("req")); }
    else setErr("coCountry", "");
    if (needPhotos()) chk("coPhotos", CO.photos.length > 0, t("err_photos"));
    chk("coSlip", !!CO.slipImg, t("err_slip"));
    return bad;
  }
  function showMsg(txt) { var m = document.getElementById("coMsg"); if (!m) return; m.textContent = txt || ""; m.hidden = !txt; }
  function shrink(im, max) {
    var sc = Math.min(1, max / Math.max(im.width, im.height));
    var c = document.createElement("canvas");
    c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
    var x = c.getContext("2d");
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  // customer photos go to private storage that only Minise can open. The database hands out a
  // one-hour upload key with each paid order, so nobody can upload without ordering first.
  function uploadPhotos(id, key) {
    var list = CO.photos.slice(0, 6);
    return Promise.all(list.map(function (f, i) {
      return new Promise(function (res, rej) {
        shrink(f.img, 1600).toBlob(function (blob) {
          if (!blob) return rej(new Error("photo"));
          var h = { apikey: SBC.key, "Content-Type": "image/jpeg", "x-upsert": "false" };
          if (/^eyJ/.test(SBC.key)) h.Authorization = "Bearer " + SBC.key;
          fetch(API + "/storage/v1/object/order-photos/" + id + "/" + key + "/" + (i + 1) + ".jpg", { method: "POST", headers: h, body: blob })
            .then(function (r) { if (!r.ok && r.status !== 409) throw new Error("upload " + r.status); res(); }, rej);
        }, "image/jpeg", 0.85);
      });
    })).then(function () { return rpc("order_photos_added", { p_id: id, p_key: key, p_count: list.length }); })
      .then(function (r) { if (!r || !r.ok) throw new Error("photos"); });
  }
  function orderPayload() {
    return {
      id: currentOrderNo(), date: todayLocal(), lang: lang, method: "rc",
      name: fieldVal("coName"), phone: readPhone(),
      contact_via: fieldVal("coVia"), contact_handle: fieldVal("coHandle"),
      delivery: delText(), delivery_type: fieldVal("coDel").replace("d_", ""),
      address: addressText(), note: fieldVal("coNote"), ref: fieldVal("rcRef"),
      items: bag.map(function (it) {
        var p = bySlug[it.s];
        // the database works out the price itself from the product, choice and quantity
        return { s: it.s, opt: it.opt || 0, addN: it.addN || 0, qty: it.qty, details: lineDetails(p, it).join(", ") };
      })
    };
  }
  function sendOrder() {
    if (CO.sending) return;
    var bad = validateCheckout();
    if (bad.length) {
      showMsg(t("fix_fields"));
      var first = document.getElementById(bad[0]) || document.getElementById(bad[0] + "F");
      if (first) { first.scrollIntoView({ behavior: "smooth", block: "center" }); if (first.focus) first.focus({ preventScroll: true }); }
      return;
    }
    if (!API) { showMsg(t("err_net")); return; }
    var btn = document.getElementById("coSend");
    CO.sending = true; btn.disabled = true; btn.textContent = t("rc_sending"); showMsg("");
    var payload = orderPayload();
    var slip = shrink(CO.slipImg, 1200, 0.8).toDataURL("image/jpeg", 0.8);
    var snap = {
      name: payload.name, phone: prettyPhone(payload.phone), via: payload.contact_via, delivery: payload.delivery,
      address: payload.address, note: payload.note, ref: payload.ref, bag: bag.slice(), total: bagTotals().sum
    };
    rpc("place_order", { p_order: payload, p_slip: slip }).then(function (res) {
      if (!res || !res.ok) {
        var err = res && res.error;
        if (err === "phone") setErr("coPhone", t("err_phone", { eg: countryOf(fieldVal("coCc"))[3] || "" }));
        throw new Error(err || (res && res.message) || "error");
      }
      snap.id = res.id; snap.total = res.total || snap.total;
      slipImg = CO.slipImg;
      // the order is safely saved now; if the photos fail we ask for them on WhatsApp instead
      var photos = CO.photos.length && res.photo_key ? uploadPhotos(res.id, res.photo_key).catch(function () { snap.photosFailed = true; }) :
        Promise.resolve(CO.photos.length ? (snap.photosFailed = true) : 0);
      return photos.then(function () { return drawReceipt(snap); }).then(function (c) {
        snap.receipt = c.toDataURL("image/png");
        CO.done = snap; CO.slipImg = null; CO.slipUrl = ""; CO.photos = []; CO.sending = false;
        orderNo = ""; try { sessionStorage.removeItem("minise_order_no"); } catch (e) { /* ignore */ }
        bag = []; saveBag();
        route();
        window.scrollTo(0, 0);
      });
    }).catch(function (e) {
      CO.sending = false; btn.disabled = false; btn.textContent = t("send_order");
      var m = String(e && e.message || "");
      showMsg(m === "busy" ? t("err_busy") : m === "unavailable" || m === "price_needed" ? t("err_unavailable") : m === "slip" ? t("err_slip_bad") :
        m === "phone" || m === "address" || m === "contact" || m === "name" ? t("fix_fields") : t("err_net"));
    });
  }
  function checkoutDone() {
    var d = CO.done;
    var name = "minise-receipt-" + d.id + ".png";
    return '<section class="wrap co-done"><div class="done-head">' + kitty("yay", "done-kitty") + '<p class="eyebrow">' + esc(t("co_eyebrow_done")) + "</p><h1>" + esc(t("done_h")) + "</h1>" +
      '<p class="lead">' + esc(t("done_p", { no: d.id, via: t("via_" + d.via) })) + "</p></div>" +
      '<div class="done-grid"><div class="rc-out"><img src="' + d.receipt + '" alt="' + esc(t("rc_title") + " " + d.id) + '">' +
      '<a class="btn wide" href="' + d.receipt + '" download="' + esc(name) + '">' + esc(t("rc_download")) + "</a><p class=\"hint\">" + esc(t("rc_saved_hint")) + "</p></div>" +
      '<div class="done-side"><div class="panel">' + (d.photosFailed ? '<p class="notice warn">' + esc(t("photos_failed")) + "</p>" : "") + '<p>' + esc(t("rc_show")) + '</p><a class="btn ghost wide" href="' + esc(waLink(orderMessage(d))) + '" target="_blank" rel="noopener">' + esc(t("done_wa")) + "</a>" +
      '<button class="btn wide" type="button" id="rcNew">' + esc(t("rc_new")) + "</button></div></div></div></section>";
  }
  function orderMessage(d) {
    var lines = [t("msg_hello")];
    if (!d.unpaid) lines.push(t("rc_no") + ": " + d.id);
    d.bag.forEach(function (it, i) {
      var p = bySlug[it.s]; if (!p) return;
      var u = unitPrice(p, it.opt, it.addN || 0), det = lineDetails(p, it);
      lines.push((i + 1) + ". " + p.n + " × " + it.qty + (det.length ? " (" + det.join(", ") + ")" : "") + " — " + (u == null ? t("msg_confirm") : money(u * it.qty)));
    });
    if (d.unpaid) return lines.join("\n");
    lines.push(t("rc_paid") + ": " + money(d.total), t("msg_paid"), "", t("name") + ": " + d.name, t("phone") + ": " + d.phone, t("delivery") + ": " + d.delivery + (d.address ? " — " + d.address : ""));
    if (d.note) lines.push(t("co_note") + " " + d.note);
    return lines.join("\n");
  }
  function loadImage(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function wrapLines(ctx, text, maxW) {
    var words = String(text).split(/(\s+)/), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur + w;
      if (ctx.measureText(test).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = w.trim(); }
      else cur = test;
    });
    if (cur.trim()) lines.push(cur.trim());
    // break very long unspaced runs (Lao is often written without spaces)
    var out = [];
    lines.forEach(function (l) {
      while (ctx.measureText(l).width > maxW && l.length > 1) {
        var n = l.length;
        while (n > 1 && ctx.measureText(l.slice(0, n)).width > maxW) n--;
        out.push(l.slice(0, n)); l = l.slice(n);
      }
      out.push(l);
    });
    return out;
  }
  function drawReceipt(d) {
    // the receipt is lettered like the shop: Patrick Hand, Lao in Noto Sans Lao Looped
    var serif = '"Patrick Hand", "Noto Sans Lao Looped", "Noto Sans Lao", sans-serif', sans = serif;
    var W = 1080, P = 80, inner = W - P * 2;
    var ink = "#24396a", soft = "#51618a", line = "rgba(36, 57, 106, 0.3)", sky = "#e1e9f2";
    var info = [
      [t("rc_no"), d.id],
      [t("rc_date"), new Date().toLocaleString(lang === "lo" ? "lo-LA" : "en-GB", { dateStyle: "medium", timeStyle: "short" })],
      [t("rc_customer"), d.name + " · " + d.phone],
      [t("rc_delivery"), d.delivery + (d.address ? " — " + d.address : "")],
      [t("rc_paid_to"), "LAO QR · " + ACCOUNT]
    ];
    if (d.ref) info.push([t("rc_ref_short"), d.ref]);
    return (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      var probe = document.createElement("canvas").getContext("2d");
      // measure item rows first so the canvas gets the right height
      probe.font = "400 26px " + sans;
      var rows = d.bag.filter(function (it) { return bySlug[it.s]; }).map(function (it) {
        var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
        var det = lineDetails(p, it).join(" · ");
        probe.font = "400 30px " + sans;
        var nameLines = wrapLines(probe, p.n + "  × " + it.qty, inner - 260);
        probe.font = "400 24px " + sans;
        var detLines = det ? wrapLines(probe, det, inner - 260) : [];
        return { name: nameLines, det: detLines, price: money((u || 0) * it.qty) };
      });
      probe.font = "400 26px " + sans;
      var infoRows = info.map(function (r) { return { k: r[0], v: wrapLines(probe, r[1], inner - 300) }; });
      probe.font = "400 24px " + sans;
      var foot = wrapLines(probe, t("rc_foot"), inner);
      var slipH = 0, slipW = 0;
      if (slipImg) { var sc = Math.min(420 / slipImg.width, 560 / slipImg.height, 1); slipW = slipImg.width * sc; slipH = slipImg.height * sc; }
      var H = 120 + 150 + 90 + 70;
      infoRows.forEach(function (r) { H += r.v.length * 38 + 16; });
      H += 60;
      rows.forEach(function (r) { H += r.name.length * 40 + r.det.length * 32 + 28; });
      H += 140 + (slipImg ? slipH + 90 : 0) + foot.length * 34 + 110;

      var c = document.createElement("canvas");
      c.width = W; c.height = Math.ceil(H);
      var x = c.getContext("2d");
      x.fillStyle = "#f6f1e6"; x.fillRect(0, 0, W, c.height);
      // checker edges top and bottom, like the shop header and footer
      x.fillStyle = ink;
      for (var cx = 0; cx < W; cx += 36) { x.fillRect(cx, 0, 18, 16); x.fillRect(cx, c.height - 16, 18, 16); }
      var y = 60;
      x.textAlign = "center"; x.font = "400 92px " + serif; x.fillText("Minise Arte", W / 2, y + 96);
      y += 150;
      x.textAlign = "center"; x.fillStyle = ink; x.font = "400 46px " + serif;
      x.fillText(t("rc_title"), W / 2, y + 30); y += 70;
      x.font = "400 24px " + sans; x.fillStyle = "#3f5684";
      x.fillText(t("rc_status"), W / 2, y + 10); y += 50;
      x.textAlign = "left";
      x.fillStyle = sky; x.fillRect(P - 24, y, inner + 48, infoRows.reduce(function (s, r) { return s + r.v.length * 38 + 16; }, 0) + 32);
      y += 30;
      infoRows.forEach(function (r) {
        x.font = "400 24px " + sans; x.fillStyle = soft; x.fillText(r.k, P, y + 20);
        x.font = "400 26px " + sans; x.fillStyle = ink;
        r.v.forEach(function (l, i) { x.fillText(l, P + 300, y + 20 + i * 38); });
        y += r.v.length * 38 + 16;
      });
      y += 50;
      rows.forEach(function (r) {
        x.font = "400 30px " + sans; x.fillStyle = ink;
        r.name.forEach(function (l, i) { x.fillText(l, P, y + i * 40); });
        x.textAlign = "right"; x.fillText(r.price, W - P, y); x.textAlign = "left";
        var yy = y + r.name.length * 40 - 6;
        x.font = "400 24px " + sans; x.fillStyle = soft;
        r.det.forEach(function (l, i) { x.fillText(l, P, yy + i * 32); });
        y += r.name.length * 40 + r.det.length * 32 + 12;
        x.fillStyle = line; x.fillRect(P, y, inner, 2); y += 40;
      });
      x.font = "400 34px " + sans; x.fillStyle = ink;
      x.fillText(t("rc_paid"), P, y + 10);
      x.textAlign = "right"; x.font = "400 40px " + sans; x.fillText(money(d.total), W - P, y + 12); x.textAlign = "left";
      y += 90;
      if (slipImg) {
        x.font = "400 24px " + sans; x.fillStyle = soft; x.fillText(t("rc_proof"), P, y); y += 24;
        x.drawImage(slipImg, P, y, slipW, slipH);
        x.strokeStyle = line; x.lineWidth = 2; x.strokeRect(P, y, slipW, slipH);
        y += slipH + 60;
      }
      x.font = "400 24px " + sans; x.fillStyle = soft;
      foot.forEach(function (l, i) { x.fillText(l, P, y + i * 34); });
      y += foot.length * 34 + 30;
      x.font = "italic 400 26px " + serif; x.fillStyle = ink; x.textAlign = "center";
      x.fillText("Best gift for your best one · @minise.arte", W / 2, y + 20);
      return c;
    });
  }
  function todayLocal() {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function readImageFile(f) {
    return new Promise(function (res) {
      if (!f || !/^image\//.test(f.type || "image/")) return res(null);
      var r = new FileReader();
      r.onload = function () { loadImage(r.result).then(function (im) { res(im ? { img: im, url: r.result } : null); }); };
      r.onerror = function () { res(null); };
      r.readAsDataURL(f);
    });
  }

  /* story, order, visit */
  function story() {
    var tl = "";
    for (var i = 1; i <= 8; i++) tl += "<li><time>" + esc(t("tl" + i + "d")) + "</time><p>" + esc(t("tl" + i)) + "</p></li>";
    return '<section class="wrap story-hero"><div class="copy"><p class="eyebrow">' + esc(t("story_eyebrow")) + "</p><h1>" + esc(t("story_h")) + '</h1><p class="lead">' + esc(t("story_lead")) + "</p>" +
      '<div class="hero-actions"><a class="btn" href="#shop">' + esc(t("hero_cta")) + '</a><a class="btn ghost" href="' + IG + '" target="_blank" rel="noopener">@minise.arte</a></div></div>' +
      '<div class="story-pics">' + kitty("heart", "pics-kitty") + P.slice().sort(bestOrder).slice(0, 2).map(function (p) { return img(p.img[0], p.n); }).join("") + "</div></section>" +
      promisesHTML() +
      '<section class="section"><div class="wrap">' + head(t("story_eyebrow"), t("tl_h")) + '<ol class="timeline">' + tl + "</ol></div></section>" +
      '<section class="section band"><div class="wrap">' + head("Minise Arte", t("values_h")) + '<div class="values">' +
      [1, 2, 3].map(function (i) { return "<div><b>" + esc(t("v" + i)) + "</b><p>" + esc(t("v" + i + "p")) + "</p></div>"; }).join("") + "</div>" +
      '<p class="igproof" style="margin-top:32px">' + esc(t("also_follow")) + ': <a class="link" href="https://www.instagram.com/minise.studio/" target="_blank" rel="noopener">@minise.studio</a> <a class="link" href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></p></div></section>';
  }
  function orderPage() {
    return '<section class="wrap page-head kittied">' + kitty("phone", "head-kitty") + '<p class="eyebrow">' + esc(t("steps_eyebrow")) + "</p><h1>" + esc(t("steps_h")) + "</h1></section>" +
      '<section class="section tight"><div class="wrap">' + stepsHTML() + "</div></section>" +
      '<section class="section band"><div class="wrap">' + head(t("faq_eyebrow"), t("faq_h")) + faqHTML() + "</div></section>";
  }
  function visitPage() {
    return '<section class="wrap page-head kittied">' + kitty("drink", "head-kitty") + '<p class="eyebrow">' + esc(t("visit_eyebrow")) + "</p><h1>" + esc(t("visit_h")) + "</h1></section>" +
      '<section class="section tight"><div class="wrap">' + visitHTML() + "</div></section>";
  }

  function footer() {
    return '<div class="wrap foot-wrap">' + kitty("shark", "foot-kitty") + kitty("sleep", "foot-kitty2") + '<div class="foot-grid"><div class="foot-brand"><span class="foot-logo">Minise Arte</span><p>' + esc(t("footer_tag")) + "</p>" +
      '<p class="tn">' + WA.mainShow + " · " + WA.altShow + "</p></div>" +
      "<div><h4>" + esc(t("footer_shop")) + "</h4><ul>" + ["locket", "bracelet", "necklace", "set", "earrings", "accessory"].map(function (ty) {
        return '<li><a href="#shop-' + ty + '">' + esc(t("type_" + ty)) + "</a></li>";
      }).join("") + "</ul></div>" +
      "<div><h4>" + esc(t("footer_help")) + '</h4><ul><li><a href="#order">' + esc(t("nav_order")) + '</a></li><li><a href="#visit">' + esc(t("nav_visit")) + '</a></li><li><a href="#story">' + esc(t("nav_story")) + '</a></li><li><a href="#checkout">' + esc(t("checkout")) + "</a></li></ul></div>" +
      "<div><h4>" + esc(t("footer_follow")) + '</h4><ul><li><a href="' + IG + '" target="_blank" rel="noopener">@minise.arte</a></li><li><a href="https://www.instagram.com/minise.studio/" target="_blank" rel="noopener">@minise.studio</a></li><li><a href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></li><li><a href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a></li><li><a href="https://linktr.ee/Miniseofficial" target="_blank" rel="noopener">Linktree</a></li></ul></div></div>' +
      '<div class="foot-base"><span>© 2026 Minise Arte · ມິນິເຊ່ ອາຕ໌</span><span>' + esc(t("footer_copy")) + "</span></div></div>";
  }

  /* ---------- router ---------- */
  var current = "";
  function route() {
    var h = (location.hash || "#home").slice(1);
    if (h === "main") { document.getElementById("main").focus(); return; }
    var main = document.getElementById("main");
    var html;
    S = null;
    if (h === "shop" || h.indexOf("shop-") === 0 || h.indexOf("c-") === 0) {
      if (h !== current) {
        F.type = "all"; F.tag = ""; F.q = "";
        if (h.indexOf("shop-") === 0 && TYPES.indexOf(h.slice(5)) > -1) F.type = h.slice(5);
        if (h.indexOf("c-") === 0 && TAGS.indexOf(h.slice(2)) > -1) F.tag = h.slice(2);
      }
      html = shop();
    } else if (h.indexOf("p-") === 0) html = product(h.slice(2));
    else if (h === "story") html = story();
    else if (h === "order") html = orderPage();
    else if (h === "visit") html = visitPage();
    else if (h === "checkout") html = checkout();
    else { h = "home"; html = home(); }
    if (h !== "checkout") CO.done = null;
    var same = h === current;
    var kept = {};
    if (same) main.querySelectorAll("input[id], select[id], textarea[id]").forEach(function (el) { if (el.type !== "file") kept[el.id] = el.value; });
    current = h;
    main.innerHTML = html;
    if (!same) pageIn(main);
    Object.keys(kept).forEach(function (id) { var el = document.getElementById(id); if (el && !el.readOnly) el.value = kept[id]; });
    if (document.getElementById("results")) renderResults("page");
    if (S) updateAskLink();
    refreshCheckout();
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      var n = a.getAttribute("data-nav");
      if (n === h || (n === "shop" && h === "shop")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (!same) window.scrollTo(0, 0);
    reveal(main);
    movePill();
    document.title = h === "home" ? "Minise Arte" : (S ? S.p.n + " · Minise Arte" : "Minise Arte");
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
    document.querySelectorAll(".announce li").forEach(function (li) { li.hidden = !li.textContent.trim(); });
    document.querySelectorAll("[data-t-label]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-t-label"))); });
    document.getElementById("foot").innerHTML = footer();
  }

  function toast(msg, pose) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    if (pose && window.MINISE_CAT) el.insertAdjacentHTML("afterbegin", kitty(pose, "toast-kitty"));
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function copyText(text, fallbackEl) {
    var done = function () { toast(t("copied"), "heart"); };
    var fail = function () {
      if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); }
      toast(t("copy_fail"));
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    } catch (e) { fail(); }
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var el;
    if ((el = e.target.closest("[data-close]"))) { closeBag(); return; }
    if ((el = e.target.closest("[data-ftype]"))) { F.type = el.getAttribute("data-ftype"); renderResults(); return; }
    if ((el = e.target.closest("[data-ftag]"))) { var g = el.getAttribute("data-ftag"); F.tag = F.tag === g ? "" : g; renderResults(); return; }
    if ((el = e.target.closest("[data-clear]"))) {
      F.type = "all"; F.tag = ""; F.av = "all"; F.rts = false; F.q = "";
      var q = document.getElementById("q"); if (q) q.value = "";
      document.getElementById("fav").value = "all"; document.getElementById("frts").checked = false;
      renderResults(); return;
    }
    if ((el = e.target.closest("[data-thumb]")) && S) {
      S.img = +el.getAttribute("data-thumb");
      var gm = document.getElementById("gmain");
      gm.classList.remove("swap"); void gm.offsetWidth;
      gm.src = S.p.img[S.img];
      if (!calm) gm.classList.add("swap");
      document.querySelectorAll("[data-thumb]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
      return;
    }
    if ((el = e.target.closest("[data-step]")) && S) {
      var k = el.getAttribute("data-step"), dd = +el.getAttribute("data-d");
      S[k] = Math.max(k === "qty" ? 1 : 0, Math.min(k === "qty" ? 20 : 10, S[k] + dd));
      document.getElementById(k).textContent = S[k];
      document.getElementById("priceBlock").innerHTML = priceBlockHTML();
      updateAskLink();
      return;
    }
    if ((el = e.target.closest("[data-bagstep]"))) {
      var i = +el.getAttribute("data-bagstep");
      bag[i].qty = Math.max(1, Math.min(20, bag[i].qty + +el.getAttribute("data-d")));
      saveBag(); renderDrawer(); if (current === "checkout") route(); return;
    }
    if ((el = e.target.closest("[data-remove]"))) {
      bag.splice(+el.getAttribute("data-remove"), 1);
      saveBag(); renderDrawer();
      if (current === "checkout") route();
      return;
    }
    if ((el = e.target.closest("[data-copy]"))) { copyText(el.getAttribute("data-copy")); return; }
    if ((el = e.target.closest("[data-unphoto]"))) {
      CO.photos.splice(+el.getAttribute("data-unphoto"), 1);
      var pp = document.getElementById("coPhotosPrev"); if (pp) pp.innerHTML = photoPreviews();
      return;
    }
    if (e.target.closest("#rcNew")) { CO.done = null; location.hash = "#shop"; return; }
  });

  document.addEventListener("input", function (e) {
    if (e.target.id === "q") { F.q = e.target.value; renderResults("type"); return; }
    if (S && (e.target.id === "ini" || e.target.id === "pnote")) {
      if (e.target.id === "ini") { e.target.value = e.target.value.replace(/[^A-Za-z&♡♥ ]/g, "").toUpperCase(); document.getElementById("iniErr").hidden = true; }
      updateAskLink(); return;
    }
    if (e.target.closest("#coForm")) {
      if (e.target.id === "coPhone") e.target.value = e.target.value.replace(/[^\d+\-() ]/g, "");
      if (e.target.id === "coCcOther") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
      var er = document.getElementById(e.target.id + "E");
      if (er && !er.hidden) setErr(e.target.id, "");
      refreshCheckout();
    }
  });

  document.addEventListener("change", function (e) {
    var id = e.target.id;
    if (id === "fav") { F.av = e.target.value; renderResults(); return; }
    if (id === "frts") { F.rts = e.target.checked; renderResults(); return; }
    if (id === "fsort") { F.sort = e.target.value; renderResults(); return; }
    if (S && e.target.name === "opt") { S.opt = +e.target.value; document.getElementById("priceBlock").innerHTML = priceBlockHTML(); updateAskLink(); return; }
    if (S && e.target.name === "col") { S.col = e.target.value; updateAskLink(); return; }
    if (id === "coDel" || id === "coCc" || id === "coVia" || id === "coProv") { setErr(id, ""); refreshCheckout(); return; }
    if (id === "coSlip") {
      var f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      readImageFile(f).then(function (r) {
        if (!r) { setErr("coSlip", t("err_slip_bad")); return; }
        CO.slipImg = r.img; CO.slipUrl = r.url;
        var l = document.getElementById("coSlipL");
        if (l) { l.firstChild.nodeValue = t("slip_change"); l.classList.add("has"); }
        var pv = document.getElementById("coSlipPrev"); if (pv) pv.innerHTML = '<img src="' + r.url + '" alt="">';
        setErr("coSlip", "");
      });
      return;
    }
    if (id === "coPhotos") {
      var files = Array.prototype.slice.call(e.target.files || [], 0, Math.max(0, 6 - CO.photos.length));
      e.target.value = "";
      Promise.all(files.map(readImageFile)).then(function (list) {
        list.forEach(function (r) { if (r && CO.photos.length < 6) CO.photos.push(r); });
        var pp = document.getElementById("coPhotosPrev"); if (pp) pp.innerHTML = photoPreviews();
        if (CO.photos.length) setErr("coPhotos", "");
      });
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.id === "pform" && S) {
      e.preventDefault();
      var sel = currentSelection();
      if (S.p.li && !sel.ini) {
        document.getElementById("iniErr").hidden = false;
        document.getElementById("ini").focus();
        return;
      }
      var key = JSON.stringify([sel.s, sel.opt, sel.addN, sel.col, sel.ini, sel.note]);
      var found = bag.find(function (it) { return JSON.stringify([it.s, it.opt, it.addN, it.col, it.ini, it.note]) === key; });
      if (found) found.qty = Math.min(20, found.qty + sel.qty); else bag.push(sel);
      saveBag();
      toast(t("added"), "gift");
      openBag();
    } else if (e.target.id === "coForm") {
      e.preventDefault();
      sendOrder();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !document.getElementById("drawer").hidden) closeBag();
  });
  document.getElementById("scrim").addEventListener("click", closeBag);
  document.getElementById("bagBtn").addEventListener("click", openBag);
  document.getElementById("langBtn").addEventListener("click", function () {
    lang = lang === "en" ? "lo" : "en";
    save("minise_lang", lang);
    applyLang();
    var keepScroll = window.scrollY;
    route();
    window.scrollTo(0, keepScroll);
    if (!document.getElementById("drawer").hidden) renderDrawer();
  });
  window.addEventListener("hashchange", route);

  /* newer catalogue published from the admin console: save it and refresh the page in place */
  function fetchLive() {
    if (!API || !window.fetch) return;
    rpc("get_catalog", { have: liveVersion })
      .then(function (res) {
        if (!res || !res.ok || res.same || res.empty || !res.data || !Array.isArray(res.data.products)) return;
        liveVersion = res.version;
        try { localStorage.setItem(LIVE_KEY, JSON.stringify({ api: API, version: res.version, products: res.data.products, settings: res.data.settings || {} })); } catch (e) { /* storage full or blocked */ }
        window.MINISE_PRODUCTS = res.data.products;
        window.MINISE_SETTINGS = Object.assign({}, res.data.settings || {}, { supabase: SBC });
        applyData();
        bag = bag.filter(function (it) { return it && bySlug[it.s]; });
        saveBag();
        applyLang();
        // don't reset a product page or a half-filled checkout under the customer's fingers
        if (current !== "checkout" && current.indexOf("p-") !== 0) { var y = window.scrollY; route(); window.scrollTo(0, y); }
        if (!document.getElementById("drawer").hidden) renderDrawer();
      })
      .catch(function () { /* keep the built-in catalogue */ });
  }

  /* the shop cat peeks up from the corner once you scroll; tap it for a tip and a way to chat */
  var PK = { shown: false, pose: 0, msg: 0, off: false };
  try { PK.off = sessionStorage.getItem("minise_cat_off") === "1"; } catch (e) { /* ignore */ }
  function peekerEls() {
    var b = document.getElementById("peeker");
    if (b || !window.MINISE_CAT) return b;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="peek-bubble" id="peekBubble" role="status" hidden></div>' +
      '<button class="peeker" id="peeker" type="button" hidden></button>');
    return document.getElementById("peeker");
  }
  function peekerUpdate() {
    var b = peekerEls();
    if (!b) return;
    var drawerOpen = !document.getElementById("drawer").hidden;
    var want = !PK.off && !drawerOpen && current !== "checkout" && window.scrollY > 520;
    if (want === PK.shown) return;
    PK.shown = want;
    if (want) {
      b.innerHTML = window.MINISE_CAT(["peek", "sharkPeek", "box"][PK.pose++ % 3]);
      b.setAttribute("aria-label", t("peek_label"));
      b.hidden = false;
      requestAnimationFrame(function () { b.classList.add("up"); });
    } else {
      b.classList.remove("up");
      document.getElementById("peekBubble").hidden = true;
      setTimeout(function () { if (!PK.shown) b.hidden = true; }, 450);
    }
  }
  function peekerTalk() {
    var bub = document.getElementById("peekBubble");
    if (!bub.hidden) { bub.hidden = true; return; }
    var tips = ["peek_1", "peek_2", "peek_3", "peek_4"];
    bub.innerHTML = "<p>" + esc(t(tips[PK.msg++ % tips.length])) + '</p><div class="pb-row"><a class="btn" href="' + esc(waLink(t("msg_hi"))) + '" target="_blank" rel="noopener">' + esc(t("peek_wa")) + '</a><button class="link" type="button" id="peekOff">' + esc(t("peek_hide")) + "</button></div>";
    bub.hidden = false;
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("#peeker")) { peekerTalk(); return; }
    if (e.target.closest("#peekOff")) {
      PK.off = true;
      try { sessionStorage.setItem("minise_cat_off", "1"); } catch (err) { /* ignore */ }
      peekerUpdate();
    }
  });
  window.addEventListener("scroll", function () { if (!peekerUpdate._t) peekerUpdate._t = setTimeout(function () { peekerUpdate._t = 0; peekerUpdate(); }, 120); }, { passive: true });
  window.addEventListener("hashchange", function () { setTimeout(peekerUpdate, 50); });

  window.addEventListener("resize", function () { clearTimeout(movePill._t); movePill._t = setTimeout(movePill, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  applyLang();
  updateBagCount();
  route();
  fetchLive();
})();

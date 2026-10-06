/* Minise Arte storefront app: routing, shop filters, product pages, bag and checkout.
   With the online backend (settings.api, see google-backend/Code.gs) the shop loads the
   catalogue published from admin.html and sends every order to it. Without it, orders go by WhatsApp. */
(function () {
  "use strict";

  var T = window.MINISE_T || {};
  var API = String((window.MINISE_SETTINGS || {}).api || "").trim();
  var LIVE_KEY = "minise_live";
  var liveVersion = "";
  // last catalogue published from the admin, saved by this browser on an earlier visit
  (function useSavedCatalogue() {
    if (!API) return;
    try {
      var c = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
      if (c && c.api === API && c.version && Array.isArray(c.products) && c.settings) {
        window.MINISE_PRODUCTS = c.products;
        window.MINISE_SETTINGS = Object.assign({}, c.settings, { api: API });
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
    steel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 2.5 14.6 9.4 21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-2.6L12 2.5Z"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/><path d="M9.5 15a2.6 2.6 0 0 0 2.5 2.5"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 20s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.7 12 20 12 20Z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3.5" y="9" width="17" height="11.5" rx="1"/><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9Zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9Z"/></svg>',
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
      '<div class="badges">' + badges(p) + "</div></div>" +
      '<div class="pmeta"><span class="ptype">' + esc(typeLabel(p)) + '</span><span class="pname">' + esc(p.n) + "</span>" + priceHTML(p) + "</div></a>";
  }
  function head(eyebrow, title, linkHref, linkText, tag) {
    var h = tag || "h2";
    return '<div class="section-head"><div><p class="eyebrow">' + esc(eyebrow) + "</p><" + h + ">" + esc(title) + "</" + h + "></div>" +
      (linkHref ? '<a class="link" href="' + linkHref + '">' + esc(linkText) + " →</a>" : "") + "</div>";
  }
  function stepsHTML() {
    var out = '<ol class="steps">';
    for (var i = 1; i <= 5; i++) out += "<li><b>" + esc(t("s" + i)) + "</b><p>" + esc(t("s" + i + "p")) + "</p></li>";
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
    var items = [["steel", "tr1"], ["drop", "tr2"], ["hand", "tr3"], ["gift", "tr4"]];
    return '<section class="promises"><div class="wrap promise-row">' + items.map(function (it) {
      return '<div class="promise">' + ICON[it[0]] + "<div><b>" + esc(t(it[1])) + "</b><span>" + esc(t(it[1] + "p")) + "</span></div></div>";
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
      return '<a class="cat" href="#shop-' + ty + '"><div class="ph">' + img(cover.img[0], "") + "</div><div><b>" + esc(t("type_" + ty)) +
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
      '<div class="hero-copy"><p class="eyebrow">' + esc(t("hero_eyebrow")) + "</p>" +
      "<h1>" + esc(t("hero_h1a")) + " <em>" + esc(t("hero_h1b")) + "</em></h1>" +
      '<p class="lead">' + esc(t("hero_lead")) + "</p>" +
      '<div class="hero-actions"><a class="btn" href="#shop">' + esc(t("hero_cta")) + '</a>' +
      '<a class="btn ghost" href="' + waLink(t("msg_hi")) + '" target="_blank" rel="noopener">' + esc(t("hero_wa")) + "</a></div>" +
      '<p class="proof"><span class="dot"></span>' + esc(t("hero_proof")) + "</p></div>" +
      '<div class="pol-stack">' + hero + "</div></div></section>" +
      promisesHTML() +
      '<section class="section"><div class="wrap">' + head(t("cat_eyebrow"), t("cat_h")) + '<div class="cats">' + cats + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("best_eyebrow"), t("best_h"), "#shop", t("view_all")) + '<div class="grid">' + best.map(card).join("") + "</div></div></section>" +
      '<section class="section band"><div class="wrap keep-grid"><div class="keep-copy"><p class="eyebrow">' + esc(t("photo_eyebrow")) + "</p><h2>" + esc(t("photo_h")) + "</h2>" +
      '<p class="lead">' + esc(t("photo_p")) + '</p><ul class="ticks">' +
      ["photo_l1", "photo_l2", "photo_l3"].map(function (k) { return "<li>" + ICON.tick + "<span>" + esc(t(k)) + "</span></li>"; }).join("") +
      '</ul><div><a class="btn" href="#c-photo">' + esc(t("photo_cta")) + '</a></div></div><div class="grid three">' + keep + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("new_eyebrow"), t("new_h"), "#shop", t("view_all")) + '<div class="grid">' + fresh.map(card).join("") + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("col_eyebrow"), t("col_h")) + '<div class="chips-row">' + tags + "</div></div></section>" +
      '<section class="section band"><div class="wrap">' + head(t("steps_eyebrow"), t("steps_h"), "#order", t("view_all")) + stepsHTML() + "</div></section>" +
      '<section class="section"><div class="wrap">' + head(t("visit_eyebrow"), t("visit_h")) + visitHTML() + "</div></section>" +
      '<section class="section tight"><div class="wrap">' + head("@minise.arte", t("ig_h"), IG, t("ig_cta")) + '<div class="ig-strip">' + igPics + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("faq_eyebrow"), t("faq_h")) + faqHTML() + "</div></section>";
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
    return '<section class="wrap"><div class="shop-head"><p class="eyebrow">' + esc(t("shop_eyebrow")) + '</p><h1 id="shopTitle">' + esc(shopTitle()) + "</h1>" +
      '<p class="lead">' + esc(t("shop_lead")) + "</p></div>" +
      '<div class="shop-layout"><details class="filters"' + (openFilters ? " open" : "") + "><summary>" + esc(t("filters")) + " <span>＋</span></summary><div class=\"fbody\">" +
      '<div class="field"><label for="q">' + esc(t("search")) + '</label><input type="search" id="q" placeholder="' + esc(t("search_ph")) + '" value="' + esc(F.q) + '" autocomplete="off"></div>' +
      '<div class="fgroup"><h3>' + esc(t("category")) + '</h3><div class="flist">' + typeBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("collection")) + '</h3><div class="flist tags">' + tagBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("availability")) + '</h3><select id="fav" aria-label="' + esc(t("availability")) + '">' +
      ["all", "cur", "old"].map(function (v) { return '<option value="' + v + '"' + (F.av === v ? " selected" : "") + ">" + esc(t("av_" + v)) + "</option>"; }).join("") +
      '</select><label class="check"><input type="checkbox" id="frts"' + (F.rts ? " checked" : "") + "> " + esc(t("rts_only")) + "</label></div>" +
      "</div></details>" +
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
      '<div class="empty"><p>' + esc(t("none")) + '</p><button class="btn ghost" type="button" data-clear>' + esc(t("clear")) + "</button></div>";
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
    if (!p) return '<section class="wrap page-head"><h1>' + esc(t("not_found")) + '</h1><p><a class="btn" href="#shop">' + esc(t("back_shop")) + "</a></p></section>";
    S = { p: p, img: 0, opt: 0, addN: 0, qty: 1, col: "", photos: [] };
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
    var photo = p.ph ? '<div class="field"><label for="photos">' + esc(t("photos")) + '</label><div class="file-pick"><input type="file" id="photos" accept="image/*" multiple></div>' +
      '<span class="hint">' + esc(t("photos_hint")) + '</span><div class="previews" id="previews"></div></div>' : "";
    var related = P.filter(function (x) { return x !== p && x.t[0] === p.t[0]; })
      .sort(function (a, b) {
        var sa = a.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0, sb = b.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0;
        return (sb - sa) || ((b.cur - a.cur)) || byLikes(a, b);
      }).slice(0, 4);
    var otherLang = lang === "lo" ? describe(p, "en") : p.lo;
    return '<section class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#shop">' + esc(t("nav_shop")) + '</a><span>/</span><a href="#shop-' + p.t[0] + '">' + esc(t("type_" + p.t[0])) + "</a><span>/</span><span>" + esc(p.n) + "</span></nav>" +
      '<div class="pdp-grid"><div class="gallery"><div class="gmain">' + img(p.img[0], p.n, "", true).replace("<img", '<img id="gmain"') + "</div>" + thumbs + "</div>" +
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
      note: note ? note.value.trim() : "",
      photos: S.photos.map(function (f) { return f.name; })
    };
  }
  function lineDetails(p, it) {
    var d = [];
    if (p.o.length > 1 || (p.o.length === 1 && p.o[0].en)) d.push(lang === "lo" ? p.o[it.opt].lo : p.o[it.opt].en);
    if (it.col) d.push(t("colour") + ": " + t(it.col));
    if (it.ini) d.push(t("initials") + ": " + it.ini);
    if (p.add && it.addN) d.push((lang === "lo" ? p.add.lo : p.add.en) + " × " + it.addN);
    if (it.photos && it.photos.length) d.push(t("photos_n", { n: it.photos.length }));
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
    if (lastCount !== null && n > lastCount && !calm) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
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
  }
  function closeBag() {
    var sc = document.getElementById("scrim"), d = document.getElementById("drawer");
    sc.classList.remove("open"); d.classList.remove("open");
    clearTimeout(closeBag._t);
    // hide once the slide-out has finished
    closeBag._t = setTimeout(function () { if (!d.classList.contains("open")) { sc.hidden = true; d.hidden = true; } }, calm ? 0 : 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function renderDrawer() {
    var d = document.getElementById("drawer");
    d.innerHTML = '<div class="drawer-head"><h2 id="drawerTitle">' + esc(t("bag_h")) + '</h2><button class="icon-btn" type="button" data-close aria-label="' + esc(t("close")) + '">✕</button></div>' +
      '<div class="drawer-body">' + (bag.length ? bagLines(true) : '<p class="empty">' + esc(t("bag_empty")) + "</p>") + "</div>" +
      '<div class="drawer-foot">' + (bag.length ? totalHTML() + '<a class="btn wide" href="#checkout" data-close>' + esc(t("checkout")) + "</a>" : "") +
      '<button class="btn ghost wide" type="button" data-close>' + esc(t("keep")) + "</button></div>";
  }

  /* checkout */
  function orderMessage() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var lines = [t("msg_hello")];
    var anyPhotos = false;
    bag.forEach(function (it, i) {
      var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
      var d = lineDetails(p, it);
      if (it.photos && it.photos.length) anyPhotos = true;
      lines.push((i + 1) + ". " + p.n + " × " + it.qty + (d.length ? " (" + d.join(", ") + ")" : "") + " — " + (u == null ? t("msg_confirm") : money(u * it.qty)));
    });
    var tt = bagTotals();
    lines.splice(1, 0, t("rc_no") + ": " + orderNo);
    lines.push(t("msg_total") + ": " + money(tt.sum) + (tt.unknown ? " " + t("plus_confirm") : ""));
    if (anyPhotos) lines.push(t("msg_photos"));
    lines.push("");
    lines.push(t("name") + ": " + g("coName"));
    lines.push(t("phone") + ": " + g("coPhone"));
    var del = document.getElementById("coDel");
    if (del) lines.push(t("delivery") + ": " + del.options[del.selectedIndex].text + (g("coBranch") ? " — " + g("coBranch") : ""));
    if (g("coNote")) lines.push(t("co_note") + " " + g("coNote"));
    return lines.join("\n");
  }
  function checkout() {
    if (!bag.length) return '<section class="wrap page-head"><p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + '</h1><p class="lead">' + esc(t("co_empty")) + '</p><p><a class="btn" href="#shop">' + esc(t("hero_cta")) + "</a></p></section>";
    var dels = ["d_pick", "d_anou", "d_mix", "d_houng", "d_abroad"];
    return '<section class="wrap"><div class="page-head"><p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + '</h1><p class="lead">' + esc(t("co_p")) + "</p></div>" +
      '<div class="co-grid"><form class="co-form" id="coForm" novalidate>' +
      '<div class="row2"><div class="field"><label for="coName">' + esc(t("name")) + '</label><input type="text" id="coName" autocomplete="name" required><span class="err" hidden>' + esc(t("req")) + "</span></div>" +
      '<div class="field"><label for="coPhone">' + esc(t("phone")) + '</label><input type="tel" id="coPhone" autocomplete="tel" inputmode="tel" placeholder="020 …" required><span class="err" hidden>' + esc(t("req")) + "</span></div></div>" +
      '<div class="field"><label for="coDel">' + esc(t("delivery")) + '</label><select id="coDel">' + dels.map(function (k) { return '<option value="' + k + '">' + esc(t(k)) + "</option>"; }).join("") + "</select>" +
      '<p class="hint" id="abroadNote" hidden>' + esc(t("abroad_note")) + ' <a class="link" href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a></p></div>' +
      '<div class="field" id="branchField" hidden><label for="coBranch">' + esc(t("branch")) + '</label><input type="text" id="coBranch" placeholder="' + esc(t("branch_ph")) + '"></div>' +
      '<div class="field"><label for="coNote">' + esc(t("co_note")) + '</label><textarea id="coNote"></textarea></div>' +
      '<fieldset class="method"><legend>' + esc(t("method")) + "</legend>" +
      '<label class="mopt"><input type="radio" name="method" value="wa" checked><span><b>' + esc(t("m_wa")) + "</b><small>" + esc(t("m_wa_p")) + "</small></span></label>" +
      '<label class="mopt"><input type="radio" name="method" value="rc"><span><b>' + esc(t("m_rc")) + "</b><small>" + esc(t("m_rc_p")) + "</small></span></label></fieldset>" +
      '<div id="waBlock" class="co-form"><div class="actions"><a class="btn wide" id="sendWa" href="#" target="_blank" rel="noopener">' + esc(t("send_wa")) + '</a>' +
      '<button class="btn ghost wide" type="button" id="copyOrder">' + esc(t("copy_order")) + '</button><p class="hint">' + esc(t("wa_note")) + "</p></div>" +
      '<div class="field"><label for="msgPreview">' + esc(t("summary")) + '</label><textarea class="msg-preview" id="msgPreview" readonly></textarea></div></div>' +
      receiptBlock() +
      "</form>" +
      '<aside class="co-side"><div class="panel"><h2>' + esc(t("summary")) + "</h2>" + bagLines(false) + totalHTML() + "</div>" +
      '<div class="panel"><h2>' + esc(t("pay_h")) + '</h2><div class="qr"><img src="' + esc(QR) + '" alt="LAO QR" width="140" height="140"><div><p>' + esc(t("pay_p")) + '</p><p class="hint">' + esc(t("acct")) + ": <b>" + ACCOUNT + "</b></p></div></div></div></aside></div></section>";
  }
  function refreshCheckout() {
    var del = document.getElementById("coDel");
    if (!del) return;
    var v = del.value;
    document.getElementById("branchField").hidden = !(v === "d_anou" || v === "d_mix" || v === "d_houng");
    document.getElementById("abroadNote").hidden = v !== "d_abroad";
    var msg = orderMessage();
    document.getElementById("msgPreview").value = msg;
    document.getElementById("sendWa").href = waLink(msg);
    var m = document.querySelector('input[name="method"]:checked');
    var rc = m && m.value === "rc";
    document.getElementById("waBlock").hidden = rc;
    document.getElementById("rcBlock").hidden = !rc;
  }

  /* pay now and download a receipt (no WhatsApp needed) */
  var orderNo = "";
  var slipImg = null;
  function newOrderNo() {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return "MA-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + r;
  }
  function receiptBlock() {
    orderNo = newOrderNo();
    slipImg = null;
    var tt = bagTotals();
    if (tt.unknown) return '<div id="rcBlock" class="co-form" hidden><p class="notice">' + esc(t("rc_need_price")) + "</p></div>";
    return '<div id="rcBlock" class="co-form" hidden>' +
      '<div class="panel paybox"><div class="total"><span>' + esc(t("rc_total")) + '</span><b class="tn">' + esc(money(tt.sum)) + "</b></div>" +
      '<div class="total"><span>' + esc(t("rc_no")) + '</span><b class="tn">' + orderNo + "</b></div>" +
      '<p class="hint">' + esc(t("rc_memo", { no: orderNo })) + "</p>" +
      '<div class="qr"><img src="' + esc(QR) + '" alt="LAO QR" width="140" height="140"><p class="hint">' + esc(t("acct")) + ": <b>" + ACCOUNT + "</b></p></div></div>" +
      '<div class="field"><label for="rcSlip">' + esc(t("rc_slip")) + '</label><input type="file" id="rcSlip" accept="image/*"><span class="hint">' + esc(t("rc_slip_hint")) + '</span><div class="previews" id="rcSlipPrev"></div></div>' +
      '<div class="field"><label for="rcRef">' + esc(t("rc_ref")) + '</label><input type="text" id="rcRef" placeholder="' + esc(t("rc_ref_ph")) + '"></div>' +
      '<button class="btn wide" type="button" id="makeReceipt">' + esc(t("rc_make")) + "</button>" +
      '<div id="rcOut" class="rc-out" hidden></div></div>';
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
  function drawReceipt() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var serif = lang === "lo" ? '"Noto Serif Lao", "Bodoni Moda", serif' : '"Bodoni Moda", "Noto Serif Lao", Georgia, serif';
    var sans = '"Jost", "Noto Sans Lao", system-ui, sans-serif';
    var W = 1080, P = 80, inner = W - P * 2;
    var ink = "#18223f", soft = "#505b7a", line = "#d9e3ee", sky = "#eef5fb";
    var del = document.getElementById("coDel");
    var info = [
      [t("rc_no"), orderNo],
      [t("rc_date"), new Date().toLocaleString(lang === "lo" ? "lo-LA" : "en-GB", { dateStyle: "medium", timeStyle: "short" })],
      [t("rc_customer"), g("coName") + " · " + g("coPhone")],
      [t("rc_delivery"), del.options[del.selectedIndex].text + (g("coBranch") && !document.getElementById("branchField").hidden ? " — " + g("coBranch") : "")],
      [t("rc_paid_to"), "LAO QR · " + ACCOUNT]
    ];
    if (g("rcRef")) info.push([t("rc_ref_short"), g("rcRef")]);
    var tt = bagTotals();
    return Promise.all([loadImage("images/logo.png"), document.fonts ? document.fonts.ready : Promise.resolve()]).then(function (res) {
      var logo = res[0];
      var probe = document.createElement("canvas").getContext("2d");
      // measure item rows first so the canvas gets the right height
      probe.font = "400 26px " + sans;
      var rows = bag.map(function (it) {
        var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
        var d = lineDetails(p, it).join(" · ");
        probe.font = "500 30px " + sans;
        var nameLines = wrapLines(probe, p.n + "  × " + it.qty, inner - 260);
        probe.font = "400 24px " + sans;
        var detLines = d ? wrapLines(probe, d, inner - 260) : [];
        return { name: nameLines, det: detLines, price: money(u * it.qty) };
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
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, c.height);
      x.fillStyle = ink; x.fillRect(0, 0, W, 14);
      var y = 60;
      if (logo) { var lh = 120, lw = logo.width * (lh / logo.height); x.drawImage(logo, (W - lw) / 2, y, lw, lh); }
      y += 150;
      x.textAlign = "center"; x.fillStyle = ink; x.font = "500 46px " + serif;
      x.fillText(t("rc_title"), W / 2, y + 30); y += 70;
      x.font = "500 24px " + sans; x.fillStyle = "#3b6a94";
      x.fillText(t("rc_status"), W / 2, y + 10); y += 50;
      x.textAlign = "left";
      x.fillStyle = sky; x.fillRect(P - 24, y, inner + 48, infoRows.reduce(function (s, r) { return s + r.v.length * 38 + 16; }, 0) + 32);
      y += 30;
      infoRows.forEach(function (r) {
        x.font = "500 24px " + sans; x.fillStyle = soft; x.fillText(r.k, P, y + 20);
        x.font = "400 26px " + sans; x.fillStyle = ink;
        r.v.forEach(function (l, i) { x.fillText(l, P + 300, y + 20 + i * 38); });
        y += r.v.length * 38 + 16;
      });
      y += 50;
      rows.forEach(function (r) {
        x.font = "500 30px " + sans; x.fillStyle = ink;
        r.name.forEach(function (l, i) { x.fillText(l, P, y + i * 40); });
        x.textAlign = "right"; x.fillText(r.price, W - P, y); x.textAlign = "left";
        var yy = y + r.name.length * 40 - 6;
        x.font = "400 24px " + sans; x.fillStyle = soft;
        r.det.forEach(function (l, i) { x.fillText(l, P, yy + i * 32); });
        y += r.name.length * 40 + r.det.length * 32 + 12;
        x.fillStyle = line; x.fillRect(P, y, inner, 2); y += 40;
      });
      x.font = "500 34px " + sans; x.fillStyle = ink;
      x.fillText(t("rc_paid"), P, y + 10);
      x.textAlign = "right"; x.font = "600 40px " + sans; x.fillText(money(tt.sum), W - P, y + 12); x.textAlign = "left";
      y += 90;
      if (slipImg) {
        x.font = "500 24px " + sans; x.fillStyle = soft; x.fillText(t("rc_proof"), P, y); y += 24;
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
  function makeReceipt() {
    var ok = true;
    ["coName", "coPhone"].forEach(function (id) {
      var inp = document.getElementById(id), err = inp.parentNode.querySelector(".err");
      var bad = !inp.value.trim();
      err.hidden = !bad; inp.setAttribute("aria-invalid", String(bad));
      if (bad && ok) { inp.focus(); ok = false; }
    });
    if (!ok) return;
    var btn = document.getElementById("makeReceipt");
    btn.disabled = true;
    drawReceipt().then(function (c) {
      btn.disabled = false;
      var url = c.toDataURL("image/png");
      var name = "minise-receipt-" + orderNo + ".png";
      var out = document.getElementById("rcOut");
      out.innerHTML = '<p class="hint">' + esc(t("rc_saved_hint")) + "</p>" +
        '<img src="' + url + '" alt="' + esc(t("rc_title") + " " + orderNo) + '">' +
        '<a class="btn wide" href="' + url + '" download="' + name + '">' + esc(t("rc_download")) + "</a>" +
        (API ? '<p class="rc-status" id="rcStatus" role="status">' + esc(t("rc_sending")) + "</p>" : "") +
        '<p class="hint">' + esc(t("rc_show")) + "</p>" +
        '<button class="btn ghost wide" type="button" id="rcNew">' + esc(t("rc_new")) + "</button>";
      out.hidden = false;
      try { var a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* the visible button and image still work */ }
      out.scrollIntoView({ behavior: "smooth", block: "start" });
      if (API) sendReceiptOrder();
    }, function () { btn.disabled = false; });
  }

  /* send the order to Minise (online backend) */
  function todayLocal() {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function orderPayload(method) {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var del = document.getElementById("coDel");
    var branch = document.getElementById("branchField");
    return {
      id: orderNo, method: method, date: todayLocal(), lang: lang,
      name: g("coName"), phone: g("coPhone"),
      delivery: del ? del.options[del.selectedIndex].text : "",
      address: branch && !branch.hidden ? g("coBranch") : "",
      note: g("coNote"), ref: method === "rc" ? g("rcRef") : "",
      items: bag.map(function (it) {
        var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0);
        return { name: p.n, qty: it.qty, details: lineDetails(p, it).join(", "), price: u == null ? 0 : u * it.qty };
      })
    };
  }
  function postOrder(payload, slip) {
    var body = JSON.stringify({ action: "order", order: payload, slip: slip || undefined });
    return fetch(API, { method: "POST", body: body, keepalive: body.length < 60000 })
      .then(function (r) { return r.json(); });
  }
  function slipData() {
    if (!slipImg) return "";
    try {
      var sc = Math.min(1, 1400 / Math.max(slipImg.width, slipImg.height));
      var c = document.createElement("canvas");
      c.width = Math.round(slipImg.width * sc); c.height = Math.round(slipImg.height * sc);
      var x = c.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(slipImg, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.82);
    } catch (e) { return ""; }
  }
  function sendReceiptOrder() {
    var payload = orderPayload("rc");
    var anyPhotos = bag.some(function (it) { return it.photos && it.photos.length; });
    var show = function (ok) {
      var el = document.getElementById("rcStatus");
      if (!el) return;
      el.className = "rc-status " + (ok ? "ok" : "warn");
      if (ok) el.textContent = t("rc_sent", { no: payload.id }) + (anyPhotos ? " " + t("rc_photos") : "");
      else el.innerHTML = esc(t("rc_send_fail")) + ' <a class="link" href="' + esc(waLink(orderMessage())) + '" target="_blank" rel="noopener">' + esc(t("rc_send_wa")) + "</a>";
    };
    postOrder(payload, slipData()).then(function (res) { show(!!(res && res.ok)); }, function () { show(false); });
  }

  /* story, order, visit */
  function story() {
    var tl = "";
    for (var i = 1; i <= 8; i++) tl += "<li><time>" + esc(t("tl" + i + "d")) + "</time><p>" + esc(t("tl" + i)) + "</p></li>";
    return '<section class="wrap story-hero"><div class="copy"><p class="eyebrow">' + esc(t("story_eyebrow")) + "</p><h1>" + esc(t("story_h")) + '</h1><p class="lead">' + esc(t("story_lead")) + "</p>" +
      '<div class="hero-actions"><a class="btn" href="#shop">' + esc(t("hero_cta")) + '</a><a class="btn ghost" href="' + IG + '" target="_blank" rel="noopener">@minise.arte</a></div></div>' +
      '<div class="story-pics">' + P.slice().sort(bestOrder).slice(0, 2).map(function (p) { return img(p.img[0], p.n); }).join("") + "</div></section>" +
      promisesHTML() +
      '<section class="section"><div class="wrap">' + head(t("story_eyebrow"), t("tl_h")) + '<ol class="timeline">' + tl + "</ol></div></section>" +
      '<section class="section band"><div class="wrap">' + head("Minise Arte", t("values_h")) + '<div class="values">' +
      [1, 2, 3].map(function (i) { return "<div><b>" + esc(t("v" + i)) + "</b><p>" + esc(t("v" + i + "p")) + "</p></div>"; }).join("") + "</div>" +
      '<p class="igproof" style="margin-top:32px">' + esc(t("also_follow")) + ': <a class="link" href="https://www.instagram.com/minise.studio/" target="_blank" rel="noopener">@minise.studio</a> <a class="link" href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></p></div></section>';
  }
  function orderPage() {
    return '<section class="wrap page-head"><p class="eyebrow">' + esc(t("steps_eyebrow")) + "</p><h1>" + esc(t("steps_h")) + "</h1></section>" +
      '<section class="section tight"><div class="wrap">' + stepsHTML() + "</div></section>" +
      '<section class="section band"><div class="wrap">' + head(t("faq_eyebrow"), t("faq_h")) + faqHTML() + "</div></section>";
  }
  function visitPage() {
    return '<section class="wrap page-head"><p class="eyebrow">' + esc(t("visit_eyebrow")) + "</p><h1>" + esc(t("visit_h")) + "</h1></section>" +
      '<section class="section tight"><div class="wrap">' + visitHTML() + "</div></section>";
  }

  function footer() {
    return '<div class="wrap"><div class="foot-grid"><div class="foot-brand"><img src="images/logo.png" alt="Minise Arte" width="94" height="56"><p>' + esc(t("footer_tag")) + "</p>" +
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
    var same = h === current;
    var kept = {};
    if (same) main.querySelectorAll("input[id], select[id], textarea[id]").forEach(function (el) { if (el.type !== "file") kept[el.id] = el.value; });
    var keptMethod = same && main.querySelector('input[name="method"]:checked');
    keptMethod = keptMethod ? keptMethod.value : "";
    current = h;
    main.innerHTML = html;
    if (!same) pageIn(main);
    Object.keys(kept).forEach(function (id) { var el = document.getElementById(id); if (el && !el.readOnly) el.value = kept[id]; });
    if (keptMethod) { var mr = main.querySelector('input[name="method"][value="' + keptMethod + '"]'); if (mr) mr.checked = true; }
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

  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function copyText(text, fallbackEl) {
    var done = function () { toast(t("copied")); };
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
    if (e.target.closest("#copyOrder")) { copyText(orderMessage(), document.getElementById("msgPreview")); return; }
    if (e.target.closest("#makeReceipt")) { makeReceipt(); return; }
    if (e.target.closest("#rcNew")) { bag = []; saveBag(); location.hash = "#shop"; return; }
    if ((el = e.target.closest("#sendWa"))) {
      var ok = true;
      ["coName", "coPhone"].forEach(function (id) {
        var inp = document.getElementById(id), err = inp.parentNode.querySelector(".err");
        var bad = !inp.value.trim();
        err.hidden = !bad; inp.setAttribute("aria-invalid", String(bad));
        if (bad && ok) { inp.focus(); ok = false; }
      });
      if (!ok) { e.preventDefault(); return; }
      refreshCheckout();
      // the order also lands in the admin console, so nothing is lost if the WhatsApp message isn't sent
      if (API) postOrder(orderPayload("wa")).catch(function () { /* WhatsApp still carries the order */ });
      return;
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target.id === "q") { F.q = e.target.value; renderResults("type"); return; }
    if (S && (e.target.id === "ini" || e.target.id === "pnote")) {
      if (e.target.id === "ini") { e.target.value = e.target.value.replace(/[^A-Za-z&♡♥ ]/g, "").toUpperCase(); document.getElementById("iniErr").hidden = true; }
      updateAskLink(); return;
    }
    if (e.target.closest("#coForm")) refreshCheckout();
  });

  document.addEventListener("change", function (e) {
    var id = e.target.id;
    if (id === "fav") { F.av = e.target.value; renderResults(); return; }
    if (id === "frts") { F.rts = e.target.checked; renderResults(); return; }
    if (id === "fsort") { F.sort = e.target.value; renderResults(); return; }
    if (S && e.target.name === "opt") { S.opt = +e.target.value; document.getElementById("priceBlock").innerHTML = priceBlockHTML(); updateAskLink(); return; }
    if (S && e.target.name === "col") { S.col = e.target.value; updateAskLink(); return; }
    if (S && id === "photos") {
      S.photos = Array.prototype.slice.call(e.target.files || []);
      var box = document.getElementById("previews");
      box.innerHTML = S.photos.slice(0, 8).map(function (f) {
        var u = "";
        try { u = URL.createObjectURL(f); } catch (err) { u = ""; }
        return u ? '<img src="' + u + '" alt="' + esc(f.name) + '">' : "";
      }).join("");
      updateAskLink(); return;
    }
    if (id === "coDel" || e.target.name === "method") { refreshCheckout(); return; }
    if (id === "rcSlip") {
      var f = e.target.files && e.target.files[0];
      var prev = document.getElementById("rcSlipPrev");
      slipImg = null; prev.innerHTML = "";
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        loadImage(reader.result).then(function (im) {
          slipImg = im;
          if (im) prev.innerHTML = '<img src="' + reader.result + '" alt="' + esc(f.name) + '">';
        });
      };
      reader.readAsDataURL(f);
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
      var key = JSON.stringify([sel.s, sel.opt, sel.addN, sel.col, sel.ini, sel.note, sel.photos]);
      var found = bag.find(function (it) { return JSON.stringify([it.s, it.opt, it.addN, it.col, it.ini, it.note, it.photos]) === key; });
      if (found) found.qty = Math.min(20, found.qty + sel.qty); else bag.push(sel);
      saveBag();
      toast(t("added"));
      openBag();
    } else if (e.target.id === "coForm") {
      e.preventDefault();
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
    fetch(API + (API.indexOf("?") > -1 ? "&" : "?") + "action=catalog&have=" + encodeURIComponent(liveVersion))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok || res.same || res.empty || !res.data || !Array.isArray(res.data.products)) return;
        liveVersion = res.version;
        try { localStorage.setItem(LIVE_KEY, JSON.stringify({ api: API, version: res.version, products: res.data.products, settings: res.data.settings || {} })); } catch (e) { /* storage full or blocked */ }
        window.MINISE_PRODUCTS = res.data.products;
        window.MINISE_SETTINGS = Object.assign({}, res.data.settings || {}, { api: API });
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

  window.addEventListener("resize", function () { clearTimeout(movePill._t); movePill._t = setTimeout(movePill, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  applyLang();
  updateBagCount();
  route();
  fetchLive();
})();

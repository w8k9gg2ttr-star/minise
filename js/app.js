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
  var FB = "https://www.facebook.com/p/MiniseArte-100092305741637/";
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

  var LANGS = ["en", "lo", "zh"], LI = { en: 0, lo: 1, zh: 2 };
  var lang = (function () {
    var saved = load("minise_lang");
    if (LANGS.indexOf(saved) > -1) return saved;
    var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  })();
  var bag = (load("minise_bag", true) || []).filter(function (it) { return it && bySlug[it.s]; });

  /* ---------- helpers ---------- */
  function t(k, vars) {
    var i = LI[lang] || 0, def = T[k], own = OVR[k], s;
    if (own) {
      // texts edited in the admin. Without a Chinese version, Chinese shows the built-in Chinese
      // while the English is still the original wording, otherwise the admin's English.
      s = own[i] || (i === 2 ? (def && def[2] && own[0] === def[0] ? def[2] : own[0]) : "") || "";
    } else s = def ? (def[i] || def[0] || "") : k;
    if (s.indexOf("020 5524 6154") > -1) s = s.split("020 5524 6154").join(WA.mainShow);
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return n.toLocaleString("en-US") + (lang === "lo" ? " ກີບ" : lang === "zh" ? " 基普" : " ₭"); }
  // "from 265,000 ₭" reads "265,000 基普 起" in Chinese
  function fromText(m) { return lang === "zh" ? m + " " + t("from") : t("from") + " " + m; }
  // run something in another language (orders and WhatsApp messages from Chinese pages are sent in English,
  // so the team can read them)
  function inLang(L, fn) { var keep = lang; lang = L; try { return fn(); } finally { lang = keep; } }
  function shopLang() { return lang === "zh" ? "en" : lang; }
  function tw(k) { return inLang(shopLang(), function () { return t(k); }); }
  // product option names: English and Lao come with the catalogue, Chinese is kept here
  var ZH_OPT = {
    "Set of 2": "两个一套", "With photo and front name engraving": "放照片 + 正面刻名字", "Phone strap": "手机挂绳", "Keychain": "钥匙扣",
    "Standard": "标准款", "With engraving on the back": "背面刻字", "Silver": "银色", "Gold": "金色", "Extra charm": "加购挂饰",
    "Set": "一套", "One bracelet": "单条手链", "Pair": "一对", "No engraving on the back": "背面不刻字", "Extra photo charm": "加购照片挂饰"
  };
  function optName(o) { return lang === "lo" ? (o.lo || o.en) : lang === "zh" ? (ZH_OPT[o.en] || o.en) : o.en; }
  function minPrice(p) { return p.o.length ? Math.min.apply(null, p.o.map(function (o) { return o.price; })) : null; }
  function priceText(p) {
    if (!p.o.length) return null;
    var m = money(minPrice(p));
    return (p.o.length > 1 || p.from) ? fromText(m) : m;
  }
  function priceHTML(p) {
    var txt = priceText(p);
    return txt ? '<span class="pprice tn">' + esc(txt) + "</span>" : '<span class="pprice ask">' + esc(t("ask")) + "</span>";
  }
  function typeLabel(p) { return t("one_" + p.t[0]); }
  function fmtDate(iso) {
    var d = iso.split("-");
    if (lang === "lo") return d[2] + "/" + d[1] + "/" + d[0];
    if (lang === "zh") return d[0] + "年" + (+d[1]) + "月" + (+d[2]) + "日";
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
    return '<div class="card-wrap"><a class="card" href="' + (p.s === MYO ? "#make" : p.s === ITB ? "#italian" : "#p-" + p.s) + '">' +
      '<div class="pimg">' + img(p.img[0], p.n, "a") + (p.img[1] ? img(p.img[1], "", "b") : "") +
      '<div class="badges">' + badges(p) + "</div>" + kitty(p.s.length % 2 ? "peniPaw" : "paw", "card-paw") + "</div>" +
      '<div class="pmeta"><span class="ptype">' + esc(typeLabel(p)) + '</span><span class="pname">' + esc(p.n) + "</span>" + priceHTML(p) + "</div></a>" + wishBtn(p.s) + "</div>";
  }
  // the shop cat (js/cats.js); decorative, so screen readers skip it
  function kitty(pose, cls) { return window.MINISE_CAT ? '<span class="' + (cls || "kitty-wrap") + '">' + window.MINISE_CAT(pose) + "</span>" : ""; }
  // the same cat as a link to Mumi's page
  function mumiLink(pose, cls, who) { who = who || "mumi"; return window.MINISE_CAT ? '<a class="' + cls + '" href="#' + who + '" title="' + esc(t(who + "_link")) + '" aria-label="' + esc(t(who + "_link")) + '">' + window.MINISE_CAT(pose) + "</a>" : ""; }
  function head(eyebrow, title, linkHref, linkText, tag, pose) {
    var h = tag || "h2";
    return '<div class="section-head"><div><p class="eyebrow">' + esc(eyebrow) + "</p><" + h + ">" + esc(title) + (pose ? " " + kitty(pose, "sec-kitty") : "") + "</" + h + "></div>" +
      (linkHref ? '<a class="link" href="' + linkHref + '">' + esc(linkText) + " →</a>" : "") + "</div>";
  }
  function stepsHTML() {
    var out = '<ol class="steps">';
    var poses = ["heart", "peniWave", "phone", "peniPaint", "gift"];
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
      '<div class="contact-line"><a class="link" href="' + FB + '" target="_blank" rel="noopener">Facebook · Minise Arte</a><a class="link" href="' + IG + '" target="_blank" rel="noopener">@minise.arte</a></div>' +
      '<a class="link" href="https://www.google.com/maps/search/?api=1&query=Morning+Market+Mall+Vientiane" target="_blank" rel="noopener">Google Maps →</a></div>' +
      '<div class="store"><p class="eyebrow">' + esc(t("store_au")) + "</p><h3>Melbourne</h3><p>" + esc(t("store_au_p")) + "</p>" +
      '<div class="contact-line"><a class="link" href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a>' +
      '<a class="link" href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></div></div>' +
      "</div>";
  }
  function promisesHTML() {
    var items = [["sparkle", "tr1"], ["swim", "tr2"], ["peniPaint", "tr3"], ["peniGift", "tr4"]];
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
      return '<a class="cat" href="#shop-' + ty + '"><div class="ph">' + img(cover.img[0], "") + kitty({ locket: "heart", bracelet: "peniBracelet", necklace: "sparkle", set: "peniGift", earrings: "drink", accessory: "peniBunny" }[ty] || "peek", "tile-kitty") + "</div><div><b>" + esc(t("type_" + ty)) +
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
      '<div class="hero-copy">' + mumiLink("drink", "hero-kitty") + '<p class="eyebrow">' + esc(t("hero_eyebrow")) + "</p>" +
      "<h1>" + esc(t("hero_h1a")) + " <em>" + esc(t("hero_h1b")) + "</em></h1>" +
      '<p class="lead">' + esc(t("hero_lead")) + "</p>" +
      '<div class="hero-actions"><a class="btn solid" href="#shop">' + esc(t("hero_cta")) + '</a>' +
      '<a class="btn ghost" href="' + waLink(tw("msg_hi")) + '" target="_blank" rel="noopener">' + esc(t("hero_wa")) + "</a></div>" +
      '<p class="proof"><span class="dot"></span>' + esc(t("hero_proof")) + "</p></div>" +
      '<div class="pol-stack">' + hero + mumiLink("peniSleep", "pol-kitty", "peni") + "</div></div>" + kitty("walk", "walker") + kitty("peniWalk", "walker walker2") + "</section>" +
      promisesHTML() +
      '<section class="section"><div class="wrap">' + head(t("cat_eyebrow"), t("cat_h"), "", "", "", "search") + '<div class="cats">' + cats + "</div></div></section>" +
      '<section class="section tight"><div class="wrap"><a class="mk-teaser" href="#make">' + kitty("peniBracelet", "teaser-kitty") +
      '<div class="mk-teaser-copy"><p class="eyebrow">' + esc(t("mk_new")) + "</p><h2>" + esc(t("mk_h")) + "</h2><p>" + esc(t("mk_teaser")) + '</p><span class="btn solid">' + esc(t("mk_cta")) + "</span></div>" +
      '<div class="mk-teaser-charms" aria-hidden="true">' + ["A1", "B20", "C25", "A7", "B4", "C37"].map(function (c) { return CH_BY[c] ? charmImg(c) : ""; }).join("") + '</div></a><a class="gf-strip" href="#gift">' + kitty("gift", "gf-strip-k") + "<b>" + esc(t("gf_teaser_h")) + '</b><span class="btn">' + esc(t("gf_teaser_cta")) + "</span>" + kitty("peniGift", "gf-strip-k") + "</a></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("best_eyebrow"), t("best_h"), "#shop", t("view_all"), "", "peniHeart") + '<div class="grid">' + best.map(card).join("") + "</div></div></section>" +
      '<section class="section band"><div class="wrap keep-grid"><div class="keep-copy"><p class="eyebrow">' + esc(t("photo_eyebrow")) + "</p><h2>" + esc(t("photo_h")) + " " + kitty("gift", "sec-kitty") + "</h2>" +
      '<p class="lead">' + esc(t("photo_p")) + '</p><ul class="ticks">' +
      ["photo_l1", "photo_l2", "photo_l3"].map(function (k) { return "<li>" + ICON.tick + "<span>" + esc(t(k)) + "</span></li>"; }).join("") +
      '</ul><div><a class="btn" href="#c-photo">' + esc(t("photo_cta")) + '</a></div></div><div class="grid three">' + keep + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("new_eyebrow"), t("new_h"), "#shop", t("view_all"), "", "peniYay") + '<div class="grid">' + fresh.map(card).join("") + "</div></div></section>" +
      duoHTML() +
      '<section class="section tight"><div class="wrap">' + head(t("col_eyebrow"), t("col_h")) + '<div class="chips-row">' + tags + "</div></div></section>" +
      '<section class="section band"><div class="wrap">' + head(t("steps_eyebrow"), t("steps_h"), "#order", t("view_all"), "", "phone") + stepsHTML() + "</div></section>" +
      '<section class="section"><div class="wrap">' + head(t("visit_eyebrow"), t("visit_h"), "", "", "", "wave") + visitHTML() + "</div></section>" +
      '<section class="section tight"><div class="wrap">' + head("@minise.arte", t("ig_h"), IG, t("ig_cta"), "", "peniBunnyPeek") + '<div class="ig-strip">' + igPics + "</div></div></section>" +
      '<section class="section tight"><div class="wrap">' + head(t("faq_eyebrow"), t("faq_h"), "", "", "", "peniBox") + faqHTML() + "</div></section>";
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
    return '<section class="wrap"><div class="shop-head kittied">' + kitty("peniSearch", "head-kitty") + '<p class="eyebrow">' + esc(t("shop_eyebrow")) + '</p><h1 id="shopTitle">' + esc(shopTitle()) + "</h1>" +
      '<p class="lead">' + esc(t("shop_lead")) + '</p><p class="gf-hint"><a class="link" href="#gift">' + esc(t("gf_shop_hint")) + " →</a></p></div>" +
      '<div class="shop-layout"><details class="filters"' + (openFilters ? " open" : "") + "><summary>" + esc(t("filters")) + " <span>＋</span></summary><div class=\"fbody\">" +
      '<div class="field"><label for="q">' + esc(t("search")) + '</label><input type="search" id="q" placeholder="' + esc(t("search_ph")) + '" value="' + esc(F.q) + '" autocomplete="off"></div>' +
      '<div class="fgroup"><h3>' + esc(t("category")) + '</h3><div class="flist">' + typeBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("collection")) + '</h3><div class="flist tags">' + tagBtns + "</div></div>" +
      '<div class="fgroup"><h3>' + esc(t("availability")) + '</h3><select id="fav" aria-label="' + esc(t("availability")) + '">' +
      ["all", "cur", "old"].map(function (v) { return '<option value="' + v + '"' + (F.av === v ? " selected" : "") + ">" + esc(t("av_" + v)) + "</option>"; }).join("") +
      '</select><label class="check"><input type="checkbox" id="frts"' + (F.rts ? " checked" : "") + "> " + esc(t("rts_only")) + "</label></div>" +
      kitty("peniYarn", "filter-kitty") + "</div></details>" +
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
  var REVEAL = ".section-head, .cat, .card, .coll, .promise, .timeline li, .values > div, .steps li, .faq details, .ig-strip a, .visit-grid > *, .story-pics img, .mumi-day li, .duo-story li";
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
  // put the menu on its own row when its words don't fit beside the logo (Lao and Chinese words are longer)
  function fitNav() {
    var head = document.querySelector(".site-head"), nav = head.querySelector(".main-nav");
    head.classList.remove("stack");
    var need = Array.prototype.reduce.call(nav.querySelectorAll("a"), function (s, a) { return s + a.offsetWidth; }, 0);
    head.classList.toggle("stack", window.innerWidth <= 1040 || need > nav.clientWidth + 1);
    navEdge();
  }
  // on phones the menu row can be swiped; a soft fade on the right shows there is more
  function navEdge() {
    var nav = document.querySelector(".main-nav");
    nav.classList.toggle("more", nav.scrollWidth > nav.clientWidth + 2 && nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
  }
  document.querySelector(".main-nav").addEventListener("scroll", navEdge, { passive: true });
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
    var txt = which === "lo" ? p.lo : which === "zh" ? "" : p.en;
    if (txt) return txt;
    if (which === "lo") return "";
    var kind = T["one_" + p.t[0]] || ["piece", "", "作品"];
    if (which === "zh") {
      var z = "Minise Arte 手工制作的" + kind[2] + (p.stainless ? "，不锈钢材质" : "") + "。";
      if (p.li) z += "可刻上 " + (p.li[0] === p.li[1] ? p.li[0] : p.li[0] + "–" + p.li[1]) + " 个字母（A–Z）。";
      return z;
    }
    var bits = ["Handmade " + kind[0].toLowerCase() + " by Minise Arte" + (p.stainless ? " in stainless steel" : "") + "."];
    if (p.li) bits.push("Personalise it with " + (p.li[0] === p.li[1] ? p.li[0] : p.li[0] + "–" + p.li[1]) + " initial" + (p.li[1] > 1 ? "s" : "") + ".");
    return bits.join(" ");
  }
  function unitPrice(p, opt, addN, parts) {
    if (!p.o.length) return null;
    return (p.o[opt] || p.o[0]).price + (p.add ? addN * p.add.price : 0) + (p.parts ? partsCost(p.parts, +p.free_pic || 0, parts) : 0);
  }
  // each kind of link has its price in "parts"; the first picture charm(s) can be free
  function partsCost(prices, free, list) {
    if (!prices || !list) return 0;
    return list.reduce(function (s, k) { if (k === "pic" && free > 0) { free--; return s; } return s + (+prices[k] || 0); }, 0);
  }
  function product(slug) {
    var p = bySlug[slug];
    if (!p) return '<section class="wrap page-head">' + kitty("search", "empty-kitty") + "<h1>" + esc(t("not_found")) + '</h1><p><a class="btn" href="#shop">' + esc(t("back_shop")) + "</a></p></section>";
    S = { p: p, img: 0, opt: 0, addN: 0, qty: 1, col: "", phs: [] };
    var thumbs = p.img.length > 1 ? '<div class="thumbs">' + p.img.map(function (src, i) {
      return '<button type="button" data-thumb="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(t("photo_n", { n: i + 1 })) + '">' + img(src, "") + "</button>";
    }).join("") + "</div>" : "";
    var priceBlock = priceBlockHTML();
    var opts = p.o.length > 1 ? '<div class="field"><span class="lbl">' + esc(t("option")) + '</span><div class="opts" role="radiogroup">' + p.o.map(function (o, i) {
      return '<label class="opt"><input type="radio" name="opt" value="' + i + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(optName(o)) + "<small>" + esc(money(o.price)) + "</small></span></label>";
    }).join("") + "</div></div>" : "";
    var addon = p.add ? '<div class="field"><span class="lbl">' + esc(optName(p.add)) + ' <span class="hint">(' + esc(t("addon_each", { p: money(p.add.price) })) + ')</span></span>' +
      '<div class="stepper"><button type="button" data-step="addN" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><output id="addN">0</output><button type="button" data-step="addN" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div></div>' : "";
    var ini = p.li ? '<div class="field"><label for="ini">' + esc(t("initials")) + '</label><input type="text" id="ini" maxlength="' + Math.max(p.li[1], 1) + '" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<span class="hint">' + esc(p.li[1] > 1 ? t("initials_hint", { n: p.li[1] }) : t("initials_hint1")) + '</span><span class="err" id="iniErr" hidden>' + esc(t("req_ini")) + "</span></div>" : "";
    var optIsColour = p.o.some(function (o) { return o.en === "Silver" || o.en === "Gold"; });
    var col = p.c.length > 1 && !optIsColour ? '<div class="field"><span class="lbl">' + esc(t("colour")) + '</span><div class="opts" role="radiogroup">' + p.c.map(function (c, i) {
      return '<label class="opt"><input type="radio" name="col" value="' + c + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(t(c)) + "</span></label>";
    }).join("") + "</div></div>" : "";
    if (p.c.length > 1 && !optIsColour) S.col = p.c[0];
    var photo = p.ph ? '<div class="field ph-field"><span class="lbl">📷 ' + esc(t("photos")) + '</span><span class="hint">' + esc(t("photos_pdp_h", { n: PH_ITEM })) + '</span><div class="ph-row" id="pdPhotos">' + pdPhotosHTML() + "</div></div>" : "";
    var related = P.filter(function (x) { return x !== p && x.t[0] === p.t[0]; })
      .sort(function (a, b) {
        var sa = a.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0, sb = b.g.some(function (g) { return p.g.indexOf(g) > -1; }) ? 1 : 0;
        return (sb - sa) || ((b.cur - a.cur)) || byLikes(a, b);
      }).slice(0, 4);
    var otherLang = lang === "en" ? p.lo : describe(p, "en");
    return '<section class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#shop">' + esc(t("nav_shop")) + '</a><span>/</span><a href="#shop-' + p.t[0] + '">' + esc(t("type_" + p.t[0])) + "</a><span>/</span><span>" + esc(p.n) + "</span></nav>" +
      '<div class="pdp-grid"><div class="gallery">' + kitty(["peek", "peniPeek", "sharkPeek", "peniBunnyPeek"][p.s.length % 4], "gal-kitty") + '<div class="gmain">' + img(p.img[0], p.n, "", true).replace("<img", '<img id="gmain"') + "</div>" + thumbs + "</div>" +
      '<div class="pinfo"><div><p class="ptype">' + esc(typeLabel(p)) + "</p><h1>" + esc(p.n) + "</h1>" + wishPdp(p.s) + '</div><div id="priceBlock">' + priceBlock + "</div>" + features(p) +
      (!p.cur ? '<p class="notice">' + esc(t("earlier_note")) + "</p>" : "") +
      '<form class="pform" id="pform" novalidate>' + opts + col + ini + addon + photo +
      '<div class="field"><label for="pnote">' + esc(t("note")) + '</label><textarea id="pnote" placeholder="' + esc(t("note_ph")) + '"></textarea></div>' +
      '<div class="field"><span class="lbl">' + esc(t("qty")) + '</span><div class="stepper"><button type="button" data-step="qty" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><output id="qty">1</output><button type="button" data-step="qty" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div></div>' +
      '<div class="actions">' + (p.so ? '<p class="notice">' + esc(t("so_note")) + '</p><button class="btn wide" type="submit" disabled>' + esc(t("so_btn")) : '<button class="btn wide" type="submit">' + esc(t("add"))) + '</button><a class="btn ghost wide" id="askWa" target="_blank" rel="noopener" href="#">' + esc(t("wa_this")) + "</a></div></form>" + (p.g.indexOf("italian") > -1 ? '<a class="it-pdp" href="#italian">' + kitty("sparkle", "it-pdp-k") + "<span class=\"it-pdp-t\"><b>" + esc(t("it_pdp")) + "</b><small>" + esc(t("it_pdp_sub")) + "</small></span><span aria-hidden=\"true\">→</span></a>" : "") +
      '<p class="nt-pdp"><a class="link" href="#note">' + esc(t("nt_pdp")) + " →</a></p>" +
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
      var label = p.o.length === 1 && p.o[0].en ? '<p class="price-note">' + esc(optName(p.o[0])) + "</p>" : "";
      return '<p class="price-big tn">' + esc(p.from && p.o.length === 1 ? fromText(money(u)) : money(u)) + "</p>" + label;
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
      s: p.s, opt: S.opt, addN: S.addN, qty: S.qty, col: S.col, phs: p.ph ? S.phs.slice() : undefined,
      ini: ini ? ini.value.trim().toUpperCase() : "",
      note: note ? note.value.trim() : ""
    };
  }
  function lineDetails(p, it, nums) {
    var d = [];
    if (p.o.length > 1 || (p.o.length === 1 && p.o[0].en)) d.push(optName(p.o[it.opt]));
    if (it.myo && it.shape) d.push(t("shape") + ": " + t("sh_" + it.shape));
    if (it.col) d.push(t("colour") + ": " + t(it.col));
    if (it.ini) d.push((it.myo ? t("letter") : t("initials")) + ": " + it.ini);
    if (p.add && it.addN && !it.myo) d.push(optName(p.add) + " × " + it.addN);
    if (it.myo && it.ch) it.ch.forEach(function (c) { d.push(t("charm") + " " + c + ": " + charmName(c)); });
    if (it.it) d.push.apply(d, itDetailLines(it, +p.free_pic || 0, nums));
    else if (nums && nums.some(Boolean)) d.push(t("ph_label") + ": " + nums.filter(Boolean).map(function (n) { return "#" + n; }).join(" "));
    if (it.note) d.push("“" + it.note + "”");
    return d;
  }
  function updateAskLink() {
    var a = document.getElementById("askWa");
    if (!a || !S) return;
    var it = currentSelection();
    var d = inLang(shopLang(), function () { return lineDetails(S.p, it); });
    a.href = waLink(tw("msg_ask") + " " + S.p.n + (d.length ? " (" + d.join(", ") + ")" : "") + (S.p.ig.length ? "\n" + igPost(S.p.ig[0]) : ""));
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
        pop.innerHTML = window.MINISE_CAT(n % 2 ? "peniPeek" : "peek");
        pop.classList.remove("go"); void pop.offsetWidth; pop.classList.add("go");
      }
    }
    lastCount = n;
  }
  function bagTotals() {
    var sum = 0, unknown = 0;
    bag.forEach(function (it) {
      var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0, it.parts);
      if (u == null) unknown += it.qty; else sum += u * it.qty;
    });
    return { sum: sum, unknown: unknown };
  }
  function bagLines(editable) {
    return bag.map(function (it, idx) {
      var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0, it.parts);
      var d = lineDetails(p, it);
      return '<div class="line">' + img(p.img[0], p.n) + '<div class="info"><b>' + esc(p.n) + "</b>" +
        (d.length ? "<small>" + esc(d.join(" · ")) + "</small>" : "") +
        (editable && p.ph ? (function () { var ph = itemPhotos(it).filter(Boolean); return ph.length ? '<span class="line-ph">' + ph.map(function (id) { return phImg(id, "line-ph-img"); }).join("") + "</span>" : ""; })() : "") +
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
    d.innerHTML = '<div class="drawer-head"><div class="drawer-title">' + (bag.length ? kitty("peniBox", "drawer-kitty") : "") + '<h2 id="drawerTitle">' + esc(t("bag_h")) + '</h2></div><button class="icon-btn" type="button" data-close aria-label="' + esc(t("close")) + '">✕</button></div>' +
      '<div class="drawer-body">' + (bag.length ? bagLines(true) : '<div class="empty">' + kitty("peniSleep", "empty-kitty") + "<p>" + esc(t("bag_empty")) + "</p></div>") + "</div>" +
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
    ["Vientiane Capital", "ນະຄອນຫຼວງວຽງຈັນ", "万象市"], ["Vientiane Province", "ແຂວງວຽງຈັນ", "万象省"], ["Luang Prabang", "ຫຼວງພະບາງ", "琅勃拉邦省"],
    ["Savannakhet", "ສະຫວັນນະເຂດ", "沙湾拿吉省"], ["Champasak", "ຈຳປາສັກ", "占巴塞省"], ["Khammouane", "ຄຳມ່ວນ", "甘蒙省"], ["Bolikhamxay", "ບໍລິຄຳໄຊ", "波里坎赛省"],
    ["Xayaboury", "ໄຊຍະບູລີ", "沙耶武里省"], ["Xiengkhouang", "ຊຽງຂວາງ", "川圹省"], ["Oudomxay", "ອຸດົມໄຊ", "乌多姆赛省"], ["Luang Namtha", "ຫຼວງນ້ຳທາ", "琅南塔省"],
    ["Bokeo", "ບໍ່ແກ້ວ", "博胶省"], ["Phongsaly", "ຜົ້ງສາລີ", "丰沙里省"], ["Houaphanh", "ຫົວພັນ", "华潘省"], ["Saravane", "ສາລະວັນ", "沙拉湾省"],
    ["Sekong", "ເຊກອງ", "色贡省"], ["Attapeu", "ອັດຕະປື", "阿速坡省"], ["Xaisomboun", "ໄຊສົມບູນ", "赛宋本省"]
  ];
  var VIAS = ["whatsapp", "phone", "facebook", "instagram"];
  var DELS = ["d_pick", "d_anou", "d_mix", "d_houng", "d_abroad"];
  /* ---------- customer photos ----------
     Photos for a piece wait in this browser (IndexedDB) until the order is sent, then go to Minise's private storage.
     A bag item keeps their ids: it.phs for a piece, link.ph for each picture charm or locket of an Italian bracelet. */
  var PH_MAX = 12, PH_ITEM = 6, PH_MEM = {}, PH_URL = {}, PHDB = null;
  function phDb() {
    if (!PHDB) PHDB = new Promise(function (res) {
      try {
        var r = indexedDB.open("minise-photos", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("p"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return PHDB;
  }
  function phStore(mode, fn) {
    return phDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (res) {
        try {
          var tx = db.transaction("p", mode), q = fn(tx.objectStore("p"));
          tx.oncomplete = function () { res(q && q.result); };
          tx.onerror = tx.onabort = function () { res(null); };
        } catch (e) { res(null); }
      });
    });
  }
  // a chosen file → a 1600 px JPEG kept here; resolves with its id (or null when it isn't a picture)
  function phAdd(file) {
    return readImageFile(file).then(function (r) {
      if (!r) return null;
      return new Promise(function (res) { shrink(r.img, 1600).toBlob(res, "image/jpeg", 0.86); }).then(function (blob) {
        if (!blob) return null;
        var id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        PH_MEM[id] = blob; PH_URL[id] = URL.createObjectURL(blob);
        return phStore("readwrite", function (s) { return s.put(blob, id); }).then(function () { return id; });
      });
    });
  }
  function phAddAll(files, room) {
    var ids = [];
    return Array.prototype.slice.call(files || [], 0, Math.max(0, room)).reduce(function (p, f) {
      return p.then(function () { return phAdd(f).then(function (id) { if (id) ids.push(id); }); });
    }, Promise.resolve()).then(function () { return ids; });
  }
  function phBlob(id) {
    if (PH_MEM[id]) return Promise.resolve(PH_MEM[id]);
    return phStore("readonly", function (s) { return s.get(id); }).then(function (b) {
      if (b) { PH_MEM[id] = b; PH_URL[id] = URL.createObjectURL(b); }
      return b || null;
    });
  }
  function phImg(id, cls) { return '<img class="' + (cls || "ph-img") + '" data-ph="' + id + '"' + (PH_URL[id] ? ' src="' + PH_URL[id] + '"' : "") + ' alt="">'; }
  function phTile(id, rm) { return '<span class="ph-tile">' + phImg(id) + '<button type="button" ' + rm + ' aria-label="' + esc(t("remove")) + '">✕</button></span>'; }
  function phAddTile(attr, multi) { return '<label class="ph-tile ph-add"><span>' + esc(t("photos_add_s")) + '</span><input type="file" accept="image/*"' + (multi ? " multiple" : "") + ' class="sr" ' + attr + "></label>"; }
  // the photo ids a bag item holds, in the order they are numbered for the shop ("" = a picture charm still waiting)
  function itemPhotos(it) {
    if (it.it) return (it.links || []).filter(function (l) { return l.k === "pic" || l.k === "lock"; }).map(function (l) { return l.ph || ""; });
    return (it.phs || []).slice();
  }
  function usedPhotoIds() {
    var ids = [];
    bag.forEach(function (it) { itemPhotos(it).forEach(function (id) { if (id) ids.push(id); }); });
    if (IT) IT.links.forEach(function (l) { if (l.ph) ids.push(l.ph); });
    if (S && S.phs) ids = ids.concat(S.phs);
    return ids;
  }
  // after a reload the photos come back from storage; the ones nothing uses any more are deleted
  function phWake() {
    var ids = usedPhotoIds().filter(function (id) { return !PH_URL[id]; });
    return Promise.all(ids.map(phBlob)).then(function () {
      document.querySelectorAll("img[data-ph]").forEach(function (im) { var u = PH_URL[im.getAttribute("data-ph")]; if (u && !im.getAttribute("src")) im.src = u; });
      if (ids.length && current === "italian") itUpdate(true);
      return phStore("readonly", function (s) { return s.getAllKeys(); });
    }).then(function (keys) {
      var keep = usedPhotoIds();
      (keys || []).forEach(function (k) { if (keep.indexOf(k) < 0) { phStore("readwrite", function (s) { return s.delete(k); }); if (PH_URL[k]) { URL.revokeObjectURL(PH_URL[k]); delete PH_URL[k]; delete PH_MEM[k]; } } });
    }).catch(function () { /* photos are optional until checkout */ });
  }
  // product page: photos picked before adding to the bag
  function pdPhotosHTML() {
    return S.phs.map(function (id, i) { return phTile(id, 'data-ph-pdrm="' + i + '"'); }).join("") + (S.phs.length < PH_ITEM ? phAddTile("data-ph-pd", true) : "");
  }
  // checkout: one block per piece that needs photos; an Italian bracelet asks for one per picture charm and locket
  function phStepHTML() {
    return bag.map(function (it, idx) {
      var p = bySlug[it.s];
      if (!p || !p.ph) return "";
      var body;
      if (it.it) {
        var k = 0;
        body = '<div class="ph-slots">' + (it.links || []).map(function (l, li) {
          if (l.k !== "pic" && l.k !== "lock") return "";
          k++;
          var lab = l.k === "lock" ? t("ip_lock") : t("ip_pic") + " · " + t("sh_" + l.sh);
          return '<div class="ph-slot"><span class="ph-slot-t"><b class="tn">' + k + "</b>" + esc(lab) + "</span>" +
            (l.ph ? phTile(l.ph, 'data-ph-slotrm="' + idx + ":" + li + '"') : phAddTile('data-ph-slot="' + idx + ":" + li + '"', false)) + "</div>";
        }).join("") + "</div>";
      } else {
        var phs = it.phs || [];
        body = '<div class="ph-row">' + phs.map(function (id, j) { return phTile(id, 'data-ph-itemrm="' + idx + ":" + j + '"'); }).join("") +
          (phs.length < PH_ITEM ? phAddTile('data-ph-item="' + idx + '"', true) : "") + "</div>";
      }
      return '<div class="ph-block" id="coPh' + idx + 'F">' + img(p.img[0], p.n) + '<div class="ph-block-m"><p class="ph-block-h"><b>' + esc(p.n) + "</b>" +
        (it.qty > 1 ? ' <span class="tn">× ' + it.qty + "</span>" : "") + "</p>" + body + '<span class="err" id="coPh' + idx + 'E" hidden></span></div></div>';
    }).join("");
  }
  function phStepRefresh() { var b = document.getElementById("coPhotos"); if (b) b.innerHTML = phStepHTML(); }
  // the photos in upload order (1.jpg, 2.jpg …) and, for each bag item, the numbers its photos get
  function photoPlan() {
    var list = [], nums = {};
    bag.forEach(function (it, idx) {
      var p = bySlug[it.s];
      if (!p || !p.ph) return;
      nums[idx] = itemPhotos(it).map(function (id) { if (!id || list.length >= PH_MAX) return 0; list.push(id); return list.length; });
    });
    return { list: list, nums: nums };
  }

  var CO = { slipImg: null, slipUrl: "", sending: false, done: null, code: null };
  // discount code: the database checks it and works out the discount again when the order is saved
  try { CO.code = JSON.parse(sessionStorage.getItem("minise_code") || "null"); } catch (e) { CO.code = null; }
  function setCode(c) {
    CO.code = c;
    try { if (c) sessionStorage.setItem("minise_code", JSON.stringify(c)); else sessionStorage.removeItem("minise_code"); } catch (e) { /* memory only */ }
  }
  function discountOf(sum) { return CO.code ? Math.round(sum * CO.code.percent / 100) : 0; }
  function payTotal() { var s = bagTotals().sum; return s - discountOf(s); }
  function checkoutTotals() {
    var tt = bagTotals(), d = discountOf(tt.sum);
    return '<div class="total"><span>' + esc(t("subtotal")) + '</span><b>' + esc(money(tt.sum)) + "</b></div>" +
      (d ? '<div class="total discount"><span>' + esc(t("discount")) + " · " + esc(CO.code.code.toUpperCase()) + " (−" + CO.code.percent + "%)</span><b>−" + esc(money(d)) + "</b></div>" +
        '<div class="total grand"><span>' + esc(t("to_pay")) + "</span><b>" + esc(money(tt.sum - d)) + "</b></div>" : "");
  }
  function codeField() {
    var c = CO.code;
    return '<div class="field" id="coCodeF"><label for="coCode">' + esc(t("code_label")) + '</label><div class="code-row">' +
      '<input type="text" id="coCode" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(t("code_ph")) + '"' + (c ? ' value="' + esc(c.code) + '" readonly' : "") + ">" +
      '<button class="btn ghost" type="button" id="' + (c ? "coCodeRemove" : "coCodeApply") + '">' + esc(t(c ? "code_remove" : "code_apply")) + "</button></div>" +
      '<span class="hint ok" id="coCodeH"' + (c ? "" : " hidden") + ">" + (c ? esc(t("code_ok", { code: c.code.toUpperCase(), p: c.percent })) : "") + "</span>" +
      '<span class="err" id="coCodeE" hidden></span></div>';
  }
  function applyCode() {
    var inp = document.getElementById("coCode"), btn = document.getElementById("coCodeApply");
    var code = (inp ? inp.value : "").trim().toLowerCase();
    if (!code) { setErr("coCode", t("code_bad")); return; }
    if (!API) { setErr("coCode", t("err_net")); return; }
    btn.disabled = true; btn.textContent = t("code_checking"); setErr("coCode", "");
    rpc("check_discount", { p_code: code }).then(function (r) {
      if (!r || !r.ok) throw new Error("bad");
      setCode({ code: r.code, percent: r.percent });
      route();
    }).catch(function () {
      btn.disabled = false; btn.textContent = t("code_apply");
      setErr("coCode", t("code_bad"));
    });
  }
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
  function delText() { var v = fieldVal("coDel"); return v ? t(v) : ""; }
  function addressText() {
    var v = fieldVal("coDel");
    if (v === "d_pick") return "";
    if (v === "d_abroad") return [fieldVal("coCountry"), fieldVal("coAddr")].filter(Boolean).join(" · ");
    var prov = document.getElementById("coProv");
    var parts = [
      prov && prov.value && PROVINCES[+prov.value] ? t("prov") + ": " + (PROVINCES[+prov.value][LI[lang]] || PROVINCES[+prov.value][0]) : "",
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
    if (!CO.shownAt) CO.shownAt = Date.now();
    // items without a price can't be paid online: say so before asking for any details
    if (tt.unknown) {
      return '<section class="wrap"><div class="page-head"><p class="eyebrow">' + esc(t("co_eyebrow")) + "</p><h1>" + esc(t("co_h")) + "</h1></div>" +
        '<div class="co-grid"><div class="co-form"><p class="notice warn">' + esc(t("need_price")) + '</p><a class="btn wide" href="' + esc(waLink(orderMessage({ bag: bag, total: tt.sum, unpaid: true }))) + '" target="_blank" rel="noopener">' + esc(t("need_price_wa")) + "</a></div>" +
        '<aside class="co-side"><div class="panel"><h2>' + esc(t("summary")) + "</h2>" + bagLines(true) + totalHTML() + "</div></aside></div></section>";
    }
    var cc = COUNTRIES.map(function (c) { return '<option value="' + c[0] + '">' + esc(t("cc_" + c[0])) + "</option>"; }).join("");
    var vias = VIAS.map(function (v) { return '<option value="' + v + '">' + esc(t("via_" + v)) + "</option>"; }).join("");
    var dels = DELS.map(function (k) { return '<option value="' + k + '">' + esc(t(k)) + "</option>"; }).join("");
    var provs = '<option value="">' + esc(t("prov_ph")) + "</option>" + PROVINCES.map(function (p, i) { return '<option value="' + i + '">' + esc(p[LI[lang]] || p[0]) + "</option>"; }).join("");
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
      noteCardHTML() +
      field("coNote", t("co_note"), '<textarea id="coNote" maxlength="500"></textarea>') +
      "</fieldset>";
    if (photos) {
      html += '<fieldset class="co-step">' + kitty("peniHeart", "step-kitty") + stepHead(n++, t("st_photos")) +
        '<p class="hint">' + esc(t("photos_need")) + '</p><div class="ph-blocks" id="coPhotos">' + phStepHTML() + '</div><span class="err" id="coPhotosE" hidden></span></fieldset>';
    }
    html += '<fieldset class="co-step">' + kitty("phone", "step-kitty") + stepHead(n++, t("st_pay")) + codeField() +
      '<div class="paybox"><div class="pay-qr"><img src="' + esc(QR) + '" alt="LAO QR" width="220" height="220"><p class="hint">' + esc(t("acct")) + ": <b>" + esc(ACCOUNT) + "</b></p></div>" +
      '<ol class="pay-steps"><li>' + esc(t("pay1")) + "</li><li>" + esc(t("pay2")) + ' <b class="tn big" id="payAmount">' + esc(money(payTotal())) + "</b></li><li>" + esc(t("pay3")) + ' <b class="tn big">' + esc(no) + '</b> <button class="mini-btn" type="button" data-copy="' + esc(no) + '">' + esc(t("copy")) + "</button></li><li>" + esc(t("pay4")) + "</li></ol></div>" +
      '<div class="field" id="coSlipF"><label class="file-drop' + (CO.slipUrl ? " has" : "") + '" for="coSlip" id="coSlipL">' + esc(CO.slipUrl ? t("slip_change") : t("slip_req")) +
      '<input type="file" id="coSlip" accept="image/*" class="sr"></label><div class="previews" id="coSlipPrev">' + (CO.slipUrl ? '<img src="' + CO.slipUrl + '" alt="">' : "") + '</div><span class="hint">' + esc(t("slip_hint2")) + '</span><span class="err" id="coSlipE" hidden></span></div>' +
      field("rcRef", t("rc_ref"), '<input type="text" id="rcRef" maxlength="80" placeholder="' + esc(t("rc_ref_ph")) + '">') +
      "</fieldset>" +
      '<p class="alert-line" id="coMsg" role="alert" hidden></p>' +
      '<button class="btn wide big" type="submit" id="coSend">' + esc(t("send_order")) + "</button>" +
      '<p class="hint center">' + esc(t("send_note")) + "</p>" +
      '<p class="hint center agree">' + esc(t("agree")).replace("{terms}", '<a class="link" href="#terms">' + esc(t("terms_link")) + "</a>").replace("{privacy}", '<a class="link" href="#privacy">' + esc(t("privacy_link")) + "</a>") + "</p>" +
      // a hidden box people never see or fill; spam robots usually do
      '<div class="hp" aria-hidden="true"><label for="coWeb">Website</label><input type="text" id="coWeb" name="website" tabindex="-1" autocomplete="off"></div>' +
      "</form>" +
      '<aside class="co-side"><div class="panel"><h2>' + esc(t("summary")) + "</h2>" + bagLines(false) + checkoutTotals() + "</div></aside></div></section>";
    return html;
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
    var via = fieldVal("coVia"), needHandle = via === "facebook" || via === "instagram";
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
    if (via === "facebook" || via === "instagram") chk("coHandle", fieldVal("coHandle").length >= 2, t("req"));
    else setErr("coHandle", "");
    var v = fieldVal("coDel");
    if (v === "d_anou" || v === "d_mix" || v === "d_houng") {
      chk("coProv", fieldVal("coProv") !== "", t("req"));
      chk("coDist", fieldVal("coDist").length >= 2, t("req"));
      chk("coBranch", fieldVal("coBranch").length >= 2, t("req"));
    } else ["coProv", "coDist", "coBranch"].forEach(function (id) { setErr(id, ""); });
    if (v === "d_abroad") { chk("coCountry", fieldVal("coCountry").length >= 2, t("req")); chk("coAddr", fieldVal("coAddr").length >= 8, t("req")); }
    else setErr("coCountry", "");
    if (needPhotos()) {
      var phTot = 0;
      bag.forEach(function (it, idx) {
        var p = bySlug[it.s];
        if (!p || !p.ph) return;
        var list = itemPhotos(it);
        phTot += list.filter(Boolean).length;
        chk("coPh" + idx, it.it ? list.every(Boolean) : list.length > 0, t(it.it ? "photos_slot_need" : "photos_item_need"));
      });
      chk("coPhotos", phTot <= PH_MAX, t("photos_max", { n: PH_MAX }));
    }
    var nc = document.getElementById("ncOn");
    if (nc && nc.checked) chk("ncMsg", NT.msg.trim().length > 0, t("nc_need")); else setErr("ncMsg", "");
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
    var list = photoPlan().list;
    return Promise.all(list.map(function (pid, i) {
      return phBlob(pid).then(function (blob) {
        if (!blob) throw new Error("photo");
        var h = { apikey: SBC.key, "Content-Type": "image/jpeg", "x-upsert": "false" };
        if (/^eyJ/.test(SBC.key)) h.Authorization = "Bearer " + SBC.key;
        return fetch(API + "/storage/v1/object/order-photos/" + id + "/" + key + "/" + (i + 1) + ".jpg", { method: "POST", headers: h, body: blob })
          .then(function (r) { if (!r.ok && r.status !== 409) throw new Error("upload " + r.status); });
      });
    })).then(function () { return rpc("order_photos_added", { p_id: id, p_key: key, p_count: list.length }); })
      .then(function (r) { if (!r || !r.ok) throw new Error("photos"); });
  }
  // what the shop receives: English or Lao (a Chinese page sends English, so the team can read it)
  function orderPayload() {
    var plan = photoPlan(), card = ncCard();
    return inLang(shopLang(), function () { return {
      id: currentOrderNo(), date: todayLocal(), lang: lang, method: "rc",
      name: fieldVal("coName"), phone: readPhone(),
      contact_via: fieldVal("coVia"), contact_handle: fieldVal("coHandle"), discount_code: CO.code ? CO.code.code : "", website: fieldVal("coWeb"),
      delivery: delText(), delivery_type: fieldVal("coDel").replace("d_", ""),
      address: addressText(), note: [ncText(card), fieldVal("coNote")].filter(Boolean).join("\n\n"), ref: fieldVal("rcRef"),
      items: bag.map(function (it, idx) {
        var p = bySlug[it.s];
        // the database works out the price itself from the product, choice and quantity
        var o = { s: it.s, opt: it.opt || 0, addN: it.addN || 0, qty: it.qty, details: lineDetails(p, it, plan.nums[idx]).join(", ") };
        if (it.parts) o.parts = it.parts;
        return o;
      })
    }; });
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
    // robots: the hidden box is filled, or the whole form was "filled in" within a few seconds
    if (fieldVal("coWeb") || Date.now() - (CO.shownAt || 0) < 4000) { showMsg(t("err_busy")); return; }
    var btn = document.getElementById("coSend");
    CO.sending = true; btn.disabled = true; btn.textContent = t("rc_sending"); showMsg("");
    var payload = orderPayload();
    var slip = shrink(CO.slipImg, 1200, 0.8).toDataURL("image/jpeg", 0.8);
    var snap = {
      name: payload.name, phone: prettyPhone(payload.phone), via: payload.contact_via, delivery: delText(),
      address: addressText(), note: payload.note, ref: payload.ref, bag: bag.slice(), total: payTotal(), subtotal: bagTotals().sum,
      discount: discountOf(bagTotals().sum), code: CO.code ? CO.code.code.toUpperCase() : "", pct: CO.code ? CO.code.percent : 0,
      wa: { delivery: payload.delivery, address: payload.address }
    };
    rpc("place_order", { p_order: payload, p_slip: slip }).then(function (res) {
      if (!res || !res.ok) {
        var err = res && res.error;
        if (err === "phone") setErr("coPhone", t("err_phone", { eg: countryOf(fieldVal("coCc"))[3] || "" }));
        throw new Error(err || (res && res.message) || "error");
      }
      snap.id = res.id; snap.total = res.total || snap.total;
      if (typeof res.discount === "number") snap.discount = res.discount;
      slipImg = CO.slipImg;
      // the order is safely saved now; if the photos fail we ask for them on WhatsApp instead
      var nPh = photoPlan().list.length;
      var photos = nPh && res.photo_key ? uploadPhotos(res.id, res.photo_key).catch(function () { snap.photosFailed = true; }) :
        Promise.resolve(nPh ? (snap.photosFailed = true) : 0);
      return photos.then(function () { return drawReceipt(snap); }).then(function (c) {
        snap.receipt = c.toDataURL("image/png");
        CO.done = snap; CO.slipImg = null; CO.slipUrl = ""; CO.sending = false; setCode(null);
        orderNo = ""; try { sessionStorage.removeItem("minise_order_no"); } catch (e) { /* ignore */ }
        bag = []; saveBag();
        phWake();
        route();
        window.scrollTo(0, 0);
      });
    }).catch(function (e) {
      CO.sending = false; btn.disabled = false; btn.textContent = t("send_order");
      var m = String(e && e.message || "");
      if (m === "code") { setCode(null); route(); showMsg(t("code_gone")); return; }
      showMsg(m === "busy" ? t("err_busy") : m === "unavailable" || m === "price_needed" ? t("err_unavailable") : m === "slip" ? t("err_slip_bad") :
        m === "phone" || m === "address" || m === "contact" || m === "name" ? t("fix_fields") : t("err_net"));
    });
  }
  function checkoutDone() {
    var d = CO.done;
    var name = "minise-receipt-" + d.id + ".png";
    return '<section class="wrap co-done"><div class="done-head">' + '<span class="done-duo">' + kitty("yay", "done-kitty") + kitty("peniYay", "done-kitty") + "</span>" + '<p class="eyebrow">' + esc(t("co_eyebrow_done")) + "</p><h1>" + esc(t("done_h")) + "</h1>" +
      '<p class="lead">' + esc(t("done_p", { no: d.id, via: t("via_" + d.via) })) + "</p></div>" +
      '<div class="done-grid"><div class="rc-out"><img src="' + d.receipt + '" alt="' + esc(t("rc_title") + " " + d.id) + '">' +
      '<a class="btn wide" href="' + d.receipt + '" download="' + esc(name) + '">' + esc(t("rc_download")) + "</a><p class=\"hint\">" + esc(t("rc_saved_hint")) + "</p></div>" +
      '<div class="done-side"><div class="panel">' + (d.photosFailed ? '<p class="notice warn">' + esc(t("photos_failed")) + "</p>" : "") + '<p>' + esc(t("rc_show")) + '</p><a class="btn ghost wide" href="' + esc(waLink(orderMessage(d))) + '" target="_blank" rel="noopener">' + esc(t("done_wa")) + "</a>" +
      '<button class="btn wide" type="button" id="rcNew">' + esc(t("rc_new")) + "</button></div></div></div></section>";
  }
  function orderMessage(d) {
    if (lang === "zh") return inLang("en", function () { return orderMessage(d); });
    var lines = [t("msg_hello")];
    if (!d.unpaid) lines.push(t("rc_no") + ": " + d.id);
    d.bag.forEach(function (it, i) {
      var p = bySlug[it.s]; if (!p) return;
      var u = unitPrice(p, it.opt, it.addN || 0, it.parts), det = lineDetails(p, it);
      lines.push((i + 1) + ". " + p.n + " × " + it.qty + (det.length ? " (" + det.join(", ") + ")" : "") + " — " + (u == null ? t("msg_confirm") : money(u * it.qty)));
    });
    if (d.unpaid) return lines.join("\n");
    if (d.discount) lines.push(t("rc_discount") + " (" + d.code + " −" + d.pct + "%): −" + money(d.discount));
    lines.push(t("rc_paid") + ": " + money(d.total), t("msg_paid"), "", t("name") + ": " + d.name, t("phone") + ": " + d.phone, t("delivery") + ": " + (d.wa || d).delivery + ((d.wa || d).address ? " — " + (d.wa || d).address : ""));
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
    // the receipt is lettered like the shop: Patrick Hand, Lao in Noto Sans Lao, Chinese in Noto Sans SC
    var serif = '"Patrick Hand", "Noto Sans Lao", "Noto Sans SC", "PingFang SC", sans-serif', sans = serif;
    var W = 1080, P = 80, inner = W - P * 2;
    var ink = "#24396a", soft = "#51618a", line = "rgba(36, 57, 106, 0.3)", sky = "#e1e9f2";
    var info = [
      [t("rc_no"), d.id],
      [t("rc_date"), new Date().toLocaleString(lang === "lo" ? "lo-LA" : lang === "zh" ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" })],
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
        var p = bySlug[it.s], u = unitPrice(p, it.opt, it.addN || 0, it.parts);
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
      H += 140 + (d.discount ? 54 : 0) + (slipImg ? slipH + 90 : 0) + foot.length * 34 + 110;

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
      if (d.discount) {
        x.font = "400 28px " + sans; x.fillStyle = soft;
        x.fillText(t("rc_discount") + " · " + d.code + " (−" + d.pct + "%)", P, y + 6);
        x.textAlign = "right"; x.fillText("−" + money(d.discount), W - P, y + 6); x.textAlign = "left";
        y += 54;
      }
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
      '<div class="story-pics">' + kitty("heart", "pics-kitty") + kitty("peniHeart", "pics-kitty pics-kitty2") + P.slice().sort(bestOrder).slice(0, 2).map(function (p) { return img(p.img[0], p.n); }).join("") + "</div></section>" +
      '<section class="section tight"><div class="wrap">' + filmHTML() + "</div></section>" +
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
    return '<section class="wrap page-head kittied">' + kitty("peniMilk", "head-kitty") + '<p class="eyebrow">' + esc(t("visit_eyebrow")) + "</p><h1>" + esc(t("visit_h")) + "</h1></section>" +
      '<section class="section tight"><div class="wrap">' + visitHTML() + "</div></section>";
  }

  // privacy policy and terms: a heading and short sections, all in the three languages
  function legalPage(key, n, pose) {
    var out = '<section class="wrap page-head kittied">' + kitty(pose, "head-kitty") + "<h1>" + esc(t(key + "_h")) + '</h1><p class="lead">' + esc(t(key + "_lead")) + "</p></section>" +
      '<section class="section tight"><div class="wrap legal">';
    for (var i = 1; i <= n; i++) out += "<section><h2>" + esc(t(key + "_" + i + "h")) + "</h2><p>" + esc(t(key + "_" + i)) + "</p></section>";
    return out + "</div></section>";
  }
  /* Meet Mumi and Meet Peni: each cat has the same kind of page. Tap the cat for a pet, pick what it does next,
     read its staff card and its day, see its favourite pieces, and visit its friend. Pet counts stay on this device. */
  var CATS = {
    mumi: {
      names: ["Mumi", "ມູມີ", "姆咪"], friend: "peni", acts: ["wave", "drink", "shark", "paint", "yay", "sleep"], love: "heart", photo: "drink", paw: "paw", sec: "sparkle", end: "box",
      day: [["8:00", "drink"], ["9:30", "phone"], ["11:00", "search"], ["14:00", "gift"], ["17:00", "swim"], ["21:00", "sharkSleep"]],
      favs: function (p) { return p.t.indexOf("locket") > -1; }, favLink: "#shop-locket", favPose: "heart", ctaHref: "#shop",
      friendPics: ["peniWave", "peniSleep"],
      k: { eyebrow: "mumi_eyebrow", h: "mumi_h", lead: "mumi_lead", cta: "mumi_cta", pet: "mumi_pet_label", pick: "mumi_pick", act: "mo_", say: "ms_", pp: "mp_", love: "mp_love",
        idH: "idc_h", idP: "idc_p", no: "mid_no", val: "mid_", dayE: "day_eyebrow", day: "md_", favE: "fav_eyebrow", favH: "fav_h", findH: "find_h", findP: "find_p",
        frE: "peni_eyebrow", frH: "peni_h", frP: "peni_p", frF: ["peni_f1", "peni_f2", "peni_f3"], frGo: "peni_visit" }
    },
    peni: {
      names: ["Peni", "ເປນີ", "佩妮"], friend: "mumi", acts: ["peniWave", "peniMilk", "peniBunny", "peniYarn", "peniYay", "peniSleep"], love: "peniHeart", photo: "peniMilk", paw: "peniPaw", sec: "peniSparkle", end: "peniBox",
      day: [["7:30", "peniSleep"], ["9:00", "peniMilk"], ["10:30", "peniSearch"], ["13:00", "peniYarn"], ["15:00", "peniGift"], ["18:00", "peniBunny"]],
      favs: function (p) { return p.g.indexOf("clover") > -1; }, favLink: "#c-clover", favPose: "peniHeart", ctaHref: "#make",
      friendPics: ["wave", "sharkSleep"],
      k: { eyebrow: "pni_eyebrow", h: "pni_h", lead: "pni_lead", cta: "pni_cta", pet: "pni_pet_label", pick: "mumi_pick", act: "po_", say: "ps_", pp: "pp_", love: "pp_love",
        idH: "pid_h", idP: "pid_p", no: "pid_no", val: "pid_", dayE: "pday_eyebrow", day: "pd_", favE: "pfav_eyebrow", favH: "pfav_h", findH: "pfind_h", findP: "pfind_p",
        frE: "mfr_eyebrow", frH: "mfr_h", frP: "mfr_p", frF: ["mfr_f1", "mfr_f2", "mfr_f3"], frGo: "mumi_visit" }
    }
  };
  var CP = { who: "mumi", line: 0, pose: { mumi: "wave", peni: "peniWave" }, pets: { mumi: 0, peni: 0 } };
  ["mumi", "peni"].forEach(function (c) { try { CP.pets[c] = parseInt(localStorage.getItem("minise_" + c + "_pets"), 10) || 0; } catch (e) { /* ignore */ } });
  function namePills(c) { var n = CATS[c].names; return '<p class="mumi-names"><span>' + n[0] + '</span><span lang="lo">' + n[1] + '</span><span lang="zh-CN">' + n[2] + "</span></p>"; }
  function catPage(c) {
    var cat = CATS[c], k = cat.k, fr = CATS[cat.friend], C = window.MINISE_CAT || function () { return ""; };
    CP.who = c;
    var pose = CP.pose[c];
    var acts = cat.acts.map(function (p) {
      return '<button type="button" data-cat-do="' + p + '" aria-pressed="' + (pose === p) + '"><span class="mo-kitty">' + C(p) + "</span><span>" + esc(t(k.act + p)) + "</span></button>";
    }).join("");
    var rows = ["name", "job", "home", "drink", "piece", "hobby", "secret"].map(function (r) {
      return "<div><dt>" + esc(t("mid_" + r + "_k")) + "</dt><dd>" + esc(t(k.val + r)) + "</dd></div>";
    }).join("");
    var day = cat.day.map(function (d, i) {
      return '<li><span class="md-time tn">' + d[0] + "</span>" + kitty(d[1], "md-kitty") + "<p>" + esc(t(k.day + (i + 1))) + "</p></li>";
    }).join("");
    var favs = P.filter(cat.favs).sort(bestOrder).slice(0, 4).map(card).join("");
    return '<section class="mumi-hero"><div class="wrap mumi-grid">' +
      '<div class="mumi-copy"><p class="eyebrow">' + esc(t(k.eyebrow)) + "</p><h1>" + esc(t(k.h)) + "</h1>" + namePills(c) +
      '<p class="lead">' + esc(t(k.lead)) + "</p>" +
      '<div class="hero-actions"><a class="btn solid" href="' + cat.ctaHref + '">' + esc(t(k.cta)) + '</a><a class="btn ghost" href="#' + cat.friend + '">' + esc(t(k.frGo)) + "</a></div></div>" +
      '<div class="mumi-play"><div class="mumi-stage">' +
      '<p class="mumi-says" id="catSays" role="status">' + esc(t(k.say + pose)) + "</p>" +
      '<div class="mumi-window"><button class="mumi-pet" id="catPet" type="button" aria-label="' + esc(t(k.pet)) + '"><span class="mumi-fig" id="catFig">' + C(pose) + "</span></button></div>" +
      '<p class="mumi-cap"><span>' + esc(t("mumi_tap")) + '</span><span class="tn" id="catCount">' + esc(t("mumi_pets").replace("{n}", CP.pets[c])) + "</span></p></div>" +
      '<div class="mumi-acts"><p id="catPick">' + esc(t(k.pick)) + '</p><div class="mumi-btns" role="group" aria-labelledby="catPick">' + acts + "</div></div></div></div></section>" +
      '<section class="section band"><div class="wrap mumi-id-grid">' +
      '<div class="mumi-id-copy"><p class="eyebrow">' + esc(t("idc_eyebrow")) + "</p><h2>" + esc(t(k.idH)) + '</h2><p class="lead">' + esc(t(k.idP)) + "</p></div>" +
      '<div class="mumi-id-hold"><div class="mumi-id"><div class="mid-top"><span>Minise Arte</span><span>' + esc(t("idc_eyebrow")) + "</span></div>" +
      '<div class="mid-body"><div class="mid-photo"><div class="ph">' + C(cat.photo) + '</div><b class="tn">' + esc(t(k.no)) + "</b></div>" +
      '<dl class="mid-list">' + rows + "</dl></div>" +
      '<div class="mid-foot"><span>' + esc(t("mid_sign")) + "</span>" + kitty(cat.paw, "mid-paw") + "</div></div></div></div></section>" +
      '<section class="section"><div class="wrap">' + head(t(k.dayE), t("day_h"), "", "", "", cat.sec) + '<ol class="mumi-day">' + day + "</ol></div></section>" +
      '<section class="section band"><div class="wrap peni-grid"><div class="peni-pic">' + kitty(cat.friendPics[0], "peni-kitty") + kitty(cat.friendPics[1], "peni-kitty2") + "</div>" +
      '<div class="peni-copy"><p class="eyebrow">' + esc(t(k.frE)) + "</p><h2>" + esc(t(k.frH)) + "</h2>" + namePills(cat.friend) +
      '<p class="lead">' + esc(t(k.frP)) + '</p><ul class="ticks">' + k.frF.map(function (f) { return "<li>" + ICON.tick + "<span>" + esc(t(f)) + "</span></li>"; }).join("") + "</ul>" +
      '<div><a class="btn" href="#' + cat.friend + '">' + esc(t(k.frGo)) + " →</a></div></div></div></section>" +
      '<section class="section"><div class="wrap">' + storyHTML() + "</div></section>" +
      (c === "peni" ? '<section class="section tight"><div class="wrap">' + fortuneHTML() + "</div></section>" : "") +
      (favs ? '<section class="section tight band"><div class="wrap">' + head(t(k.favE), t(k.favH), cat.favLink, t("view_all"), "", cat.favPose) + '<div class="grid">' + favs + "</div></div></section>" : "") +
      '<section class="mumi-end"><div class="wrap"><div class="mumi-end-card">' + kitty(cat.end, "end-kitty") + "<h2>" + esc(t(k.findH)) + "</h2><p>" + esc(t(k.findP)) + '</p><a class="btn solid" href="' + cat.ctaHref + '">' + esc(t(k.cta)) + "</a></div></div></section>";
  }
  function catSay(text) {
    var s = document.getElementById("catSays");
    if (!s) return;
    s.textContent = text;
    s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop");
  }
  function catHop(fig) { if (calm) return; fig.classList.remove("jump"); void fig.offsetWidth; fig.classList.add("jump"); }
  var HEART = '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20.5C5.5 16 1.5 12.2 1.5 7.6 1.5 4.3 4 2 7 2c2 0 3.8 1.1 5 2.9C13.2 3.1 15 2 17 2c3 0 5.5 2.3 5.5 5.6 0 4.6-4 8.4-10.5 12.9Z" fill="#ec9aa9" stroke="#24396a" stroke-width="2" stroke-linejoin="round"/></svg>';
  function catPet() {
    var fig = document.getElementById("catFig"), c = CP.who, cat = CATS[c];
    if (!fig) return;
    CP.pets[c]++;
    try { localStorage.setItem("minise_" + c + "_pets", String(CP.pets[c])); } catch (e) { /* ignore */ }
    // every tenth pet the cat hugs a heart locket
    var love = CP.pets[c] % 10 === 0;
    catSay(t(love ? cat.k.love : cat.k.pp + (CP.line++ % 4 + 1)));
    document.getElementById("catCount").textContent = t("mumi_pets").replace("{n}", CP.pets[c]);
    if (love && window.MINISE_CAT) {
      fig.innerHTML = window.MINISE_CAT(cat.love);
      clearTimeout(catPet._t);
      catPet._t = setTimeout(function () { var f = document.getElementById("catFig"); if (f) f.innerHTML = window.MINISE_CAT(CP.pose[CP.who]); }, 2400);
    }
    catHop(fig);
    if (calm) return;
    var stage = fig.closest(".mumi-stage");
    for (var i = 0; i < (love ? 8 : 3); i++) {
      var h = document.createElement("span");
      h.className = "mumi-heart";
      h.innerHTML = HEART;
      h.style.setProperty("--x", Math.round(Math.random() * 160 - 80) + "px");
      h.style.setProperty("--r", Math.round(Math.random() * 50 - 25) + "deg");
      h.style.animationDelay = i * 90 + "ms";
      h.addEventListener("animationend", function () { this.remove(); });
      stage.appendChild(h);
    }
  }
  function catDo(pose) {
    var fig = document.getElementById("catFig"), cat = CATS[CP.who];
    if (!fig || !window.MINISE_CAT || cat.acts.indexOf(pose) < 0) return;
    clearTimeout(catPet._t);
    CP.pose[CP.who] = pose;
    fig.innerHTML = window.MINISE_CAT(pose);
    document.querySelectorAll("[data-cat-do]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cat-do") === pose)); });
    catSay(t(cat.k.say + pose));
    catHop(fig);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("#catPet")) { catPet(); return; }
    var b = e.target.closest("[data-cat-do]");
    if (b) catDo(b.getAttribute("data-cat-do"));
  });

  /* Mumi & Peni stories: short four-panel comics, one episode at a time */
  var EPISODES = [
    [[["drink"], ["peniSleep", "pn-small"]], "mumi", "st_1"], [[["peni", "pn-big"], ["@A1"]], "peni", "st_2"], [[["paint"], ["peniBracelet"]], "mumi", "st_3"], [[["gift"], ["peniWave"]], "peni", "st_4"],
    [[["shark"]], "mumi", "ep2_1"], [[["peniBunny"]], "peni", "ep2_2"], [[["sharkPeek"], ["peniHop"]], "mumi", "ep2_3"], [[["sharkSleep"], ["peniBunnySleep"]], "peni", "ep2_4"],
    [[["phone"]], "mumi", "ep3_1"], [[["peniSearch"]], "peni", "ep3_2"], [[["paint"], ["peniHeart"]], "mumi", "ep3_3"], [[["gift"], ["peniYay"]], "peni", "ep3_4"],
    [[["search"]], "mumi", "ep4_1"], [[["peniBox", "pn-big"]], "peni", "ep4_2"], [[["heart"], ["@A17"], ["@C23"]], "mumi", "ep4_3"], [[["peniWave"], ["drink"]], "peni", "ep4_4"]
  ];
  var EP = { n: 0 };
  function storyPanels() {
    return EPISODES.slice(EP.n * 4, EP.n * 4 + 4).map(function (p, i) {
      var pics = p[0].map(function (x) {
        if (x[0].charAt(0) === "@") return '<span class="pn-clover">' + charmImg(x[0].slice(1)) + "</span>";
        return kitty(x[0], "pn-k" + (x[1] ? " " + x[1] : "") + (p[0].length === 1 ? " pn-solo" : ""));
      }).join("");
      return '<li><span class="pn-num tn">' + (i + 1) + '</span><div class="pn-pic">' + pics + '</div><p class="pn-say"><b>' + esc(t(p[1] === "mumi" ? "mid_name" : "peni_name")) + "</b>" + esc(t(p[2])) + "</p></li>";
    }).join("");
  }
  function storyHTML() {
    var tabs = [0, 1, 2, 3].map(function (n) {
      return '<button type="button" class="ep-tab" data-ep="' + n + '" aria-pressed="' + (EP.n === n) + '"><span class="tn">' + esc(t("ep_n", { n: n + 1 })) + "</span>" + esc(t("ep" + (n + 1) + "_t")) + "</button>";
    }).join("");
    return '<div class="stories"><div class="ep-head"><p class="eyebrow">' + esc(t("ep_eyebrow")) + '</p><div class="ep-tabs" role="group" aria-label="' + esc(t("ep_eyebrow")) + '">' + tabs + "</div></div>" +
      '<ol class="duo-story" id="duoStory">' + storyPanels() + "</ol></div>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ep]");
    if (!b) return;
    EP.n = +b.getAttribute("data-ep");
    document.querySelectorAll("[data-ep]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    var box = document.getElementById("duoStory");
    if (box) { box.innerHTML = storyPanels(); pageIn(box); }
  });

  /* Peni's charm of the day: the same charm and wish for everyone today (Vientiane time), a new one tomorrow */
  var LUCKY = ["A1", "A5", "A7", "A9", "A11", "A16", "A22", "A24", "B4", "B20", "B23", "C12", "C13", "C16", "C17", "C18", "C25", "C27", "C33", "C37", "C38", "A3", "B2", "C36"];
  function fortuneToday() {
    var day = Math.floor((Date.now() + 7 * 3600000) / 86400000);
    var list = LUCKY.filter(function (c) { return CH_BY[c]; });
    return { code: list[day % list.length], wish: "ft_" + ((day * 7) % 12 + 1) };
  }
  function fortuneHTML() {
    var f = fortuneToday();
    if (!f.code) return "";
    return '<div class="fortune">' + kitty("peniSparkle", "fortune-kitty") + '<div class="fortune-copy"><p class="eyebrow">' + esc(t("ft_eyebrow")) + "</p><h3>" + esc(charmName(f.code)) + " <small class=\"tn\">" + f.code + "</small></h3>" +
      "<p>“" + esc(t(f.wish)) + "”</p>" + '<button class="btn solid" type="button" data-lucky="' + f.code + '">' + esc(t("ft_use")) + "</button></div>" +
      '<span class="fortune-charm">' + charmImg(f.code) + "</span></div>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lucky]");
    if (!b) return;
    var code = b.getAttribute("data-lucky");
    if (MK.ch.indexOf(code) < 0) { if (MK.ch.length >= MYO_MAX) MK.ch.pop(); MK.ch.push(code); }
    MK.say = t("pn_lucky", { n: charmName(code) });
    mkSave();
    location.hash = "#make";
  });

  /* Make your own bracelet: a coloured letter disc on a steel chain, plus up to MYO_MAX charms from the trays (js/charms.js).
     It is one product in the catalogue, so its price (the bracelet, and each charm as the add-on) is edited in the admin
     and checked again by the database when the order is sent. */
  var MYO = "make-your-own-bracelet", MYO_MAX = 3, MYO_BASE = 225000, MYO_CHARM = 30000;
  // enamel colours: [name, colour, dark (the silver letter then shows light)]
  var MYO_COLS = [["pink", "#f4bccb", 0], ["hotpink", "#e7739f", 0], ["red", "#c83a3f", 1], ["yellow", "#f3d873", 0], ["mint", "#a3dcc9", 0], ["green", "#4f9a72", 1],
    ["sky", "#a9cdea", 0], ["navy", "#33467e", 1], ["lilac", "#cdb6e3", 0], ["purple", "#8d63b5", 1], ["white", "#f5f3ee", 0], ["black", "#2a2a30", 1]];
  var MYO_SHAPES = ["circle", "heart"];
  var CH = window.MINISE_CHARMS || { trays: [], list: [] }, CH_BY = {}, TRAY_BY = {};
  CH.trays.forEach(function (tr) { TRAY_BY[tr.id] = tr; });
  var CH_IDX = {};
  CH.list.forEach(function (c) {
    CH_BY[c[0]] = c;
    var tr = TRAY_BY[c[0].charAt(0).toLowerCase()];
    if (tr) { tr.n = tr.n || 0; CH_IDX[c[0]] = tr.n++; }
  });
  var MK = { shape: "circle", col: "pink", ini: "", ch: [], tray: "a", note: "", say: "" };
  try {
    var mk0 = JSON.parse(sessionStorage.getItem("minise_make") || "null");
    if (mk0) {
      if (MYO_SHAPES.indexOf(mk0.shape) > -1) MK.shape = mk0.shape;
      if (MYO_COLS.some(function (c) { return c[0] === mk0.col; })) MK.col = mk0.col;
      if (/^[A-Z]$/.test(mk0.ini || "")) MK.ini = mk0.ini;
      MK.ch = (mk0.ch || []).filter(function (c) { return CH_BY[c]; }).slice(0, MYO_MAX);
      if (TRAY_BY[mk0.tray]) MK.tray = mk0.tray;
      MK.note = String(mk0.note || "").slice(0, 300);
    }
  } catch (e) { /* start fresh */ }
  function mkSave() { try { sessionStorage.setItem("minise_make", JSON.stringify({ shape: MK.shape, col: MK.col, ini: MK.ini, ch: MK.ch, tray: MK.tray, note: MK.note })); } catch (e) { /* ignore */ } }
  function charmName(code) { var c = CH_BY[code]; return c ? c[4 + LI[lang]] : code; }
  // the charm's studio picture (cut out, on white), or a square cut of the tray photo
  function charmStyle(code) {
    var c = CH_BY[code], tr = c && TRAY_BY[c[0].charAt(0).toLowerCase()];
    if (!tr) return "";
    if (tr.studio) {
      var i = CH_IDX[code], cols = tr.cols, rows = Math.ceil(tr.n / cols), col = i % cols, row = Math.floor(i / cols);
      return "background-image:url(" + tr.studio + ");background-size:" + cols * 100 + "% auto;background-position:" + (col / (cols - 1) * 100).toFixed(2) + "% " + (rows > 1 ? (row / (rows - 1) * 100).toFixed(2) : 0) + "%";
    }
    var sz = c[3], l = Math.max(0, Math.min(tr.w - sz, c[1] - sz / 2)), tp = Math.max(0, Math.min(tr.h - sz, c[2] - sz / 2));
    return "background-image:url(" + tr.img + ");background-size:" + (tr.w / sz * 100).toFixed(2) + "% auto;background-position:" + (l / (tr.w - sz) * 100).toFixed(2) + "% " + (tp / (tr.h - sz) * 100).toFixed(2) + "%";
  }
  function charmImg(code, cls) { return '<span class="' + (cls || "ch-img") + '" style="' + charmStyle(code) + '"></span>'; }
  // the price comes from the catalogue; until the product is in the online catalogue, orders go by WhatsApp
  function myoPrices() {
    var p = bySlug[MYO];
    var live = !!(p && p.o.length && p.add && !p.so);
    return { base: live ? p.o[0].price : MYO_BASE, charm: live ? p.add.price : MYO_CHARM, live: live };
  }
  function myoTotal() { var pr = myoPrices(); return pr.base + MK.ch.length * pr.charm; }
  // the initial charm, drawn around (0,0): a silver frame filled with coloured enamel, the letter in silver
  var HEART = "M0 27 C-16 16 -33 3 -33 -11 C-33 -23 -24 -31 -14 -31 C-7 -31 -2 -27 0 -22 C2 -27 7 -31 14 -31 C24 -31 33 -23 33 -11 C33 3 16 16 0 27 Z";
  function charmShape(shape, col, letter) {
    var shine = col[2] ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.55)";
    var body = shape === "heart"
      ? '<path d="' + HEART + '" fill="' + col[1] + '" stroke="#b3b9c4" stroke-width="6" stroke-linejoin="round"/><path d="' + HEART + '" transform="translate(0 -1) scale(.7)" fill="none" stroke="' + shine + '" stroke-width="3"/>'
      : '<circle r="30" fill="' + col[1] + '" stroke="#b3b9c4" stroke-width="6"/><circle r="22" fill="none" stroke="' + shine + '" stroke-width="2"/>';
    return body + (letter == null ? "" : '<text y="' + (shape === "heart" ? 6 : 11) + '" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="' + (shape === "heart" ? 26 : 31) + '" fill="' + (col[2] ? "#e3e6ec" : "#6c717d") + '">' + esc(letter) + "</text>");
  }
  function mkShapesHTML() {
    return MYO_SHAPES.map(function (sh) {
      return '<label class="mk-shape"><input type="radio" name="mkShape" value="' + sh + '"' + (MK.shape === sh ? " checked" : "") + '><svg viewBox="-40 -38 80 76" aria-hidden="true">' + charmShape(sh, myoColour(), MK.ini || "A") + "</svg><span>" + esc(t("sh_" + sh)) + "</span></label>";
    }).join("");
  }
  function mkSwsHTML() {
    return MYO_COLS.map(function (c) {
      return '<label class="mk-sw"><input type="radio" name="mkCol" value="' + c[0] + '"' + (MK.col === c[0] ? " checked" : "") + '><svg class="dot" viewBox="-37 -37 74 74" aria-hidden="true">' + charmShape(MK.shape, c, null) + "</svg><span>" + esc(t("bc_" + c[0])) + "</span></label>";
    }).join("");
  }
  function myoColour() { return MYO_COLS.filter(function (c) { return c[0] === MK.col; })[0] || MYO_COLS[0]; }

  // the chain hangs in a curve; the letter disc sits at the bottom and the charms hang from it
  function chainAt(u) {
    var v = 1 - u, A = [24, 50], B = [96, 176], Cc = [264, 176], D = [336, 50];
    return [v * v * v * A[0] + 3 * v * v * u * B[0] + 3 * v * u * u * Cc[0] + u * u * u * D[0], v * v * v * A[1] + 3 * v * v * u * B[1] + 3 * v * u * u * Cc[1] + u * u * u * D[1]];
  }
  var MK_SLOTS = [0.67, 0.33, 0.83];
  function mkPreview() {
    var col = myoColour(), mid = chainAt(0.5);
    var rings = "", hang = "";
    MK.ch.forEach(function (code, i) {
      var pt = chainAt(MK_SLOTS[i]);
      rings += '<path d="M' + pt[0].toFixed(1) + " " + pt[1].toFixed(1) + " l0 12\" stroke=\"#8a93a3\" stroke-width=\"3\"/><circle cx=\"" + pt[0].toFixed(1) + '" cy="' + pt[1].toFixed(1) + '" r="4.5" fill="none" stroke="#8a93a3" stroke-width="2.5"/>';
      hang += '<span class="mk-hang" style="left:' + (pt[0] / 360 * 100).toFixed(2) + "%;top:" + ((pt[1] + 1) / 230 * 100).toFixed(2) + '%">' + charmImg(code) + "</span>";
    });
    var chain = "M24 50 C96 176 264 176 336 50";
    return '<svg class="mk-chain" viewBox="0 0 360 230" aria-hidden="true">' +
      '<path d="' + chain + '" fill="none" stroke="#7d8696" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="' + chain + '" fill="none" stroke="#e3e7ee" stroke-width="4" stroke-dasharray="5 3"/>' +
      '<circle cx="24" cy="50" r="8" fill="#e3e7ee" stroke="#7d8696" stroke-width="3"/><circle cx="336" cy="50" r="8" fill="#e3e7ee" stroke="#7d8696" stroke-width="3"/>' + rings +
      '<g transform="translate(' + mid[0].toFixed(1) + " " + mid[1].toFixed(1) + ')">' + charmShape(MK.shape, col, MK.ini || "?") + "</g></svg>" + hang;
  }
  function mkDetails() {
    var d = [t("shape") + ": " + t("sh_" + MK.shape), t("colour") + ": " + t("bc_" + MK.col), t("letter") + ": " + (MK.ini || "?")];
    MK.ch.forEach(function (c) { d.push(t("charm") + " " + c + ": " + charmName(c)); });
    if (MK.note.trim()) d.push("“" + MK.note.trim() + "”");
    return d;
  }
  function mkSummary() {
    var pr = myoPrices(), n = MK.ch.length;
    var names = n ? MK.ch.map(function (c) { return '<li>' + charmImg(c, "ch-dot") + "<span>" + esc(charmName(c)) + ' <small class="tn">' + c + "</small></span></li>"; }).join("") : '<li class="none">' + esc(t("mk_none")) + "</li>";
    var btn = pr.live ? '<button class="btn solid wide" type="button" data-mk-add>' + esc(t("add")) + "</button>"
      : '<a class="btn solid wide" id="mkWa" target="_blank" rel="noopener" href="' + esc(mkWaLink()) + '">' + esc(t("mk_wa")) + "</a>";
    return '<h2 class="mk-sum-h">' + esc(t("mk_yours")) + "</h2>" +
      '<dl class="mk-dl"><div><dt>' + esc(t("shape")) + "</dt><dd>" + esc(t("sh_" + MK.shape)) + "</dd></div><div><dt>" + esc(t("colour")) + '</dt><dd><svg class="mk-swatch" viewBox="-37 -37 74 74" aria-hidden="true">' + charmShape(MK.shape, myoColour(), null) + "</svg>" + esc(t("bc_" + MK.col)) + "</dd></div>" +
      "<div><dt>" + esc(t("letter")) + "</dt><dd>" + esc(MK.ini || "—") + "</dd></div></dl>" +
      '<ul class="mk-picked">' + names + "</ul>" +
      '<div class="mk-money tn"><p><span>' + esc(t("mk_bracelet")) + "</span><b>" + esc(money(pr.base)) + "</b></p>" +
      "<p><span>" + esc(t("charms")) + " × " + n + "</span><b>" + esc(money(n * pr.charm)) + "</b></p>" +
      '<p class="grand"><span>' + esc(t("total")) + "</span><b>" + esc(money(myoTotal())) + "</b></p></div>" + btn;
  }
  function mkWaLink() {
    var d = inLang(shopLang(), function () { return mkDetails(); });
    return waLink(tw("mk_msg") + "\n" + d.join("\n") + "\n" + inLang(shopLang(), function () { return t("total"); }) + ": " + money(myoTotal()));
  }
  function charmGrid() {
    var full = MK.ch.length >= MYO_MAX;
    return CH.list.filter(function (c) { return c[0].charAt(0).toLowerCase() === MK.tray; }).map(function (c) {
      var on = MK.ch.indexOf(c[0]) > -1;
      return '<button type="button" class="mk-ch" data-mk-ch="' + c[0] + '" aria-pressed="' + on + '"' + (full && !on ? ' aria-disabled="true"' : "") + ">" +
        charmImg(c[0]) + '<span class="ch-name">' + esc(charmName(c[0])) + '</span><span class="ch-code tn">' + c[0] + "</span></button>";
    }).join("");
  }
  function makePage() {
    var pr = myoPrices();
    if (!MK.say) MK.say = t("pn_hi");
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function (L) {
      return '<label class="mk-l"><input type="radio" name="mkIni" value="' + L + '"' + (MK.ini === L ? " checked" : "") + "><span>" + L + "</span></label>";
    }).join("");
    var tabs = CH.trays.map(function (tr) {
      var n = CH.list.filter(function (c) { return c[0].charAt(0).toLowerCase() === tr.id; }).length;
      return '<button type="button" class="mk-tab" data-mk-tray="' + tr.id + '" aria-pressed="' + (MK.tray === tr.id) + '">' + esc(tr.name[LI[lang]]) + ' <span class="tn">' + n + "</span></button>";
    }).join("");
    return '<section class="wrap page-head kittied">' + kitty("peniBracelet", "head-kitty") + '<p class="eyebrow">' + esc(t("mk_eyebrow")) + "</p><h1>" + esc(t("mk_h")) + '</h1><p class="lead">' + esc(t("mk_lead")) + "</p>" +
      '<p class="mk-price tn">' + esc(t("mk_price", { p: money(pr.base), c: money(pr.charm) })) + "</p></section>" +
      '<section class="section tight mk-sec"><div class="wrap mk-grid">' +
      '<div class="mk-side"><div class="mk-card"><div class="mk-stage" id="mkStage">' + mkPreview() + "</div>" +
      '<div class="mk-peni">' + kitty("peni", "mk-peni-kitty") + '<p class="mk-say" id="mkSay" role="status">' + esc(MK.say) + "</p></div></div>" +
      '<div class="mk-sum" id="mkSum">' + mkSummary() + "</div></div>" +
      '<form class="mk-steps" id="mkForm" novalidate>' +
      '<fieldset class="mk-step"><legend><span class="num">1</span>' + esc(t("mk_s0")) + '</legend><div class="mk-shapes" id="mkShapes">' + mkShapesHTML() + "</div></fieldset>" +
      '<fieldset class="mk-step"><legend><span class="num">2</span>' + esc(t("mk_s1")) + '</legend><div class="mk-sws" id="mkSws">' + mkSwsHTML() + "</div></fieldset>" +
      '<fieldset class="mk-step"><legend><span class="num">3</span>' + esc(t("mk_s2")) + '</legend><div class="mk-ls">' + letters + '</div><p class="err" id="mkIniErr" hidden>' + esc(t("mk_pick_letter")) + "</p></fieldset>" +
      '<fieldset class="mk-step"><legend><span class="num">4</span>' + esc(t("mk_s3")) + '</legend><p class="hint">' + esc(t("mk_s3_hint", { n: MYO_MAX, c: money(pr.charm) })) + "</p>" +
      '<div class="mk-tabs">' + tabs + '</div><p class="mk-count tn" id="mkCount">' + esc(t("mk_count", { n: MK.ch.length, max: MYO_MAX })) + '</p><div class="mk-chs" id="mkChs">' + charmGrid() + "</div></fieldset>" +
      '<fieldset class="mk-step"><legend><span class="num">5</span>' + esc(t("mk_s4")) + '</legend><textarea id="mkNote" maxlength="300" placeholder="' + esc(t("mk_note_ph")) + '">' + esc(MK.note) + "</textarea>" +
      '<p class="hint">' + esc(t("mk_care")) + "</p></fieldset></form></div></section>" +
      '<div class="mk-bar" id="mkBar"></div>';
  }
  function mkBar() {
    var b = document.getElementById("mkBar");
    if (!b) return;
    var pr = myoPrices();
    b.innerHTML = '<div><small>' + esc(t("total")) + " · " + esc(t("mk_count", { n: MK.ch.length, max: MYO_MAX })) + '</small><b class="tn">' + esc(money(myoTotal())) + "</b></div>" +
      (pr.live ? '<button class="btn solid" type="button" data-mk-add>' + esc(t("add")) + "</button>" : '<a class="btn solid" target="_blank" rel="noopener" href="' + esc(mkWaLink()) + '">WhatsApp</a>');
  }
  function mkSay(text) {
    MK.say = text;
    var el = document.getElementById("mkSay");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function mkUpdate() {
    mkSave();
    var st = document.getElementById("mkStage");
    if (!st) return;
    st.innerHTML = mkPreview();
    document.getElementById("mkSum").innerHTML = mkSummary();
    document.getElementById("mkChs").innerHTML = charmGrid();
    document.getElementById("mkCount").textContent = t("mk_count", { n: MK.ch.length, max: MYO_MAX });
    mkBar();
  }
  function mkAdd() {
    if (!MK.ini) {
      var er = document.getElementById("mkIniErr");
      er.hidden = false;
      er.closest(".mk-step").scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
      mkSay(t("mk_pick_letter"));
      return;
    }
    if (!myoPrices().live) return;
    bag.push({ s: MYO, opt: 0, addN: MK.ch.length, qty: 1, shape: MK.shape, col: "bc_" + MK.col, ini: MK.ini, ch: MK.ch.slice(), note: MK.note.trim(), myo: 1 });
    saveBag();
    toast(t("added"), "gift");
    mkSay(t("pn_added"));
    openBag();
  }
  document.addEventListener("change", function (e) {
    if (e.target.name === "mkShape") { MK.shape = e.target.value; mkSay(t("pn_shape", { s: t("sh_" + MK.shape) })); document.getElementById("mkSws").innerHTML = mkSwsHTML(); mkUpdate(); }
    else if (e.target.name === "mkCol") { MK.col = e.target.value; mkSay(t("pn_col", { c: t("bc_" + MK.col) })); document.getElementById("mkShapes").innerHTML = mkShapesHTML(); mkUpdate(); }
    else if (e.target.name === "mkIni") { MK.ini = e.target.value; document.getElementById("mkIniErr").hidden = true; document.getElementById("mkShapes").innerHTML = mkShapesHTML(); mkSay(t("pn_letter", { l: MK.ini })); mkUpdate(); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id !== "mkNote") return;
    MK.note = e.target.value;
    mkSave();
    clearTimeout(mkUpdate._t);
    mkUpdate._t = setTimeout(function () { var w = document.getElementById("mkWa"); if (w) w.href = mkWaLink(); mkBar(); }, 300);
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mk-tray]");
    if (b) {
      MK.tray = b.getAttribute("data-mk-tray");
      mkSave();
      document.querySelectorAll("[data-mk-tray]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      document.getElementById("mkChs").innerHTML = charmGrid();
      return;
    }
    b = e.target.closest("[data-mk-ch]");
    if (b) {
      var code = b.getAttribute("data-mk-ch"), i = MK.ch.indexOf(code);
      if (i > -1) MK.ch.splice(i, 1);
      else if (MK.ch.length >= MYO_MAX) { mkSay(t("mk_full")); return; }
      else { MK.ch.push(code); mkSay(t("pn_charm", { n: charmName(code) })); }
      mkUpdate();
      var again = document.querySelector('[data-mk-ch="' + code + '"]');
      if (again) again.focus({ preventScroll: true });
      return;
    }
    if (e.target.closest("[data-mk-add]")) mkAdd();
  });
  /* Italian charm bracelet (#italian): the size and silver or gold, then link by link: picture charms (heart or square,
     the first one free), laser-engraved squares, long engraved links, lockets, charms from the tray photo (js/charms.js)
     and initials that hang from the bracelet. It is one product in the catalogue; its "parts" hold the price of each kind
     of link, which the admin edits and the database checks again when the order is sent. */
  var ITB = "custom-italian-charm-bracelet";
  var IT_N = { w: 18, m: 21 }, IT_INI = 3, IT_PHOTOS = 6, IT_ENG = 12, IT_LONG = 26, IT_W = 44, IT_H = 42;
  var IT_BASE = [265000, 285000], IT_PARTS = { pic: 65000, eng: 65000, long: 70000, ini: 40000, lock: 150000, charm: 50000 };
  var IT_TABS = ["pic", "eng", "ini", "lock", "charm"];
  var IT_SCRIPT = "'Snell Roundhand', 'Apple Chancery', 'Segoe Script', 'Brush Script MT', 'Noto Sans Lao', 'Noto Sans SC', cursive";
  var ITC = window.MINISE_ITALIAN || { img: "", w: 1, h: 1, cell: 200, cols: 5, list: [] }, ITC_BY = {};
  ITC.list.forEach(function (c, i) { ITC_BY[c[0]] = { c: c, i: i }; });
  var IT = { size: "w", metal: 0, wrist: "", links: [], inis: [], note: "", tab: "pic", say: ["is_hi"], pose: "wave", last: 0, seq: 1 };
  function itClean(s, max) { return String(s || "").replace(/[“”"<>\u0000-\u001f]/g, "").slice(0, max); }
  function itOk(l) {
    return !!l && ((l.k === "pic" && (l.sh === "heart" || l.sh === "square")) || l.k === "eng" || l.k === "long" || l.k === "lock" || (l.k === "charm" && !!ITC_BY[l.c]));
  }
  try {
    var it0 = JSON.parse(sessionStorage.getItem("minise_italian") || "null");
    if (it0) {
      if (IT_N[it0.size]) IT.size = it0.size;
      IT.metal = it0.metal === 1 ? 1 : 0;
      if (/^\d{2}(\.\d)?$/.test(it0.wrist || "")) IT.wrist = it0.wrist;
      var itFree0 = false;
      IT.links = (it0.links || []).filter(itOk).slice(0, 30).map(function (l) {
        var o = { k: l.k };
        if (l.k === "pic") { o.sh = l.sh; if (l.free && !itFree0) { o.free = 1; itFree0 = true; } }
        if ((l.k === "pic" || l.k === "lock") && /^p[a-z0-9]{6,20}$/.test(l.ph || "")) o.ph = l.ph;
        if (l.k === "eng" || l.k === "long") o.txt = itClean(l.txt, l.k === "eng" ? IT_ENG : IT_LONG);
        if (l.k === "charm") o.c = l.c;
        return o;
      });
      IT.inis = (it0.inis || []).filter(function (L) { return /^[A-Z]$/.test(L); }).slice(0, IT_INI);
      IT.note = String(it0.note || "").slice(0, 300);
      if (IT_TABS.indexOf(it0.tab) > -1) IT.tab = it0.tab;
    }
  } catch (e) { /* start fresh */ }
  // the free picture charm is always on the bracelet
  if (!IT.links.some(function (l) { return l.free; })) IT.links.unshift({ k: "pic", sh: "square", free: 1 });
  IT.links.forEach(function (l) { l.id = IT.seq++; });
  function itSave() {
    try {
      sessionStorage.setItem("minise_italian", JSON.stringify({ size: IT.size, metal: IT.metal, wrist: IT.wrist, inis: IT.inis, note: IT.note, tab: IT.tab,
        links: IT.links.map(function (l) { return { k: l.k, sh: l.sh, txt: l.txt, c: l.c, free: l.free, ph: l.ph }; }) }));
    } catch (e) { /* ignore */ }
  }
  function itById(id) { return IT.links.filter(function (l) { return l.id === id; })[0]; }
  function itSlots(l) { return l.k === "long" || (l.k === "charm" && ITC_BY[l.c] && ITC_BY[l.c].c[1]) ? 2 : 1; }
  function itUsed() { return IT.links.reduce(function (s, l) { return s + itSlots(l); }, 0); }
  function itPhotoCount() { return IT.links.filter(function (l) { return l.k === "pic" || l.k === "lock"; }).length; }
  function itParts() { return IT.links.map(function (l) { return l.k; }).concat(IT.inis.map(function () { return "ini"; })); }
  function itCharmName(code) { var o = ITC_BY[code]; return o ? o.c[2 + LI[lang]] : code; }
  // the prices come from the catalogue; until the product is in the online catalogue, orders go by WhatsApp
  function itPrices() {
    var p = bySlug[ITB];
    var live = !!(p && p.o.length && p.parts && !p.so && !p.hid);
    return {
      metals: live ? p.o.map(function (o) { return [optName(o), o.price]; }) : [[t("silver"), IT_BASE[0]], [t("gold"), IT_BASE[1]]],
      parts: live ? p.parts : IT_PARTS, free: live ? +p.free_pic || 0 : 1, live: live
    };
  }
  function itTotal() {
    var pr = itPrices(), m = pr.metals[IT.metal] || pr.metals[0];
    return m[1] + partsCost(pr.parts, pr.free, itParts());
  }
  function itMetal() { return IT.metal === 1 ? "g" : "s"; }

  // shared gradients and clip shapes for every link drawn on the page (each link is drawn around 0,0)
  function itDefs() {
    var grad = function (id, a, b, c, d) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset=".46" stop-color="' + b + '"/><stop offset=".56" stop-color="' + c + '"/><stop offset="1" stop-color="' + d + '"/></linearGradient>'; };
    var dome = function (id, a, b, c) { return '<radialGradient id="' + id + '" cx=".38" cy=".32" r=".78"><stop offset="0" stop-color="' + a + '"/><stop offset=".5" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; };
    return '<svg class="it-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      grad("itMs", "#fbfcfd", "#d4d9e0", "#bec5ce", "#eef1f4") + grad("itMg", "#fff2c2", "#e4bf64", "#cfa143", "#f7de94") +
      dome("itDs", "#ffffff", "#d7dbe1", "#959daa") + dome("itDg", "#fff6d4", "#e3bd60", "#a77d28") +
      '<linearGradient id="itPh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3d4e9"/><stop offset="1" stop-color="#f3d8cf"/></linearGradient>' +
      '<clipPath id="itCSq"><rect x="-14.5" y="-13.5" width="29" height="27" rx="1.5"/></clipPath>' +
      '<clipPath id="itCHt"><path d="' + HEART + '" transform="translate(0 1.5) scale(.45)"/></clipPath>' +
      "</defs></svg>";
  }
  function itLink(l, m) {
    var w = itSlots(l) * IT_W, h = IT_H, x0 = -w / 2, y0 = -h / 2;
    var edge = m === "g" ? "#a17a2a" : "#89919d", ink = m === "g" ? "#6a4f14" : "#4f5662";
    if (l.k === "charm") return itCharmFace(l.c, w);
    var s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="3" fill="url(#itM' + m + ')" stroke="' + edge + '"/>' +
      '<path d="M' + (x0 + 1.5) + " " + (y0 + 4.5) + "h" + (w - 3) + "M" + (x0 + 1.5) + " " + (-y0 - 4.5) + "h" + (w - 3) + '" stroke="' + edge + '" stroke-width=".8" opacity=".6"/>';
    if (l.k === "plain") return s + '<g fill="' + ink + '" opacity=".38" font-family="Arial, Helvetica, sans-serif" font-size="5" letter-spacing=".4" text-anchor="middle"><text y="-1">STAINLESS</text><text y="6">STEEL</text></g>';
    if (l.k === "pic") return s + itPicFace(l);
    if (l.k === "lock") return s + '<ellipse cy="1" rx="14" ry="14.5" fill="url(#itD' + m + ')" stroke="' + edge + '"/><path d="' + HEART + '" transform="translate(0 2) scale(.19)" fill="none" stroke="' + edge + '" stroke-width="6"/><rect x="-4.5" y="-16" width="9" height="3.4" rx="1.5" fill="' + edge + '"/>';
    return s + itEngrave(l, w, ink);
  }
  // a picture charm: the photo under glass in a black heart or square frame
  function itPicFace(l) {
    var ph = l.ph && PH_URL[l.ph], heart = l.sh === "heart", clip = heart ? "itCHt" : "itCSq";
    var frame = heart ? '<path d="' + HEART + '" transform="translate(0 1.5) scale(.5)" fill="#1f2433"/>' : '<rect x="-16" y="-15" width="32" height="30" rx="2.5" fill="#1f2433"/>';
    var pic = ph ? '<image href="' + ph + '" x="-16" y="-15" width="32" height="30" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clip + ')"/>'
      : '<g clip-path="url(#' + clip + ')"><rect x="-16" y="-15" width="32" height="30" fill="url(#itPh)"/><circle cx="5.5" cy="-5" r="3" fill="#fff" opacity=".9"/><path d="M-16 13 L-6 1 L0 7 L5 2.5 L16 13 Z" fill="#51618a" opacity=".55"/></g>';
    return frame + pic;
  }
  function itLines(s, n) {
    if (s.length <= n) return [s];
    var mid = s.length / 2, cut = -1;
    for (var i = 1; i < s.length - 1; i++) if (s.charAt(i) === " " && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    return cut > 0 ? [s.slice(0, cut), s.slice(cut + 1)] : [s];
  }
  function itEngrave(l, w, ink) {
    var txt = (l.txt || "").trim(), lines = itLines(txt || (l.k === "long" ? t("it_long_ph") : "Aa"), l.k === "long" ? 15 : 6);
    var longest = Math.max.apply(null, lines.map(function (x) { return x.length; }));
    var fs = Math.min(lines.length > 1 ? 9 : 12, (w - 8) / Math.max(1, longest * 0.47));
    return '<g font-family="' + IT_SCRIPT + '" font-size="' + fs.toFixed(1) + '" fill="' + ink + '" text-anchor="middle"' + (txt ? "" : ' opacity=".35"') + ">" +
      lines.map(function (x, i) { return '<text y="' + ((i - (lines.length - 1) / 2) * fs * 1.1 + fs * 0.32).toFixed(1) + '">' + esc(x) + "</text>"; }).join("") + "</g>";
  }
  // a charm from the tray: its own photo, straightened, fills the link
  function itCharmFace(code, w) {
    var o = ITC_BY[code];
    if (!o) return "";
    var C = ITC.cell, cx = (o.i % ITC.cols) * C + C / 2, cy = Math.floor(o.i / ITC.cols) * C + C / 2, two = w > IT_W;
    var vw = two ? 176 : 140, vh = two ? 84 : 134;
    return '<svg x="' + (-w / 2) + '" y="' + (-IT_H / 2) + '" width="' + w + '" height="' + IT_H + '" viewBox="' + (cx - vw / 2) + " " + (cy - vh / 2) + " " + vw + " " + vh + '" preserveAspectRatio="xMidYMid slice"><image href="' + ITC.img + '" width="' + ITC.w + '" height="' + ITC.h + '"/></svg>' +
      '<rect x="' + (-w / 2) + '" y="' + (-IT_H / 2) + '" width="' + w + '" height="' + IT_H + '" rx="3" fill="none" stroke="#858d99"/>';
  }
  function itThumb(code) {
    var o = ITC_BY[code];
    if (!o) return "";
    var rows = Math.ceil(ITC.list.length / ITC.cols), col = o.i % ITC.cols, row = Math.floor(o.i / ITC.cols);
    return '<span class="it-thumb" style="background-image:url(' + ITC.img + ");background-size:" + ITC.cols * 100 + "% auto;background-position:" + (col / (ITC.cols - 1) * 100).toFixed(2) + "% " + (rows > 1 ? (row / (rows - 1) * 100).toFixed(2) : 0) + '%"></span>';
  }
  function itSvg(l, m) { return '<svg class="it-link" viewBox="' + (itSlots(l) > 1 ? "-46 -23 92 46" : "-24 -23 48 46") + '" aria-hidden="true">' + itLink(l, m || itMetal()) + "</svg>"; }

  // the bracelet laid flat in a ring: the chosen links sit at the front, the initials hang below them
  function itPreview() {
    var N = IT_N[IT.size], used = itUsed(), slots = Math.max(N, used), m = itMetal();
    var D = 360 / slots, R = slots * IT_W / (2 * Math.PI) + 1, cx = 200, cy = 192;
    var run = [], at = 0, plain = [];
    IT.links.forEach(function (l) { var s = itSlots(l); run.push([l, at + (s - 1) / 2]); at += s; });
    for (var j = at; j < slots; j++) plain.push([{ k: "plain" }, j]);
    var mid = (at - 1) / 2;
    var place = function (pair) {
      var th = 90 + (mid - pair[1]) * D, r = th * Math.PI / 180;
      var rot = Math.sin(r) > -0.01 ? th - 90 : th + 90;
      return '<g transform="translate(' + (cx + R * Math.cos(r)).toFixed(1) + " " + (cy + R * Math.sin(r)).toFixed(1) + ") rotate(" + rot.toFixed(1) + ')"><g' + (pair[0].id && pair[0].id === IT.last ? ' class="it-pop"' : "") + ">" + itLink(pair[0], m) + "</g></g>";
    };
    var k = IT.inis.length;
    var dangles = IT.inis.map(function (L, i) {
      var th = 90 + ((k - 1) / 2 - i) * D, r = th * Math.PI / 180, rr = R + IT_H / 2 - 2;
      return '<g transform="translate(' + (cx + rr * Math.cos(r)).toFixed(1) + " " + (cy + rr * Math.sin(r)).toFixed(1) + ')"><g class="it-dangle" style="animation-delay:-' + (i * 0.7).toFixed(1) + 's">' +
        '<circle cy="4" r="4" fill="none" stroke="' + (m === "g" ? "#a17a2a" : "#89919d") + '" stroke-width="2"/><g font-family="Georgia, \'Times New Roman\', serif" font-weight="700" font-size="31" text-anchor="middle"><text x="1.5" y="37" fill="rgba(20,30,60,.2)">' + L + '</text><text y="35" fill="url(#itM' + m + ')" stroke="' + (m === "g" ? "#7d5d17" : "#5f6774") + '" stroke-width="1.1">' + L + "</text></g></g></g>";
    }).join("");
    var pr = itPrices(), metal = (pr.metals[IT.metal] || pr.metals[0])[0];
    return '<svg class="it-ring" viewBox="0 0 400 430" aria-hidden="true">' +
      '<circle cx="' + cx + '" cy="' + (cy + 5) + '" r="' + R.toFixed(1) + '" fill="none" stroke="rgba(20,30,60,.14)" stroke-width="' + (IT_H + 6) + '"/>' +
      plain.map(place).join("") + run.map(place).join("") + dangles +
      '<text class="it-ring-a" x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle">' + esc(t("isz_" + IT.size) + " · " + metal) + "</text>" +
      '<text class="it-ring-b' + (used > N ? " over" : "") + '" x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle">' + esc(t("it_links", { n: used, max: N })) + "</text></svg>";
  }

  function itSizeHTML() {
    return ["w", "m"].map(function (s) {
      return '<label class="it-opt"><input type="radio" name="itSize" value="' + s + '"' + (IT.size === s ? " checked" : "") + '>' +
        '<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle r="' + (s === "w" ? 13 : 17) + '" fill="none" stroke="#9aa2ad" stroke-width="6" stroke-dasharray="' + (s === "w" ? "3.6 .9" : "4.2 .9") + '"/></svg>' +
        '<span class="it-opt-t"><b>' + esc(t("isz_" + s)) + "</b><small>" + esc(t("isz_" + s + "_sub", { n: IT_N[s] })) + "</small></span></label>";
    }).join("");
  }
  function itMetalHTML() {
    return itPrices().metals.map(function (mt, i) {
      return '<label class="it-opt"><input type="radio" name="itMetal" value="' + i + '"' + (IT.metal === i ? " checked" : "") + ">" + itSvg({ k: "plain" }, i === 1 ? "g" : "s") +
        '<span class="it-opt-t"><b>' + esc(mt[0]) + '</b><small class="tn">' + esc(money(mt[1])) + "</small></span></label>";
    }).join("");
  }
  function itFreeLink() { return IT.links.filter(function (l) { return l.free; })[0]; }
  function itFreeHTML() {
    var f = itFreeLink();
    return ["heart", "square"].map(function (sh) {
      return '<label class="mk-shape it-shape"><input type="radio" name="itFree" value="' + sh + '"' + (f && f.sh === sh ? " checked" : "") + ">" + itSvg({ k: "pic", sh: sh, ph: f ? f.ph : "" }) + "<span>" + esc(t("sh_" + sh)) + "</span></label>";
    }).join("");
  }
  function itPhotoBtn(l, cls) {
    return '<label class="' + (cls || "link it-ph") + '">' + esc(t(l.ph ? "it_photo_change" : "it_photo")) + '<input type="file" accept="image/*" class="sr" data-it-ph="' + l.id + '"></label>';
  }
  function itTabsHTML() {
    return IT_TABS.map(function (k) { return '<button type="button" class="mk-tab" data-it-tab="' + k + '" aria-pressed="' + (IT.tab === k) + '">' + esc(t("it_t_" + k)) + "</button>"; }).join("");
  }
  function itEngRow(k, max, price) {
    return '<div class="it-eng"><span id="itPv_' + k + '">' + itSvg({ k: k, txt: "" }) + '</span><div class="field"><label for="itIn_' + k + '">' + esc(t("it_eng_" + k)) + ' <span class="tn it-plus">+' + esc(price) + "</span></label>" +
      '<div class="it-eng-in"><input type="text" id="itIn_' + k + '" maxlength="' + max + '" autocomplete="off" placeholder="' + esc(t(k === "long" ? "it_long_ph" : "it_eng_ph")) + '"><button type="button" class="btn solid" data-it-add="' + k + '">' + esc(t("it_add")) + "</button></div>" +
      '<span class="hint tn" id="itInH_' + k + '">0/' + max + '</span><span class="err" id="itInE_' + k + '" hidden>' + esc(t("it_need_txt")) + "</span></div></div>";
  }
  function itPanel() {
    var pr = itPrices(), P = function (k) { return money(+pr.parts[k] || 0); };
    if (IT.tab === "pic") return '<p class="hint">' + esc(t("it_pic_h", { p: P("pic") })) + '</p><div class="it-adds">' +
      ["heart", "square"].map(function (sh) { return '<button type="button" class="it-add" data-it-add="pic" data-sh="' + sh + '">' + itSvg({ k: "pic", sh: sh }) + "<span>" + esc(t("it_add_" + sh)) + '</span><small class="tn">+' + esc(P("pic")) + "</small></button>"; }).join("") + "</div>";
    if (IT.tab === "eng") return '<div class="it-engs">' + itEngRow("eng", IT_ENG, P("eng")) + itEngRow("long", IT_LONG, P("long")) + "</div>";
    if (IT.tab === "ini") return '<p class="hint">' + esc(t("it_ini_h", { p: P("ini"), n: IT_INI })) + '</p><div class="it-ls">' +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function (L) { return '<button type="button" class="it-l" data-it-add="ini" data-l="' + L + '" aria-label="' + esc(t("ip_ini") + " " + L) + '">' + L + "</button>"; }).join("") + "</div>";
    if (IT.tab === "lock") return '<div class="it-lock">' + itSvg({ k: "lock" }) + "<div><p>" + esc(t("it_lock_h")) + '</p><button type="button" class="btn solid" data-it-add="lock">' + esc(t("it_add_lock")) + ' <span class="tn">+' + esc(P("lock")) + "</span></button></div></div>";
    return '<p class="hint">' + esc(t("it_charm_h", { p: P("charm") })) + '</p><div class="mk-chs it-chs">' + ITC.list.map(function (c) {
      var n = IT.links.filter(function (l) { return l.c === c[0]; }).length;
      return '<button type="button" class="mk-ch it-ch" data-it-add="charm" data-c="' + c[0] + '"' + (n ? ' data-n="' + n + '"' : "") + ">" + itThumb(c[0]) + '<span class="ch-name">' + esc(itCharmName(c[0])) + '</span><span class="ch-code tn">' + c[0] + "</span></button>";
    }).join("") + "</div>";
  }
  // the links in order, left to right as we make them
  function itListHTML() {
    var pr = itPrices(), free = pr.free, last = IT.links.length - 1;
    return IT.links.map(function (l, i) {
      var isFree = l.k === "pic" && free > 0;
      if (isFree) free--;
      var label = l.k === "charm" ? itCharmName(l.c) + " · " + l.c : t("ip_" + l.k) + (l.k === "pic" ? " · " + t("sh_" + l.sh) : "");
      var extra = "";
      if (l.k === "pic") extra = '<div class="it-row-x"><span class="it-sh">' + ["heart", "square"].map(function (sh) {
        return '<label><input type="radio" name="itSh' + l.id + '" value="' + sh + '" data-it-sh="' + l.id + '"' + (l.sh === sh ? " checked" : "") + "><span>" + esc(t("sh_" + sh)) + "</span></label>";
      }).join("") + "</span>" + itPhotoBtn(l) + "</div>";
      else if (l.k === "eng" || l.k === "long") extra = '<div class="it-row-x"><input type="text" class="it-txt" id="itTxt' + l.id + '" data-it-txt="' + l.id + '" maxlength="' + (l.k === "eng" ? IT_ENG : IT_LONG) + '" value="' + esc(l.txt || "") + '" aria-label="' + esc(t("ip_" + l.k)) + '" placeholder="' + esc(t(l.k === "long" ? "it_long_ph" : "it_eng_ph")) + '"><span class="err" id="itTxt' + l.id + 'E" hidden></span></div>';
      else if (l.k === "lock") extra = '<div class="it-row-x">' + itPhotoBtn(l) + '<span class="hint">' + esc(t("it_lock_photo")) + "</span></div>";
      return '<li class="it-row' + (l.id === IT.last ? " it-new" : "") + '"><span class="it-pos tn">' + (i + 1) + "</span>" + itSvg(l) +
        '<div class="it-row-m"><p class="it-row-t"><b>' + esc(label) + '</b><span class="tn">' + esc(isFree ? t("it_free") : "+" + money(+pr.parts[l.k] || 0)) + "</span></p>" + extra + "</div>" +
        '<div class="it-row-b"><button type="button" data-it-mv="' + l.id + '" data-d="-1" aria-label="' + esc(t("it_up")) + '"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
        '<button type="button" data-it-mv="' + l.id + '" data-d="1" aria-label="' + esc(t("it_down")) + '"' + (i === last ? " disabled" : "") + ">↓</button>" +
        (l.free ? "" : '<button type="button" data-it-rm="' + l.id + '" aria-label="' + esc(t("remove") + ": " + label) + '">✕</button>') + "</div></li>";
    }).join("");
  }
  function itInisHTML() {
    if (!IT.inis.length) return "";
    var pr = itPrices();
    return '<div class="it-inis"><span>' + esc(t("it_inis")) + "</span>" + IT.inis.map(function (L, i) {
      return '<span class="it-ini"><b>' + L + '</b><small class="tn">+' + esc(money(+pr.parts.ini || 0)) + '</small><button type="button" data-it-rmi="' + i + '" aria-label="' + esc(t("remove") + ": " + L) + '">✕</button></span>';
    }).join("") + "</div>";
  }
  function itSummary() {
    var pr = itPrices(), N = IT_N[IT.size], used = itUsed(), m = pr.metals[IT.metal] || pr.metals[0], count = {};
    itParts().forEach(function (k) { count[k] = (count[k] || 0) + 1; });
    var lines = ["pic", "eng", "long", "lock", "charm", "ini"].filter(function (k) { return count[k]; }).map(function (k) {
      var n = count[k], freeN = k === "pic" ? Math.min(pr.free, n) : 0, cost = (n - freeN) * (+pr.parts[k] || 0);
      return "<p><span>" + esc(t(k === "charm" ? "charms" : "ip_" + k)) + " × " + n + (freeN ? " · " + esc(t("it_free_n", { n: freeN })) : "") + "</span><b>" + esc(cost ? money(cost) : t("it_free")) + "</b></p>";
    }).join("");
    var btn = pr.live ? '<button class="btn solid wide" type="button" data-it-bag>' + esc(t("add")) + "</button>"
      : '<a class="btn solid wide" id="itWa" target="_blank" rel="noopener" href="' + esc(itWaLink()) + '">' + esc(t("mk_wa")) + "</a>";
    return '<h2 class="mk-sum-h">' + esc(t("mk_yours")) + "</h2>" +
      '<dl class="mk-dl"><div><dt>' + esc(t("it_size")) + "</dt><dd>" + esc(t("isz_" + IT.size)) + (IT.wrist ? ' <small class="tn">' + esc(IT.wrist) + " cm</small>" : "") + "</dd></div>" +
      "<div><dt>" + esc(t("colour")) + "</dt><dd>" + esc(m[0]) + "</dd></div>" +
      "<div><dt>" + esc(t("it_links_l")) + '</dt><dd class="tn' + (used > N ? " it-over" : "") + '">' + used + " / " + N + "</dd></div></dl>" +
      (used > N ? '<p class="it-warn">' + esc(t("it_too_many", { n: N })) + "</p>" : "") +
      '<div class="mk-money tn"><p><span>' + esc(t("it_bracelet")) + "</span><b>" + esc(money(m[1])) + "</b></p>" + lines +
      '<p class="grand"><span>' + esc(t("total")) + "</span><b>" + esc(money(itTotal())) + "</b></p></div>" + btn + '<p class="it-care">' + esc(t("it_care")) + "</p>";
  }
  // what the shop reads (order details and the WhatsApp message): one line per link, in order
  function itDetailLines(it, free, nums) {
    var d = [t("it_size") + ": " + t("isz_" + it.size)], slot = 0;
    var num = function () { var n = nums ? nums[slot] : 0; slot++; return n ? " #" + n : ""; };
    if (it.wrist) d.push(t("it_wrist") + ": " + it.wrist + " cm");
    (it.links || []).forEach(function (l) {
      if (l.k === "pic") { var f = free > 0; if (f) free--; d.push(t(f ? "ip_freepic" : "ip_pic") + ": " + t("sh_" + l.sh) + num()); }
      else if (l.k === "eng" || l.k === "long") d.push(t("ip_" + l.k) + ": “" + (l.txt || "").trim() + "”");
      else if (l.k === "lock") d.push(t("ip_lock") + num());
      else if (l.k === "charm") d.push(t("charm") + " " + l.c + ": " + itCharmName(l.c));
    });
    (it.inis || []).forEach(function (L) { d.push(t("ip_ini") + ": " + L); });
    return d;
  }
  function itWaLink() {
    var pr = itPrices();
    var d = inLang(shopLang(), function () {
      var x = [(pr.metals[IT.metal] || pr.metals[0])[0]].concat(itDetailLines(IT, pr.free));
      if (IT.note.trim()) x.push("“" + IT.note.trim() + "”");
      return x.concat([t("total") + ": " + money(itTotal())]);
    });
    return waLink(tw("it_msg") + "\n" + d.join("\n"));
  }
  function itStep(n, title, body) { return '<fieldset class="mk-step"><legend><span class="num">' + n + "</span>" + esc(title) + "</legend>" + body + "</fieldset>"; }
  function italianPage() {
    var pr = itPrices();
    if (IT.metal >= pr.metals.length) IT.metal = 0;
    var f = itFreeLink();
    return itDefs() + '<section class="wrap page-head kittied">' + kitty("sparkle", "head-kitty") + '<p class="eyebrow">' + esc(t("it_eyebrow")) + "</p><h1>" + esc(t("it_h")) + '</h1><p class="lead">' + esc(t("it_lead")) + "</p>" +
      '<p class="mk-price tn">' + esc(t("it_price", { p: money(pr.metals[0][1]) })) + '</p><p class="it-cross"><a class="link" href="#make">' + esc(t("it_cross")) + " →</a></p></section>" +
      '<section class="section tight mk-sec it-sec"><div class="wrap mk-grid">' +
      '<div class="mk-side"><div class="mk-card"><div class="it-stage" id="itStage">' + itPreview() + "</div>" +
      '<div class="mk-peni"><span class="mk-peni-kitty" id="itCat">' + (window.MINISE_CAT ? window.MINISE_CAT(IT.pose) : "") + '</span><p class="mk-say" id="itSay" role="status">' + esc(itSayText()) + "</p></div></div>" +
      '<div class="mk-sum" id="itSum">' + itSummary() + "</div></div>" +
      '<form class="mk-steps" id="itForm" novalidate>' +
      itStep(1, t("it_s_size"), '<div class="it-opts">' + itSizeHTML() + '</div><div class="field it-wrist"><label for="itWrist">' + esc(t("it_wrist_l")) + '</label><input type="text" id="itWrist" inputmode="decimal" maxlength="4" autocomplete="off" placeholder="16" value="' + esc(IT.wrist) + '"><span class="hint">' + esc(t("it_wrist_h")) + "</span></div>") +
      itStep(2, t("it_s_metal"), '<div class="it-opts" id="itMetals">' + itMetalHTML() + "</div>") +
      itStep(3, t("it_s_free"), '<p class="hint">' + esc(t("it_free_h")) + '</p><div class="mk-shapes" id="itFree">' + itFreeHTML() + '</div><p class="it-free-ph" id="itFreePh">' + (f ? itPhotoBtn(f, "btn ghost it-ph-btn") : "") + "</p>") +
      itStep(4, t("it_s_add"), '<div class="mk-tabs">' + itTabsHTML() + '</div><div class="it-panel" id="itPanel">' + itPanel() + "</div>") +
      itStep(5, t("it_s_arrange"), '<p class="hint">' + esc(t("it_arrange_h")) + '</p><ol class="it-list" id="itList">' + itListHTML() + '</ol><div id="itInis">' + itInisHTML() + '</div><p class="hint">' + esc(t("it_photos_note", { n: IT_PHOTOS })) + "</p>") +
      itStep(6, t("mk_s4"), '<textarea id="itNote" maxlength="300" placeholder="' + esc(t("it_note_ph")) + '">' + esc(IT.note) + '</textarea><p class="hint">' + esc(t("it_care")) + "</p>") +
      "</form></div></section>" + '<div class="mk-bar" id="itBar"></div>';
  }
  function itBar() {
    var b = document.getElementById("itBar");
    if (!b) return;
    var pr = itPrices();
    b.innerHTML = "<div><small>" + esc(t("total")) + " · " + esc(t("it_links", { n: itUsed(), max: IT_N[IT.size] })) + '</small><b class="tn">' + esc(money(itTotal())) + "</b></div>" +
      (pr.live ? '<button class="btn solid" type="button" data-it-bag>' + esc(t("add")) + "</button>" : '<a class="btn solid" target="_blank" rel="noopener" href="' + esc(itWaLink()) + '">WhatsApp</a>');
  }
  // Mumi's words are kept as a key, so they follow a change of language
  function itSayText() {
    var v = Object.assign({}, IT.say[1]);
    if (v.c) v.n = itCharmName(v.c);
    if (v.sz) v.s = t("isz_" + v.sz);
    if (v.sh) v.s = t("sh_" + v.sh);
    if (v.mi != null) v.m = (itPrices().metals[v.mi] || [""])[0];
    return t(IT.say[0], v);
  }
  function itSay(key, vars, pose) {
    IT.say = [key, vars || {}];
    var el = document.getElementById("itSay");
    if (!el) return;
    el.textContent = itSayText();
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    if (pose && pose !== IT.pose && window.MINISE_CAT) { IT.pose = pose; document.getElementById("itCat").innerHTML = window.MINISE_CAT(pose); }
  }
  // redraw after a change; "all" also redraws the parts drawn in the bracelet's metal or with charm counts
  function itUpdate(all) {
    itSave();
    var st = document.getElementById("itStage");
    if (!st) return;
    st.innerHTML = itPreview();
    document.getElementById("itSum").innerHTML = itSummary();
    document.getElementById("itList").innerHTML = itListHTML();
    document.getElementById("itInis").innerHTML = itInisHTML();
    if (all) {
      document.getElementById("itFree").innerHTML = itFreeHTML();
      var f = itFreeLink(), fp = document.getElementById("itFreePh");
      if (fp) fp.innerHTML = f ? itPhotoBtn(f, "btn ghost it-ph-btn") : "";
      document.getElementById("itMetals").innerHTML = itMetalHTML();
      // the engraving boxes keep what was typed
      var typed = ["eng", "long"].map(function (k) { var x = document.getElementById("itIn_" + k); return x ? x.value : ""; });
      document.getElementById("itPanel").innerHTML = itPanel();
      ["eng", "long"].forEach(function (k, i) {
        var x = document.getElementById("itIn_" + k);
        if (x && typed[i]) { x.value = typed[i]; x.dispatchEvent(new Event("input", { bubbles: true })); }
      });
    }
    IT.last = 0;
    itBar();
  }
  function itRoom(slots, photo) {
    var N = IT_N[IT.size];
    if (itUsed() + slots > N) { itSay(IT.size === "w" ? "it_full_w" : "it_full_m", { n: N }, "search"); return false; }
    if (photo && itPhotoCount() >= IT_PHOTOS) { itSay("it_photo_max", { n: IT_PHOTOS }, "search"); return false; }
    return true;
  }
  function itAddLink(l) { l.id = IT.seq++; IT.links.push(l); IT.last = l.id; }
  function itAdd() {
    var bad = IT.links.filter(function (l) { return (l.k === "eng" || l.k === "long") && !(l.txt || "").trim(); })[0];
    if (bad) {
      setErr("itTxt" + bad.id, t("it_need_txt"));
      var inp = document.getElementById("itTxt" + bad.id);
      if (inp) { inp.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" }); inp.focus({ preventScroll: true }); }
      itSay("it_need_txt", null, "search");
      return;
    }
    if (itUsed() > IT_N[IT.size]) { itSay("it_too_many", { n: IT_N[IT.size] }, "search"); return; }
    if (!itPrices().live) return;
    bag.push({ s: ITB, opt: IT.metal, addN: 0, qty: 1, it: 1, size: IT.size, wrist: IT.wrist, parts: itParts(), inis: IT.inis.slice(), note: IT.note.trim(),
      links: IT.links.map(function (l) { return { k: l.k, sh: l.sh, txt: (l.txt || "").trim() || undefined, c: l.c, ph: l.ph }; }) });
    saveBag();
    toast(t("added"), "gift");
    itSay("is_added", null, "yay");
    openBag();
  }
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.name === "itSize") { IT.size = el.value; itSay("is_size", { sz: IT.size, n: IT_N[IT.size] }, "wave"); itUpdate(); }
    else if (el.name === "itMetal") { IT.metal = +el.value; itSay("is_metal", { mi: IT.metal }, "sparkle"); itUpdate(true); }
    else if (el.name === "itFree") { var f = itFreeLink(); if (f) { f.sh = el.value; IT.last = f.id; } itSay("is_shape", { sh: el.value }, "heart"); itUpdate(true); }
    else if (el.hasAttribute("data-it-sh")) { var l = itById(+el.getAttribute("data-it-sh")); if (l) { l.sh = el.value; IT.last = l.id; } itUpdate(true); }
    else if (el.hasAttribute("data-it-ph")) {
      var id = +el.getAttribute("data-it-ph"), file = el.files && el.files[0];
      el.value = "";
      phAdd(file).then(function (pid) {
        var l = itById(id);
        if (!pid || !l) return;
        l.ph = pid;
        IT.last = id;
        itSay("is_photo", null, "heart");
        itUpdate(true);
      });
    }
  });
  document.addEventListener("input", function (e) {
    var el = e.target, id = el.id;
    if (id === "itWrist") {
      var v = el.value.replace(/[^\d.]/g, "");
      IT.wrist = /^\d{2}(\.\d)?$/.test(v) && +v >= 12 && +v <= 25 ? v : "";
      itSave();
      document.getElementById("itSum").innerHTML = itSummary();
    } else if (id === "itIn_eng" || id === "itIn_long") {
      var k = id.slice(5);
      document.getElementById("itInH_" + k).textContent = el.value.length + "/" + (k === "eng" ? IT_ENG : IT_LONG);
      document.getElementById("itPv_" + k).innerHTML = itSvg({ k: k, txt: itClean(el.value, 40) });
      if (el.value.trim()) document.getElementById("itInE_" + k).hidden = true;
    } else if (el.hasAttribute("data-it-txt")) {
      var l = itById(+el.getAttribute("data-it-txt"));
      if (!l) return;
      l.txt = itClean(el.value, l.k === "eng" ? IT_ENG : IT_LONG);
      if (l.txt.trim()) setErr("itTxt" + l.id, "");
      itSave();
      document.getElementById("itStage").innerHTML = itPreview();
      var mini = el.closest(".it-row").querySelector(".it-link");
      if (mini) mini.outerHTML = itSvg(l);
      clearTimeout(itUpdate._t);
      itUpdate._t = setTimeout(function () { document.getElementById("itSum").innerHTML = itSummary(); itBar(); }, 300);
    } else if (id === "itNote") {
      IT.note = el.value;
      itSave();
      clearTimeout(itUpdate._t);
      itUpdate._t = setTimeout(function () { var w = document.getElementById("itWa"); if (w) w.href = itWaLink(); itBar(); }, 300);
    }
  });
  document.addEventListener("keydown", function (e) {
    // Enter in an engraving box adds it (instead of sending the form)
    if (e.key === "Enter" && (e.target.id === "itIn_eng" || e.target.id === "itIn_long")) { e.preventDefault(); var b = document.querySelector('[data-it-add="' + e.target.id.slice(5) + '"]'); if (b) b.click(); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-it-tab]");
    if (b) {
      IT.tab = b.getAttribute("data-it-tab");
      itSave();
      document.querySelectorAll("[data-it-tab]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      document.getElementById("itPanel").innerHTML = itPanel();
      return;
    }
    b = e.target.closest("[data-it-add]");
    if (b) {
      var k = b.getAttribute("data-it-add");
      if (k === "pic") {
        if (!itRoom(1, true)) return;
        itAddLink({ k: "pic", sh: b.getAttribute("data-sh") });
        itSay("is_pic", null, "heart");
      } else if (k === "eng" || k === "long") {
        var inp = document.getElementById("itIn_" + k), txt = itClean(inp.value, k === "eng" ? IT_ENG : IT_LONG).trim();
        if (!txt) { document.getElementById("itInE_" + k).hidden = false; inp.focus(); return; }
        if (!itRoom(k === "long" ? 2 : 1, false)) return;
        itAddLink({ k: k, txt: txt });
        inp.value = "";
        document.getElementById("itInH_" + k).textContent = "0/" + (k === "eng" ? IT_ENG : IT_LONG);
        document.getElementById("itPv_" + k).innerHTML = itSvg({ k: k, txt: "" });
        itSay("is_eng", { t: txt }, "paint");
      } else if (k === "ini") {
        if (IT.inis.length >= IT_INI) { itSay("it_ini_max", { n: IT_INI }, "search"); return; }
        IT.inis.push(b.getAttribute("data-l"));
        itSay("is_ini", { l: b.getAttribute("data-l") }, "yay");
      } else if (k === "lock") {
        if (!itRoom(1, true)) return;
        itAddLink({ k: "lock" });
        itSay("is_lock", null, "gift");
      } else if (k === "charm") {
        var c = b.getAttribute("data-c");
        if (!ITC_BY[c] || !itRoom(ITC_BY[c].c[1] ? 2 : 1, false)) return;
        itAddLink({ k: "charm", c: c });
        itSay("is_charm", { c: c }, "sparkle");
      }
      itUpdate(k === "charm");
      if (k === "charm") { var again = document.querySelector('[data-it-add="charm"][data-c="' + b.getAttribute("data-c") + '"]'); if (again) again.focus({ preventScroll: true }); }
      return;
    }
    b = e.target.closest("[data-it-mv]");
    if (b) {
      var id = +b.getAttribute("data-it-mv"), d = +b.getAttribute("data-d"), i = IT.links.indexOf(itById(id)), j = i + d;
      if (i < 0 || j < 0 || j >= IT.links.length) return;
      var x = IT.links[i]; IT.links[i] = IT.links[j]; IT.links[j] = x;
      itUpdate();
      var same = document.querySelector('[data-it-mv="' + id + '"][data-d="' + d + '"]');
      if (same && !same.disabled) same.focus({ preventScroll: true });
      else { same = document.querySelector('[data-it-mv="' + id + '"]:not([disabled])'); if (same) same.focus({ preventScroll: true }); }
      return;
    }
    b = e.target.closest("[data-it-rm]");
    if (b) {
      var rid = +b.getAttribute("data-it-rm"), l = itById(rid);
      if (!l || l.free) return;
      IT.links.splice(IT.links.indexOf(l), 1);
      itSay("is_off", null, "wave");
      itUpdate(true);
      return;
    }
    b = e.target.closest("[data-it-rmi]");
    if (b) { IT.inis.splice(+b.getAttribute("data-it-rmi"), 1); itSay("is_off", null, "wave"); itUpdate(); return; }
    if (e.target.closest("[data-it-bag]")) itAdd();
  });

  /* home: a little Mumi & Peni comic, and a charm-matching game (Peni mixed up the tray).
     Winning offers to start a bracelet with the matched charms. The best score stays on this device. */
  var GM_POOL = ["A1", "A7", "A9", "A11", "A15", "A16", "A20", "A24", "B4", "B12", "B20", "B23", "C13", "C16", "C17", "C25", "C33", "C37"];
  var GM = { cards: [], open: [], done: {}, moves: 0, lock: false, won: false, say: "" };
  function gmBest() { try { return parseInt(localStorage.getItem("minise_gm_best"), 10) || 0; } catch (e) { return 0; } }
  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function gmNew() {
    var pick = shuffled(GM_POOL.filter(function (c) { return CH_BY[c]; })).slice(0, 6);
    GM = { cards: shuffled(pick.concat(pick)), open: [], done: {}, moves: 0, lock: false, won: false, say: t("gm_say_start") };
  }
  function gmCard(i) {
    var code = GM.cards[i], up = GM.done[i] || GM.open.indexOf(i) > -1;
    return '<button type="button" class="gm-card' + (up ? " is-up" : "") + (GM.done[i] ? " is-done" : "") + '" data-gm="' + i + '" aria-label="' + esc(t("gm_card", { n: i + 1 }) + (up ? ": " + charmName(code) : "")) + '">' +
      '<span class="gm-inner"><span class="gm-back">' + kitty("paw", "gm-paw") + '</span><span class="gm-front">' + charmImg(code) + "</span></span></button>";
  }
  function gmStats() {
    var pairs = Object.keys(GM.done).length / 2, best = gmBest();
    return '<span class="tn">' + esc(t("gm_moves", { n: GM.moves })) + '</span><span class="tn">' + esc(t("gm_pairs", { n: pairs, t: GM.cards.length / 2 })) + "</span>" +
      (best ? '<span class="tn">' + esc(t("gm_best", { n: best })) + "</span>" : "");
  }
  function gmWin() {
    if (!GM.won) return "";
    return '<div class="gm-win" role="status">' + kitty("yay", "gm-win-kitty") + '<div><p>' + esc(t("gm_win", { n: GM.moves })) + '</p><div class="gm-win-btns"><button class="btn solid" type="button" data-gm-use>' + esc(t("gm_use")) + '</button><button class="btn" type="button" data-gm-again>' + esc(t("gm_again")) + "</button></div></div>" + kitty("peniWave", "gm-win-kitty") + "</div>";
  }
  function gameHTML() {
    if (!GM.cards.length) gmNew();
    return '<div class="gm" id="gm"><div class="gm-top"><div><h3>' + esc(t("gm_h")) + "</h3><p>" + esc(t("gm_p")) + '</p></div><div class="gm-stats" id="gmStats">' + gmStats() + "</div></div>" +
      '<div class="gm-board" id="gmBoard">' + GM.cards.map(function (c, i) { return gmCard(i); }).join("") + "</div>" +
      '<div class="gm-foot"><div class="gm-peni">' + kitty("peni", "gm-peni-kitty") + '<p class="gm-say" id="gmSay" role="status">' + esc(GM.say) + '</p></div><button class="link gm-reset" type="button" data-gm-again>' + esc(t("gm_again")) + "</button></div>" +
      '<div id="gmWin">' + gmWin() + "</div></div>";
  }
  function duoHTML() {
    if (!GM.cards.length) gmNew();
    return '<section class="duo"><div class="wrap">' +
      '<div class="duo-head">' + kitty("wave", "duo-kitty") + '<div><p class="eyebrow">' + esc(t("duo_eyebrow")) + "</p><h2>" + esc(t("duo_h")) + '</h2><p class="lead">' + esc(t("duo_lead")) + '</p></div><span class="duo-links"><a class="link" href="#mumi">' + esc(t("mumi_link")) + ' →</a><a class="link" href="#peni">' + esc(t("peni_link")) + ' →</a><a class="link" href="#story">' + esc(t("fm_watch")) + " →</a></span>" + kitty("peniWave", "duo-kitty duo-kitty2") + "</div>" +
      storyHTML() + fortuneHTML() +
      gameHTML() + "</div></section>";
  }
  function gmSay(text) {
    GM.say = text;
    var el = document.getElementById("gmSay");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function gmSync() {
    var board = document.getElementById("gmBoard");
    if (!board) return;
    board.querySelectorAll("[data-gm]").forEach(function (b) {
      var i = +b.getAttribute("data-gm"), up = GM.done[i] || GM.open.indexOf(i) > -1;
      b.classList.toggle("is-up", !!up);
      b.classList.toggle("is-done", !!GM.done[i]);
      b.setAttribute("aria-label", t("gm_card", { n: i + 1 }) + (up ? ": " + charmName(GM.cards[i]) : ""));
    });
    document.getElementById("gmStats").innerHTML = gmStats();
    document.getElementById("gmWin").innerHTML = gmWin();
  }
  function gmFlip(i) {
    if (GM.lock || GM.won || GM.done[i] || GM.open.indexOf(i) > -1) return;
    GM.open.push(i);
    if (GM.open.length === 2) {
      GM.moves++;
      var a = GM.open[0], b = GM.open[1];
      if (GM.cards[a] === GM.cards[b]) {
        GM.done[a] = GM.done[b] = true;
        GM.open = [];
        if (Object.keys(GM.done).length === GM.cards.length) {
          GM.won = true;
          var best = gmBest();
          if (!best || GM.moves < best) { try { localStorage.setItem("minise_gm_best", String(GM.moves)); } catch (e) { /* ignore */ } }
          gmSay(t("gm_say_win"));
        } else gmSay(t("gm_say_match", { n: charmName(GM.cards[a]) }));
      } else {
        GM.lock = true;
        gmSay(t("gm_say_miss"));
        setTimeout(function () { GM.open = []; GM.lock = false; gmSync(); }, calm ? 500 : 950);
      }
    }
    gmSync();
    if (GM.won) { var w = document.querySelector(".gm-win"); if (w) w.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" }); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-gm]");
    if (b) { gmFlip(+b.getAttribute("data-gm")); return; }
    if (e.target.closest("[data-gm-again]")) {
      gmNew();
      var board = document.getElementById("gmBoard");
      if (board) board.innerHTML = GM.cards.map(function (c, i) { return gmCard(i); }).join("");
      gmSync();
      gmSay(t("gm_say_start"));
      return;
    }
    if (e.target.closest("[data-gm-use]")) {
      // start a bracelet with three of the charms just matched
      var seen = [];
      GM.cards.forEach(function (c) { if (seen.indexOf(c) < 0) seen.push(c); });
      MK.ch = seen.slice(0, MYO_MAX);
      MK.say = t("pn_from_game");
      mkSave();
      location.hash = "#make";
    }
  });
  /* Mumi & Peni's world (#cats): an animated stage, a choose-your-path story game, a quiz,
     the comics, the charm game and Peni's charm of the day. Found endings stay on this device. */
  var WL = { m: "drink", p: "peniMilk", mode: "shop", lm: 0, lp: 0 };
  var WL_M = ["drink", "wave", "heart", "gift", "yay", "paint", "sparkle", "search", "phone", "shark"];
  var WL_P = ["peniMilk", "peniWave", "peniHeart", "peniGift", "peniYay", "peniPaint", "peniSparkle", "peniYarn", "peniBunny", "peniPhone"];
  var WL_MODES = { shop: ["drink", "peniMilk", "wl_sm", "wl_sp"], costume: ["shark", "peniBunny", "wl_cm", "wl_cp"], party: ["yay", "peniYay", "wl_pm", "wl_pp"], nap: ["sleep", "peniSleep", "wl_nz", "wl_nz"] };
  var WL_FLOAT = [["A1", 6, 0], ["C17", 18, 1.2], ["A9", 30, 2.6], ["C13", 70, 0.6], ["A7", 82, 2], ["C25", 92, 3.1], ["B20", 50, 4]];
  function wlStage() {
    var C = window.MINISE_CAT || function () { return ""; };
    var floats = WL_FLOAT.map(function (f) { return CH_BY[f[0]] ? '<span class="wl-bit" style="left:' + f[1] + "%;animation-delay:-" + f[2] + 's">' + charmImg(f[0]) + "</span>" : ""; }).join("");
    var stars = [[8, 14], [22, 30], [40, 10], [58, 26], [74, 12], [90, 30], [32, 44], [66, 46]].map(function (s, i) { return '<i style="left:' + s[0] + "%;top:" + s[1] + "%;animation-delay:-" + (i * 0.4) + 's"></i>'; }).join("");
    return '<div class="wl-stage" id="wlStage" data-mode="' + WL.mode + '"><div class="wl-sky" aria-hidden="true"><span class="wl-moon"></span>' + stars + "</div>" +
      '<div class="wl-awning" aria-hidden="true"></div><p class="wl-sign" aria-hidden="true">Minise Arte</p>' +
      '<div class="wl-floats" aria-hidden="true">' + floats + "</div>" +
      '<div class="wl-cats">' +
      '<button class="wl-cat" type="button" data-wl="m" aria-label="' + esc(t("wl_pet_m")) + '"><span class="wl-say" id="wlSayM">' + esc(t("wl_m4")) + '</span><span class="wl-fig" id="wlFigM">' + C(WL.m) + "</span></button>" +
      '<button class="wl-cat" type="button" data-wl="p" aria-label="' + esc(t("wl_pet_p")) + '"><span class="wl-say" id="wlSayP">' + esc(t("wl_p6")) + '</span><span class="wl-fig" id="wlFigP">' + C(WL.p) + "</span></button>" +
      '</div><div class="wl-floor" aria-hidden="true"></div><div class="wl-burst" id="wlBurst" aria-hidden="true"></div></div>' +
      '<div class="wl-modes" role="group" aria-label="' + esc(t("wl_h")) + '">' + ["shop", "costume", "party", "nap"].map(function (m) {
        return '<button type="button" class="wl-mode" data-wl-mode="' + m + '" aria-pressed="' + (WL.mode === m) + '">' + esc(t("wl_" + m)) + "</button>";
      }).join("") + "</div>";
  }
  function wlSet(which, pose, line) {
    var fig = document.getElementById(which === "m" ? "wlFigM" : "wlFigP"), say = document.getElementById(which === "m" ? "wlSayM" : "wlSayP");
    if (!fig || !window.MINISE_CAT) return;
    WL[which] = pose;
    fig.innerHTML = window.MINISE_CAT(pose);
    if (line) { say.textContent = line; say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop"); }
    if (!calm) { fig.classList.remove("jump"); void fig.offsetWidth; fig.classList.add("jump"); }
  }
  function wlBurst(n) {
    var box = document.getElementById("wlBurst");
    if (!box || calm) return;
    var cols = ["#f4a9ba", "#a9bfdb", "#24396a", "#f3d873", "#a3dcc9", "#fff"];
    for (var i = 0; i < (n || 26); i++) {
      var b = document.createElement("i");
      b.style.setProperty("--x", Math.round(Math.random() * 360 - 180) + "px");
      b.style.setProperty("--y", Math.round(-80 - Math.random() * 200) + "px");
      b.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
      b.style.background = cols[i % cols.length];
      b.style.animationDelay = Math.round(Math.random() * 150) + "ms";
      b.addEventListener("animationend", function () { this.remove(); });
      box.appendChild(b);
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-wl]");
    if (b) {
      var w = b.getAttribute("data-wl"), list = w === "m" ? WL_M : WL_P, cur = WL[w], next = cur;
      while (next === cur) next = list[Math.floor(Math.random() * list.length)];
      var n = w === "m" ? (WL.lm++ % 6) + 1 : (WL.lp++ % 6) + 1;
      wlSet(w, next, t("wl_" + w + n));
      return;
    }
    b = e.target.closest("[data-wl-mode]");
    if (b) {
      var m = b.getAttribute("data-wl-mode"), set = WL_MODES[m];
      WL.mode = m;
      document.getElementById("wlStage").setAttribute("data-mode", m);
      document.querySelectorAll("[data-wl-mode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      wlSet("m", set[0], t(set[2]));
      setTimeout(function () { wlSet("p", set[1], t(set[3])); }, calm ? 0 : 180);
      if (m === "party" || m === "costume") wlBurst(m === "party" ? 34 : 20);
    }
  });

  // the story game: each scene has who is in it, its text and the choices; endings have a badge charm
  var SG_SCENES = {
    s1: { cats: ["phone", "peniPeek"], ch: [["sg_c1a", "s2a"], ["sg_c1b", "s2b"]] },
    s2a: { cats: ["search"], ch: [["sg_c2a1", "s3a"], ["sg_c2a2", "s3b"]] },
    s2b: { cats: ["peniBox"], ch: [["sg_c2b1", "s3c"], ["sg_c2b2", "s3d"]] },
    s3a: { cats: ["peniYarn"], ch: [["sg_c3a1", "eA"], ["sg_c3a2", "s4"]] },
    s3b: { cats: ["gift", "peniBunnySleep"], ch: [["sg_c3b1", "s3d"], ["sg_c3b2", "eB"]] },
    s3c: { cats: ["peniSparkle"], charms: ["A17", "A1", "C17"], ch: [["sg_c3c1", "eA"], ["sg_c3c2", "eC"]] },
    s3d: { cats: ["heart", "peniHeart"], ch: [["sg_c3d1", "eA"], ["sg_c3d2", "eD"]] },
    s4: { cats: ["shark", "peniYarn"], ch: [["sg_c4", "eA"]] },
    eA: { cats: ["gift", "peniYay"], end: "A", badge: "C12", cta: ["#c-photo", "sg_cta_photo"] },
    eB: { cats: ["drink", "peniBunnySleep"], end: "B", badge: "C17", cta: ["#c-photo", "sg_cta_photo"] },
    eC: { cats: ["paint", "peniBracelet"], end: "C", badge: "A1", cta: ["#make", "nav_make"] },
    eD: { cats: ["heart", "peniGift"], end: "D", badge: "A18", cta: ["#c-photo", "sg_cta_photo"] }
  };
  var SG = { at: "s1", steps: 0, found: [], fresh: false };
  try { SG.found = (JSON.parse(localStorage.getItem("minise_sg_endings") || "[]") || []).filter(function (x) { return /^[ABCD]$/.test(x); }); } catch (e) { /* ignore */ }
  function sgBadges() {
    return '<div class="sg-badges">' + ["A", "B", "C", "D"].map(function (k) {
      var sc = SG_SCENES["e" + k], got = SG.found.indexOf(k) > -1;
      return '<span class="sg-badge' + (got ? " got" : "") + '" title="' + esc(got ? t("sg_e" + k + "_t") : "?") + '">' + (got ? charmImg(sc.badge) : "<b>?</b>") + "</span>";
    }).join("") + '<span class="sg-count tn">' + esc(t("sg_found", { n: SG.found.length })) + "</span></div>";
  }
  function sgScene() {
    var sc = SG_SCENES[SG.at];
    var pics = sc.cats.map(function (p) { return kitty(p, "sg-k" + (sc.cats.length === 1 ? " sg-solo" : "")); }).join("") +
      (sc.charms ? '<span class="sg-charms">' + sc.charms.map(function (c) { return charmImg(c); }).join("") + "</span>" : "");
    var body;
    if (sc.end) {
      var all = SG.found.length === 4;
      body = '<p class="sg-tag">' + esc(t(SG.fresh ? "sg_new" : "sg_seen")) + "</p><h4>" + esc(t("sg_e" + sc.end + "_t")) + "</h4><p>" + esc(t("sg_e" + sc.end)) + "</p>" +
        (all ? '<p class="sg-all">' + esc(t("sg_all")) + "</p>" : "") +
        '<div class="sg-ch"><button class="btn solid" type="button" data-sg-again>' + esc(t("sg_again")) + '</button><a class="btn" href="' + sc.cta[0] + '">' + esc(t(sc.cta[1])) + "</a></div>";
    } else {
      body = "<p>" + esc(t("sg_" + SG.at)) + '</p><div class="sg-ch">' + sc.ch.map(function (c, i) {
        return '<button class="btn' + (i ? "" : " solid") + '" type="button" data-sg-go="' + c[1] + '">' + esc(t(c[0])) + "</button>";
      }).join("") + "</div>";
    }
    return '<div class="sg-scene' + (sc.end ? " is-end" : "") + '"><div class="sg-pic">' + pics + (sc.end ? '<span class="sg-medal">' + charmImg(sc.badge) + "</span>" : "") + '</div><div class="sg-text" role="status">' + body + "</div></div>";
  }
  function sgHTML() {
    return '<div class="sg" id="sg"><div class="sg-top"><div><p class="eyebrow">' + esc(t("sg_eyebrow")) + "</p><h2>" + esc(t("sg_h")) + "</h2><p>" + esc(t("sg_p")) + '</p></div><div id="sgBadges">' + sgBadges() + "</div></div>" +
      '<div id="sgScene">' + sgScene() + "</div></div>";
  }
  function sgGo(to) {
    SG.at = to;
    SG.steps++;
    var sc = SG_SCENES[to];
    SG.fresh = false;
    if (sc.end && SG.found.indexOf(sc.end) < 0) {
      SG.found.push(sc.end);
      SG.fresh = true;
      try { localStorage.setItem("minise_sg_endings", JSON.stringify(SG.found)); } catch (e) { /* ignore */ }
    }
    var box = document.getElementById("sgScene");
    if (!box) return;
    box.innerHTML = sgScene();
    document.getElementById("sgBadges").innerHTML = sgBadges();
    if (!calm) { box.classList.remove("turn"); void box.offsetWidth; box.classList.add("turn"); }
    var r = box.getBoundingClientRect();
    if (r.top < 90 || r.top > window.innerHeight - 160) box.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sg-go]");
    if (b) { sgGo(b.getAttribute("data-sg-go")); return; }
    if (e.target.closest("[data-sg-again]")) { SG.steps = 0; sgGo("s1"); }
  });

  // the quiz: four questions, each answer counts for Mumi or Peni
  var QZ_Q = [[], [], [], ["A18", "C18"]];
  var QZ = { i: 0, m: 0, p: 0 };
  function qzBody() {
    if (QZ.i >= 4) {
      var who = QZ.m > QZ.p ? "m" : QZ.p > QZ.m ? "p" : "b";
      var pics = who === "m" ? kitty("yay", "qz-k") : who === "p" ? kitty("peniYay", "qz-k") : kitty("yay", "qz-k") + kitty("peniYay", "qz-k");
      var cta = { m: ["#c-photo", "qz_rm_cta"], p: ["#make", "qz_rp_cta"], b: ["#shop-set", "qz_rb_cta"] }[who];
      return '<div class="qz-result"><div class="qz-pics">' + pics + '</div><div><h3>' + esc(t("qz_r" + who + "_h")) + "</h3><p>" + esc(t("qz_r" + who)) + '</p><div class="sg-ch"><a class="btn solid" href="' + cta[0] + '">' + esc(t(cta[1])) + '</a><button class="btn" type="button" data-qz-again>' + esc(t("qz_again")) + "</button></div></div></div>";
    }
    var n = QZ.i + 1, imgs = QZ_Q[QZ.i];
    var dots = [0, 1, 2, 3].map(function (d) { return '<i class="' + (d < QZ.i ? "done" : d === QZ.i ? "on" : "") + '"></i>'; }).join("");
    return '<p class="qz-n tn"><span class="qz-dots">' + dots + "</span>" + esc(t("qz_q", { n: n })) + "</p><h3>" + esc(t("qz_" + n)) + '</h3><div class="qz-ans">' +
      ["m", "p"].map(function (w, i) {
        return '<button type="button" class="qz-a" data-qz="' + w + '">' + (imgs[i] ? charmImg(imgs[i]) : "") + "<span>" + esc(t("qz_" + n + w)) + "</span></button>";
      }).join("") + "</div>";
  }
  function qzHTML() {
    return '<div class="qz"><div class="qz-head">' + kitty("peek", "qz-peek") + kitty("peniPeek", "qz-peek") + '<div><p class="eyebrow">' + esc(t("qz_eyebrow")) + "</p><h2>" + esc(t("qz_h")) + "</h2><p>" + esc(t("qz_p")) + '</p></div></div><div class="qz-body" id="qzBody">' + qzBody() + "</div></div>";
  }
  function qzRender() {
    var box = document.getElementById("qzBody");
    if (!box) return;
    box.innerHTML = qzBody();
    if (!calm) { box.classList.remove("turn"); void box.offsetWidth; box.classList.add("turn"); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-qz]");
    if (b) { QZ[b.getAttribute("data-qz")]++; QZ.i++; qzRender(); return; }
    if (e.target.closest("[data-qz-again]")) { QZ = { i: 0, m: 0, p: 0 }; qzRender(); }
  });

  function worldPage() {
    if (!GM.cards.length) gmNew();
    var meet = [["mumi", "wave", "wl_m_line"], ["peni", "peniWave", "wl_p_line"]].map(function (c) {
      return '<a class="wl-meet" href="#' + c[0] + '">' + kitty(c[1], "wl-meet-k") + "<div><h3>" + esc(t(c[0] === "mumi" ? "mid_name" : "peni_name")) + "</h3><p>" + esc(t(c[2])) + '</p><span class="link">' + esc(t(c[0] + "_link")) + " →</span></div></a>";
    }).join("");
    return '<section class="wl-hero"><div class="wrap"><div class="wl-head"><p class="eyebrow">' + esc(t("wl_eyebrow")) + "</p><h1>" + esc(t("wl_h")) + '</h1><p class="lead">' + esc(t("wl_lead")) + "</p></div>" +
      wlStage() + '<p class="wl-hint">' + esc(t("wl_tap")) + "</p></div></section>" +
      '<section class="section band"><div class="wrap">' + filmHTML() + "</div></section>" +
      '<section class="section tight"><div class="wrap"><div class="wl-meets">' + meet + '</div><div class="wl-more">' + [["#gift", "gift", "gf_link"], ["#note", "peniWave", "nt_link"], ["#make", "peniBracelet", "nav_make"], ["#wish", "peniBox", "wish_h"]].map(function (m) { return '<a href="' + m[0] + '">' + kitty(m[1], "wl-more-k") + "<span>" + esc(t(m[2])) + "</span></a>"; }).join("") + "</div></div></section>" +
      '<section class="section band"><div class="wrap">' + sgHTML() + "</div></section>" +
      '<section class="section"><div class="wrap">' + qzHTML() + "</div></section>" +
      '<section class="section band"><div class="wrap">' + storyHTML() + "</div></section>" +
      '<section class="section"><div class="wrap wl-play">' + fortuneHTML() + gameHTML() + "</div></section>";
  }

  /* Gift finder (#gift): four little questions, then Mumi & Peni open a gift box with matching pieces
     from the catalogue (scored by type, tags, initials and price). */
  var GF_Q = [
    ["who", [["partner", "heart"], ["friend", "peniWave"], ["family", "gift"], ["me", "sparkle"], ["pet", "peniYarn"]]],
    ["occ", [["bday", "yay"], ["anniv", "peniHeart"], ["just", "peniMilk"], ["xmas", "peniGift"]]],
    ["style", [["photo", "phone"], ["cute", "peniBunny"], ["initial", "paint"], ["sparkle", "peniSparkle"]]],
    ["budget", [["low", "drink"], ["mid", "peniPhone"], ["any", "shark"]]]
  ];
  var GF = { step: 0, a: {} };
  var PAW = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="15.5" rx="5.2" ry="4.4"/><circle cx="5.6" cy="10.4" r="2.2"/><circle cx="9.5" cy="6.6" r="2.3"/><circle cx="14.5" cy="6.6" r="2.3"/><circle cx="18.4" cy="10.4" r="2.2"/></svg>';
  function gfLabel(q, o) {
    if (q === "budget") return t("gf_budget_" + o, { p: money(o === "low" ? 220000 : 240000) });
    return t("gf_" + q + "_" + o);
  }
  function gfScore(p, a) {
    var g = p.g || [], ty = p.t || [], name = String(p.n).toLowerCase(), s = 0;
    var has = function (x) { return g.indexOf(x) > -1; }, is = function (x) { return ty.indexOf(x) > -1; };
    if (a.who === "partner") s += (has("couple") ? 4 : 0) + (is("set") ? 3 : 0) + (is("locket") ? 1 : 0);
    if (a.who === "friend") s += (is("bracelet") ? 2 : 0) + (has("clover") || has("butterfly") ? 2 : 0) + (/friend|bond|twinkle|buddy/.test(name) ? 2 : 0);
    if (a.who === "family") s += (has("photo") ? 3 : 0) + (is("locket") ? 2 : 0) + (has("flower") ? 1 : 0);
    if (a.who === "me") s += is("necklace") || is("bracelet") ? 1 : 0;
    if (a.who === "pet") s += has("pet") ? 6 : 0;
    if (a.occ === "bday") s += (has("photo") ? 1 : 0) + (p.li ? 1 : 0);
    if (a.occ === "anniv") s += (has("couple") ? 3 : 0) + (has("photo") ? 2 : 0);
    if (a.occ === "just") s += has("clover") || has("butterfly") || has("flower") ? 2 : 0;
    if (a.occ === "xmas") s += has("christmas") ? 5 : 0;
    if (a.style === "photo") s += (has("photo") ? 4 : 0) + (is("locket") ? 2 : 0);
    if (a.style === "cute") s += has("clover") || has("butterfly") || has("pet") || has("flower") ? 3 : 0;
    if (a.style === "initial") s += p.li ? 4 : 0;
    if (a.style === "sparkle") s += /twinkle|glitter|glitz|crystal|star|sparkle|holo|shimmer/.test(name) ? 4 : 0;
    return s + Math.min(2, (p.lk || 0) / 500) + (p.cur ? 0.5 : 0);
  }
  function gfPicks(a) {
    var price = function (p) { return p.o[0].price; };
    var priced = P.filter(function (p) { return p.o.length && !p.so && p.s !== MYO && p.s !== ITB; });
    var fits = a.budget === "low" ? function (p) { return price(p) <= 220000; } : a.budget === "mid" ? function (p) { return price(p) > 200000 && price(p) <= 260000; } : function () { return true; };
    var list = priced.filter(fits);
    if (list.length < 3) list = priced;
    return list.map(function (p) { return [gfScore(p, a), p]; })
      .sort(function (x, y) { return (y[0] - x[0]) || byLikes(x[1], y[1]); })
      .slice(0, 6).map(function (x) { return x[1]; });
  }
  function gfPaws() {
    return '<span class="gf-paws" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < GF.step ? "done" : i === GF.step ? "on" : "") + '">' + PAW + "</i>"; }).join("") + "</span>";
  }
  function gfBody() {
    if (GF.step >= 4) return gfResult();
    var q = GF_Q[GF.step], mumi = GF.step % 2 === 0;
    var tiles = q[1].map(function (o) {
      return '<button type="button" class="gf-tile" data-gf="' + o[0] + '">' + kitty(o[1], "gf-tk") + "<span>" + esc(gfLabel(q[0], o[0])) + "</span></button>";
    }).join("");
    return '<div class="gf-step"><div class="gf-top">' + gfPaws() + '<span class="tn">' + esc(t("gf_step", { n: GF.step + 1 })) + "</span>" +
      (GF.step ? '<button class="link gf-back" type="button" data-gf-back>← ' + esc(t("gf_back")) + "</button>" : "") + "</div>" +
      '<div class="gf-ask">' + kitty(mumi ? "wave" : "peniWave", "gf-ask-k") + '<p class="gf-say">' + esc(t("gf_say_" + q[0])) + "</p></div>" +
      "<h2>" + esc(t("gf_q_" + q[0])) + '</h2><div class="gf-tiles gf-n' + q[1].length + '">' + tiles + "</div></div>";
  }
  function gfResult() {
    var a = GF.a, picks = gfPicks(a);
    var chips = GF_Q.map(function (q) { return "<span>" + esc(gfLabel(q[0], a[q[0]])) + "</span>"; }).join("");
    var ask = inLang(shopLang(), function () { return t("gf_msg") + "\n" + GF_Q.map(function (q) { return "• " + gfLabel(q[0], a[q[0]]); }).join("\n") + (picks.length ? "\n" + picks.slice(0, 3).map(function (p) { return p.n; }).join(", ") : ""); });
    return '<div class="gf-result"><div class="gf-box" aria-hidden="true"><span class="gf-pop">' + kitty("yay", "gf-pop-k") + kitty("peniYay", "gf-pop-k") + '</span><span class="gf-base"></span><span class="gf-lid"></span></div>' +
      '<p class="eyebrow">' + esc(t("gf_r_eyebrow")) + "</p><h2>" + esc(t("gf_r_h")) + '</h2><p class="gf-chips">' + chips + '</p><p class="lead">' + esc(t("gf_r_p")) + "</p>" +
      '<div class="grid gf-grid">' + picks.map(card).join("") + "</div>" +
      '<div class="gf-more"><a class="btn solid" href="#make">' + esc(t("gf_r_own")) + '</a><a class="btn" href="' + esc(waLink(ask)) + '" target="_blank" rel="noopener">' + esc(t("gf_r_ask")) + '</a><a class="btn" href="#note">' + esc(t("nt_link")) + '</a><button class="btn ghost" type="button" data-gf-again>' + esc(t("gf_r_again")) + "</button></div></div>";
  }
  function giftPage() {
    return '<section class="gf-hero"><div class="wrap"><div class="gf-head"><div><p class="eyebrow">' + esc(t("gf_eyebrow")) + "</p><h1>" + esc(t("gf_h")) + '</h1><p class="lead">' + esc(t("gf_lead")) + "</p></div></div>" +
      '<div class="gf-card" id="gfCard">' + gfBody() + "</div></div></section>";
  }
  function gfRender() {
    var box = document.getElementById("gfCard");
    if (!box) return;
    box.innerHTML = gfBody();
    if (!calm) { box.classList.remove("turn"); void box.offsetWidth; box.classList.add("turn"); }
    var r = box.getBoundingClientRect();
    if (r.top < 80) box.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-gf]");
    if (b) { GF.a[GF_Q[GF.step][0]] = b.getAttribute("data-gf"); GF.step++; gfRender(); return; }
    if (e.target.closest("[data-gf-back]")) { GF.step = Math.max(0, GF.step - 1); gfRender(); return; }
    if (e.target.closest("[data-gf-again]")) { GF = { step: 0, a: {} }; gfRender(); }
  });

  /* ---------- Wishlist ("Peni's treasure box"): a heart on every piece, kept on this device ---------- */
  var WISH = [];
  try { WISH = (JSON.parse(localStorage.getItem("minise_wish") || "[]") || []).filter(function (s) { return typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s); }).slice(0, 80); } catch (e) { /* ignore */ }
  var HEART_I = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.8-4.7-7.8-10.4A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.8 2.7c0 5.7-7.8 10.4-7.8 10.4Z"/></svg>';
  function wishSave() { try { localStorage.setItem("minise_wish", JSON.stringify(WISH)); } catch (e) { /* ignore */ } wishCount(); }
  function wishCount() {
    var el = document.getElementById("wishCount");
    if (!el) return;
    var n = WISH.filter(function (s) { return bySlug[s]; }).length;
    el.textContent = n;
    el.hidden = !n;
  }
  function wishBtn(s) {
    var on = WISH.indexOf(s) > -1;
    return '<button type="button" class="wish-btn' + (on ? " on" : "") + '" data-wish="' + s + '" aria-pressed="' + on + '" aria-label="' + esc(t(on ? "wish_remove" : "wish_add")) + '">' + HEART_I + "</button>";
  }
  function wishPdp(s) {
    var on = WISH.indexOf(s) > -1;
    return '<button type="button" class="btn ghost wish-pdp' + (on ? " on" : "") + '" data-wish="' + s + '" aria-pressed="' + on + '">' + HEART_I + "<span>" + esc(t(on ? "wish_saved" : "wish_save")) + "</span></button>";
  }
  function wishToggle(s) {
    var i = WISH.indexOf(s), on = i < 0;
    if (on) WISH.unshift(s); else WISH.splice(i, 1);
    wishSave();
    document.querySelectorAll('[data-wish="' + s + '"]').forEach(function (b) {
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      if (b.classList.contains("wish-pdp")) b.querySelector("span").textContent = t(on ? "wish_saved" : "wish_save");
      else b.setAttribute("aria-label", t(on ? "wish_remove" : "wish_add"));
      if (on && !calm) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    });
    toast(t(on ? "wish_added" : "wish_removed"), on ? "peniHeart" : null);
    if (current === "wish" && !on) { var y = window.scrollY; route(); window.scrollTo(0, y); }
  }
  function wishPage() {
    var list = WISH.map(function (s) { return bySlug[s]; }).filter(Boolean);
    var head = '<section class="wrap page-head kittied">' + kitty("peniBox", "head-kitty") + '<p class="eyebrow">' + esc(t("wish_eyebrow")) + "</p><h1>" + esc(t("wish_h")) + '</h1><p class="lead">' + esc(t(list.length ? "wish_lead" : "wish_empty")) + "</p></section>";
    if (!list.length) return head + '<section class="section tight"><div class="wrap wish-empty">' + kitty("peniSleep", "empty-kitty") + '<div class="wish-tools"><a class="btn solid" href="#shop">' + esc(t("back_shop")) + '</a><a class="btn" href="#gift">' + esc(t("gf_link")) + "</a></div></div></section>";
    var msg = inLang(shopLang(), function () { return t("wish_msg") + "\n" + list.map(function (p) { return "• " + p.n + " " + location.origin + "/#p-" + p.s; }).join("\n"); });
    return head + '<section class="section tight"><div class="wrap"><div class="wish-tools"><a class="btn solid" target="_blank" rel="noopener" href="' + esc(waLink(msg)) + '">' + esc(t("wish_share")) + '</a><a class="btn" href="#note">' + esc(t("nt_link")) + '</a><button class="btn ghost" type="button" data-wish-clear>' + esc(t("wish_clear")) + "</button></div>" +
      '<div class="grid">' + list.map(card).join("") + "</div></div></section>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-wish]");
    if (b) { e.preventDefault(); wishToggle(b.getAttribute("data-wish")); return; }
    b = e.target.closest("[data-wish-clear]");
    if (b) {
      // two taps, so a list is never cleared by accident
      if (!b.classList.contains("sure")) {
        b.classList.add("sure");
        b.textContent = t("wish_clear2");
        setTimeout(function () { if (b.isConnected) { b.classList.remove("sure"); b.textContent = t("wish_clear"); } }, 3000);
        return;
      }
      WISH = [];
      wishSave();
      route();
    }
  });

  /* back to the top: a little paw button once you have scrolled down a long page */
  var TOP = document.createElement("button");
  TOP.type = "button";
  TOP.className = "to-top";
  TOP.hidden = true;
  TOP.setAttribute("data-t-label", "to_top");
  TOP.setAttribute("aria-label", "Back to top");
  TOP.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(TOP);
  TOP.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); });
  window.addEventListener("scroll", function () { var hide = window.scrollY < 900 || current === "make" || current === "italian"; if (TOP.hidden !== hide) TOP.hidden = hide; }, { passive: true });

  /* ---------- Cute note maker (#note): write a note on Mumi & Peni paper, save it as a picture or add it to the order ---------- */
  var NOTE = window.MINISE_NOTE || { PAPERS: { tea: ["drink"] }, LOOK: {}, STK: {} };
  var NT_PAPERS = NOTE.PAPERS, NT_LOOK = NOTE.LOOK, STK = NOTE.STK;
  var NT = { to: "", from: "", msg: "", paper: "tea", st: ["heart", "star"], sent: false };
  try {
    var nt0 = JSON.parse(sessionStorage.getItem("minise_note") || "null");
    if (nt0) {
      NT.to = String(nt0.to || "").slice(0, 40); NT.from = String(nt0.from || "").slice(0, 40); NT.msg = String(nt0.msg || "").slice(0, 160);
      if (NT_PAPERS[nt0.paper]) NT.paper = nt0.paper;
      if (Array.isArray(nt0.st)) NT.st = nt0.st.filter(function (s) { return STK[s]; }).slice(0, 3);
    }
  } catch (e) { /* start fresh */ }
  function ntSave() { try { sessionStorage.setItem("minise_note", JSON.stringify({ to: NT.to, from: NT.from, msg: NT.msg, paper: NT.paper, st: NT.st })); } catch (e) { /* ignore */ } }
  function giftNote() { try { return sessionStorage.getItem("minise_giftnote") || ""; } catch (e) { return ""; } }
  function ntCard() {
    var cats = NT_PAPERS[NT.paper].map(function (p) { return kitty(p, "nt-cat"); }).join("");
    var st = NT.st.map(function (s, i) { return '<span class="nt-st nt-st' + (i + 1) + '">' + STK[s] + "</span>"; }).join("");
    return '<div class="nt-card nt-p-' + NT.paper + '" id="ntCard"><span class="nt-tape" aria-hidden="true"></span>' + st +
      '<p class="nt-to">' + esc(t("nt_to")) + ': <b class="' + (NT.to ? "" : "nt-ph") + '">' + esc(NT.to || t("nt_to_ph")) + "</b></p>" +
      '<p class="nt-msg' + (NT.msg ? "" : " nt-ph") + '">' + esc(NT.msg || t("nt_msg_ph")) + "</p>" +
      '<p class="nt-from">' + esc(t("nt_from")) + ': <b class="' + (NT.from ? "" : "nt-ph") + '">' + esc(NT.from || t("nt_from_ph")) + "</b></p>" +
      '<span class="nt-cats" aria-hidden="true">' + cats + "</span></div>";
  }
  function ntPapers() {
    return Object.keys(NT_PAPERS).map(function (p) {
      return '<button type="button" class="nt-paper nt-p-' + p + '" data-nt-paper="' + p + '" aria-pressed="' + (NT.paper === p) + '"><span class="nt-sw">' + kitty(NT_PAPERS[p][0], "nt-sw-k") + "</span><span>" + esc(t("nt_p_" + p)) + "</span></button>";
    }).join("");
  }
  function ntStickers() {
    return Object.keys(STK).map(function (s) {
      return '<button type="button" class="nt-stk" data-nt-st="' + s + '" aria-pressed="' + (NT.st.indexOf(s) > -1) + '" aria-label="' + esc(t("nt_st_" + s)) + '">' + STK[s] + "</button>";
    }).join("");
  }
  function notePage() {
    NT.sent = false;
    return '<section class="nt-hero"><div class="wrap"><div class="gf-head"><div><p class="eyebrow">' + esc(t("nt_eyebrow")) + "</p><h1>" + esc(t("nt_h")) + '</h1><p class="lead">' + esc(t("nt_lead")) + "</p></div></div>" +
      '<div class="nt-grid"><div class="nt-preview"><div class="nt-env" id="ntEnv"><span class="nt-env-back" aria-hidden="true"></span><div id="ntCardBox">' + ntCard() + '</div><span class="nt-env-front" aria-hidden="true"></span><span class="nt-seal" aria-hidden="true">' + STK.heart + "</span></div>" +
      '<div class="nt-peni">' + kitty("peniWave", "nt-peni-k") + '<p class="nt-say" id="ntSay" role="status">' + esc(t("nt_say")) + "</p></div></div>" +
      '<form class="nt-form" id="ntForm" novalidate>' +
      '<div class="field"><label for="ntTo">' + esc(t("nt_to")) + '</label><input type="text" id="ntTo" maxlength="40" autocomplete="off" placeholder="' + esc(t("nt_to_ph")) + '" value="' + esc(NT.to) + '"></div>' +
      '<div class="field"><label for="ntMsg">' + esc(t("nt_msg")) + '</label><textarea id="ntMsg" maxlength="160" placeholder="' + esc(t("nt_msg_ph")) + '">' + esc(NT.msg) + '</textarea><span class="hint tn" id="ntCount">' + NT.msg.length + "/160</span></div>" +
      '<div class="field"><label for="ntFrom">' + esc(t("nt_from")) + '</label><input type="text" id="ntFrom" maxlength="40" autocomplete="off" placeholder="' + esc(t("nt_from_ph")) + '" value="' + esc(NT.from) + '"></div>' +
      '<div class="field"><span class="lbl">' + esc(t("nt_paper")) + '</span><div class="nt-papers" id="ntPapers">' + ntPapers() + "</div></div>" +
      '<div class="field"><span class="lbl">' + esc(t("nt_stickers")) + '</span><div class="nt-stks" id="ntStks">' + ntStickers() + "</div></div>" +
      '<p class="err" id="ntErr" hidden>' + esc(t("nt_empty")) + "</p>" +
      '<div class="nt-actions"><button class="btn solid" type="button" data-nt-add>' + esc(t("nt_add")) + '</button><button class="btn" type="button" data-nt-save>' + esc(t("nt_save")) + '</button><button class="btn ghost" type="button" data-nt-copy>' + esc(t("nt_copy")) + "</button></div>" +
      '<div id="ntDone"></div></form></div></div></section>';
  }
  function ntRefresh() {
    var box = document.getElementById("ntCardBox");
    if (box) box.innerHTML = ntCard();
    var env = document.getElementById("ntEnv");
    if (env) env.classList.remove("send");
    ntSave();
  }
  function ntSay(text) {
    var el = document.getElementById("ntSay");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function ntText() { return (NT.to ? t("nt_to") + ": " + NT.to + "\n" : "") + NT.msg + (NT.from ? "\n" + t("nt_from") + ": " + NT.from : ""); }
  function ntNeedMsg() {
    if (NT.msg.trim()) return false;
    document.getElementById("ntErr").hidden = false;
    document.getElementById("ntMsg").focus();
    return true;
  }
  // an SVG string as a picture the canvas can draw
  function svgImage(svg, w, h) {
    var s = svg.replace(/^<svg/, "<svg" + (svg.indexOf("xmlns=") < 0 ? ' xmlns="http://www.w3.org/2000/svg"' : "") + ' width="' + w + '" height="' + h + '"');
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    });
  }
  function wrapLines(x, text, max) {
    var parts = [];
    if (window.Intl && Intl.Segmenter) {
      var seg = new Intl.Segmenter(lang === "zh" ? "zh" : lang === "lo" ? "lo" : "en", { granularity: "word" });
      Array.from(seg.segment(text)).forEach(function (s) {
        if (!s.isWordLike && !/^\s+$/.test(s.segment) && parts.length && s.segment !== "\n") parts[parts.length - 1] += s.segment;
        else parts.push(s.segment);
      });
    } else parts = text.split(/(\s+)/);
    var lines = [], line = "";
    parts.forEach(function (p) {
      if (p === "\n") { lines.push(line); line = ""; return; }
      var test = line + p;
      if (x.measureText(test).width > max && line.trim()) { lines.push(line.trim()); line = p.replace(/^\s+/, ""); }
      else line = test;
    });
    if (line.trim()) lines.push(line.trim());
    return lines;
  }
  function ntPicture() {
    return NOTE.draw({ paper: NT.paper, to: NT.to || t("nt_to_ph"), msg: NT.msg || t("nt_msg_ph"), from: NT.from || t("nt_from_ph"), st: NT.st, toLabel: t("nt_to"), fromLabel: t("nt_from"), lang: lang })
      .then(function (c) { return new Promise(function (res) { c.toBlob(res, "image/png"); }); });
  }
  document.addEventListener("input", function (e) {
    var id = e.target.id;
    if (id !== "ntTo" && id !== "ntMsg" && id !== "ntFrom") return;
    NT[id === "ntTo" ? "to" : id === "ntMsg" ? "msg" : "from"] = e.target.value;
    if (id === "ntMsg") { document.getElementById("ntCount").textContent = e.target.value.length + "/160"; document.getElementById("ntErr").hidden = true; }
    ntRefresh();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-nt-paper]");
    if (b) {
      NT.paper = b.getAttribute("data-nt-paper");
      document.querySelectorAll("[data-nt-paper]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      ntRefresh();
      ntSay(t("nt_p_" + NT.paper) + "! " + t("nt_say_paper"));
      return;
    }
    b = e.target.closest("[data-nt-st]");
    if (b) {
      var s = b.getAttribute("data-nt-st"), i = NT.st.indexOf(s);
      if (i > -1) NT.st.splice(i, 1);
      else { if (NT.st.length >= 3) NT.st.shift(); NT.st.push(s); }
      document.getElementById("ntStks").innerHTML = ntStickers();
      ntRefresh();
      return;
    }
    if (e.target.closest("[data-nt-copy]")) { if (!ntNeedMsg()) copyText(ntText()); return; }
    b = e.target.closest("[data-nt-save]");
    if (b) {
      if (ntNeedMsg() || !window.MINISE_CAT) return;
      b.disabled = true;
      ntPicture().then(function (blob) {
        b.disabled = false;
        if (!blob) return;
        var url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url; a.download = "minise-note.png";
        document.body.appendChild(a); a.click();
        setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
        toast(t("nt_saved"), "peniSparkle");
      }).catch(function () { b.disabled = false; });
      return;
    }
    if (e.target.closest("[data-nt-add]")) {
      if (ntNeedMsg()) return;
      var text = inLang(shopLang(), function () { return t("nt_order") + " (" + t("nt_p_" + NT.paper) + ")\n" + ntText(); });
      try { sessionStorage.setItem("minise_giftnote", text); sessionStorage.setItem("minise_notecard", "1"); } catch (err) { /* ignore */ }
      var env = document.getElementById("ntEnv");
      if (env && !calm) { env.classList.remove("send"); void env.offsetWidth; env.classList.add("send"); }
      ntSay(t("nt_say_sent"));
      document.getElementById("ntDone").innerHTML = '<p class="notice nt-ok">' + esc(t("nt_added")) + '</p><div class="nt-actions">' +
        (bag.length ? '<a class="btn solid" href="#checkout">' + esc(t("nt_go_bag")) + "</a>" : '<a class="btn solid" href="#gift">' + esc(t("gf_link")) + '</a><a class="btn" href="#shop">' + esc(t("back_shop")) + "</a>") + "</div>";
    }
  });

  /* checkout: an optional note card in the delivery step. It shares the note maker's words and paper. */
  function ncIsOn() { try { var f = sessionStorage.getItem("minise_notecard"); return f === "1" || (f !== "0" && !!giftNote()); } catch (e) { return false; } }
  function ncMini() {
    return '<div class="nc-mini nt-p-' + NT.paper + '"><span class="nt-tape" aria-hidden="true"></span>' + NT.st.map(function (s, i) { return '<span class="nc-st nc-st' + (i + 1) + '" aria-hidden="true">' + STK[s] + "</span>"; }).join("") +
      '<p class="nc-to">' + esc(t("nt_to")) + ': <b class="' + (NT.to ? "" : "nt-ph") + '">' + esc(NT.to || t("nt_to_ph")) + "</b></p>" +
      '<p class="nc-msg' + (NT.msg ? "" : " nt-ph") + '">' + esc(NT.msg || t("nt_msg_ph")) + "</p>" +
      '<p class="nc-from">' + esc(t("nt_from")) + ': <b class="' + (NT.from ? "" : "nt-ph") + '">' + esc(NT.from || t("nt_from_ph")) + "</b></p>" + kitty(NT_PAPERS[NT.paper][0], "nc-cat") + "</div>";
  }
  function noteCardHTML() {
    var on = ncIsOn();
    var papers = Object.keys(NT_PAPERS).map(function (p) {
      return '<label class="nt-paper nc-paper nt-p-' + p + '"><input type="radio" name="ncPaper" value="' + p + '"' + (NT.paper === p ? " checked" : "") + '><span class="nt-sw">' + kitty(NT_PAPERS[p][0], "nt-sw-k") + "</span><span>" + esc(t("nt_p_" + p)) + "</span></label>";
    }).join("");
    return '<div class="nc-box' + (on ? " on" : "") + '" id="ncBox"><label class="nc-toggle"><input type="checkbox" id="ncOn"' + (on ? " checked" : "") + '><span class="nc-check" aria-hidden="true"></span>' +
      '<span class="nc-txt"><b>' + esc(t("nc_h")) + "</b><small>" + esc(t("nc_sub")) + '</small></span><span class="nc-free">' + esc(t("nc_free")) + "</span>" + kitty("peniWave", "nc-k") + "</label>" +
      '<div class="nc-body" id="ncBody"' + (on ? "" : " hidden") + '><div class="nc-grid"><div class="nc-fields">' +
      field("ncTo", t("nt_to"), '<input type="text" id="ncTo" maxlength="40" autocomplete="off" placeholder="' + esc(t("nt_to_ph")) + '" value="' + esc(NT.to) + '">') +
      field("ncMsg", t("nt_msg"), '<textarea id="ncMsg" maxlength="160" placeholder="' + esc(t("nt_msg_ph")) + '">' + esc(NT.msg) + "</textarea>", NT.msg.length + "/160") +
      field("ncFrom", t("nt_from"), '<input type="text" id="ncFrom" maxlength="40" autocomplete="off" placeholder="' + esc(t("nt_from_ph")) + '" value="' + esc(NT.from) + '">') +
      "</div>" + '<div class="nc-prev" id="ncPrev">' + ncMini() + "</div></div>" +
      '<div class="field nc-paper-field"><span class="lbl">' + esc(t("nt_paper")) + '</span><div class="nc-papers" role="radiogroup">' + papers + "</div></div>" +
      '<p class="hint nc-more"><a class="link" href="#note">' + esc(t("nc_more")) + " →</a></p></div></div>";
  }
  // what the team reads in the order (in English or Lao)
  // the card exactly as it will be printed: its words in the customer's language, and its stickers.
  // The admin reads this back from the order note and draws the card (js/notecard.js).
  function ncCard() {
    var on = document.getElementById("ncOn");
    if (!on || !on.checked || !NT.msg.trim()) return null;
    return { paper: NT.paper, st: NT.st.slice(), text: (NT.to.trim() ? t("nt_to") + ": " + NT.to.trim() + "\n" : "") + NT.msg.trim().replace(/\n\s*\n+/g, "\n") + (NT.from.trim() ? "\n" + t("nt_from") + ": " + NT.from.trim() : "") };
  }
  // what the team reads in the order (the heading in English or Lao)
  function ncText(card) {
    if (!card) return "";
    return t("nc_order") + " (" + t("nt_p_" + card.paper) + "):\n" + card.text + (card.st.length ? "\n" + card.st.map(function (s) { return t("nt_st_" + s); }).join(" · ") : "");
  }
  document.addEventListener("change", function (e) {
    if (e.target.id === "ncOn") {
      var on = e.target.checked, box = document.getElementById("ncBox");
      box.classList.toggle("on", on);
      document.getElementById("ncBody").hidden = !on;
      try { sessionStorage.setItem("minise_notecard", on ? "1" : "0"); if (!on) sessionStorage.removeItem("minise_giftnote"); } catch (err) { /* ignore */ }
      if (!on) setErr("ncMsg", "");
      else if (!calm) { var b = document.getElementById("ncBody"); b.classList.remove("open"); void b.offsetWidth; b.classList.add("open"); }
    } else if (e.target.name === "ncPaper") {
      NT.paper = e.target.value;
      ntSave();
      document.getElementById("ncPrev").innerHTML = ncMini();
    }
  });
  document.addEventListener("input", function (e) {
    var id = e.target.id;
    if (id !== "ncTo" && id !== "ncMsg" && id !== "ncFrom") return;
    NT[id === "ncTo" ? "to" : id === "ncMsg" ? "msg" : "from"] = e.target.value;
    ntSave();
    document.getElementById("ncPrev").innerHTML = ncMini();
    if (id === "ncMsg") { var h = document.getElementById("ncMsgH"); if (h) h.textContent = e.target.value.length + "/160"; if (e.target.value.trim()) setErr("ncMsg", ""); }
  });

  /* ---------- The film: the Minise Arte story as a little cartoon. Scenes are drawn in SVG (park, booth, street, city, night),
     and the music is played live with Web Audio (a soft ukulele tune, bass and bells), starting only when someone presses Play. ---------- */
  var INKC = "#24396a";
  function fmSvg(inner) { return '<svg class="fm-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + "</svg>"; }
  function fmSky(v) {
    var g = { day: ["#b9e0f6", "#eef8fc"], sunset: ["#f6ad9b", "#fde3c4"], night: ["#18224a", "#3a4f86"], dusk: ["#b7a6e6", "#fbd5c4"] }[v];
    return '<defs><linearGradient id="fmSky-' + v + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></linearGradient>' +
      '<pattern id="fmCheck" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#f7c6d2"/><rect width="22" height="22" fill="#fff8fa"/><rect x="22" y="22" width="22" height="22" fill="#fff8fa"/></pattern></defs>' +
      '<rect width="1600" height="900" fill="url(#fmSky-' + v + ')"/>';
  }
  function fmSun(x, y, col) { return '<g class="fm-sun"><circle cx="' + x + '" cy="' + y + '" r="130" fill="' + col + '" opacity=".22"/><circle cx="' + x + '" cy="' + y + '" r="82" fill="' + col + '" stroke="' + INKC + '" stroke-width="3"/></g>'; }
  function fmMoon(x, y) { return '<g class="fm-glow"><circle cx="' + x + '" cy="' + y + '" r="110" fill="#fff3c4" opacity=".14"/></g><circle cx="' + x + '" cy="' + y + '" r="62" fill="#fff3c4" stroke="' + INKC + '" stroke-width="3"/><circle cx="' + (x - 18) + '" cy="' + (y - 14) + '" r="11" fill="#f1dfa0"/><circle cx="' + (x + 20) + '" cy="' + (y + 16) + '" r="8" fill="#f1dfa0"/>'; }
  function fmStars() { return [[120, 90], [300, 160], [460, 70], [640, 140], [820, 60], [980, 170], [1140, 90], [1460, 220], [220, 260], [760, 240]].map(function (s, i) { return '<circle class="fm-star s' + (i % 3) + '" cx="' + s[0] + '" cy="' + s[1] + '" r="' + (i % 2 ? 4 : 6) + '" fill="#fff6d2"/>'; }).join(""); }
  function fmCloud(x, y, s, cls) { return '<g class="fm-cloud ' + cls + '"><path transform="translate(' + x + " " + y + ") scale(" + s + ')" d="M0 40 C-2 14 26 2 46 14 C58 -12 108 -12 118 16 C142 4 172 20 164 46 Z" fill="#fff" stroke="' + INKC + '" stroke-width="3" stroke-linejoin="round"/></g>'; }
  function fmClouds() { return fmCloud(140, 120, 1.3, "c1") + fmCloud(620, 70, 1, "c2") + fmCloud(1000, 150, 1.5, "c3"); }
  function fmBirds() { return '<g class="fm-birds"><path d="M0 0 q14 -12 28 0 q14 -12 28 0 M70 30 q10 -9 20 0 q10 -9 20 0" fill="none" stroke="' + INKC + '" stroke-width="4" stroke-linecap="round" transform="translate(300 230)"/></g>'; }
  function fmHills(back, front) {
    return '<path class="fm-hill-b" d="M-40 540 C240 440 560 480 860 460 C1160 440 1400 490 1640 462 V900 H-40 Z" fill="' + back + '"/>' +
      '<path d="M-20 650 C360 570 760 650 1140 610 C1360 588 1500 616 1620 606 V900 H-20 Z" fill="' + front + '" stroke="' + INKC + '" stroke-width="3"/>';
  }
  function fmTree(x, y, s, leaf, lights) {
    var bulbs = lights ? [[-70, -6], [-28, 36], [14, -44], [54, 22], [84, -16], [-52, -62], [32, -86], [-6, 4]].map(function (b, i) { return '<circle class="fm-bulb b' + (i % 3) + '" cx="' + b[0] + '" cy="' + b[1] + '" r="10" stroke="' + INKC + '" stroke-width="2.5"/>'; }).join("") : "";
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><path d="M-16 0 L-11 168 L11 168 L16 0 Z" fill="#c1946a" stroke="' + INKC + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<g class="fm-sway"><circle cx="-62" cy="14" r="62" fill="' + leaf[0] + '" stroke="' + INKC + '" stroke-width="4"/><circle cx="62" cy="14" r="62" fill="' + leaf[0] + '" stroke="' + INKC + '" stroke-width="4"/><circle cx="0" cy="-38" r="86" fill="' + leaf[1] + '" stroke="' + INKC + '" stroke-width="4"/>' + bulbs + "</g></g>";
  }
  function fmFlowers(dark) {
    var cols = dark ? ["#8c9ccc", "#a99cd6", "#7f95c4"] : ["#f4a9ba", "#f3d873", "#ffffff", "#cdb6e3"];
    return '<g class="fm-flowers">' + [[90, 820], [230, 860], [420, 800], [560, 868], [1050, 830], [1190, 870], [1360, 812], [1500, 858], [700, 880], [900, 850]].map(function (f, i) {
      var c = cols[i % cols.length], p = "";
      for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; p += '<circle cx="' + (f[0] + Math.cos(a) * 11).toFixed(1) + '" cy="' + (f[1] + Math.sin(a) * 11).toFixed(1) + '" r="9" fill="' + c + '" stroke="' + INKC + '" stroke-width="2"/>'; }
      return '<g class="fm-fl f' + (i % 3) + '">' + p + '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="6" fill="#f6b84a"/></g>';
    }).join("") + "</g>";
  }
  function fmPark(o) {
    o = o || {};
    var leaf = o.dark ? ["#4c7f88", "#568a92"] : o.warm ? ["#9ccf86", "#a8d690"] : ["#7fc68c", "#8dcf99"];
    var hills = o.dark ? ["#3b5a8e", "#2e4b7d"] : o.warm ? ["#d9d79f", "#b4d18f"] : ["#b5e0b9", "#94cf9c"];
    return fmSky(o.sky || "day") + (o.dark ? fmStars() + fmMoon(1320, 170) : fmSun(o.warm ? 1200 : 1320, o.warm ? 330 : 170, o.warm ? "#ffd27a" : "#ffe7a0")) + (o.dark ? "" : fmClouds() + fmBirds()) +
      fmHills(hills[0], hills[1]) + (o.noTrees ? "" : fmTree(180, 470, 1, leaf, false) + fmTree(1430, 490, 0.85, leaf, false)) + (o.center ? fmTree(800, 470, 1.25, leaf, o.lights) : "") + fmFlowers(o.dark);
  }
  function fmEasel() {
    return '<g transform="translate(1010 430)"><g class="fm-pop"><path d="M30 0 L-10 300 M190 0 L230 300 M110 0 L110 300" stroke="#b98b62" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="-6" y="-10" width="232" height="190" rx="8" fill="#fffaf0" stroke="' + INKC + '" stroke-width="5"/>' +
      '<circle cx="70" cy="70" r="34" fill="#f3d873"/><path d="M20 160 C60 110 100 150 140 120 C170 100 200 130 210 150 L210 170 L10 170 Z" fill="#94cf9c"/><path d="M150 62 C140 48 146 38 155 42 C160 36 170 40 168 50 C166 60 156 64 150 62 Z" fill="#f4a9ba"/>' +
      '<rect x="20" y="186" width="180" height="14" rx="6" fill="#b98b62"/></g></g>';
  }
  function fmTent() {
    var scal = "";
    for (var i = 0; i < 8; i++) scal += '<path d="M' + (560 + i * 60) + " 420 a30 30 0 0 0 60 0 Z\" fill=\"" + (i % 2 ? "#a9bfdb" : "#3f5684") + '" stroke="' + INKC + '" stroke-width="3"/>';
    var str = "";
    for (var j = 0; j < 8; j++) str += '<path d="M' + (800 + (j - 4) * 30) + " 270 L" + (560 + j * 60) + " 420 L" + (620 + j * 60) + " 420 L" + (800 + (j - 3) * 30) + ' 270 Z" fill="' + (j % 2 ? "#a9bfdb" : "#3f5684") + '"/>';
    return '<g class="fm-pop"><path d="M600 420 V720 M1000 420 V720" stroke="#b98b62" stroke-width="14"/>' + str + '<path d="M680 270 L920 270 L1040 420 L560 420 Z" fill="none" stroke="' + INKC + '" stroke-width="4" stroke-linejoin="round"/>' + scal +
      '<rect x="560" y="640" width="480" height="40" rx="8" fill="#fbf3e3" stroke="' + INKC + '" stroke-width="4"/><path d="M580 680 V780 M1020 680 V780" stroke="' + INKC + '" stroke-width="8"/>' +
      '<path d="M570 680 Q800 720 1030 680" fill="#f7c6d2" stroke="' + INKC + '" stroke-width="3"/></g>';
  }
  function fmBush(x, y, s) { return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><circle cx="-60" cy="0" r="58" fill="#7cc48a" stroke="' + INKC + '" stroke-width="4"/><circle cx="60" cy="0" r="58" fill="#7cc48a" stroke="' + INKC + '" stroke-width="4"/><circle cx="0" cy="-34" r="70" fill="#86cc93" stroke="' + INKC + '" stroke-width="4"/><circle cx="-20" cy="-50" r="6" fill="#f4a9ba"/><circle cx="34" cy="-20" r="6" fill="#f4a9ba"/></g>'; }
  function fmBowls() { return '<g class="fm-pop"><path d="M860 770 Q900 812 940 770 Z" fill="#f6c9d3" stroke="' + INKC + '" stroke-width="4"/><path d="M990 780 Q1030 822 1070 780 Z" fill="#a9cdea" stroke="' + INKC + '" stroke-width="4"/><circle cx="880" cy="764" r="7" fill="#c1946a"/><circle cx="898" cy="760" r="7" fill="#c1946a"/><circle cx="1020" cy="774" r="7" fill="#c1946a"/></g>'; }
  function fmBlanket() { return '<ellipse cx="800" cy="800" rx="420" ry="70" fill="url(#fmCheck)" stroke="' + INKC + '" stroke-width="4"/>'; }
  function fmStreet() {
    var win = "";
    for (var i = 0; i < 4; i++) win += '<rect x="' + (300 + i * 280) + '" y="150" width="120" height="90" rx="10" fill="#d5e6f6" stroke="' + INKC + '" stroke-width="4"/><path d="M' + (360 + i * 280) + " 150 V240 M" + (300 + i * 280) + " 195 H" + (420 + i * 280) + '" stroke="' + INKC + '" stroke-width="3"/>';
    var aw = "";
    for (var k = 0; k < 10; k++) aw += '<path d="M' + (420 + k * 76) + " 330 h76 v70 a38 22 0 0 1 -76 0 Z\" fill=\"" + (k % 2 ? "#a9bfdb" : "#3f5684") + '" stroke="' + INKC + '" stroke-width="3"/>';
    var balloons = [[330, 560, "#f4a9ba"], [380, 520, "#f3d873"], [1260, 540, "#a9cdea"], [1310, 500, "#cdb6e3"]].map(function (b, i) { return '<g class="fm-balloon bl' + i + '"><path d="M' + b[0] + " " + (b[1] + 50) + " Q" + (b[0] + 12) + " " + (b[1] + 130) + " " + (i < 2 ? 420 : 1180) + ' 760" fill="none" stroke="' + INKC + '" stroke-width="2.5"/><ellipse cx="' + b[0] + '" cy="' + b[1] + '" rx="38" ry="48" fill="' + b[2] + '" stroke="' + INKC + '" stroke-width="3.5"/><path d="M' + (b[0] - 14) + " " + (b[1] - 20) + " q6 -12 18 -14\" stroke=\"#fff\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/></g>"; }).join("");
    return fmSky("day") + fmClouds() + '<rect x="160" y="60" width="1280" height="720" fill="#fbf3e3" stroke="' + INKC + '" stroke-width="5"/>' + win +
      '<rect x="560" y="268" width="480" height="58" rx="10" fill="#fff" stroke="' + INKC + '" stroke-width="4"/><text x="800" y="310" text-anchor="middle" font-family="Patrick Hand, Comic Sans MS, sans-serif" font-size="42" fill="' + INKC + '">Minise Arte</text>' + aw +
      '<rect x="460" y="430" width="300" height="250" rx="12" fill="#d5e6f6" stroke="' + INKC + '" stroke-width="4"/><rect x="840" y="430" width="200" height="350" rx="12" fill="#f4b3c2" stroke="' + INKC + '" stroke-width="4"/><circle cx="1010" cy="610" r="8" fill="' + INKC + '"/>' +
      '<g class="fm-swing2"><path d="M900 470 L940 440 L980 470" fill="none" stroke="' + INKC + '" stroke-width="3"/><rect x="884" y="468" width="112" height="44" rx="8" fill="#fff" stroke="' + INKC + '" stroke-width="3"/><text x="940" y="499" text-anchor="middle" font-family="Patrick Hand, Comic Sans MS, sans-serif" font-size="26" fill="#d6496a">OPEN</text></g>' +
      '<rect x="0" y="780" width="1600" height="120" fill="#e9dfcb" stroke="' + INKC + '" stroke-width="4"/><path d="M0 830 H1600" stroke="#d8ccb2" stroke-width="4" stroke-dasharray="40 30"/>' + balloons;
  }
  function fmCity() {
    var b = "", xs = [[60, 520, 150], [230, 440, 120], [370, 560, 170], [560, 380, 110], [690, 480, 160], [870, 420, 130], [1020, 540, 150], [1190, 360, 120], [1330, 470, 180]];
    xs.forEach(function (q, i) {
      b += '<rect x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + (800 - q[1]) + '" fill="' + (i % 2 ? "#8e7cc0" : "#a693d2") + '" stroke="' + INKC + '" stroke-width="3"/>';
      for (var yy = q[1] + 30; yy < 760; yy += 60) for (var xx = q[0] + 22; xx < q[0] + q[2] - 20; xx += 44) b += '<rect class="fm-win w' + ((xx + yy) % 3) + '" x="' + xx + '" y="' + yy + '" width="18" height="24" rx="3" fill="#ffe7a0"/>';
    });
    var plane = '<g class="fm-plane2"><path d="M-260 0 H-60" stroke="' + INKC + '" stroke-width="3"/><rect x="-420" y="-34" width="170" height="68" rx="14" fill="#fff" stroke="' + INKC + '" stroke-width="4"/><text x="-335" y="10" text-anchor="middle" font-family="Patrick Hand, Comic Sans MS, sans-serif" font-size="30" fill="#d6496a">Melbourne ♥</text>' +
      '<path d="M-60 -18 C40 -30 150 -24 190 0 C150 24 40 30 -60 18 Z" fill="#fff" stroke="' + INKC + '" stroke-width="4"/><path d="M40 -20 L-10 -80 L30 -80 L90 -22 Z M40 20 L-10 80 L30 80 L90 22 Z M-50 -16 L-80 -56 L-56 -56 L-30 -18 Z" fill="#a9bfdb" stroke="' + INKC + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="110" cy="-4" r="8" fill="#a9cdea" stroke="' + INKC + '" stroke-width="2.5"/><circle cx="84" cy="-4" r="8" fill="#a9cdea" stroke="' + INKC + '" stroke-width="2.5"/><circle cx="58" cy="-4" r="8" fill="#a9cdea" stroke="' + INKC + '" stroke-width="2.5"/></g>';
    return fmSky("sunset") + fmSun(1260, 300, "#ffd27a") + fmCloud(160, 140, 1.2, "c1") + fmCloud(900, 90, 1, "c2") + b + plane + '<rect x="0" y="790" width="1600" height="110" fill="#c9b6a0" stroke="' + INKC + '" stroke-width="4"/>';
  }
  var FILM = [
    { bg: function () { return fmPark({}) + fmBlanket(); }, cats: [["peek", "l2"], ["peniPeek", "r2"]], title: ["fm_title1", "fm_title2"] },
    { bg: function () { return fmPark({}) + fmEasel(); }, date: "tl1d", cats: [["paint", "l"]], dots: true },
    { bg: function () { return fmPark({ center: true, lights: true, noTrees: false }); }, date: "tl2d", cats: [["heart", "r"]], props: "lockets" },
    { bg: function () { return fmPark({ noTrees: true }) + fmTent(); }, date: "tl3d", cats: [["wave", "l"]], props: "letters" },
    { bg: function () { return fmPark({}) + fmBowls() + fmBush(1330, 760, 1.1); }, date: "tl4d", cats: [["heart", "l"], ["peniPeek", "bush"]], props: "food", mew: 1 },
    { bg: function () { return fmPark({ sky: "dusk", warm: true }); }, cats: [["wave", "l"], ["peniWave", "r"]], props: "butterflies" },
    { bg: function () { return fmPark({}) + fmBlanket(); }, date: "tl5d", cats: [["gift", "l"], ["peniGift", "r"]], props: "boxes" },
    { bg: fmStreet, date: "tl6d", cats: [["wave", "l"], ["peniYay", "r"]] },
    { bg: fmCity, date: "tl7d", cats: [["walk", "walk"], ["peniHop", "r"]] },
    { bg: function () { return fmPark({ dark: true, sky: "night" }); }, date: "tl8d", cats: [["peniSparkle", "c"]], props: "treasure" },
    { bg: function () { return fmPark({ sky: "sunset", warm: true }); }, cats: [["yay", "l"], ["peniYay", "r"]], props: "party", title: ["fm_end1", "fm_end2"], end: true }
  ];
  function fmProps(k) {
    var bit = function (code, cls) { return '<span class="fm-bit ' + cls + '">' + charmImg(code) + "</span>"; };
    var disc = function (sh, col, l, cls) { return '<span class="fm-disc ' + cls + '"><svg viewBox="-40 -38 80 76" aria-hidden="true">' + charmShape(sh, col, l) + "</svg></span>"; };
    if (k === "lockets") return bit("C14", "fm-hang h1") + bit("A18", "fm-hang h2") + bit("C36", "fm-hang h3");
    if (k === "letters") return disc("circle", MYO_COLS[0], "M", "on-table t1") + disc("heart", MYO_COLS[8], "A", "on-table t2") + disc("circle", MYO_COLS[4], "P", "on-table t3") + disc("heart", MYO_COLS[1], "N", "on-table t4");
    if (k === "food") return bit("B14", "fm-food f1");
    if (k === "butterflies") return [1, 2, 3].map(function (n) { return '<span class="fm-bf bf' + n + '"><i></i><i></i></span>'; }).join("");
    if (k === "boxes") return '<span class="fm-box x1"></span><span class="fm-box x2"></span><span class="fm-box x3"></span>';
    if (k === "treasure") return bit("C33", "fm-glowbit g1") + bit("C25", "fm-glowbit g2") + bit("C37", "fm-glowbit g3") + bit("A1", "fm-glowbit g4") + [1, 2, 3, 4, 5, 6].map(function (n) { return '<i class="fm-ff ff' + n + '"></i>'; }).join("");
    if (k === "party") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(function (n) { return '<i class="fm-conf f' + n + '"></i>'; }).join("");
    return "";
  }
  var FM = { i: 0, on: false, t: 0, started: false };
  function fmScene(i, enter) {
    var s = FILM[i];
    return '<div class="fm-scene' + (enter ? " enter" : "") + '"><div class="fm-world">' + fmSvg(s.bg()) +
      '<div class="fm-props" aria-hidden="true">' + fmProps(s.props) + "</div>" +
      s.cats.map(function (c, n) { return '<span class="fm-cat fm-c-' + c[1] + '" style="animation-delay:' + (0.5 + n * 0.4) + 's">' + (window.MINISE_CAT ? window.MINISE_CAT(c[0]) : "") + "</span>"; }).join("") + "</div>" +
      (s.date ? '<span class="fm-date">' + esc(t(s.date)) + "</span>" : "") +
      (s.title ? '<div class="fm-title"><span>' + esc(t(s.title[0])) + "</span><b>" + esc(t(s.title[1])) + "</b></div>" : "") + "</div>";
  }

  // ---- the music: a soft ukulele strum (I–vi–IV–V in C), a sine bass, a little melody with a bell on top, and a hi-hat tick
  var SND = { ctx: null, on: true, playing: false, next: 0, step: 0, timer: 0, out: null, verb: null, noise: null };
  try { SND.on = localStorage.getItem("minise_film_sound") !== "off"; } catch (e) { /* ignore */ }
  var VOL = 0.5;
  function sndCtx() {
    if (SND.ctx) return SND.ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var c = new AC(), out = c.createGain(), lp = c.createBiquadFilter(), comp = c.createDynamicsCompressor();
    out.gain.value = SND.on ? VOL : 0;
    lp.type = "lowpass"; lp.frequency.value = 5600;
    out.connect(lp); lp.connect(comp); comp.connect(c.destination);
    // a cosy room: decaying noise as the reverb
    var len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    var verb = c.createConvolver(), wet = c.createGain();
    verb.buffer = ir; wet.gain.value = 0.3; verb.connect(wet); wet.connect(out);
    var nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.2), c.sampleRate), nd = nb.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    SND.ctx = c; SND.out = out; SND.verb = verb; SND.noise = nb;
    return c;
  }
  function tone(t, f, dur, vol, type, glide) {
    var c = SND.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(f, t);
    if (glide) glide.forEach(function (p) { o.frequency.exponentialRampToValueAtTime(p[0], t + p[1]); });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(SND.out); g.connect(SND.verb);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function tick(t, vol) {
    var c = SND.ctx, s = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = SND.noise; hp.type = "highpass"; hp.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(hp); hp.connect(g); g.connect(SND.out);
    s.start(t); s.stop(t + 0.06);
  }
  var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  var CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  var MELODY = [
    [76, 79, 81, 79, 76, 0, 74, 72], [72, 76, 81, 0, 79, 76, 0, 74], [72, 0, 77, 81, 0, 79, 77, 76], [74, 0, 79, 0, 71, 74, 79, 0],
    [76, 79, 84, 81, 79, 0, 76, 79], [81, 0, 79, 76, 72, 0, 74, 76], [77, 81, 0, 84, 81, 79, 77, 0], [79, 0, 74, 76, 74, 71, 72, 0]
  ];
  var EIGHTH = 60 / 88 / 2;
  function sndSchedule() {
    var c = SND.ctx;
    if (!c) return;
    if (!document.getElementById("fmStage")) { sndStop(); return; }
    while (SND.next < c.currentTime + 0.3) {
      var s = SND.step, bar = Math.floor(s / 8) % 8, e = s % 8, t0 = SND.next, ch = CHORDS[bar % 4];
      if ([0, 3, 5, 6].indexOf(e) > -1) ch.forEach(function (n, k) { tone(t0 + k * 0.02, NOTE(n), 0.9, e === 0 ? 0.045 : 0.03, "triangle"); });
      if (e === 0 || e === 4) tone(t0, NOTE(ch[0] - 12), 0.85, 0.11, "sine");
      if (e % 2 === 1) tick(t0, 0.018);
      var m = MELODY[bar][e];
      if (m) { tone(t0, NOTE(m), 0.6, 0.07, "sine"); tone(t0, NOTE(m + 12), 0.3, 0.018, "triangle"); }
      SND.step++;
      SND.next += EIGHTH;
    }
  }
  function sndStart() {
    var c = sndCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    SND.out.gain.cancelScheduledValues(c.currentTime);
    SND.out.gain.setTargetAtTime(SND.on ? VOL : 0, c.currentTime, 0.15);
    if (SND.playing) return;
    SND.playing = true;
    SND.next = c.currentTime + 0.12;
    clearInterval(SND.timer);
    SND.timer = setInterval(sndSchedule, 60);
  }
  function sndStop(slow) {
    if (!SND.ctx) return;
    clearInterval(SND.timer);
    SND.playing = false;
    var c = SND.ctx;
    SND.out.gain.cancelScheduledValues(c.currentTime);
    SND.out.gain.setTargetAtTime(0.0001, c.currentTime, slow ? 0.7 : 0.08);
  }
  // little sound effects: a chime between scenes, a pop when a cat appears, a tiny "mew" for Peni
  function sfx(kind, delay) {
    if (!SND.ctx || !SND.on || !FM.on) return;
    var t = SND.ctx.currentTime + (delay || 0);
    if (kind === "chime") [84, 88, 91].forEach(function (n, i) { tone(t + i * 0.07, NOTE(n), 0.9, 0.035, "sine"); });
    if (kind === "pop") tone(t, 420, 0.16, 0.06, "sine", [[900, 0.08]]);
    if (kind === "mew") tone(t, 760, 0.45, 0.05, "triangle", [[1180, 0.12], [820, 0.4]]);
    if (kind === "yay") [72, 76, 79, 84, 88].forEach(function (n, i) { tone(t + i * 0.06, NOTE(n), 0.7, 0.04, "sine"); });
  }

  function filmHTML() {
    var dots = FILM.map(function (s, i) { return '<button type="button" class="fm-dot-btn" data-fm-go="' + i + '" aria-label="' + (i + 1) + '"' + (i === FM.i ? ' aria-current="true"' : "") + "></button>"; }).join("");
    var canFull = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    return '<div class="film" id="film"><div class="fm-head"><p class="eyebrow">' + esc(t("fm_eyebrow")) + "</p><h2>" + esc(t("fm_h")) + "</h2></div>" +
      '<div class="fm-screen" id="fmScreen"><div class="fm-stage" id="fmStage">' + fmScene(FM.i) + "</div>" +
      '<span class="fm-mark" aria-hidden="true">Minise Arte</span>' +
      '<p class="fm-cc" id="fmSub" aria-live="polite">' + esc(t("fm_" + FM.i)) + "</p>" +
      (FM.started ? "" : '<button class="fm-big" type="button" data-fm="play" id="fmBig"><span class="fm-big-i" aria-hidden="true"></span><span>' + esc(t("fm_watch")) + '</span><small>' + esc(t("fm_hint")) + "</small></button>") +
      '<div class="fm-bar" aria-hidden="true"><span id="fmBar" style="width:' + (FM.i / (FILM.length - 1) * 100) + '%"></span></div></div>' +
      '<div class="fm-ctl"><button class="btn solid" type="button" data-fm="toggle" id="fmToggle">' + esc(t(FM.on ? "fm_pause" : "fm_play")) + '</button>' +
      '<button class="btn ghost" type="button" data-fm="restart">' + esc(t("fm_again")) + "</button>" +
      '<button class="btn ghost fm-snd" type="button" data-fm="sound" id="fmSnd" aria-pressed="' + SND.on + '">' + esc(t(SND.on ? "fm_sound_on" : "fm_sound_off")) + "</button>" +
      (canFull ? '<button class="btn ghost" type="button" data-fm="full">' + esc(t("fm_full")) + "</button>" : "") +
      '<span class="fm-dots">' + dots + "</span></div>" +
      '<details class="fm-read"><summary>' + esc(t("fm_read")) + "</summary><ol>" + FILM.map(function (s, i) { return "<li>" + (s.date ? "<b>" + esc(t(s.date)) + "</b> " : "") + esc(t("fm_" + i)) + "</li>"; }).join("") + "</ol></details></div>";
  }
  function fmShow(i) {
    var st = document.getElementById("fmStage");
    if (!st) { FM.on = false; clearTimeout(FM.t); return; }
    FM.i = i;
    // the new scene opens in a circle over the old one (calm mode: just swap)
    if (calm) st.innerHTML = fmScene(i);
    else {
      st.insertAdjacentHTML("beforeend", fmScene(i, true));
      var all = st.querySelectorAll(".fm-scene");
      setTimeout(function () { for (var k = 0; k < all.length - 1; k++) if (all[k].parentNode) all[k].remove(); }, 1000);
    }
    var sub = document.getElementById("fmSub");
    sub.textContent = t("fm_" + i);
    sub.classList.remove("pop"); void sub.offsetWidth; sub.classList.add("pop");
    document.querySelectorAll("[data-fm-go]").forEach(function (d) { if (+d.getAttribute("data-fm-go") === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    var bar = document.getElementById("fmBar"), n = FILM.length - 1;
    bar.style.transition = "none";
    bar.style.width = (i / n * 100) + "%";
    if (FM.on && !FILM[i].end) { void bar.offsetWidth; bar.style.transition = "width 6.4s linear"; bar.style.width = ((i + 1) / n * 100) + "%"; }
    if (FM.on) {
      sfx("chime");
      FILM[i].cats.forEach(function (c, k) { sfx("pop", 0.5 + k * 0.4); });
      if (FILM[i].mew) sfx("mew", 2.1);
      if (FILM[i].end) { sfx("yay", 0.6); setTimeout(function () { if (FILM[FM.i].end) sndStop(true); }, 4500); }
    }
  }
  function fmButtons() {
    var b = document.getElementById("fmToggle");
    if (b) b.textContent = t(FM.on ? "fm_pause" : "fm_play");
    var s = document.getElementById("fmSnd");
    if (s) { s.textContent = t(SND.on ? "fm_sound_on" : "fm_sound_off"); s.setAttribute("aria-pressed", String(SND.on)); }
  }
  function fmTick() {
    clearTimeout(FM.t);
    if (!FM.on) return;
    if (FILM[FM.i].end) { FM.on = false; fmButtons(); return; }
    FM.t = setTimeout(function () {
      if (!document.getElementById("fmStage")) { FM.on = false; sndStop(); return; }
      fmShow(FM.i + 1);
      fmTick();
    }, 6400);
  }
  function fmPlay(from) {
    FM.started = true;
    var big = document.getElementById("fmBig");
    if (big) big.remove();
    if (typeof from === "number") FM.i = from;
    else if (FILM[FM.i].end) FM.i = 0;
    FM.on = true;
    sndStart();
    fmShow(FM.i);
    fmTick();
    fmButtons();
  }
  function fmPause() { FM.on = false; clearTimeout(FM.t); sndStop(); var bar = document.getElementById("fmBar"); if (bar) { bar.style.transition = "none"; bar.style.width = (FM.i / (FILM.length - 1) * 100) + "%"; } fmButtons(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fm]");
    if (b) {
      var a = b.getAttribute("data-fm");
      if (a === "play") fmPlay();
      else if (a === "toggle") { if (FM.on) fmPause(); else fmPlay(); }
      else if (a === "restart") fmPlay(0);
      else if (a === "sound") {
        SND.on = !SND.on;
        try { localStorage.setItem("minise_film_sound", SND.on ? "on" : "off"); } catch (err) { /* ignore */ }
        if (SND.ctx) SND.out.gain.setTargetAtTime(SND.on && SND.playing ? VOL : 0.0001, SND.ctx.currentTime, 0.1);
        if (SND.on && FM.on) sndStart();
        fmButtons();
      } else if (a === "full") {
        var sc = document.getElementById("fmScreen");
        if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else if (sc.requestFullscreen) sc.requestFullscreen();
        else if (sc.webkitRequestFullscreen) sc.webkitRequestFullscreen();
      }
      return;
    }
    b = e.target.closest("[data-fm-go]");
    if (b) {
      var go = +b.getAttribute("data-fm-go");
      if (FM.on) fmPlay(go);
      else { FM.started = true; var big = document.getElementById("fmBig"); if (big) big.remove(); fmShow(go); }
    }
  });

  function footer() {
    return '<div class="wrap foot-wrap">' + kitty("shark", "foot-kitty") + kitty("peniBunnySleep", "foot-kitty2") + '<div class="foot-grid"><div class="foot-brand"><span class="foot-logo">Minise Arte</span><p>' + esc(t("footer_tag")) + "</p>" +
      '<p class="tn">' + WA.mainShow + " · " + WA.altShow + "</p></div>" +
      "<div><h4>" + esc(t("footer_shop")) + '</h4><ul><li><a href="#make">' + esc(t("nav_make")) + "</a></li><li><a href=\"#italian\">" + esc(t("nav_italian")) + "</a></li>" + ["locket", "bracelet", "necklace", "set", "earrings", "accessory"].map(function (ty) {
        return '<li><a href="#shop-' + ty + '">' + esc(t("type_" + ty)) + "</a></li>";
      }).join("") + "</ul></div>" +
      "<div><h4>" + esc(t("footer_help")) + '</h4><ul><li><a href="#order">' + esc(t("nav_order")) + '</a></li><li><a href="#visit">' + esc(t("nav_visit")) + '</a></li><li><a href="#story">' + esc(t("nav_story")) + '</a></li><li><a href="#cats">' + esc(t("nav_cats")) + '</a></li><li><a href="#gift">' + esc(t("gf_link")) + '</a></li><li><a href="#note">' + esc(t("nt_link")) + '</a></li><li><a href="#wish">' + esc(t("wish_eyebrow")) + '</a></li><li><a href="#mumi">' + esc(t("mumi_link")) + '</a></li><li><a href="#peni">' + esc(t("peni_link")) + '</a></li><li><a href="#checkout">' + esc(t("checkout")) + '</a></li><li><a href="#privacy">' + esc(t("privacy_link")) + '</a></li><li><a href="#terms">' + esc(t("terms_link")) + "</a></li></ul></div>" +
      "<div><h4>" + esc(t("footer_follow")) + '</h4><ul><li><a href="' + FB + '" target="_blank" rel="noopener">Facebook</a></li><li><a href="' + IG + '" target="_blank" rel="noopener">@minise.arte</a></li><li><a href="https://www.instagram.com/minise.studio/" target="_blank" rel="noopener">@minise.studio</a></li><li><a href="https://www.instagram.com/minise.au/" target="_blank" rel="noopener">@minise.au</a></li><li><a href="https://miniseau.com" target="_blank" rel="noopener">miniseau.com</a></li><li><a href="https://linktr.ee/Miniseofficial" target="_blank" rel="noopener">Linktree</a></li></ul></div></div>' +
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
    } else if (h === "make" || h === "p-" + MYO) { h = "make"; html = makePage(); }
    else if (h === "italian" || h === "p-" + ITB) { h = "italian"; html = italianPage(); }
    else if (h.indexOf("p-") === 0) html = product(h.slice(2));
    else if (h === "story") html = story();
    else if (h === "order") html = orderPage();
    else if (h === "visit") html = visitPage();
    else if (h === "privacy") html = legalPage("pv", 7, "sharkPeek");
    else if (h === "terms") html = legalPage("tm", 10, "paint");
    else if (h === "mumi" || h === "peni") html = catPage(h);
    else if (h === "cats") html = worldPage();
    else if (h === "gift") html = giftPage();
    else if (h === "note") html = notePage();
    else if (h === "wish") html = wishPage();
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
    if (h === "make") mkBar();
    if (h === "italian") itBar();
    refreshCheckout();
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      var n = a.getAttribute("data-nav");
      if (n === h || (n === "shop" && h === "shop")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (!same) window.scrollTo(0, 0);
    reveal(main);
    movePill();
    setMeta(h);
    track(h);
  }

  // the browser tab title and the page description follow the page you are on
  function setMeta(h) {
    var names = { shop: t("nav_shop"), story: t("nav_story"), order: t("nav_order"), visit: t("nav_visit"), checkout: t("co_h"), privacy: t("pv_h"), terms: t("tm_h"), mumi: t("mumi_link"), peni: t("peni_link"), make: t("mk_h"), italian: t("it_h"), cats: t("wl_h"), gift: t("gf_h"), note: t("nt_h"), wish: t("wish_h") };
    var title = "Minise Arte · " + t("footer_tag").replace(/\.$/, ""), desc = t("hero_lead");
    if (S) { title = S.p.n + " · Minise Arte"; desc = (describe(S.p, lang) || describe(S.p, "en") || desc).slice(0, 155); }
    else if (h.indexOf("shop") === 0 || h.indexOf("c-") === 0) title = shopTitle() + " · Minise Arte";
    else if (names[h]) title = names[h] + " · Minise Arte";
    if (h === "mumi") desc = t("mumi_lead");
    if (h === "peni") desc = t("pni_lead");
    if (h === "cats") desc = t("wl_lead");
    if (h === "gift") desc = t("gf_lead");
    if (h === "note") desc = t("nt_lead");
    if (h === "make") desc = t("mk_lead");
    if (h === "italian") desc = t("it_lead");
    document.title = title;
    var m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", desc);
  }
  // anonymous visit counts (which page, which day, phone or computer). Nothing that identifies a person,
  // no cookies, and only on the real shop address.
  var lastTrack = "";
  function track(h) {
    if (!API || !/(^|\.)minisearte\.com$/.test(location.hostname) || navigator.webdriver || h === lastTrack) return;
    lastTrack = h;
    var dev = /iPad|Tablet/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) ? "tablet" : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "phone" : "computer";
    rpc("track_view", { p_path: h.slice(0, 60), p_lang: lang, p_device: dev }).catch(function () { /* counting is optional */ });
  }
  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-lang") === lang)); });
    document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
    document.querySelectorAll(".announce li").forEach(function (li) { li.hidden = !li.textContent.trim(); });
    document.querySelectorAll("[data-t-label]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-t-label"))); });
    document.getElementById("foot").innerHTML = footer();
    wishCount();
    fitNav();
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
    if ((el = e.target.closest("[data-ph-pdrm]")) && S) {
      S.phs.splice(+el.getAttribute("data-ph-pdrm"), 1);
      document.getElementById("pdPhotos").innerHTML = pdPhotosHTML();
      return;
    }
    if ((el = e.target.closest("[data-ph-itemrm]"))) {
      var pi = el.getAttribute("data-ph-itemrm").split(":"), pit = bag[+pi[0]];
      if (pit && pit.phs) { pit.phs.splice(+pi[1], 1); saveBag(); phStepRefresh(); }
      return;
    }
    if ((el = e.target.closest("[data-ph-slotrm]"))) {
      var ps = el.getAttribute("data-ph-slotrm").split(":"), sit = bag[+ps[0]], sl = sit && sit.links && sit.links[+ps[1]];
      if (sl) { delete sl.ph; saveBag(); phStepRefresh(); }
      return;
    }
    if (e.target.closest("#coCodeApply")) { applyCode(); return; }
    if (e.target.closest("#coCodeRemove")) { setCode(null); route(); return; }
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
    var el = e.target, files = el.files;
    if (el.hasAttribute("data-ph-pd") && S) {
      phAddAll(files, PH_ITEM - S.phs.length).then(function (ids) { S.phs = S.phs.concat(ids).slice(0, PH_ITEM); var pr = document.getElementById("pdPhotos"); if (pr) pr.innerHTML = pdPhotosHTML(); });
      el.value = "";
    } else if (el.hasAttribute("data-ph-item")) {
      var idx = +el.getAttribute("data-ph-item"), it = bag[idx];
      if (it) phAddAll(files, PH_ITEM - (it.phs || []).length).then(function (ids) { it.phs = (it.phs || []).concat(ids).slice(0, PH_ITEM); saveBag(); phStepRefresh(); if (ids.length) setErr("coPh" + idx, ""); });
      el.value = "";
    } else if (el.hasAttribute("data-ph-slot")) {
      var sp = el.getAttribute("data-ph-slot").split(":"), sit = bag[+sp[0]], sl = sit && sit.links && sit.links[+sp[1]];
      if (sl) phAddAll(files, 1).then(function (ids) { if (ids[0]) { sl.ph = ids[0]; saveBag(); phStepRefresh(); } });
      el.value = "";
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
      var key = JSON.stringify([sel.s, sel.opt, sel.addN, sel.col, sel.ini, sel.note, sel.phs || []]);
      var found = bag.find(function (it) { return JSON.stringify([it.s, it.opt, it.addN, it.col, it.ini, it.note, it.phs || []]) === key; });
      if (found) found.qty = Math.min(20, found.qty + sel.qty); else bag.push(sel);
      saveBag();
      if (S.phs.length) { S.phs = []; var pr = document.getElementById("pdPhotos"); if (pr) pr.innerHTML = pdPhotosHTML(); }
      toast(t("added"), "gift");
      openBag();
    } else if (e.target.id === "coForm") {
      e.preventDefault();
      sendOrder();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "coCode" && !e.target.readOnly) { e.preventDefault(); applyCode(); return; }
    if (e.key === "Escape" && !document.getElementById("drawer").hidden) closeBag();
  });
  document.getElementById("scrim").addEventListener("click", closeBag);
  document.getElementById("bagBtn").addEventListener("click", openBag);
  // language menu: English, ລາວ, 中文
  function langMenu(open) {
    var m = document.getElementById("langMenu"), b = document.getElementById("langBtn");
    m.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { var cur = m.querySelector('[data-lang="' + lang + '"]'); if (cur) cur.focus(); }
  }
  document.getElementById("langBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    langMenu(document.getElementById("langMenu").hidden);
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("#langMenu")) langMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !document.getElementById("langMenu").hidden) { langMenu(false); document.getElementById("langBtn").focus(); } });
  document.getElementById("langMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (!b) return;
    langMenu(false);
    if (b.getAttribute("data-lang") === lang) return;
    lang = b.getAttribute("data-lang");
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
  var PK = { shown: false, pose: 0, msg: 0, off: false, cat: "mumi" };
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
    var want = !PK.off && !drawerOpen && current !== "checkout" && current !== "make" && current !== "italian" && window.scrollY > 520;
    if (want === PK.shown) return;
    PK.shown = want;
    if (want) {
      var pk = ["peek", "peniPeek", "sharkPeek", "peniBunnyPeek", "box", "peniBox"][PK.pose++ % 6];
      PK.cat = pk.indexOf("peni") === 0 ? "peni" : "mumi";
      b.innerHTML = window.MINISE_CAT(pk);
      b.setAttribute("aria-label", t(PK.cat === "peni" ? "peek_label_p" : "peek_label"));
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
    var tips = PK.cat === "peni" ? ["pk_p1", "pk_p2", "pk_p3", "pk_p4"] : ["peek_1", "peek_2", "peek_3", "peek_4"];
    bub.innerHTML = "<p>" + esc(t(tips[PK.msg++ % tips.length])) + '</p><div class="pb-row"><a class="btn" href="' + esc(waLink(tw("msg_hi"))) + '" target="_blank" rel="noopener">' + esc(t("peek_wa")) + '</a>' + (current !== (PK.cat || "mumi") ? '<a class="link" href="#' + (PK.cat || "mumi") + '">' + esc(t((PK.cat || "mumi") + "_link")) + " →</a>" : "") + '<button class="link" type="button" id="peekOff">' + esc(t("peek_hide")) + "</button></div>";
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

  // re-measure the menu whenever the screen width changes (rotating a phone or iPad, resizing a window)
  var lastW = 0;
  function onWidth() { var w = document.documentElement.clientWidth; if (w === lastW) return; lastW = w; clearTimeout(movePill._t); movePill._t = setTimeout(function () { fitNav(); movePill(); }, 120); }
  window.addEventListener("resize", onWidth);
  window.addEventListener("orientationchange", onWidth);
  if ("ResizeObserver" in window) new ResizeObserver(onWidth).observe(document.documentElement);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitNav(); movePill(); });

  // first visit: a short note about what the shop keeps on this device (no tracking cookies)
  function cookieNote() {
    var seen = false;
    try { seen = localStorage.getItem("minise_note_ok") === "1"; } catch (e) { seen = true; }
    if (seen || document.getElementById("cookieNote")) return;
    document.body.insertAdjacentHTML("beforeend", '<div class="cookie-note" id="cookieNote" role="region" aria-label="' + esc(t("privacy_link")) + '"><p>' + esc(t("cookie_text")) +
      ' <a class="link" href="#privacy">' + esc(t("privacy_link")) + '</a></p><button class="btn solid" type="button" id="cookieOk">' + esc(t("cookie_ok")) + "</button></div>");
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#cookieOk")) return;
    try { localStorage.setItem("minise_note_ok", "1"); } catch (err) { /* ignore */ }
    var n = document.getElementById("cookieNote"); if (n) n.remove();
  });

  applyLang();
  updateBagCount();
  route();
  cookieNote();
  fetchLive();
  phWake();
})();

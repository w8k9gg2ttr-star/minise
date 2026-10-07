/* Minise Arte · the shop cat.
   Line drawings of the cat from the shop sign, in navy ink, built from shared parts so every pose matches.
   Moving parts are grouped (k-eyes, k-tail, k-head, k-wave …) and animated by css/cats.css.
   MINISE_CAT(pose) returns an <svg> string. Poses:
   drink, wave, heart, gift, phone, yay, search, sleep, peek, paint, sparkle, box, walk, paw,
   shark, sharkPeek, sharkSleep, swim */
(function () {
  var INK = "#24396a", FUR = "#f8f4ea", SUIT = "#a9bfdb", SUIT_DARK = "#8ea8ca", BLUSH = "#f2c3cb", PINK = "#ec9aa9", WATER = "#c9d9ec", SW = 5.5;
  var STROKE = ' stroke="' + INK + '" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round"';

  function sw(w) { return w ? STROKE.replace('stroke-width="' + SW + '"', 'stroke-width="' + w + '"') : STROKE; }
  function path(d, fill, w) { return '<path d="' + d + '" fill="' + (fill || "none") + '"' + sw(w) + "/>"; }
  function dot(x, y, r, fill) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (fill || INK) + '"/>'; }
  function oval(x, y, rx, ry, fill, w) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (w ? sw(w) : "") + "/>"; }
  function g(cls, inner) { return '<g class="' + cls + '">' + inner + "</g>"; }
  // the same shape on the other side of the cat (the drawings are 200 wide)
  function mirror(d) { return d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, function (_, x, y) { return (200 - x) + " " + y; }); }
  function both(d, fill, w) { return path(d, fill, w) + path(mirror(d), fill, w); }
  // an outlined tube (tails, legs and raised arms), like the double line on the sign
  function tube(d, wide, inner) {
    wide = wide || 17;
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + wide + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + (inner || FUR) + '" stroke-width="' + (wide - 11) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function paw(x, y, r, fill) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 10) + '" fill="' + (fill || FUR) + '"' + STROKE + "/>"; }
  function star(x, y, r) {
    return '<path d="M' + x + " " + (y - r) + " Q" + x + " " + y + " " + (x + r) + " " + y + " Q" + x + " " + y + " " + x + " " + (y + r) + " Q" + x + " " + y + " " + (x - r) + " " + y + " Q" + x + " " + y + " " + x + " " + (y - r) + 'Z" fill="#fff"' + sw(3.5) + "/>";
  }

  /* ---------- body parts ---------- */
  var HEAD = "M34 100 C28 78 30 58 38 44 L40 16 Q42 9 49 13 L72 31 C90 26 110 26 128 31 L151 13 Q158 9 160 16 L162 44 C170 58 172 78 166 100 C160 124 134 138 100 138 C66 138 40 124 34 100 Z";
  var BODY = "M64 128 C52 150 50 180 58 202 C58 214 61 222 71 222 C81 222 85 216 87 206 C95 202 105 202 113 206 C115 216 119 222 129 222 C139 222 142 214 142 202 C150 180 148 150 136 128 Z";
  var TAIL = "M138 196 C162 198 180 184 176 162 C174 150 182 144 190 150";
  var ARM_REST = "M66 152 Q76 166 90 164";

  function eyes(kind) {
    if (kind === "happy") return g("k-eyes-still", path("M60 87 Q72 72 86 87") + path("M114 87 Q128 72 140 87"));
    if (kind === "sleep") return g("k-eyes-still", path("M60 84 Q72 93 86 84") + path("M114 84 Q128 93 140 84"));
    if (kind === "big") return g("k-eyes", dot(73, 84, 11) + dot(127, 84, 11) + dot(77, 80, 3.6, "#fff") + dot(131, 80, 3.6, "#fff") + dot(70, 89, 1.8, "#fff") + dot(124, 89, 1.8, "#fff"));
    var lids = path("M58 83 C66 77 80 77 88 83 C82 91 64 91 58 83 Z", "#fff") + path("M112 83 C120 77 134 77 142 83 C136 91 118 91 112 83 Z", "#fff");
    if (kind === "look") return g("k-eyes", lids + g("k-look", dot(82, 85, 4.8) + dot(136, 85, 4.8)));
    // the sign's look: half-lidded, pupils toward the nose
    return g("k-eyes", lids + dot(81, 84, 4.8) + dot(119, 84, 4.8));
  }
  function mouth(kind) {
    if (kind === "open") return path("M88 104 Q100 124 112 104 Z", PINK, 5);
    if (kind === "o") return oval(100, 109, 5, 6, PINK, 4.5);
    if (kind === "none") return "";
    return path("M89 105 Q94.5 112 100 105 Q105.5 112 111 105", null, 4.5);
  }
  function stripes(short) {
    if (short) return both("M44 96 Q50 95 56 97", null, 5) + both("M43 105 Q50 104 57 106", null, 5);
    return both("M33 94 Q43 92 52 95") + both("M32 104 Q43 103 54 106") + both("M35 114 Q45 114 53 116");
  }
  function face(o) {
    o = o || {};
    return (o.blush === false ? "" : oval(64, 101, 8, 5, BLUSH) + oval(136, 101, 8, 5, BLUSH)) +
      eyes(o.eyes) + oval(100, 97, 5.5, 4.2, INK) + mouth(o.mouth) + stripes(o.short);
  }
  function head(o) { return g("k-head", path(HEAD, FUR) + face(o)); }
  function cat(o) {
    o = o || {};
    return (o.tail === false ? "" : g("k-tail", tube(TAIL))) + path(BODY, FUR) + (o.belly || "") + (o.armsBack || "") + head(o.face) + (o.front || "");
  }
  function restArms(which) {
    return (which !== "r" ? path(ARM_REST) : "") + (which !== "l" ? path(mirror(ARM_REST)) : "");
  }
  function motion(x, y) { return g("k-motion", path("M" + x + " " + y + " q8 4 8 13", null, 4) + path("M" + (x + 10) + " " + (y - 12) + " q10 6 10 18", null, 4)); }

  /* ---------- props ---------- */
  function iced() {
    return path("M103 101 L112 132 L109 178", null, 4.5) +
      g("k-sip", path("M76 140 L83 194 Q100 201 117 194 L124 140 Z", "rgba(255,255,255,0.85)") +
        '<path d="M80.5 162 L83.5 192 Q100 198 116.5 192 L119.5 162 Z" fill="#4a5f8c"/>' +
        g("k-ice", '<rect x="88" y="150" width="13" height="13" rx="3" fill="#fff" stroke="' + INK + '" stroke-width="3" transform="rotate(-10 94 156)"/>') +
        g("k-ice k-ice2", '<rect x="101" y="166" width="12" height="12" rx="3" fill="#dfe8f3" stroke="' + INK + '" stroke-width="3" transform="rotate(12 107 172)"/>') +
        path("M76 140 L124 140") + paw(76, 168, 9) + paw(124, 168, 9));
  }
  function heartLocket() {
    return path("M80 140 Q100 152 120 140", null, 3.5) +
      g("k-beat", path("M100 202 C70 182 62 166 70 154 C78 142 93 145 100 156 C107 145 122 142 130 154 C138 166 130 182 100 202 Z", "#f6d3d9") +
        path("M100 186 C88 178 86 170 90 165 C94 160 99 162 100 167 C101 162 106 160 110 165 C114 170 112 178 100 186 Z", "#fff", 3.5)) +
      paw(68, 170, 9) + paw(132, 170, 9);
  }
  function giftBox() {
    return g("k-hop", path("M70 156 L130 156 L130 204 L70 204 Z", SUIT) + path("M66 146 L134 146 L134 160 L66 160 Z", SUIT_DARK) +
      path("M100 146 L100 204", null, 5) +
      g("k-bow", path("M100 146 C88 128 74 132 80 142 C84 148 96 146 100 146 C104 146 116 148 120 142 C126 132 112 128 100 146 Z", "#f6d3d9", 4.5)) +
      paw(68, 178, 9) + paw(132, 178, 9));
  }
  function phone() {
    var qr = "";
    [[86, 160], [106, 160], [86, 180]].forEach(function (q) { qr += '<rect x="' + q[0] + '" y="' + q[1] + '" width="11" height="11" rx="1.5" fill="none" stroke="' + INK + '" stroke-width="3"/>' + '<rect x="' + (q[0] + 3.5) + '" y="' + (q[1] + 3.5) + '" width="4" height="4" fill="' + INK + '"/>'; });
    qr += '<rect x="107" y="181" width="4" height="4" fill="' + INK + '"/><rect x="113" y="187" width="4" height="4" fill="' + INK + '"/><rect x="107" y="191" width="4" height="4" fill="' + INK + '"/>';
    return g("k-buzz", path("M78 148 Q78 142 84 142 L116 142 Q122 142 122 148 L122 202 Q122 208 116 208 L84 208 Q78 208 78 202 Z", "#fff") + g("k-screen", qr) + paw(78, 194, 9) + paw(122, 194, 9));
  }
  function magnifier() {
    return g("k-scan", tube("M150 108 L178 146", 15) + '<circle cx="132" cy="86" r="26" fill="rgba(223,232,243,0.55)"' + STROKE + "/>" +
      '<path d="M118 74 Q124 66 134 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' + paw(176, 146, 10));
  }
  function confetti() {
    var bits = [[22, 40, "#a9bfdb", 0], [178, 30, "#ec9aa9", 1], [14, 120, "#ec9aa9", 0], [186, 108, "#a9bfdb", 1], [40, 8, "#24396a", 1], [158, 6, "#a9bfdb", 0], [196, 66, "#24396a", 0], [6, 76, "#24396a", 1]];
    return g("k-confetti", bits.map(function (b) {
      return g("k-bit", b[3] ? '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5" fill="' + b[2] + '"/>' : '<rect x="' + (b[0] - 4) + '" y="' + (b[1] - 7) + '" width="8" height="14" rx="2" fill="' + b[2] + '" transform="rotate(' + (b[0] % 50 - 25) + " " + b[0] + " " + b[1] + ')"/>');
    }).join(""));
  }
  function zzz(x, y) {
    return '<g class="k-zzz" fill="' + INK + '" font-family="Patrick Hand, Comic Sans MS, sans-serif"><text x="' + x + '" y="' + y + '" font-size="30">z</text><text x="' + (x + 20) + '" y="' + (y - 20) + '" font-size="24">z</text><text x="' + (x + 36) + '" y="' + (y - 38) + '" font-size="18">z</text></g>';
  }
  function sparkles() {
    return g("k-stars", [[14, 34, 13], [188, 40, 11], [6, 146, 9], [194, 150, 10], [172, 2, 8]].map(function (s) { return g("k-star", star(s[0], s[1], s[2])); }).join(""));
  }

  /* ---------- shark costume ---------- */
  var HOOD = "M22 112 C18 66 54 30 100 30 C146 30 182 66 178 112 C176 146 144 160 100 160 C56 160 24 146 22 112 Z";
  var FIN = "M78 36 C86 14 104 2 126 0 C118 12 116 24 120 36 Z";
  function teeth(cx, cy, rx, ry, from, to, n, inward) {
    var d = "";
    for (var i = 0; i < n; i++) {
      var a0 = (from + (to - from) * (i / n)) * Math.PI / 180, a1 = (from + (to - from) * ((i + 1) / n)) * Math.PI / 180, am = (a0 + a1) / 2;
      var p0 = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)], p1 = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
      var tip = [cx + (rx - inward) * Math.cos(am), cy + (ry - inward) * Math.sin(am)];
      d += "M" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + " L" + tip[0].toFixed(1) + " " + tip[1].toFixed(1) + " L" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + " Z ";
    }
    return path(d, "#fff", 3);
  }
  function sharkHead(o) {
    o = o || {};
    return g("k-fintop", path(FIN, SUIT)) + path(HOOD, SUIT) +
      both("M30 100 Q36 108 34 118", null, 4) + both("M38 96 Q44 106 41 118", null, 4) +
      oval(100, 108, 57, 44, FUR, SW) +
      teeth(100, 108, 57, 44, 206, 334, 6, 10) + teeth(100, 108, 57, 44, 52, 128, 3, 8) +
      '<g transform="translate(100 114) scale(0.8) translate(-100 -92)">' + face(Object.assign({ short: true }, o)) + "</g>";
  }
  function shark(o) {
    o = o || {};
    var belly = oval(100, 186, 27, 25, FUR, 4);
    var finL = path("M66 156 C48 158 36 170 33 184 C46 183 58 179 70 174 Z", SUIT);
    var finR = o.wave ? g("k-finwave", path("M134 154 C152 146 166 130 172 114 C178 130 170 150 146 170 Z", SUIT) + motion(178, 102)) : path(mirror("M66 156 C48 158 36 170 33 184 C46 183 58 179 70 174 Z"), SUIT);
    return g("k-sharktail", path("M140 198 C158 200 170 192 180 176 C185 192 185 206 179 220 C168 212 156 210 140 212 Z", SUIT)) +
      path(BODY, SUIT) + belly + finL + finR + g("k-head", sharkHead(o.face));
  }
  function water() {
    return g("k-waves", path("M-30 150 Q-5 138 20 150 T70 150 T120 150 T170 150 T220 150 T270 150 L270 200 L-30 200 Z", WATER) +
      path("M-10 170 Q10 162 30 170 T70 170 T110 170 T150 170 T190 170 T230 170", null, 4));
  }

  /* ---------- side view (walking) ---------- */
  function leg(x, cls) { return g("k-leg " + cls, tube("M" + x + " 108 L" + (x - 2) + " 146", 21)); }
  function walker() {
    return g("k-walkbob",
      leg(84, "k-leg-a") + leg(164, "k-leg-b") +
      g("k-tail k-tail-side", tube("M50 94 C30 88 22 66 30 46 C34 38 42 38 44 46", 17)) +
      path("M58 74 C36 78 32 112 48 124 C62 134 156 136 178 122 C194 112 192 82 172 74 C146 64 84 66 58 74 Z", FUR) +
      leg(68, "k-leg-b") + leg(148, "k-leg-a") +
      path("M112 84 Q120 92 116 104 M126 82 Q134 90 130 102", null, 4) +
      '<g transform="translate(116 -6) scale(0.64)">' + head({}) + "</g>");
  }

  /* ---------- poses ---------- */
  var POSES = {
    drink: { box: "0 0 200 228", draw: function () { return cat({ face: { mouth: "none" } }) + iced(); } },
    wave: { box: "0 0 204 228", draw: function () {
      return cat({ face: { eyes: "happy" }, armsBack: g("k-wave", tube("M136 150 C152 140 164 124 170 110", 16)), front: restArms("l") + g("k-wave", paw(171, 106, 11) + motion(184, 92)) });
    } },
    heart: { box: "0 0 200 228", draw: function () { return cat({ face: { eyes: "big" } }) + heartLocket(); } },
    gift: { box: "0 0 200 228", draw: function () { return cat({ face: { eyes: "happy" } }) + giftBox(); } },
    phone: { box: "0 0 200 228", draw: function () { return cat({ face: { eyes: "look", mouth: "o" } }) + phone(); } },
    yay: { box: "0 0 204 228", draw: function () {
      var arms = g("k-cheer-l", tube("M66 150 C50 140 38 124 32 108", 16)) + g("k-cheer-r", tube("M134 150 C150 140 162 124 168 108", 16));
      return confetti() + cat({ face: { eyes: "happy", mouth: "open" }, armsBack: arms, front: g("k-cheer-l", paw(30, 104, 11)) + g("k-cheer-r", paw(170, 104, 11)) });
    } },
    search: { box: "0 0 204 228", draw: function () { return cat({ face: { eyes: "look", mouth: "o" }, front: restArms("l") }) + magnifier(); } },
    sleep: { box: "0 0 240 170", draw: function () {
      return '<g transform="translate(20 0)">' + g("k-breathe", g("k-tail", tube("M178 152 C200 150 210 136 204 122", 17)) +
        path("M30 160 C24 118 52 82 112 82 C168 82 204 110 200 160 Z", FUR) + path("M150 160 Q156 150 168 152")) + "</g>" +
        '<g transform="translate(6 34) scale(0.76)">' + g("k-breathe-head", path(HEAD, FUR) + face({ eyes: "sleep", mouth: "w" })) + "</g>" +
        path("M60 158 Q70 150 84 156 Q98 150 110 158", FUR, 5) + zzz(178, 70);
    } },
    peek: { box: "0 0 200 150", draw: function () {
      return head({ mouth: "o" }) + paw(62, 140, 13) + paw(138, 140, 13) +
        path("M56 136 L56 144 M64 134 L64 144", null, 3) + path(mirror("M56 136 L56 144 M64 134 L64 144"), null, 3);
    } },
    paint: { box: "0 0 214 228", draw: function () {
      var brush = g("k-brush", tube("M130 176 L176 120", 13) + path("M171 126 L181 114", null, 5) +
        path("M178 104 C186 96 196 98 194 108 C192 116 184 120 178 116 Z", SUIT_DARK, 4.5) + paw(130, 174, 10));
      var painted = g("k-twinkle", path("M196 74 C184 66 182 56 188 52 C193 48 197 51 198 55 C199 51 203 48 208 52 C214 56 210 66 196 74 Z", "none", 4.5).replace('stroke="' + INK + '"', 'stroke="' + PINK + '"') +
        dot(178, 64, 3, PINK) + dot(206, 84, 2.5, SUIT_DARK));
      return painted + cat({ face: { eyes: "look", mouth: "w" }, front: restArms("l") }) + brush;
    } },
    sparkle: { box: "-8 -12 216 242", draw: function () { return sparkles() + cat({ face: { eyes: "big", mouth: "w" }, front: restArms() }); } },
    box: { box: "0 0 200 204", draw: function () {
      return head({ eyes: "happy" }) +
        g("k-boxjig", path("M30 112 L8 92 L24 84 L46 112 Z", SUIT_DARK) + path(mirror("M30 112 L8 92 L24 84 L46 112 Z"), SUIT_DARK) +
          path("M30 112 L170 112 L170 196 L30 196 Z", SUIT) + path("M92 112 L108 112 L108 196 L92 196 Z", "#f6d3d9", 4.5) +
          paw(70, 114, 11) + paw(130, 114, 11));
    } },
    walk: { box: "0 -8 236 166", draw: walker },
    paw: { box: "0 0 92 134", draw: function () {
      return tube("M46 150 L46 70", 44) + oval(46, 58, 30, 27, FUR, SW) +
        oval(29, 47, 5.5, 7, PINK) + oval(46, 40, 6, 7.5, PINK) + oval(63, 47, 5.5, 7, PINK) + oval(46, 64, 12, 9.5, PINK);
    } },
    shark: { box: "0 -6 200 234", draw: function () { return shark({ wave: true, face: { mouth: "w" } }); } },
    sharkPeek: { box: "0 -4 200 170", draw: function () {
      return g("k-head", sharkHead({ mouth: "o" })) + path("M40 166 C46 150 64 146 78 156 Z", SUIT) + path(mirror("M40 166 C46 150 64 146 78 156 Z"), SUIT);
    } },
    sharkSleep: { box: "0 -6 200 172", draw: function () { return g("k-breathe-head", sharkHead({ eyes: "sleep", mouth: "w" })) + zzz(150, 40); } },
    swim: { box: "0 -6 200 196", draw: function () { return g("k-bob", sharkHead({ mouth: "w" })) + water(); } }
  };

  var n = 0;
  window.MINISE_CAT = function (pose, label) {
    var name = POSES[pose] ? pose : "drink", p = POSES[name];
    // every cat blinks and sways on its own timing, so a page full of cats never moves in step
    var delay = -((n++ * 1.37) % 5).toFixed(2);
    return '<svg class="kitty kitty-' + name + '" viewBox="' + p.box + '" xmlns="http://www.w3.org/2000/svg" style="--kd:' + delay + 's"' +
      (label ? ' role="img" aria-label="' + String(label).replace(/"/g, "&quot;") + '"' : ' aria-hidden="true" focusable="false"') + ">" + p.draw() + "</svg>";
  };
  window.MINISE_CAT_POSES = Object.keys(POSES);

  /* cats only move while they are on screen (saves battery on phones) */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle("play", e.isIntersecting); });
  }, { rootMargin: "80px" }) : null;
  function watch(root) {
    if (!root || !root.querySelectorAll) return;
    var list = root.matches && root.matches("svg.kitty") ? [root] : root.querySelectorAll("svg.kitty");
    Array.prototype.forEach.call(list, function (s) {
      if (s.getAttribute("data-kw")) return;
      s.setAttribute("data-kw", "1");
      if (io) io.observe(s); else s.classList.add("play");
    });
  }
  function unwatch(root) {
    if (!io || !root || !root.querySelectorAll) return;
    var list = root.matches && root.matches("svg.kitty") ? [root] : root.querySelectorAll("svg.kitty");
    Array.prototype.forEach.call(list, function (s) { io.unobserve(s); });
  }
  if ("MutationObserver" in window) {
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        Array.prototype.forEach.call(r.addedNodes, function (node) { if (node.nodeType === 1) watch(node); });
        Array.prototype.forEach.call(r.removedNodes, function (node) { if (node.nodeType === 1) unwatch(node); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  watch(document.body);
})();

/* Minise Arte · the cute note card. The shop draws it when a customer saves their note as a picture, and the admin
   draws the very same card from the order, ready to print. Papers, colours and stickers live here for both. */
(function () {
  var PAPERS = { tea: ["drink"], milk: ["peniMilk"], night: ["sleep", "peniSleep"], costume: ["shark", "peniBunny"], clover: ["peniSparkle"] };
  var LOOK = {
    tea: { bg: ["#f6efe0", "#efe4cc"], card: "#fbf7ee", ink: "#24396a", dot: "#a9bfdb" },
    milk: { bg: ["#fbd9e2", "#f6c4d1"], card: "#fff6f8", ink: "#7a3346", dot: "#ffffff" },
    night: { bg: ["#1f2c55", "#34477d"], card: "#2b3b6b", ink: "#fdf6dc", dot: "#fff3c4" },
    costume: { bg: ["#cfe0f2", "#f8d6e0"], card: "#fbf8f3", ink: "#24396a", dot: "#ffffff" },
    clover: { bg: ["#dff3ea", "#c8eadb"], card: "#f7fcf9", ink: "#24563f", dot: "#9fd8bf" }
  };
  var STK = {
    heart: '<svg viewBox="0 0 40 40"><path d="M20 35C8 26 3 19 3 12.5 3 7.5 7 4 11.5 4c3.4 0 6.5 2 8.5 5 2-3 5.1-5 8.5-5C33 4 37 7.5 37 12.5 37 19 32 26 20 35Z" fill="#f4a9ba" stroke="#24396a" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 11c1-2.5 3-3.6 5-3.4" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 40 40"><path d="M20 3l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L20 28.4 9.7 34.2l2.4-11.4L3.5 14.9l11.6-1.3Z" fill="#f3d873" stroke="#24396a" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    clover: '<svg viewBox="0 0 40 40"><g fill="#8fd1b0" stroke="#24396a" stroke-width="2.3"><circle cx="14" cy="14" r="7"/><circle cx="26" cy="14" r="7"/><circle cx="14" cy="26" r="7"/><circle cx="26" cy="26" r="7"/></g><circle cx="20" cy="20" r="3" fill="#6cb894"/><path d="M24 30Q28 36 34 37" fill="none" stroke="#24396a" stroke-width="2.5" stroke-linecap="round"/></svg>',
    bow: '<svg viewBox="0 0 40 40"><path d="M20 20C12 10 4 10 4 17s8 9 16 3Zm0 0c8-10 16-10 16-3s-8 9-16 3Z" fill="#c9b3e0" stroke="#24396a" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 22 12 34l4-1 2 4 3-13M22 22l6 12-4-1-2 4-3-13" fill="#c9b3e0" stroke="#24396a" stroke-width="2.3" stroke-linejoin="round"/><circle cx="20" cy="20" r="3.5" fill="#f4a9ba" stroke="#24396a" stroke-width="2.3"/></svg>',
    paw: '<svg viewBox="0 0 40 40"><g fill="#f6c9d3" stroke="#24396a" stroke-width="2.3"><ellipse cx="20" cy="26" rx="9" ry="7.5"/><circle cx="9" cy="17" r="4"/><circle cx="16" cy="10" r="4"/><circle cx="24" cy="10" r="4"/><circle cx="31" cy="17" r="4"/></g></svg>',
    berry: '<svg viewBox="0 0 40 40"><path d="M20 36C10 30 6 22 8 15c1.5-5 6-6 12-6s10.5 1 12 6c2 7-2 15-12 21Z" fill="#e8546b" stroke="#24396a" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 9c2-5 6-4 8-1 2-3 6-4 8 1-4 2-12 2-16 0Z" fill="#7bb07d" stroke="#24396a" stroke-width="2.3" stroke-linejoin="round"/><g fill="#fff3c4"><circle cx="15" cy="18" r="1.4"/><circle cx="23" cy="17" r="1.4"/><circle cx="19" cy="24" r="1.4"/><circle cx="26" cy="24" r="1.4"/><circle cx="14" cy="26" r="1.4"/></g></svg>'
  };
  function svgImage(svg, w, h) {
    var s = svg.replace(/^<svg/, "<svg" + (svg.indexOf("xmlns=") < 0 ? ' xmlns="http://www.w3.org/2000/svg"' : "") + ' width="' + w + '" height="' + h + '"');
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    });
  }
  // words stay whole (Lao and Chinese have no spaces, so the browser finds the words), punctuation stays with its word
  function wrapLines(x, text, max, lang) {
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
  /* the card, 1080 × 1350 (4:5). n = { paper, to, msg, from, st: [stickers], toLabel, fromLabel, lang }.
     An empty "to" or "from" leaves that line out. Resolves with the canvas. */
  function draw(n) {
    var W = 1080, H = 1350, paper = PAPERS[n.paper] ? n.paper : "tea", look = LOOK[paper];
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    var FONT = '"Patrick Hand", "Noto Sans Lao", "Noto Sans SC", "Comic Sans MS", sans-serif';
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('60px "Patrick Hand"'), document.fonts.load('60px "Noto Sans Lao"'), document.fonts.load('60px "Noto Sans SC"')]).catch(function () {}) : Promise.resolve();
    return ready.then(function () {
      var g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = look.dot;
      for (var yy = 40; yy < H; yy += 70) for (var xx = (yy / 70) % 2 ? 40 : 75; xx < W; xx += 70) { x.globalAlpha = 0.55; x.beginPath(); x.arc(xx, yy, paper === "night" ? 3 : 7, 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 1;
      // the note paper
      x.save();
      x.shadowColor = "rgba(20,30,60,0.25)"; x.shadowBlur = 40; x.shadowOffsetY = 18;
      x.fillStyle = look.card;
      x.beginPath(); x.roundRect ? x.roundRect(110, 150, 860, 1000, 40) : x.rect(110, 150, 860, 1000); x.fill();
      x.restore();
      x.lineWidth = 6; x.strokeStyle = "#24396a";
      x.beginPath(); x.roundRect ? x.roundRect(110, 150, 860, 1000, 40) : x.rect(110, 150, 860, 1000); x.stroke();
      // washi tape
      x.save(); x.translate(540, 150); x.rotate(-0.05); x.fillStyle = "rgba(169,191,219,0.85)"; x.fillRect(-120, -32, 240, 64); x.restore();
      x.fillStyle = look.ink;
      x.font = "54px " + FONT; x.textAlign = "left"; x.textBaseline = "alphabetic";
      if (n.to) x.fillText(n.toLabel + ": " + n.to, 300, 300);
      var size = 84, lines;
      do { x.font = size + "px " + FONT; lines = wrapLines(x, n.msg || "", 680, n.lang); size -= 6; } while (lines.length * size * 1.3 > 440 && size > 40);
      size += 6;
      x.textAlign = "center";
      var top = 580 - (lines.length - 1) * size * 0.65;
      lines.forEach(function (l, i) { x.fillText(l, 540, top + i * size * 1.3); });
      x.textAlign = "left"; x.font = "54px " + FONT;
      if (n.from) x.fillText(n.fromLabel + ": " + n.from, 180, 930);
      x.textAlign = "center"; x.font = "40px " + FONT; x.fillStyle = paper === "night" ? "#fdf6dc" : "#24396a";
      x.fillText("Minise Arte · minisearte.com", 540, 1250);
      var cats = PAPERS[paper], st = (n.st || []).filter(function (s) { return STK[s]; }).slice(0, 3);
      var jobs = cats.map(function (p) { return window.MINISE_CAT ? svgImage(window.MINISE_CAT(p), 300, 300) : Promise.resolve(null); });
      return Promise.all(jobs.concat(st.map(function (s) { return svgImage(STK[s], 150, 150); }))).then(function (ims) {
        ims.slice(0, cats.length).forEach(function (im, i) { if (im) { if (cats.length === 1) x.drawImage(im, 650, 850, 280, 280); else x.drawImage(im, 530 + i * 200, 900, 220, 220); } });
        var spots = [[128, 168, -0.3], [802, 190, 0.25], [130, 990, 0.2]];
        ims.slice(cats.length).forEach(function (im, i) { if (im) { x.save(); x.translate(spots[i][0] + 75, spots[i][1] + 75); x.rotate(spots[i][2]); x.drawImage(im, -75, -75, 150, 150); x.restore(); } });
        return c;
      });
    });
  }
  window.MINISE_NOTE = { PAPERS: PAPERS, LOOK: LOOK, STK: STK, draw: draw, svgImage: svgImage, wrapLines: wrapLines };
})();

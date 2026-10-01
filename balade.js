/* Balade pixel art : appelée par startWalk(callbackFin). Fichiers à côté : map.png, dos1.png, dos2.png, nous.png, lucario.png */
(() => {
  const W = 270, H = 480, SPEED = 70, MAPH = 1422, MAPW = 400, OUT = "#2b1b3d";

  /* ====== TEXTES À PERSONNALISER ====== */
  const T = {
    a: "Un cadeau est posé devant la maison ! Il y a une photo dedans...",
    b: "Une lettre dans la boîte aux lettres ! Elle cache une photo.",
    c: "Une étoile est tombée du ciel... et c'est une photo !",
    l1: () => "LUCARIO : Enfin te voilà, " + NAME + " ! Je gardais des souvenirs pour toi.",
    l2: "Regarde celui-ci...",
    l3: "Et celui-là aussi.",
    l4: "Le gâteau t'attend tout en haut. N'oublie pas de faire un vœu !",
    fin: "Et voilà le gâteau !"
  };

  /* Trajet (x, y sur la carte) ; le 3e élément = arrêt */
  const ROUTE = [[370,1015],[150,1015],[150,930,"a"],[150,775],[330,775],[330,665,"b"],
                 [330,350],[330,235,"c"],[345,190,"d"],[350,122,"fin"]];
  const ITEMS = { a:{x:205,y:965,t:"gift",p:0}, b:{x:272,y:645,t:"mail",p:1}, c:{x:300,y:238,t:"star",p:2} };

  const img = s => { const i = new Image(); i.src = s; return i; };
  const ok = i => i.complete && i.naturalWidth > 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sp = (rows, pal) => {
    const c = document.createElement("canvas"); c.width = rows[0].length; c.height = rows.length;
    const x = c.getContext("2d");
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
    return c;
  };
  const SPR = {
    gift: sp(["..RR.RR.",".R.RRR.R","..RRRR..","YYYRRYYY","YYYRRYYY","YYYRRYYY","YYYRRYYY","DDDDDDDD"], {R:"#e8344e",Y:"#ffd166",D:"#d9a441"}),
    mail: sp(["........","WWWWWWWW","WPWWWWPW","WWPWWPWW","WWWPPWWW","WWWWWWWW","WWWWWWWW","DDDDDDDD"], {W:"#fff5f8",P:"#ff8fb1",D:"#c9b6da"}),
    star: sp(["...YY...","...YY...","YYYYYYYY",".YYYYYY.","..YYYY..",".YYYYYY.",".YY..YY.","YY....YY"], {Y:"#ffd166"})
  };

  const mapI = img("map.png"), dos = [img("dos1.png"), img("dos2.png")], front = img("nous.png"), luc = img("lucario.png");

  window.startWalk = function (done) {
    const css = document.createElement("style");
    css.textContent = `
    #walk{position:fixed;inset:0;background:#000;display:flex;justify-content:center;z-index:5;cursor:pointer;font-family:"Press Start 2P",monospace;overflow:hidden}
    #walk canvas{width:min(100vw,56.25vh);height:auto;image-rendering:pixelated}
    #walk .dlg{position:absolute;left:50%;transform:translateX(-50%);bottom:3vh;width:min(94vw,520px);min-height:5.5em;display:none;
      background:#fff5f8;color:${OUT};border:4px solid ${OUT};box-shadow:0 0 0 4px #ff8fb1;padding:14px;font-size:clamp(9px,2.6vw,12px);line-height:1.9}
    #walk .ph{position:absolute;left:50%;top:5vh;transform:translateX(-50%) rotate(-2deg);display:none;background:#fff5f8;
      padding:10px 10px 22px;border:4px solid ${OUT};box-shadow:6px 6px 0 rgba(0,0,0,.4)}
    #walk .ph img{display:block;max-width:min(78vw,340px);max-height:46vh}
    #walk .fade{position:absolute;inset:0;background:#000;opacity:1;transition:opacity .9s;pointer-events:none}`;
    document.head.appendChild(css);
    const box = document.createElement("div");
    box.id = "walk";
    box.innerHTML = `<canvas width="${W}" height="${H}"></canvas><div class="ph"><img alt=""></div><div class="dlg"></div><div class="fade"></div>`;
    document.body.appendChild(box);
    const cv = box.querySelector("canvas"), ctx = cv.getContext("2d");
    const dlg = box.querySelector(".dlg"), ph = box.querySelector(".ph"), phImg = ph.querySelector("img"), fade = box.querySelector(".fade");
    ctx.imageSmoothingEnabled = false;
    setTimeout(() => fade.style.opacity = 0, 50);

    const pos = { x: ROUTE[0][0], y: ROUTE[0][1] };
    let moving = false, t = 0, found = {}, lucarioOn = false;
    const petals = Array.from({ length: 28 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 8 + Math.random() * 14, d: Math.random() * 6 }));

    /* ---- dessin ---- */
    function walker() {
      const f = moving ? dos[Math.floor(t * 5) % 2] : dos[0];
      const im = ok(f) ? f : front;
      if (!ok(im)) return;
      const h = 60, w = h * im.naturalWidth / im.naturalHeight;
      const hop = moving && Math.floor(t * 5) % 2 ? -2 : 0;
      return [im, -w / 2, -h + hop, w, h];
    }
    function draw(dt) {
      t += dt;
      const cx = Math.max(0, Math.min(MAPW - W, pos.x - W / 2));
      const cy = Math.max(0, Math.min(MAPH - H, pos.y - H * 0.62));
      ctx.clearRect(0, 0, W, H);
      if (ok(mapI)) ctx.drawImage(mapI, cx, cy, W, H, 0, 0, W, H);
      const X = x => Math.round(x - cx), Y = y => Math.round(y - cy);

      for (const k in ITEMS) if (!found[k]) {
        const it = ITEMS[k], b = Math.round(Math.sin(t * 3) * 2);
        ctx.drawImage(SPR[it.t], X(it.x) - 12, Y(it.y) - 24 + b, 24, 24);
        if (Math.floor(t * 4) % 2) { ctx.fillStyle = "#fff"; ctx.fillRect(X(it.x) + 12, Y(it.y) - 28 + b, 3, 3); ctx.fillRect(X(it.x) - 15, Y(it.y) - 10 + b, 3, 3); }
      }
      if (lucarioOn && ok(luc)) { const h = 64, w = h * luc.naturalWidth / luc.naturalHeight; ctx.drawImage(luc, X(292) - w / 2, Y(172) - h, w, h); }

      /* mini gâteau tout en haut */
      const gx = X(334), gy = Y(98), fl = Math.floor(t * 4) % 2;
      ctx.fillStyle = OUT; ctx.fillRect(gx - 2, gy - 4, 36, 6); ctx.fillRect(gx, gy - 14, 32, 12); ctx.fillRect(gx + 6, gy - 24, 20, 11);
      ctx.fillStyle = "#efe3f7"; ctx.fillRect(gx - 1, gy - 3, 34, 3);
      ctx.fillStyle = "#ff8fb1"; ctx.fillRect(gx + 2, gy - 12, 28, 8);
      ctx.fillStyle = "#b99cf5"; ctx.fillRect(gx + 8, gy - 22, 16, 7);
      ctx.fillStyle = "#fff5f8"; ctx.fillRect(gx + 2, gy - 12, 28, 2); ctx.fillRect(gx + 8, gy - 22, 16, 2);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(gx + 15, gy - 30, 2, 6);
      ctx.fillStyle = fl ? "#ff9f1c" : "#ffe66d"; ctx.fillRect(gx + 15, gy - 35 + fl, 2, 5 - fl);

      const w = walker();
      if (w) ctx.drawImage(w[0], X(pos.x) + w[1], Y(pos.y) + w[2], w[3], w[4]);

      /* pétales qui tombent + léger voile rose */
      ctx.fillStyle = "#ffc2d6";
      petals.forEach(p => {
        p.y += p.s * dt; p.x += Math.sin(t + p.d) * 8 * dt;
        if (p.y > H) { p.y = -4; p.x = Math.random() * W; }
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      });
      ctx.fillStyle = "rgba(255,170,210,.07)"; ctx.fillRect(0, 0, W, H);
    }
    let last = performance.now(), alive = true;
    (function loop(n) {
      if (!alive) return;
      draw(Math.min(.05, (n - last) / 1000)); last = n;
      requestAnimationFrame(loop);
    })(last);

    /* ---- mouvement, dialogues ---- */
    function walkTo([x, y]) {
      return new Promise(res => {
        moving = true;
        let prev = performance.now();
        (function step(n) {
          const dt = Math.min(.05, (n - prev) / 1000); prev = n;
          const dx = x - pos.x, dy = y - pos.y, d = Math.hypot(dx, dy), m = SPEED * dt;
          if (d <= m) { pos.x = x; pos.y = y; moving = false; return res(); }
          pos.x += dx / d * m; pos.y += dy / d * m;
          requestAnimationFrame(step);
        })(prev);
      });
    }
    const tap = () => new Promise(r => box.addEventListener("pointerdown", r, { once: true }));
    async function say(text, photo) {
      dlg.style.display = "block";
      if (photo) { phImg.src = photo; ph.style.display = "block"; }
      let skip = false; const on = () => skip = true;
      box.addEventListener("pointerdown", on);
      for (let i = 1; i <= text.length && !skip; i++) { dlg.textContent = text.slice(0, i); await sleep(28); }
      dlg.textContent = text;
      box.removeEventListener("pointerdown", on);
      await tap();
      dlg.style.display = "none"; ph.style.display = "none";
    }

    async function run() {
      await sleep(900);
      for (let i = 1; i < ROUTE.length; i++) {
        await walkTo(ROUTE[i]);
        const id = ROUTE[i][2];
        if (!id) continue;
        if (ITEMS[id]) { found[id] = true; await say(T[id], PHOTOS[ITEMS[id].p]); }
        if (id === "d") {
          lucarioOn = true; await sleep(500);
          await say(T.l1()); await say(T.l2, PHOTOS[3]); await say(T.l3, PHOTOS[4]); await say(T.l4);
        }
        if (id === "fin") await say(T.fin);
      }
      fade.style.opacity = 1; await sleep(1000);
      alive = false; box.remove(); css.remove();
      done();
    }
    run();
  };
})();

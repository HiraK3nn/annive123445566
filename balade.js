/* Balade pixel art : appelée par startWalk(callbackFin).
   Fichiers à côté : map.png, dos1.png, dos2.png, lucario.png (+ nous.png en secours, facultatif)
   Globales attendues : NAME (prénom) et PHOTOS (tableau de 5 photos), comme avant. */
(() => {
  const W = 270, H = 480, SPEED = 60, MAPW = 450, MAPH = 637, OUT = "#2b1b3d";
  const CH = 28;                 // hauteur des persos à l'écran (dos1/dos2.png font déjà 28 px de haut)
  const K = MAPW / 723;          // les coordonnées ci-dessous sont en pixels de la carte d'origine (723×1024)
  const pt = (x, y) => ({ x: Math.round(x * K), y: Math.round(y * K) });
  const P = (x, y, id) => [Math.round(x * K), Math.round(y * K), id];

  /* ====== TEXTES À PERSONNALISER ====== */
  const T = {
    a: "Un cadeau est posé devant la maison ! Il y a une photo dedans...",
    b: "Une lettre dans la boîte aux lettres ! Elle cache une photo.",
    c: "Une étoile est tombée du ciel... et c'est une photo !",
    l1: () => "LUCARIO : Enfin te voilà, " + NAME + " ! Je gardais des souvenirs pour toi.",
    l2: "Regarde celui-ci...",
    l3: "Et celui-là aussi.",
    l4: "Le gâteau t'attend sous la tour Eiffel. N'oublie pas de faire un vœu !",
    fin: "Et voilà le gâteau !"
  };

  /* Trajet (x, y sur la carte d'origine) ; le 3e élément = arrêt */
  const ROUTE = [P(362,1000), P(362,668), P(290,668,"a"), P(412,668), P(412,600), P(448,535,"b"),
                 P(430,440), P(362,432), P(362,342,"c"), P(362,300,"d"), P(362,265,"fin")];
  /* Objets déjà dessinés sur la carte : on ne fait que les faire scintiller (centre de l'objet) */
  const ITEMS = { a:{...pt(237,632), p:0}, b:{...pt(478,487), p:1}, c:{...pt(361,287), p:2} };
  const LUCARIO = pt(322, 268);  // pieds de Lucario (il regarde vers le couple)
  const CAKE = pt(362, 198);     // bas du gâteau, sous la tour Eiffel

  const img = s => { const i = new Image(); i.src = s; return i; };
  const ok = i => i.complete && i.naturalWidth > 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

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
      const h = CH, w = Math.round(h * im.naturalWidth / im.naturalHeight);
      return [im, -Math.round(w / 2), -h, w, h];
    }
    function twinkle(x, y) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
    }
    function marker(x, y) {          /* petite flèche qui rebondit au-dessus d'un objet à ramasser */
      ctx.fillStyle = OUT;
      ctx.fillRect(x - 5, y - 1, 11, 3); ctx.fillRect(x - 3, y + 2, 7, 2); ctx.fillRect(x - 1, y + 4, 3, 2);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(x - 4, y, 9, 2); ctx.fillRect(x - 2, y + 2, 5, 1); ctx.fillRect(x, y + 3, 1, 1);
    }
    function draw(dt) {
      t += dt;
      const cx = Math.max(0, Math.min(MAPW - W, pos.x - W / 2));
      const cy = Math.max(0, Math.min(MAPH - H, pos.y - H * 0.62));
      ctx.clearRect(0, 0, W, H);
      if (ok(mapI)) ctx.drawImage(mapI, cx, cy, W, H, 0, 0, W, H);
      const X = x => Math.round(x - cx), Y = y => Math.round(y - cy);

      /* objets de la carte (cadeau, boîte aux lettres, étoile) : flèche + étincelles tant qu'ils ne sont pas ramassés */
      for (const k in ITEMS) if (!found[k]) {
        const it = ITEMS[k], ix = X(it.x), iy = Y(it.y), b = Math.round(Math.sin(t * 3) * 2);
        marker(ix, iy - 24 + b);
        const s = Math.floor(t * 4);
        if (s % 3 === 0) twinkle(ix + 14, iy - 8);
        if (s % 3 === 1) twinkle(ix - 14, iy + 4);
        if (s % 3 === 2) twinkle(ix + 6, iy + 12);
      }

      /* Lucario (sprite en pixels natifs, retourné pour regarder vers la droite) */
      if (lucarioOn && ok(luc)) {
        const w = luc.naturalWidth, h = luc.naturalHeight, bob = Math.floor(t * 2) % 2;
        ctx.save(); ctx.translate(X(LUCARIO.x), Y(LUCARIO.y) - bob); ctx.scale(-1, 1);
        ctx.drawImage(luc, -Math.round(w / 2), -h, w, h);
        ctx.restore();
      }

      /* mini gâteau sous la tour Eiffel */
      const gx = X(CAKE.x) - 16, gy = Y(CAKE.y) - 2, fl = Math.floor(t * 4) % 2;
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

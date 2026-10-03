/* Balade pixel art : appelée par startWalk(callbackFin).
   Fichiers à côté : map.png, dos1.png, dos2.png, lucario.png, musique.mp3 (+ nous.png en secours, facultatif)
   Globales attendues : NAME (prénom) et PHOTOS (tableau de 5 photos), comme avant. */
(() => {
  const ZOOM = 1.25;
   const W = Math.round(270 / ZOOM), H = Math.round(270 / ZOOM * 16 / 9), SPEED = 42, MAPW = 450, MAPH = 637, OUT = "#2b1b3d";
  const MUSIC = "musique.mp3", VOL = 0.5;   // ta musique (mets le fichier à côté du script) et son volume (0 à 1)
  const STEP = 3;                // pas par seconde (cadence de l'animation de marche) : plus petit = plus lent
  const CH = 34;                 // hauteur des persos à l'écran (dos1/dos2.png font déjà 34 px de haut)
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
                 P(430,440), P(362,432), P(362,342,"c"), P(362,342,"d"), P(362,265,"fin")];
  /* Objets déjà dessinés sur la carte : on ne fait que les faire scintiller (centre de l'objet) */
  const ITEMS = { a:{...pt(237,632), p:0}, b:{...pt(478,487), p:1}, c:{...pt(361,287), p:2} };
  const LUCARIO = pt(330, 352);  // pieds de Lucario : au bord du chemin, avant les lampadaires (il regarde vers le couple)
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
    #walk .snd{position:absolute;top:2vh;right:2vw;z-index:2;width:2.6em;height:2.6em;display:flex;align-items:center;justify-content:center;
      background:#fff5f8;color:${OUT};border:3px solid ${OUT};box-shadow:0 0 0 3px #ff8fb1;font-size:clamp(9px,2.6vw,12px)}
    #walk .fade{position:absolute;inset:0;background:#000;opacity:1;transition:opacity .9s;pointer-events:none}`;
    document.head.appendChild(css);
    const box = document.createElement("div");
    box.id = "walk";
    box.innerHTML = `<canvas width="${W}" height="${H}"></canvas><div class="ph"><img alt=""></div><div class="dlg"></div><div class="snd">♪</div><div class="fade"></div>`;
    document.body.appendChild(box);
    const cv = box.querySelector("canvas"), ctx = cv.getContext("2d");
    const dlg = box.querySelector(".dlg"), ph = box.querySelector(".ph"), phImg = ph.querySelector("img"), fade = box.querySelector(".fade");
    ctx.imageSmoothingEnabled = false;
    setTimeout(() => fade.style.opacity = 0, 50);

    /* ---- musique : démarre avec la balade, en boucle, fondu à l'entrée et à la sortie ---- */
    const bgm = new Audio(MUSIC); bgm.loop = true; bgm.volume = 0;
    let muted = false, fadeTimer = null;
    const snd = box.querySelector(".snd");
    const ramp = (to, ms) => {
      clearInterval(fadeTimer);
      const from = bgm.volume, t0 = performance.now();
      fadeTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        bgm.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k >= 1) clearInterval(fadeTimer);
      }, 40);
    };
    const startMusic = () => bgm.play().then(() => ramp(muted ? 0 : VOL, 1500)).catch(() => {});
    startMusic();                                              // si le navigateur bloque, on réessaie au 1er tap
    box.addEventListener("pointerdown", () => { if (bgm.paused) startMusic(); }, { once: true });
    snd.addEventListener("pointerdown", e => {
      e.stopPropagation();                                     // ne fait pas avancer les dialogues
      muted = !muted; snd.style.opacity = muted ? .5 : 1;
      snd.textContent = muted ? "✕" : "♪";
      ramp(muted ? 0 : VOL, 300);
    });

    const pos = { x: ROUTE[0][0], y: ROUTE[0][1] };
    let moving = false, t = 0, found = {}, lucarioOn = false, smokeT0 = null;
    const petals = Array.from({ length: 28 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 8 + Math.random() * 14, d: Math.random() * 6 }));


    /* ---- petits outils de dessin pixel ---- */
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    function disc(cx, cy, r, c, from) {            // disque "pixel" (sans lissage) ; from = ne dessine que les lignes dy >= from
      ctx.fillStyle = c;
      for (let dy = Math.max(-r, from === undefined ? -r : from); dy <= r; dy++) {
        const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
        ctx.fillRect(Math.round(cx) - w, Math.round(cy) + dy, 2 * w + 1, 1);
      }
    }
    const puffs = Array.from({ length: 11 }, (_, i) => ({
      a: i / 11 * Math.PI * 2 + Math.random() * .5, d: 4 + Math.random() * 12, r: 6 + Math.random() * 5,
      delay: Math.random() * .12, vy: -(5 + Math.random() * 9)
    }));
    function smoke(cx, cy, s) {                    // s = secondes depuis le début du "pouf"
      const L = puffs.map(p => {
        const l = s - p.delay; if (l < 0) return null;
        const g = Math.min(1, l / .45), e = 1 - (1 - g) * (1 - g);
        return { x: cx + Math.cos(p.a) * p.d * e, y: cy + Math.sin(p.a) * p.d * e * .8 + p.vy * l,
                 r: Math.max(1, Math.round(p.r * e * (l > .8 ? 1 - (l - .8) * .8 : 1))), al: l < .55 ? 1 : Math.max(0, 1 - (l - .55) / .55) };
      }).filter(p => p && p.al > 0);
      if (!L.length) return;
      ctx.save();
      const al = L[0].al; ctx.globalAlpha = al;
      L.forEach(p => disc(p.x, p.y, p.r + 1, "#b9a7cf"));     // contour commun
      L.forEach(p => disc(p.x, p.y, p.r, "#f6f0fb"));          // corps du nuage
      L.forEach(p => disc(p.x, p.y, p.r, "#ddd0ec", Math.round(p.r * .35)));   // ombre en bas
      L.forEach(p => disc(p.x - p.r * .3, p.y - p.r * .35, Math.max(1, Math.round(p.r * .3)), "#fff"));   // reflet
      ctx.restore();
      if (s > .45 && s < 1.1) {                                // étincelles quand le nuage se dissipe
        const k = Math.floor(s * 12);
        twinkle(cx - 14, cy - 10 + (k % 3)); twinkle(cx + 15, cy - 4 - (k % 2)); twinkle(cx + 2, cy - 22 + (k % 4));
      }
    }
    function cake(bx, by, fl) {                    // petit gâteau kawaii : bx = milieu, by = bas
      rect(bx - 12, by - 3, 24, 3, OUT); rect(bx - 11, by - 2, 22, 1, "#efe3f7");                        // assiette
      rect(bx - 10, by - 13, 20, 11, OUT); rect(bx - 9, by - 12, 18, 8, "#ff8fb1");                      // étage du bas
      rect(bx - 9, by - 12, 18, 2, "#fff5f8");                                                           // glaçage
      rect(bx - 8, by - 10, 2, 2, "#fff5f8"); rect(bx - 3, by - 10, 2, 3, "#fff5f8"); rect(bx + 3, by - 10, 2, 2, "#fff5f8"); rect(bx + 7, by - 10, 2, 3, "#fff5f8");
      rect(bx - 4, by - 8, 2, 2, OUT); rect(bx + 2, by - 8, 2, 2, OUT); rect(bx - 1, by - 6, 2, 1, OUT);   // yeux + bouche
      rect(bx - 7, by - 7, 2, 1, "#ff5c8a"); rect(bx + 5, by - 7, 2, 1, "#ff5c8a");                      // joues roses
      rect(bx - 6, by - 20, 12, 8, OUT); rect(bx - 5, by - 19, 10, 6, "#b99cf5");                        // étage du haut
      rect(bx - 5, by - 19, 10, 2, "#fff5f8"); rect(bx - 4, by - 17, 2, 2, "#fff5f8"); rect(bx + 1, by - 17, 2, 1, "#fff5f8");
      rect(bx - 5, by - 24, 4, 4, OUT); rect(bx - 4, by - 23, 2, 2, "#e8344e"); rect(bx - 4, by - 23, 1, 1, "#fff");   // cerise
      rect(bx + 2, by - 26, 2, 6, "#ffd166"); rect(bx + 2, by - 24, 2, 1, "#fff5f8");                    // bougie
      rect(bx + 2, by - 30 + fl, 2, 4 - fl, fl ? "#ff9f1c" : "#ffe66d");                                 // flamme
    }

    /* ---- dessin ---- */
    function walker() {
      const f = moving ? dos[Math.floor(t * STEP) % 2] : dos[0];
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
      if (smokeT0 !== null) smoke(X(LUCARIO.x), Y(LUCARIO.y) - 14, t - smokeT0);   // nuage de fumée par-dessus

      /* mini gâteau sous la tour Eiffel */
      cake(X(CAKE.x), Y(CAKE.y), Math.floor(t * 4) % 2);

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
          smokeT0 = t; await sleep(320); lucarioOn = true; await sleep(800);
          await say(T.l1()); await say(T.l2, PHOTOS[3]); await say(T.l3, PHOTOS[4]); await say(T.l4);
        }
        if (id === "fin") await say(T.fin);
      }
      fade.style.opacity = 1; ramp(0, 1000); await sleep(1000);
      bgm.pause(); clearInterval(fadeTimer);
      alive = false; box.remove(); css.remove();
      done();
    }
    run();
  };
})();

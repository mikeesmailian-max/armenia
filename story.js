// Walk Armenia — Pillar 4: Multi-Stage Branching Yerevan Storylines, Factions & Ownable Café / Luxury Garage Empire
(() => {
  "use strict";

  const STORY_KEY = "walk-armenia-empire-v1";
  let emp = {
    arcs: {},          // arcId -> stageIndex (0..3, 3 = completed)
    activeArc: null,   // currently tracked arcId
    cafeLevel: 0,      // 0 = unowned, 1..3
    cafeBank: 0,
    garage: { niva: true, gwagon: false, cabrio: false },
    activeCar: "niva",
    lastTickTs: Date.now()
  };
  try {
    const s = JSON.parse(localStorage.getItem(STORY_KEY) || "null");
    if (s && typeof s === "object") {
      emp = { ...emp, ...s, arcs: { ...(s.arcs || {}) }, garage: { niva: true, ...(s.garage || {}) } };
    }
  } catch {}
  const saveEmp = () => { try { localStorage.setItem(STORY_KEY, JSON.stringify(emp)); } catch {} };

  const ARCS = [
    {
      id: "nardi_champ",
      title: "🎲 Underground Nardi Championship",
      hy: "Նարդու Երևանյան Առաջնություն",
      reward: 45000, respect: 80, clout: 120,
      stages: [
        { label: "Beat the Vernissage Shark", x: 345, z: 365, prompt: "[E] Challenge the Vernissage Nardi Shark (Story Stage 1/3)",
          hy: "Շեշ-բեշ գցի՛ր, տեսնենք ով է վարպետը",
          text: "You roll a cold double-six on the hand-carved walnut board! The crowd erupts and points you toward the high-stakes Saryan semifinal.",
          bonus: 8000 },
        { label: "Win Saryan High-Stakes Semifinal", x: 112, z: -118, prompt: "[E] Play High-Stakes Saryan Semifinal (Story Stage 2/3)",
          hy: "Սարյանի վարպետները սպասում են",
          text: "Under candlelit wine bottles on Saryan Street, you sweep the rival champion 2–0! One final match awaits at the foot of Cascade.",
          bonus: 12000 },
        { label: "Cascade Sunset Grand Final", x: 344, z: -690, prompt: "[E] Play Cascade Grand Nardi Final (Story Stage 3/3)",
          hy: "Կասկադի մեծ եզրափակիչը",
          text: "VICTORY! You claim the Golden Zar trophy in front of Cascade's cheering crowd! (+֏ 45,000, +80 Respect, +120 Clout!)",
          bonus: 45000 }
      ]
    },
    {
      id: "saryan_wine",
      title: "🍷 The Saryan Wine Fest Sabotage",
      hy: "Սարյանի Գինու Փառատոնի Գաղտնիքը",
      reward: 38000, respect: 90, clout: 95,
      stages: [
        { label: "Confront the Rival Sommelier on Northern Ave", x: 268, z: 18, prompt: "[E] Confront Rival Sommelier (Story Stage 1/3)",
          hy: "Ո՞ւր տարաք Արենիի տակառը",
          text: "He panics and slips that the prized 1998 Areni reserve barrel was stashed near Republic Square!",
          bonus: 6000 },
        { label: "Recover Stolen Areni Barrel near Republic Sq", x: 145, z: 465, prompt: "[E] Seize the Stolen Areni Reserve Barrel (Story Stage 2/3)",
          hy: "Գտնվե՛ց հին Արենիի տակառը",
          text: "You intercept the getaway van just before the fountain roundabout and rescue the vintage barrel intact!",
          bonus: 10000 },
        { label: "Deliver Vintage to In Vino Saryan Wine Bar", x: 112, z: -118, venue: "saryan_wine", prompt: "[E] Toast Victory at Saryan Wine Bar (Story Stage 3/3)",
          hy: "Կենացդ՝ Սարյանի փառատոնը փրկված է",
          text: "The Saryan winemakers raise their glasses to you — the festival is saved! (+֏ 38,000, +90 Respect, +95 Clout!)",
          bonus: 38000 }
      ]
    },
    {
      id: "master_duduk",
      title: "🎶 The Missing Master Duduk",
      hy: "Կորած Վարպետի Դուդուկը",
      reward: 40000, respect: 110, clout: 85,
      stages: [
        { label: "Meet Master Vahan at Opera Square", x: 260, z: -380, prompt: "[E] Speak with Master Vahan at Opera (Story Stage 1/3)",
          hy: "Իմ 100-ամյա ծիրանի դուդուկը տարել են",
          text: "Master Vahan's heirloom apricot-wood duduk was snatched by a slick courier heading down Northern Avenue!",
          bonus: 6000 },
        { label: "Corner the Courier on Northern Ave", x: 268, z: 110, prompt: "[E] Intercept the Duduk Courier (Story Stage 2/3)",
          hy: "Կանգնի՛ր, վերադարձրու դուդուկը",
          text: "You cut off the courier between the café terraces and recover the velvet duduk case without a scratch!",
          bonus: 10000 },
        { label: "Return Heirloom at Republic Sq Fountains", x: 156, z: 486, prompt: "[E] Return Master Duduk at Republic Sq (Story Stage 3/3)",
          hy: "Շնորհակալություն, ախպերս",
          text: "Master Vahan plays a hauntingly beautiful melody beside the Singing Fountains in your honor! (+֏ 40,000, +110 Respect!)",
          bonus: 40000 }
      ]
    },
    {
      id: "midnight_run",
      title: "🏎️ Midnight Yerevan VIP Run",
      hy: "Գիշերային Երևանի VIP Մրցարշավ",
      reward: 55000, respect: 70, clout: 160,
      stages: [
        { label: "Meet the Fixer on Abovyan Street", x: 295, z: -140, prompt: "[E] Take the Midnight VIP Envelope (Story Stage 1/3)",
          hy: "Արագ հասցրու Հանրապետության հրապարակ",
          text: "Grab the VIP guest passes and race down to Republic Square before the jazz show starts!",
          bonus: 8000 },
        { label: "Deliver VIP Passes at Republic Square", x: 105, z: 515, prompt: "[E] Hand Off VIP Passes at Republic Sq (Story Stage 2/3)",
          hy: "Հրաշալի է՝ հիմա գնա Մալխաս ջազ ակումբ",
          text: "Delivered with minutes to spare! The VIP host invites you to headline the afterparty at Malkhas Jazz Club!",
          bonus: 12000 },
        { label: "VIP Celebration at Malkhas Jazz Club", x: 252, z: -215, venue: "malkhas_jazz", prompt: "[E] Claim VIP Jazz Table & Payout (Story Stage 3/3)",
          hy: "Բարի գալուստ Մալխաս VIP սեղան",
          text: "Champagne, Ararat cognac, and standing applause at Yerevan's legendary jazz club! (+֏ 55,000, +160 Clout!)",
          bonus: 55000 }
      ]
    }
  ];

  const CAFE_TIERS = [
    { lv: 1, name: "Yerevan Espresso Kiosk", cost: 20000, ratePerMin: 2500, desc: "A charming coffee cart on Northern Ave serving traditional Armenian surj." },
    { lv: 2, name: "Northern Ave Bistro Terrace", cost: 45000, ratePerMin: 6500, desc: "Expanded stone-tile café terrace with striped umbrellas, glowing signage & pastries." },
    { lv: 3, name: "Grand Armenian Tuff Lounge", cost: 95000, ratePerMin: 14000, desc: "Flagship VIP Northern Ave lounge with warm chandeliers, gold trim & massive passive income." }
  ];

  const CARS = [
    { id: "niva", name: "Classic Lada Niva 4x4", cost: 0, color: 0xe6dfd0, desc: "Timeless Armenian mountain & city icon." },
    { id: "gwagon", name: "Matte-Black Yerevan G-Wagon", cost: 35000, color: 0x17181c, desc: "The undisputed king of Northern Avenue nightlife." },
    { id: "cabrio", name: "Apricot Gold Sunset Cabriolet", cost: 65000, color: 0xe59648, desc: "Turn heads from Cascade to Republic Square." }
  ];

  function bootStory() {
    const G = window.__game;
    const H = window.__hyper;
    if (!G || !G._ext || !H) { setTimeout(bootStory, 90); return; }

    const E = G._ext;
    const T = E.THREE;
    const { scene } = E;
    const P = G.player;
    const UI = E.ui;

    // 3D Glowing Story Mission Beacon (floats smoothly at current tracked objective!)
    const beaconGrp = new T.Group();
    const bRing = new T.Mesh(
      new T.Cyl(1.4, 1.4, 0.08, 24, 1, true),
      new T.BasicMat({ color: 0xffc45e, transparent: true, opacity: 0.85, side: T.DoubleSide })
    );
    bRing.position.y = 0.2;
    const bBeam = new T.Mesh(
      new T.Cyl(0.18, 0.55, 18, 12, 1, true),
      new T.BasicMat({ color: 0xffc45e, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide })
    );
    bBeam.position.y = 9.0;
    beaconGrp.add(bRing, bBeam);
    beaconGrp.visible = false;
    scene.add(beaconGrp);

    // 3D Ownable Player Café on Northern Avenue (x: 257, z: 34) — visually upgrades Lv.1 -> Lv.3!
    const CAFE_POS = { x: 257, z: 34 };
    const cafeGrp = new T.Group();
    cafeGrp.position.set(CAFE_POS.x, 0, CAFE_POS.z);
    scene.add(cafeGrp);

    function rebuildPlayerCafe3D() {
      while (cafeGrp.children.length) cafeGrp.remove(cafeGrp.children[0]);
      if (emp.cafeLevel <= 0) return;

      const wood = new T.StdMat({ color: 0x52301d, roughness: 0.58 });
      const gold = new T.StdMat({ color: 0xdfaa4c, roughness: 0.25, metalness: 0.8 });
      const cloth = new T.StdMat({ color: emp.cafeLevel >= 3 ? 0x7c1c28 : 0x265c42, roughness: 0.78 });

      // Counter kiosk
      const kiosk = new T.Mesh(new T.Box(3.4, 1.15, 1.5), wood);
      kiosk.position.set(0, 0.575, 0); kiosk.castShadow = kiosk.receiveShadow = true; cafeGrp.add(kiosk);
      const canopy = new T.Mesh(new T.Box(3.9, 0.16, 2.2), cloth);
      canopy.position.set(0, 2.65, 0.15); canopy.castShadow = true; cafeGrp.add(canopy);
      for (const px of [-1.6, 1.6]) {
        const post = new T.Mesh(new T.Cyl(0.05, 0.05, 2.65, 8), gold);
        post.position.set(px, 1.32, 0.7); cafeGrp.add(post);
      }
      const lamp = new T.PointLight(0xffcb78, emp.cafeLevel * 1.1, 12, 1.5);
      lamp.position.set(0, 2.4, 0.9); cafeGrp.add(lamp);

      // Lv.2+ adds bistro patio tables & parasols!
      if (emp.cafeLevel >= 2) {
        for (const [tx, tz] of [[-2.6, 2.2], [0, 2.5], [2.6, 2.2]]) {
          const tbl = new T.Mesh(new T.Cyl(0.62, 0.62, 0.06, 14), wood);
          tbl.position.set(tx, 0.76, tz); cafeGrp.add(tbl);
          const leg = new T.Mesh(new T.Cyl(0.05, 0.12, 0.76, 8), gold);
          leg.position.set(tx, 0.38, tz); cafeGrp.add(leg);
          const umb = new T.Mesh(new T.Cyl(0.06, 1.25, 0.32, 10), cloth);
          umb.position.set(tx, 2.35, tz); cafeGrp.add(umb);
        }
      }
      // Lv.3 adds gold grand VIP arch & glowing chandelier sign!
      if (emp.cafeLevel >= 3) {
        const arch = new T.Mesh(new T.Box(7.2, 0.35, 0.35), gold);
        arch.position.set(0, 3.4, 0.7); cafeGrp.add(arch);
        for (const ax of [-3.4, 3.4]) {
          const col = new T.Mesh(new T.Cyl(0.14, 0.18, 3.4, 10), new T.StdMat({ color: 0xc98a70, roughness: 0.75 }));
          col.position.set(ax, 1.7, 0.7); cafeGrp.add(col);
        }
      }
    }
    rebuildPlayerCafe3D();

    function getTrackedStage() {
      if (!emp.activeArc) return null;
      const arc = ARCS.find(a => a.id === emp.activeArc);
      if (!arc) return null;
      const idx = emp.arcs[arc.id] || 0;
      if (idx >= arc.stages.length) return null;
      return { arc, idx, st: arc.stages[idx] };
    }

    function trackArc(arcId) {
      const arc = ARCS.find(a => a.id === arcId);
      if (!arc) return;
      const idx = emp.arcs[arcId] || 0;
      if (idx >= arc.stages.length) {
        UI.de(arc.title + " Completed!", arc.hy, "You already conquered this Yerevan story arc!");
        return;
      }
      emp.activeArc = arcId;
      saveEmp();
      const st = arc.stages[idx];
      if (G.setGPS) G.setGPS(st.x, st.z, st.label);
      UI._e();
      UI.de("Tracking: " + arc.title, st.label, "Follow the golden GPS route & beacon, then press [E] when you arrive!");
    }

    function completeCurrentStage() {
      const cur = getTrackedStage();
      if (!cur) return false;
      const { arc, idx, st } = cur;
      const he = G.G();
      emp.arcs[arc.id] = idx + 1;
      he.dram = (he.dram || 0) + (st.bonus || 0);
      if (idx + 1 >= arc.stages.length) {
        emp.activeArc = null;
        if (H.addReputation) H.addReputation(arc.respect, arc.clout);
        UI.de("🏆 STORY COMPLETE: " + arc.title, st.hy, st.text);
      } else {
        if (H.addReputation) H.addReputation(20, 25);
        const nxt = arc.stages[idx + 1];
        if (G.setGPS) G.setGPS(nxt.x, nxt.z, nxt.label);
        UI.de(`Stage ${idx + 1}/3 Cleared! (+${UI.Ie(st.bonus)})`, st.hy, st.text + " Next: " + nxt.label);
      }
      UI.gt(); UI.at();
      G.SND && G.SND.cash && G.SND.cash();
      saveEmp();
      return true;
    }

    function buyOrUpgradeCafe() {
      const next = CAFE_TIERS[emp.cafeLevel];
      if (!next) return;
      const he = G.G();
      if (he.dram < next.cost) {
        UI.de("Need " + UI.Ie(next.cost), "Գումարը քիչ է", "Complete Story Missions or Drama to fund your Yerevan Café!");
        return;
      }
      he.dram -= next.cost;
      emp.cafeLevel = next.lv;
      emp.lastTickTs = Date.now();
      saveEmp();
      UI.gt(); UI.at();
      G.SND && G.SND.cash && G.SND.cash();
      rebuildPlayerCafe3D();
      if (H.addReputation) H.addReputation(45, 60);
      renderEmpireModal();
      UI.de("☕ " + next.name + " Opened!", "Շնորհավորում ենք", "Your upgraded 3D café terrace is now live on Northern Avenue earning " + UI.Ie(next.ratePerMin) + "/min!");
    }

    function collectCafeBank() {
      const amt = Math.floor(emp.cafeBank);
      if (amt <= 0) { UI.de("Café Register Empty", "", "Wait a moment for your Northern Ave café to earn Dram!"); return; }
      const he = G.G();
      he.dram += amt;
      emp.cafeBank = 0;
      saveEmp();
      UI.gt(); UI.at();
      G.SND && G.SND.cash && G.SND.cash();
      renderEmpireModal();
      UI.de("💰 Collected " + UI.Ie(amt) + "!", "Սրճարանի եկամուտ", "Fresh Dram collected from your Yerevan Café!");
    }

    function selectOrBuyCar(carId) {
      const car = CARS.find(c => c.id === carId);
      if (!car) return;
      const he = G.G();
      if (!emp.garage[carId]) {
        if (he.dram < car.cost) {
          UI.de("Need " + UI.Ie(car.cost), "Գումարը քիչ է", "Earn Dram from Story Arcs, Café income, or Jobs!");
          return;
        }
        he.dram -= car.cost;
        emp.garage[carId] = true;
        UI.gt(); UI.at();
        G.SND && G.SND.cash && G.SND.cash();
      }
      emp.activeCar = carId;
      saveEmp();
      UI._e();
      if (G.bringCar) {
        G.bringCar();
        // Tint player's summoned car mesh cleanly to match chosen luxury ride!
        setTimeout(() => {
          const fleet = G.FLEET || [];
          const nearest = fleet.find(c => c && c.g && Math.hypot(c.x - P.x, c.z - P.z) < 28) || (G.cars && G.cars[0]);
          if (nearest && nearest.g) {
            nearest.g.traverse((o) => {
              if (o.isMesh && o.material && o.material.color && o.material.metalness > 0.1 && o.material.roughness < 0.6) {
                o.material.color.setHex(car.color);
              }
            });
          }
        }, 120);
      }
      UI.de("🚗 " + car.name + " Delivered!", "Մեքենան պատրաստ է", "Your ride is waiting at the curb — press [F] to drive and tune the Yerevan FM Radio!");
    }

    // ---- BUILD STORY & EMPIRE MODAL UI ----
    let modal = document.getElementById("empireOv");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "ov";
      modal.id = "empireOv";
      modal.innerHTML = `<div class="panel box" style="max-width:860px;width:94vw;max-height:86vh;overflow:auto" role="dialog" aria-label="Yerevan Storylines and Empire">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px">
          <div><h2 style="margin:0">📖 Yerevan Storylines &amp; Empire<small style="display:block;font-size:11px;letter-spacing:.14em;opacity:.75;margin-top:3px">MULTI-STAGE MISSIONS · OWNABLE CAFÉ · LUXURY GARAGE</small></h2></div>
          <button id="empClose">Close (Esc)</button>
        </div>
        <div id="empBody"></div>
      </div>`;
      document.body.appendChild(modal);
      modal.querySelector("#empClose").addEventListener("click", () => UI._e());
    }

    function renderEmpireModal() {
      const body = document.getElementById("empBody");
      if (!body) return;
      const curTier = emp.cafeLevel > 0 ? CAFE_TIERS[emp.cafeLevel - 1] : null;
      const nextTier = CAFE_TIERS[emp.cafeLevel] || null;

      let html = `<h3 style="margin:8px 0;color:var(--apricot)">🔥 Branching Yerevan Story Arcs</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:10px;margin-bottom:18px">`;
      for (const a of ARCS) {
        const stIdx = emp.arcs[a.id] || 0;
        const done = stIdx >= a.stages.length;
        const tracking = emp.activeArc === a.id && !done;
        const nextLabel = done ? "✓ Completed — Legend of Yerevan" : `Stage ${stIdx + 1}/3: ${a.stages[stIdx].label}`;
        html += `<div style="background:rgba(255,255,255,.05);border:1px solid ${tracking ? "var(--apricot)" : "rgba(255,255,255,.12)"};border-radius:12px;padding:12px">
          <div style="font-weight:700;font-size:14.5px">${a.title}</div>
          <div style="font-size:11.5px;opacity:.7;margin:2px 0 6px">${a.hy} · Final Reward: ${UI.Ie(a.reward)}</div>
          <div style="font-size:12.5px;margin-bottom:10px;color:${done ? "#8ce99a" : "#f7d49c"}">${nextLabel}</div>
          <button class="arcGo" data-arc="${a.id}" ${done ? "disabled" : ""} style="padding:7px 12px;font-size:12px">${done ? "✓ Completed" : tracking ? "📍 Tracking on GPS" : "▶ Start / Track GPS"}</button>
        </div>`;
      }
      html += `</div>`;

      // Café Empire section
      html += `<h3 style="margin:8px 0;color:var(--apricot)">☕ Your Yerevan Café (Northern Avenue)</h3>
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px;margin-bottom:18px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
          <div>
            <b>${curTier ? `Lv.${curTier.lv} ${curTier.name}` : "No Café Owned Yet"}</b>
            <div style="font-size:12.5px;opacity:.82;margin-top:3px">${curTier ? `Earning ${UI.Ie(curTier.ratePerMin)}/min · Ready in register: <b>${UI.Ie(Math.floor(emp.cafeBank))}</b>` : "Buy your own real 3D café terrace on Northern Avenue to earn passive Dram!"}</div>
            ${nextTier ? `<div style="font-size:12px;opacity:.72;margin-top:4px">Next Upgrade: ${nextTier.name} — ${nextTier.desc}</div>` : ""}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${curTier ? `<button id="empCollect">💰 Collect ${UI.Ie(Math.floor(emp.cafeBank))}</button>` : ""}
            ${nextTier ? `<button id="empBuyCafe" style="background:var(--apricot);color:#24130d;border:0;font-weight:700">${curTier ? "⬆ Upgrade" : "🏪 Buy Café"} · ${UI.Ie(nextTier.cost)}</button>` : `<button disabled>★ Max Tier Owned</button>`}
          </div>
        </div>`;

      // Luxury Garage section
      html += `<h3 style="margin:8px 0;color:var(--apricot)">🚗 Yerevan Garage &amp; Custom Rides</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">`;
      for (const c of CARS) {
        const owned = !!emp.garage[c.id];
        html += `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px">
          <div style="font-weight:700;font-size:13.5px">${c.name}</div>
          <div style="font-size:12px;opacity:.75;margin:4px 0 10px">${c.desc}</div>
          <button class="carBtn" data-car="${c.id}" style="padding:7px 12px;font-size:12px">${owned ? "🔑 Summon Ride" : "Buy · " + UI.Ie(c.cost)}</button>
        </div>`;
      }
      html += `</div>`;

      body.innerHTML = html;
      body.querySelectorAll(".arcGo").forEach(b => b.addEventListener("click", () => trackArc(b.dataset.arc)));
      body.querySelectorAll(".carBtn").forEach(b => b.addEventListener("click", () => selectOrBuyCar(b.dataset.car)));
      const colBtn = body.querySelector("#empCollect");
      if (colBtn) colBtn.addEventListener("click", collectCafeBank);
      const buyBtn = body.querySelector("#empBuyCafe");
      if (buyBtn) buyBtn.addEventListener("click", buyOrUpgradeCafe);
    }

    function openEmpire() {
      if (G.ui.open && G.ui.open !== "empireOv") UI._e();
      renderEmpireModal();
      UI.ki("empireOv");
    }

    // Add Story & Empire buttons to Side Panel and HUD Menu
    const sideRow = document.querySelector("#side .row");
    if (sideRow && !document.getElementById("bEmpireSide")) {
      const b = document.createElement("button");
      b.id = "bEmpireSide";
      b.textContent = "📖 Story & Empire (J)";
      b.addEventListener("click", openEmpire);
      sideRow.insertBefore(b, sideRow.children[1] || null);
    }
    const camMenu = UI.fe("cam");
    if (camMenu && !document.getElementById("bEmpire")) {
      const b = document.createElement("button");
      b.id = "bEmpire";
      b.textContent = "📖 Story & Empire (J)";
      b.addEventListener("click", openEmpire);
      camMenu.appendChild(b);
    }

    // Chain cleanly onto __hyperPrompt and __hyperActE
    const prevPrompt = window.__hyperPrompt;
    window.__hyperPrompt = function () {
      const cur = getTrackedStage();
      if (cur && Math.hypot(P.x - cur.st.x, P.z - cur.st.z) < 6.0) {
        return cur.st.prompt;
      }
      if (emp.cafeLevel > 0 && Math.hypot(P.x - CAFE_POS.x, P.z - CAFE_POS.z) < 4.5) {
        return `[E] Collect Café Earnings (${UI.Ie(Math.floor(emp.cafeBank))}) · Your Lv.${emp.cafeLevel} Café`;
      }
      return prevPrompt ? prevPrompt() : null;
    };

    const prevActE = window.__hyperActE;
    window.__hyperActE = function () {
      const cur = getTrackedStage();
      if (cur && Math.hypot(P.x - cur.st.x, P.z - cur.st.z) < 6.0) {
        return completeCurrentStage();
      }
      if (emp.cafeLevel > 0 && Math.hypot(P.x - CAFE_POS.x, P.z - CAFE_POS.z) < 4.5) {
        collectCafeBank();
        return true;
      }
      return prevActE ? prevActE() : false;
    };

    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (G.ui.open === "empireOv" && e.key === "Escape") { UI._e(); e.preventDefault(); return; }
      if (!G.ui.open && e.code === "KeyJ" && !e.repeat) openEmpire();
    });

    // Per-frame beacon pulse & passive café Dram accrual
    let saveAccum = 0;
    window.__storyTick = function (clock) {
      const cur = getTrackedStage();
      const inOtherSpace = !!(window.__worldFX && window.__worldFX.getActiveVenue()) || !!(window.__dest && window.__dest.isActive());
      if (cur && !inOtherSpace) {
        beaconGrp.visible = true;
        beaconGrp.position.set(cur.st.x, 0, cur.st.z);
        bRing.rotation.y = clock * 1.4;
        bRing.scale.setScalar(0.92 + 0.12 * Math.sin(clock * 3.5));
      } else {
        beaconGrp.visible = false;
      }

      if (emp.cafeLevel > 0) {
        const tier = CAFE_TIERS[emp.cafeLevel - 1];
        emp.cafeBank = Math.min(250000, emp.cafeBank + (tier.ratePerMin / 60) * 0.016);
        saveAccum += 0.016;
        if (saveAccum > 10) { saveAccum = 0; saveEmp(); }
      }
    };

    window.__story = {
      openEmpire,
      trackArc,
      ARCS,
      onVenueVisit: (venueId) => {
        const cur = getTrackedStage();
        if (cur && cur.st.venue === venueId) completeCurrentStage();
      },
      getState: () => ({ ...emp })
    };
  }

  bootStory();
})();

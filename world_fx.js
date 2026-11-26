// Walk Armenia — Pillar 1 & 2: Dynamic Weather, Wet Reflections, Umbrellas, 3rd-Person Locomotion Feel & Enterable Yerevan Venues
(() => {
  "use strict";

  const WEATHERS = ["clear", "rain", "afterrain", "mist"];
  const WEATHER_LABELS = {
    clear: "☀️ Weather: Clear",
    rain: "🌧 Weather: Yerevan Rain",
    afterrain: "✨ Weather: Wet Gloss",
    mist: "🌫 Weather: Ararat Mist"
  };

  function bootWorldFX() {
    const G = window.__game;
    const H = window.__hyper;
    const R = window.__render;
    if (!G || !G._ext || !H || !R) { setTimeout(bootWorldFX, 80); return; }

    const E = G._ext;
    const T = E.THREE;
    const { scene, sun, hemi } = E;
    const P = G.player;
    const UI = E.ui;

    // =========================================================================
    // 1. DYNAMIC YEREVAN WEATHER, 3D RAIN STREAKS & PEDESTRIAN UMBRELLAS
    // =========================================================================
    let weather = "clear";
    let wetnessCur = 0, rainCur = 0, rainLensCur = 0;

    // 1,200 Instanced 3D Falling Rain Streaks orbiting around camera (kept >=2.6m from lens so streaks stay cinematic)
    const RAIN_COUNT = 1100;
    const rainGeo = new T.Box(0.006, 0.68, 0.006);
    const rainMat = new T.BasicMat({
      color: 0xdbeeff, transparent: true, opacity: 0.25, depthWrite: false
    });
    const rainMesh = new T.Instanced(rainGeo, rainMat, RAIN_COUNT);
    rainMesh.frustumCulled = false;
    rainMesh.visible = false;
    scene.add(rainMesh);

    const rainDrops = [];
    const dummyMat = new T.Mat4();
    const tiltQ = new T.Quat().setFromAxisAngle(new T.Vec3(0, 0, 1), 0.10);
    const rainPos = new T.Vec3();
    const rainScale = new T.Vec3(1, 1, 1);

    for (let i = 0; i < RAIN_COUNT; i++) {
      let ox = (Math.random() - 0.5) * 44;
      let oz = (Math.random() - 0.5) * 44;
      if (Math.hypot(ox, oz) < 2.8) { ox += (ox >= 0 ? 3.2 : -3.2); }
      rainDrops.push({
        ox,
        y: Math.random() * 24,
        oz,
        spd: 22 + Math.random() * 11
      });
    }

    // Pedestrian 3D Umbrellas (automatically appear over nearby walkers when raining!)
    const umbColors = [0x1c212b, 0x6e1f2b, 0x1d354d, 0x3b2c26, 0x263b30];
    const umbMats = umbColors.map(c => new T.StdMat({ color: c, roughness: 0.45, metalness: 0.08, side: T.DoubleSide }));
    const umbPoleMat = new T.StdMat({ color: 0x222222, roughness: 0.35, metalness: 0.7 });
    const umbGeo = new T.Cyl(0.05, 0.68, 0.24, 10, 1, true);
    const poleGeo = new T.Cyl(0.012, 0.012, 0.95, 6);

    function syncWalkerUmbrellas(show) {
      const walkers = G.walkers || [];
      for (let i = 0; i < walkers.length; i++) {
        const w = walkers[i];
        if (!w || !w.actor || !w.actor.g) continue;
        if (!w._umb && show) {
          const g = new T.Group();
          const canopy = new T.Mesh(umbGeo, umbMats[i % umbMats.length]);
          canopy.position.y = 0.45;
          canopy.castShadow = true;
          const pole = new T.Mesh(poleGeo, umbPoleMat);
          g.add(canopy, pole);
          g.position.set(0.24, 1.72, 0.08);
          g.rotation.z = -0.08;
          w.actor.g.add(g);
          w._umb = g;
        }
        if (w._umb) w._umb.visible = show && !w.sit;
      }
    }

    // Distant Snow-Capped Mount Ararat Atmospheric Silhouette on the Southern Horizon!
    function buildAraratHorizon() {
      const araratGrp = new T.Group();
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 384;
      const g = cv.getContext("2d");
      g.clearRect(0, 0, 1024, 384);

      // Greater Ararat (left-center, 5137m) + Lesser Ararat (right, 3896m)
      const grad = g.createLinearGradient(0, 40, 0, 384);
      grad.addColorStop(0, "rgba(255,248,244,0.94)");
      grad.addColorStop(0.28, "rgba(232,226,236,0.84)");
      grad.addColorStop(0.55, "rgba(155,154,182,0.72)");
      grad.addColorStop(0.88, "rgba(128,136,168,0.34)");
      grad.addColorStop(1, "rgba(128,136,168,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, 384);
      g.lineTo(95, 298);
      g.lineTo(220, 212);
      g.lineTo(355, 86);
      g.lineTo(418, 48);   // Greater Ararat snow dome
      g.lineTo(468, 66);
      g.lineTo(568, 178);
      g.lineTo(648, 224);  // Saddle
      g.lineTo(758, 134);  // Lesser Ararat cone
      g.lineTo(796, 128);
      g.lineTo(895, 232);
      g.lineTo(1024, 318);
      g.lineTo(1024, 384);
      g.closePath();
      g.fill();

      // Sunlit snow ridges
      g.fillStyle = "rgba(255,244,230,0.45)";
      g.beginPath();
      g.moveTo(418, 48); g.lineTo(468, 66); g.lineTo(525, 148); g.lineTo(440, 165); g.lineTo(395, 118);
      g.closePath(); g.fill();

      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      const mat = new T.BasicMat({ map: tex, transparent: true, opacity: 0.78, depthWrite: false, fog: false });
      const m = new T.Mesh(new T.Plane(1950, 520), mat);
      m.position.set(160, 175, 2250);
      m.rotation.y = Math.PI;
      araratGrp.add(m);
      scene.add(araratGrp);
      return { grp: araratGrp, mat };
    }
    const araratHorizon = buildAraratHorizon();

    // Weather HUD Button in #cam
    const camMenu = UI.fe("cam");
    let wBtn = UI.fe("bWeather");
    if (camMenu && !wBtn) {
      wBtn = document.createElement("button");
      wBtn.id = "bWeather";
      wBtn.title = "Cycle Yerevan weather: Clear, Rain, Post-Rain Gloss, Ararat Mist (X)";
      camMenu.appendChild(wBtn);
    }

    function setWeather(mode, quiet) {
      if (!WEATHERS.includes(mode)) mode = "clear";
      weather = mode;
      if (wBtn) wBtn.textContent = WEATHER_LABELS[weather];
      syncWalkerUmbrellas(weather === "rain");
      if (!quiet) {
        const desc = {
          clear: "Crisp sunlit Armenian sky over central Yerevan.",
          rain: "Fresh Yerevan rainstorm — glistening mirror puddles, umbrellas & lens drops!",
          afterrain: "Sunshine breaking through after rain — shimmering wet travertine reflections!",
          mist: "Cool mountain mist drifting in from Mount Ararat."
        };
        UI.de(WEATHER_LABELS[weather], "Եղանակը փոխվեց", desc[weather]);
      }
      if (window.__spatialAudio && window.__spatialAudio.setRain) {
        window.__spatialAudio.setRain(weather === "rain" ? 1 : 0);
      }
    }
    function cycleWeather() {
      setWeather(WEATHERS[(WEATHERS.indexOf(weather) + 1) % WEATHERS.length], false);
    }
    if (wBtn) wBtn.addEventListener("click", cycleWeather);
    setWeather("clear", true);

    // =========================================================================
    // 2. AAA 3RD-PERSON CHARACTER LOCOMOTION POLISH (TURN BANKING, SPRINT LEAN & STAIR STEP)
    // =========================================================================
    let prevPX = P.x, prevPZ = P.z, prevYaw = P.yaw || 0;
    let curBank = 0, curPitch = 0, stepPhase = 0;

    function updateThirdPersonPhysics() {
      if (P.car || !P.actor || !P.actor.inner || !P.actor.g) return;
      const dx = P.x - prevPX, dz = P.z - prevPZ;
      const spd = Math.hypot(dx, dz) * 60; // approx m/s
      let dyaw = (P.yaw || 0) - prevYaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;

      prevPX = P.x; prevPZ = P.z; prevYaw = P.yaw || 0;

      // Smooth athletic turn banking & forward sprint pitch
      const targetBank = Math.max(-0.14, Math.min(0.14, -dyaw * 2.2 * Math.min(1, spd * 0.45)));
      const targetPitch = Math.max(0, Math.min(0.11, (spd - 1.2) * 0.022));
      curBank += (targetBank - curBank) * 0.16;
      curPitch += (targetPitch - curPitch) * 0.14;

      P.actor.inner.rotation.z = curBank;
      P.actor.inner.rotation.x = curPitch;

      // Natural subtle stride rhythm when walking/running (extra lift near Cascade steps!)
      if (spd > 0.35) {
        stepPhase += Math.min(0.35, spd * 0.055);
        const onCascade = P.z < -680 && Math.abs(P.x - 344) < 55;
        const bob = Math.abs(Math.sin(stepPhase)) * (onCascade ? 0.055 : 0.024);
        P.actor.inner.position.y = bob;
      } else {
        P.actor.inner.position.y *= 0.82;
      }
    }

    // =========================================================================
    // 3. THREE ENTERABLE 3D YEREVAN LANDMARK VENUES (WINE BAR, JAZZ CLUB, TAVERN)
    // =========================================================================
    const VENUES = [
      {
        id: "saryan_wine",
        name: "In Vino · Saryan Wine Bar",
        hy: "Սարյան Գինու Բար",
        streetX: 112, streetZ: -118,
        roomX: 4200, roomZ: 4200,
        accent: 0x9b2335,
        lightHex: 0xffb36b,
        actLabel: "Taste Reserve Armenian Areni Wine (֏ 2,500 · +Respect & Energy)",
        actPrice: 2500,
        actTitle: "🍷 Saryan Areni Reserve Tasting",
        actHy: "Կենացդ · Բարի գալուստ Սարյան",
        actDesc: "You swirl a ruby glass of aged Vayots Dzor Areni Noir as locals debate winemaking traditions around the oak barrels. (+35 Energy, +25 Respect!)"
      },
      {
        id: "malkhas_jazz",
        name: "Malkhas Yerevan Jazz Club",
        hy: "Մալխաս Ջազ Ակումբ",
        streetX: 252, streetZ: -215,
        roomX: 4320, roomZ: 4200,
        accent: 0x3b1f54,
        lightHex: 0xff9b54,
        actLabel: "Order Ararat 10yr Cognac at VIP Stage Table (֏ 4,000 · +Clout)",
        actPrice: 4000,
        actTitle: "🎷 Live Yerevan Jazz & Ararat Cognac",
        actHy: "Երևանյան Ջազի Երեկո",
        actDesc: "Warm piano chords and muted trumpet fill the velvet room while you toast with amber Armenian cognac at the front table. (+40 Energy, +45 Clout!)"
      },
      {
        id: "khorovats_tavern",
        name: "Old Yerevan Khorovats Tavern",
        hy: "Հին Երևանի Խորովածի Պանդոկ",
        streetX: 258, streetZ: 148,
        roomX: 4440, roomZ: 4200,
        accent: 0xb84a27,
        lightHex: 0xff8a3d,
        actLabel: "Feast on Charcoal Khorovats & Warm Lavash (֏ 3,500 · Full Energy)",
        actPrice: 3500,
        actTitle: "🔥 Authentic Armenian Khorovats Feast",
        actHy: "Բարի ախորժակ · Հայկական Խորոված",
        actDesc: "Skewers straight off the glowing apricot-wood mangal wrapped in fresh tonir lavash with herbs and grilled eggplant. (Full Energy, +30 Respect!)"
      }
    ];

    let activeVenue = null;
    let savedOutdoor = null;
    const venueGroups = {};
    const venueMarkers = [];
    const emberMeshes = [];

    function makeSignTex(title, sub, bg, fg) {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 144;
      const g = cv.getContext("2d");
      g.fillStyle = bg; g.fillRect(0, 0, 512, 144);
      g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 496, 128);
      g.fillStyle = fg; g.font = "bold 40px Georgia, serif"; g.textAlign = "center";
      g.fillText(title, 256, 68);
      g.font = "24px system-ui, sans-serif"; g.fillStyle = "#f4dfc6";
      g.fillText(sub, 256, 110);
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    function buildVenues() {
      // Glowing street-side entrance medallions in Yerevan
      for (const v of VENUES) {
        const doorGrp = new T.Group();
        const post = new T.Mesh(new T.Box(2.2, 0.65, 0.14), new T.BasicMat({
          map: makeSignTex(v.name.split("·")[0].trim(), v.hy, "#1d1412", "#f5be78")
        }));
        post.position.set(0, 2.7, 0);
        const pillarL = new T.Mesh(new T.Cyl(0.05, 0.05, 2.7, 8), new T.StdMat({ color: 0x241d1a, metalness: 0.6, roughness: 0.4 }));
        pillarL.position.set(-1.05, 1.35, 0);
        const pillarR = pillarL.clone(); pillarR.position.x = 1.05;
        const lamp = new T.PointLight(v.lightHex, 1.4, 7.5, 1.6);
        lamp.position.set(0, 2.5, 0.6);
        doorGrp.add(post, pillarL, pillarR, lamp);
        doorGrp.position.set(v.streetX, 0, v.streetZ);
        scene.add(doorGrp);
        venueMarkers.push({ v, grp: doorGrp });

        // Build full 3D Interior Room at (v.roomX, 0, v.roomZ)
        const room = new T.Group();
        room.position.set(v.roomX, 0, v.roomZ);

        const wallMat = new T.StdMat({
          color: v.id === "malkhas_jazz" ? 0x241720 : v.id === "khorovats_tavern" ? 0x8a5646 : 0x5c3c31,
          roughness: 0.85
        });
        const floorMat = new T.StdMat({
          color: v.id === "malkhas_jazz" ? 0x2a1b17 : 0x4a3326,
          roughness: 0.35, metalness: 0.08
        });
        const woodMat = new T.StdMat({ color: 0x4e2d1a, roughness: 0.55 });
        const goldMat = new T.StdMat({ color: 0xd9a24c, roughness: 0.25, metalness: 0.82 });
        const darkMat = new T.StdMat({ color: 0x161418, roughness: 0.28, metalness: 0.35 });

        // Floor, ceiling, 4 walls (14m x 5m x 14m)
        const floor = new T.Mesh(new T.Plane(14, 14).rotateX(-Math.PI / 2), floorMat);
        floor.receiveShadow = true; room.add(floor);
        const ceil = new T.Mesh(new T.Plane(14, 14).rotateX(Math.PI / 2), new T.StdMat({ color: 0x1b1514, roughness: 0.9 }));
        ceil.position.y = 4.6; room.add(ceil);

        for (const [wx, wz, ry] of [[0, -7, 0], [0, 7, Math.PI], [-7, 0, Math.PI / 2], [7, 0, -Math.PI / 2]]) {
          const w = new T.Mesh(new T.Plane(14, 4.6), wallMat);
          w.position.set(wx, 2.3, wz); w.rotation.y = ry; w.receiveShadow = true;
          room.add(w);
        }

        // Back wall glowing marquee sign
        const sign = new T.Mesh(new T.Plane(5.2, 1.35), new T.BasicMat({
          map: makeSignTex(v.name, v.hy, "#140d0c", "#ffcb7c")
        }));
        sign.position.set(0, 3.4, -6.92);
        room.add(sign);

        // Glowing Exit Door at south wall (z = +6.9)
        const door = new T.Mesh(new T.Box(1.8, 2.7, 0.14), new T.StdMat({ color: 0x3b2217, roughness: 0.6 }));
        door.position.set(0, 1.35, 6.9); room.add(door);
        const exitSign = new T.Mesh(new T.Plane(1.3, 0.36), new T.BasicMat({
          map: makeSignTex("EXIT TO YEREVAN", "Ելք · Press E", "#122618", "#9ef7b6")
        }));
        exitSign.position.set(0, 3.0, 6.88); exitSign.rotation.y = Math.PI;
        room.add(exitSign);

        // Warm interior chandelier / accent lighting
        const l1 = new T.PointLight(v.lightHex, 3.2, 18, 1.4); l1.position.set(0, 3.8, -1.5); room.add(l1);
        const l2 = new T.PointLight(0xffd2a0, 2.2, 16, 1.5); l2.position.set(-4, 3.2, 2.5); room.add(l2);
        const l3 = new T.PointLight(v.accent, 1.8, 16, 1.5); l3.position.set(4, 3.2, 2.5); room.add(l3);

        // Bar Counter & Interactive Hero Focal Point at z = -3.8
        const bar = new T.Mesh(new T.Box(6.4, 1.15, 1.1), woodMat);
        bar.position.set(0, 0.575, -3.8); bar.castShadow = bar.receiveShadow = true; room.add(bar);
        const barTop = new T.Mesh(new T.Box(6.6, 0.08, 1.25), goldMat);
        barTop.position.set(0, 1.18, -3.8); room.add(barTop);

        if (v.id === "saryan_wine") {
          // Wine Bar: Oak wine barrels + glowing backlit bottle wall!
          for (let i = -2; i <= 2; i++) {
            const barrel = new T.Mesh(new T.Cyl(0.45, 0.42, 1.05, 12), woodMat);
            barrel.position.set(i * 2.1, 0.525, -5.8); room.add(barrel);
          }
          for (let row = 0; row < 3; row++) {
            for (let col = -4; col <= 4; col++) {
              const btl = new T.Mesh(new T.Cyl(0.055, 0.06, 0.34, 8), new T.StdMat({
                color: (col + row) % 2 === 0 ? 0x7a1220 : 0x1a5934, roughness: 0.12, metalness: 0.2, emissive: 0x26060a
              }));
              btl.position.set(col * 0.52, 1.55 + row * 0.46, -6.75);
              room.add(btl);
            }
          }
        } else if (v.id === "malkhas_jazz") {
          // Jazz Club: Velvet stage, glossy grand piano & brass spotlight!
          const stage = new T.Mesh(new T.Box(8.5, 0.38, 3.4), new T.StdMat({ color: 0x3b121b, roughness: 0.7 }));
          stage.position.set(0, 0.19, -5.2); room.add(stage);
          const pianoBody = new T.Mesh(new T.Box(2.2, 0.72, 1.5), darkMat);
          pianoBody.position.set(-1.4, 1.15, -5.2); room.add(pianoBody);
          const pianoKeys = new T.Mesh(new T.Box(1.6, 0.08, 0.28), new T.BasicMat({ color: 0xfefefe }));
          pianoKeys.position.set(-1.4, 1.05, -4.42); room.add(pianoKeys);
          const bass = new T.Mesh(new T.Cyl(0.28, 0.36, 1.65, 10), woodMat);
          bass.position.set(1.6, 1.25, -5.1); bass.rotation.z = 0.12; room.add(bass);
          const spot = new T.PointLight(0xffaa44, 4.2, 14, 1.4);
          spot.position.set(0, 4.0, -4.8); room.add(spot);
        } else {
          // Khorovats Tavern: Brick charcoal mangal grill with glowing embers + woven wall carpets!
          const mangal = new T.Mesh(new T.Box(3.4, 1.0, 1.1), new T.StdMat({ color: 0x6b3a2e, roughness: 0.9 }));
          mangal.position.set(0, 0.5, -5.8); room.add(mangal);
          const coals = new T.Mesh(new T.Plane(3.0, 0.85).rotateX(-Math.PI / 2), new T.BasicMat({ color: 0xff5a1f }));
          coals.position.set(0, 1.02, -5.8); room.add(coals);
          emberMeshes.push(coals);
          for (const sx of [-6.92, 6.92]) {
            const rug = new T.Mesh(new T.Plane(3.2, 2.0), new T.StdMat({ color: 0x8f1d24, roughness: 0.92 }));
            rug.position.set(sx, 2.4, -1.0); rug.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
            room.add(rug);
          }
        }

        // Cozy candlelit dining tables on left and right
        for (const [tx, tz] of [[-4.2, -0.5], [-4.2, 3.0], [4.2, -0.5], [4.2, 3.0]]) {
          const top = new T.Mesh(new T.Cyl(0.75, 0.75, 0.07, 16), woodMat);
          top.position.set(tx, 0.78, tz); room.add(top);
          const leg = new T.Mesh(new T.Cyl(0.08, 0.16, 0.78, 8), darkMat);
          leg.position.set(tx, 0.39, tz); room.add(leg);
          const candle = new T.Mesh(new T.Cyl(0.03, 0.03, 0.14, 6), new T.BasicMat({ color: 0xffe4a0 }));
          candle.position.set(tx, 0.88, tz); room.add(candle);
        }

        room.visible = false;
        scene.add(room);
        venueGroups[v.id] = room;
      }
    }
    buildVenues();

    function enterVenue(id) {
      const v = VENUES.find(x => x.id === id);
      if (!v) return;
      if (window.__dest && window.__dest.isActive()) window.__dest.exitToYerevan(true);
      if (P.car && G.leaveCar) G.leaveCar();
      if (!activeVenue) {
        savedOutdoor = { x: P.x, z: P.z, yaw: P.yaw };
      } else {
        venueGroups[activeVenue.id].visible = false;
      }
      activeVenue = v;
      venueGroups[v.id].visible = true;
      P.x = v.roomX;
      P.z = v.roomZ + 4.4;
      P.yaw = Math.PI;
      P.cy = Math.PI;
      if (P.actor && P.actor.g) { P.actor.g.position.set(P.x, 0, P.z); P.actor.g.rotation.y = P.yaw; }
      rainCur = 0; rainLensCur = 0; rainMesh.visible = false;
      UI.de("Entered " + v.name, v.hy, "Walk to the bar/stage and press E to enjoy, or walk to the Exit door (or press Esc) to return to Yerevan.");
      if (window.__spatialAudio && window.__spatialAudio.setIndoor) window.__spatialAudio.setIndoor(true, v.id);
      updateExitPill();
    }

    function exitVenue(quiet) {
      if (!activeVenue) return;
      venueGroups[activeVenue.id].visible = false;
      const prev = savedOutdoor || { x: activeVenue.streetX, z: activeVenue.streetZ + 3, yaw: 0 };
      activeVenue = null;
      savedOutdoor = null;
      P.x = prev.x; P.z = prev.z; P.yaw = prev.yaw; P.cy = prev.yaw;
      if (P.actor && P.actor.g) { P.actor.g.position.set(P.x, 0, P.z); P.actor.g.rotation.y = P.yaw; }
      if (window.__spatialAudio && window.__spatialAudio.setIndoor) window.__spatialAudio.setIndoor(false, null);
      if (!quiet) UI.de("Back on Yerevan Streets", "Երևանի փողոցներում", "Stepped back outside.");
      updateExitPill();
    }

    // Floating quick-exit pill when inside a 3D Venue
    let exitPill = document.getElementById("venueExitPill");
    if (!exitPill) {
      exitPill = document.createElement("button");
      exitPill.id = "venueExitPill";
      exitPill.style.cssText = "display:none;position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:26;background:rgba(28,18,16,.92);color:#f7d099;border:1px solid rgba(242,179,115,.55);padding:9px 18px;border-radius:999px;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45)";
      exitPill.textContent = "🚪 Exit Venue to Yerevan (Esc)";
      exitPill.addEventListener("click", () => exitVenue(false));
      document.body.appendChild(exitPill);
    }
    function updateExitPill() {
      if (exitPill) exitPill.style.display = activeVenue ? "block" : "none";
    }

    // Add Quick Venues switcher button into #cam menu
    let vBtn = UI.fe("bVenues");
    let venueIdx = 0;
    if (camMenu && !vBtn) {
      vBtn = document.createElement("button");
      vBtn.id = "bVenues";
      vBtn.textContent = "🍷 Enter 3D Venues";
      vBtn.title = "Step inside Saryan Wine Bar, Malkhas Jazz Club, or Khorovats Tavern";
      vBtn.addEventListener("click", () => {
        if (activeVenue) {
          exitVenue(false);
        } else {
          const v = VENUES[venueIdx % VENUES.length];
          venueIdx++;
          enterVenue(v.id);
        }
      });
      camMenu.appendChild(vBtn);
    }

    // Chain cleanly onto __hyperPrompt and __hyperActE so existing street interactions keep working!
    const prevPrompt = window.__hyperPrompt;
    window.__hyperPrompt = function () {
      if (activeVenue) {
        const dx = P.x - activeVenue.roomX, dz = P.z - activeVenue.roomZ;
        if (dz > 4.6) return "[E] Exit " + activeVenue.name + " to Yerevan Streets";
        if (dz < -1.0 && Math.abs(dx) < 4.5) return "[E] " + activeVenue.actLabel;
        return "Inside " + activeVenue.name + " · Walk to counter for [E], or Exit door / Esc";
      }
      for (const m of venueMarkers) {
        if (Math.hypot(P.x - m.v.streetX, P.z - m.v.streetZ) < 4.0) {
          return "[E] Enter " + m.v.name + " (" + m.v.hy + ")";
        }
      }
      return prevPrompt ? prevPrompt() : null;
    };

    const prevActE = window.__hyperActE;
    window.__hyperActE = function () {
      if (activeVenue) {
        const dx = P.x - activeVenue.roomX, dz = P.z - activeVenue.roomZ;
        if (dz > 4.6) { exitVenue(false); return true; }
        if (dz < -1.0 && Math.abs(dx) < 4.5) {
          const he = G.G();
          if (he.dram < activeVenue.actPrice) {
            UI.de("Need " + UI.Ie(activeVenue.actPrice), "Գումարը քիչ է", "Earn Dram from Story Missions (J), Jobs (P), or Drama (K)!");
            return true;
          }
          he.dram -= activeVenue.actPrice;
          he.energy = Math.min(100, (he.energy || 70) + 45);
          UI.gt(); UI.at();
          G.SND && G.SND.cash && G.SND.cash();
          if (H.addReputation) H.addReputation(activeVenue.id === "malkhas_jazz" ? 15 : 30, activeVenue.id === "malkhas_jazz" ? 45 : 20);
          UI.de(activeVenue.actTitle, activeVenue.actHy, activeVenue.actDesc);
          if (window.__story && window.__story.onVenueVisit) window.__story.onVenueVisit(activeVenue.id);
          return true;
        }
        return false;
      }
      for (const m of venueMarkers) {
        if (Math.hypot(P.x - m.v.streetX, P.z - m.v.streetZ) < 4.0) {
          enterVenue(m.v.id);
          return true;
        }
      }
      return prevActE ? prevActE() : false;
    };

    // Keyboard shortcuts: X = cycle weather, Esc = exit venue if open
    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === "KeyX" && !G.ui.open) {
        cycleWeather();
      } else if (e.code === "Escape" && activeVenue && !G.ui.open) {
        exitVenue(false);
      }
    });

    // =========================================================================
    // 4. PER-FRAME WORLD FX TICK (CALLED BY render.js)
    // =========================================================================
    window.__worldFXTick = function (clock) {
      // Clamp player cleanly inside the 14x14 interior room when inside a venue!
      if (activeVenue) {
        P.x = Math.max(activeVenue.roomX - 5.9, Math.min(activeVenue.roomX + 5.9, P.x));
        P.z = Math.max(activeVenue.roomZ - 2.6, Math.min(activeVenue.roomZ + 5.9, P.z));
        if (P.actor && P.actor.g) P.actor.g.position.set(P.x, 0, P.z);
        for (const em of emberMeshes) {
          em.material.color.setHSL(0.045 + 0.015 * Math.sin(clock * 6.5), 0.95, 0.52 + 0.08 * Math.sin(clock * 9.0));
        }
      }

      // Smoothly transition wetness, rain streaks & lens raindrops
      const targetWet = weather === "rain" ? 1.0 : weather === "afterrain" ? 0.88 : weather === "mist" ? 0.22 : 0.0;
      const targetRain = (weather === "rain" && !activeVenue && !G.INT.on) ? 1.0 : 0.0;
      const targetLens = (weather === "rain" && !activeVenue && !G.INT.on) ? 0.85 : 0.0;

      wetnessCur += (targetWet - wetnessCur) * (targetWet === 0 ? 0.25 : 0.08);
      rainCur = targetRain === 0 ? rainCur * 0.72 : rainCur + (targetRain - rainCur) * 0.15;
      if (targetRain === 0 && rainCur < 0.02) rainCur = 0;
      rainLensCur = targetLens === 0 ? rainLensCur * 0.72 : rainLensCur + (targetLens - rainLensCur) * 0.15;
      if (targetLens === 0 && rainLensCur < 0.02) rainLensCur = 0;

      if (R && R.setWeatherFX) {
        R.setWeatherFX({ wetness: wetnessCur, rainActive: rainCur, rainLens: rainLensCur });
      }

      // Update 3D falling rain volume around camera
      rainMesh.visible = rainCur > 0.04;
      if (rainMesh.visible) {
        const cx = G.camera.position.x, cz = G.camera.position.z;
        const isNight = G.SKY && G.SKY.mode === "night";
        rainMat.color.setHex(isNight ? 0xffdfb0 : 0xdbeeff);
        rainMat.opacity = (isNight ? 0.34 : 0.24) * rainCur;
        for (let i = 0; i < RAIN_COUNT; i++) {
          const d = rainDrops[i];
          d.y -= d.spd * 0.016;
          d.ox += 0.04;
          if (d.y < 0.2) {
            d.y = 21 + Math.random() * 5;
            d.ox = (Math.random() - 0.5) * 44;
            d.oz = (Math.random() - 0.5) * 44;
            if (Math.hypot(d.ox, d.oz) < 2.8) d.ox += (d.ox >= 0 ? 3.2 : -3.2);
          }
          rainPos.set(cx + d.ox, d.y, cz + d.oz);
          dummyMat.compose(rainPos, tiltQ, rainScale);
          rainMesh.setMatrixAt(i, dummyMat);
        }
        rainMesh.instanceMatrix.needsUpdate = true;
      }

      // Adjust atmospheric haze & Mount Ararat alpenglow tint per time of day & weather
      if (scene.fog) {
        const baseDensity = weather === "mist" ? 0.0024 : weather === "rain" ? 0.0017 : 0.00055;
        if (typeof scene.fog.density === "number") {
          scene.fog.density += (baseDensity - scene.fog.density) * 0.04;
        }
      }
      if (araratHorizon) {
        const m = G.SKY ? G.SKY.mode : "golden";
        araratHorizon.grp.visible = !activeVenue && !(window.__dest && window.__dest.isActive());
        araratHorizon.mat.color.setHex(m === "dusk" ? 0xffb3a0 : m === "night" ? 0x263554 : 0xffffff);
        araratHorizon.mat.opacity = weather === "mist" ? 0.42 : m === "night" ? 0.35 : 0.78;
      }

      // 3rd-person locomotion banking & sprint lean
      updateThirdPersonPhysics();
    };

    window.__worldFX = {
      getWeather: () => weather,
      setWeather,
      cycleWeather,
      enterVenue,
      exitVenue,
      getActiveVenue: () => activeVenue,
      VENUES
    };
  }

  bootWorldFX();
})();

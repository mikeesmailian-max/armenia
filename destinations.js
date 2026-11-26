// Walk Armenia — Pillar 3: Playable 3D Destination Hubs for the Top 10 Armenia Tours (Khor Virap, Garni Temple, Lake Sevan)
(() => {
  "use strict";

  function bootDestinations() {
    const G = window.__game;
    const H = window.__hyper;
    if (!G || !G._ext || !H) { setTimeout(bootDestinations, 85); return; }

    const E = G._ext;
    const T = E.THREE;
    const { scene } = E;
    const P = G.player;
    const UI = E.ui;

    const HUBS = {
      khor_virap: {
        id: "khor_virap",
        name: "Khor Virap Monastery & Mt. Ararat",
        hy: "Խոր Վիրապ և Արարատ լեռ",
        ox: 8000, oz: 8000,
        spawnDX: 0, spawnDZ: 12, spawnYaw: Math.PI,
        busDX: 12, busDZ: 22,
        actDX: 0, actDZ: -2,
        actPrompt: "[E] Ring Monastery Bell & Snap Mt. Ararat Passport Photo (+40 Respect & Clout)",
        actTitle: "🔔 Khor Virap & Mount Ararat",
        actHy: "Խոր Վիրապ · Արարատի ստորոտին",
        actMsg: "The bronze monastery bell rings out across the Ararat Valley as snow-capped Mount Ararat glows above the ancient red-tuff dome! (+40 Respect, +40 Clout)"
      },
      garni: {
        id: "garni",
        name: "Garni Pagan Temple & Basalt Gorge",
        hy: "Գառնու տաճար և Քարերի սիմֆոնիա",
        ox: 8400, oz: 8000,
        spawnDX: 0, spawnDZ: 22, spawnYaw: Math.PI,
        busDX: -12, busDZ: 22,
        actDX: 0, actDZ: -3,
        actPrompt: "[E] Step Into 1st-Century Sun Temple Sanctuary (+45 Respect & Clout)",
        actTitle: "🏛️ Temple of Garni (77 AD)",
        actHy: "Գառնու Հեթանոսական Տաճար",
        actMsg: "Cool basalt echoes resonate through the 24 Ionic columns perched high above the Symphony of Stones gorge! (+45 Respect, +45 Clout)"
      },
      sevan: {
        id: "sevan",
        name: "Lake Sevan & Sevanavank Peninsula",
        hy: "Սևանա լիճ և Սևանավանք",
        ox: 8800, oz: 8000,
        spawnDX: 0, spawnDZ: 21, spawnYaw: Math.PI,
        busDX: 12, busDZ: 21,
        actDX: -5, actDZ: 6,
        actPrompt: "[E] Taste Grilled Lake Sevan Ishkhan & Admire Sevanavank (+50 Energy & Respect)",
        actTitle: "🌊 Lake Sevan — Jewel of Armenia",
        actHy: "Սևանավանք · 1,900մ բարձրության վրա",
        actMsg: "Crisp 1,900m alpine air, turquoise waves lapping the black-tuff peninsula, and fresh lakeside Sevan trout! (+50 Energy, +40 Respect)"
      }
    };

    const builtGroups = {};
    const animBoats = [];
    let sevanWater = null;
    let activeHub = null;
    let savedYerevan = null;

    function buildTourBus(x, z, ry) {
      const bus = new T.Group();
      const bodyMat = new T.StdMat({ color: 0xf6efe6, roughness: 0.28, metalness: 0.22 });
      const stripeMat = new T.StdMat({ color: 0xd9431e, roughness: 0.35 });
      const glassMat = new T.StdMat({ color: 0x1a2c3d, roughness: 0.08, metalness: 0.7 });
      const tireMat = new T.StdMat({ color: 0x161618, roughness: 0.85 });

      const body = new T.Mesh(new T.Box(2.6, 2.7, 9.2), bodyMat);
      body.position.y = 1.95; body.castShadow = body.receiveShadow = true; bus.add(body);
      const stripe = new T.Mesh(new T.Box(2.64, 0.36, 9.22), stripeMat);
      stripe.position.y = 1.35; bus.add(stripe);
      const win = new T.Mesh(new T.Box(2.64, 1.05, 8.2), glassMat);
      win.position.y = 2.45; bus.add(win);
      for (const wx of [-1.25, 1.25]) {
        for (const wz of [-2.9, 2.9]) {
          const w = new T.Mesh(new T.Cyl(0.55, 0.55, 0.32, 12).rotateZ(Math.PI / 2), tireMat);
          w.position.set(wx, 0.55, wz); bus.add(w);
        }
      }
      bus.position.set(x, 0, z);
      bus.rotation.y = ry;
      return bus;
    }

    function makeStoneTex(baseHex, mortarHex, repX, repY) {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d");
      g.fillStyle = mortarHex; g.fillRect(0, 0, 256, 256);
      const rows = 8, cols = 4, bh = 256 / rows, bw = 256 / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (bw * 0.5);
        for (let c = -1; c <= cols; c++) {
          g.fillStyle = baseHex;
          g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
          const shade = ((r * 13 + c * 29) % 19) - 9;
          g.fillStyle = shade > 0 ? `rgba(255,245,230,${shade * 0.009})` : `rgba(20,12,10,${-shade * 0.011})`;
          g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
        }
      }
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      tex.wrapS = tex.wrapT = 1000; // RepeatWrapping
      tex.repeat.set(repX, repY);
      return tex;
    }

    function buildArmenianChurch(tuffColor, roofColor, scale = 1) {
      const g = new T.Group();
      const hexStr = "#" + tuffColor.toString(16).padStart(6, "0");
      const stone = new T.StdMat({ color: 0xffffff, map: makeStoneTex(hexStr, "#3b2c26", 3, 2), roughness: 0.84 });
      const roof = new T.StdMat({ color: roofColor, roughness: 0.65 });
      const gold = new T.StdMat({ color: 0xdfb254, roughness: 0.25, metalness: 0.85 });

      // Cruciform nave
      const naveA = new T.Mesh(new T.Box(8.5, 6.2, 12.2), stone);
      naveA.position.y = 3.1; naveA.castShadow = naveA.receiveShadow = true; g.add(naveA);
      const naveB = new T.Mesh(new T.Box(12.2, 5.6, 7.2), stone);
      naveB.position.y = 2.8; naveB.castShadow = naveB.receiveShadow = true; g.add(naveB);

      // Polygonal drum + iconic Armenian conical umbrella dome!
      const drum = new T.Mesh(new T.Cyl(2.65, 2.75, 4.4, 12), stone);
      drum.position.y = 8.1; drum.castShadow = true; g.add(drum);
      const cone = new T.Mesh(new T.Cyl(0.18, 3.05, 4.2, 12), roof);
      cone.position.y = 12.3; cone.castShadow = true; g.add(cone);

      // Gilded Armenian cross atop dome
      const cV = new T.Mesh(new T.Box(0.16, 1.45, 0.16), gold); cV.position.y = 15.0; g.add(cV);
      const cH = new T.Mesh(new T.Box(0.85, 0.16, 0.16), gold); cH.position.y = 15.25; g.add(cH);

      // Arched portal doorway
      const door = new T.Mesh(new T.Box(2.2, 3.4, 0.4), new T.StdMat({ color: 0x2b1912, roughness: 0.7 }));
      door.position.set(0, 1.7, 6.1); g.add(door);

      g.scale.set(scale, scale, scale);
      return g;
    }

    // Organic vertex-displaced alpine mountain peak (pointed snow-crested ridge, never a flat cylinder!)
    function makeAlpinePeak(radius, height, rockHex, snowThreshold, seed) {
      const geo = new T.Plane(radius * 2, radius * 2, 24, 24).rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const rockC = new T.Color(rockHex);
      const snowC = new T.Color(0xf6f8ff);
      const c = new T.Color();
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vz = pos.getZ(i);
        const r = Math.hypot(vx, vz) / radius;
        const ang = Math.atan2(vz, vx);
        const ridge = 1 + 0.16 * Math.sin(ang * 5 + seed) + 0.09 * Math.cos(ang * 9 - seed * 1.7);
        const falloff = Math.max(0, 1 - r * ridge);
        const h = Math.pow(falloff, 1.55) * height + (falloff > 0.05 ? Math.sin(vx * 0.06 + seed) * Math.cos(vz * 0.06) * height * 0.05 : 0);
        pos.setY(i, h);
        const snowMix = Math.max(0, Math.min(1, (h / Math.max(1, height) - snowThreshold) * 3.4));
        c.copy(rockC).lerp(snowC, snowMix);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new T.F32Attr(colors, 3));
      geo.computeVertexNormals();
      return new T.Mesh(geo, new T.StdMat({ vertexColors: true, roughness: 0.88 }));
    }

    function makeCypress(x, z, sc = 1) {
      const g = new T.Group();
      const trunk = new T.Mesh(new T.Cyl(0.12, 0.18, 1.6, 6), new T.StdMat({ color: 0x4d3624, roughness: 0.9 }));
      trunk.position.y = 0.8; g.add(trunk);
      const fol = new T.Mesh(new T.Cyl(0.08, 0.95, 5.4, 8), new T.StdMat({ color: 0x2d4d2a, roughness: 0.85 }));
      fol.position.y = 3.9; fol.castShadow = true; g.add(fol);
      g.position.set(x, 0, z);
      g.scale.setScalar(sc);
      return g;
    }

    function buildHub(id) {
      if (builtGroups[id]) return builtGroups[id];
      const h = HUBS[id];
      const grp = new T.Group();
      grp.position.set(h.ox, 0, h.oz);

      if (id === "khor_virap") {
        // Sun-baked Armenian stone courtyard & vast Ararat Valley stretching to the horizon
        const court = new T.Mesh(new T.Plane(76, 76).rotateX(-Math.PI / 2), new T.StdMat({
          color: 0xffffff, map: makeStoneTex("#c8b196", "#8c7862", 14, 14), roughness: 0.88
        }));
        court.receiveShadow = true; grp.add(court);
        const valley = new T.Mesh(new T.Plane(2600, 2600).rotateX(-Math.PI / 2), new T.StdMat({ color: 0x7b8055, roughness: 0.94 }));
        valley.position.y = -4.5; grp.add(valley);
        const hillSkirt = new T.Mesh(new T.Cyl(44, 72, 4.8, 24), new T.StdMat({ color: 0x9c8c72, roughness: 0.92 }));
        hillSkirt.position.y = -2.42; grp.add(hillSkirt);

        // Fortified Khor Virap stone monastery courtyard walls (wide open gateway at z=+17!) + cypress trees
        const wallMat = new T.StdMat({ color: 0xffffff, map: makeStoneTex("#bd8d72", "#6b4d3e", 6, 2), roughness: 0.85 });
        for (const [wx, wz, sx, sz] of [[-24, -4, 1.8, 42], [24, -4, 1.8, 42], [0, -24, 50, 1.8], [-17, 17, 16, 1.8], [17, 17, 16, 1.8]]) {
          const w = new T.Mesh(new T.Box(sx, 4.8, sz), wallMat);
          w.position.set(wx, 2.4, wz); w.castShadow = w.receiveShadow = true; grp.add(w);
        }
        for (const [cx, cz, sc] of [[-18, 8, 1.1], [19, 6, 1.0], [-19, -15, 1.2], [18, -16, 1.15]]) grp.add(makeCypress(cx, cz, sc));

        // Iconic Khor Virap Red-Tuff Church in center of courtyard
        const church = buildArmenianChurch(0xc9836a, 0x8f4c3a, 1.08);
        church.position.set(0, 0, -7);
        grp.add(church);

        // Colossal Sculpted Snow-Capped Mount Ararat (Greater & Lesser Ararat!) towering right behind the monastery!
        const bigArarat = makeAlpinePeak(240, 165, 0x6a6478, 0.42, 1.2);
        bigArarat.position.set(-55, -5, -310); grp.add(bigArarat);
        const lilArarat = makeAlpinePeak(155, 112, 0x736b7c, 0.56, 3.8);
        lilArarat.position.set(125, -5, -285); grp.add(lilArarat);

        // Monastery bell pavilion
        const bell = new T.Mesh(new T.Cyl(0.22, 0.36, 0.55, 10), new T.StdMat({ color: 0xc8993b, metalness: 0.85, roughness: 0.25 }));
        bell.position.set(0, 2.5, -2); grp.add(bell);

      } else if (id === "garni") {
        // Volcanic basalt cliff promontory & vast Azat River Canyon below
        const plateau = new T.Mesh(new T.Plane(64, 68).rotateX(-Math.PI / 2), new T.StdMat({
          color: 0xffffff, map: makeStoneTex("#948c80", "#69625a", 14, 14), roughness: 0.88
        }));
        plateau.receiveShadow = true; grp.add(plateau);
        const cliffBase = new T.Mesh(new T.Box(64, 24, 68), new T.StdMat({ color: 0x5c5752, roughness: 0.92 }));
        cliffBase.position.y = -12.05; grp.add(cliffBase);
        const gorgeFloor = new T.Mesh(new T.Plane(2600, 2600).rotateX(-Math.PI / 2), new T.StdMat({ color: 0x546144, roughness: 0.95 }));
        gorgeFloor.position.y = -24; grp.add(gorgeFloor);
        const azatRiver = new T.Mesh(new T.Plane(28, 1200).rotateX(-Math.PI / 2), new T.StdMat({ color: 0x26758f, roughness: 0.12, metalness: 0.2 }));
        azatRiver.position.set(-70, -23.7, -90); azatRiver.rotation.y = 0.65; grp.add(azatRiver);

        // Surrounding Gegham Mountain Canyon Ridges!
        for (const [mx, mz, r, h, s] of [[-190, -210, 180, 95, 0.7], [160, -220, 190, 105, 2.4], [0, -340, 220, 120, 4.1]]) {
          const pk = makeAlpinePeak(r, h, 0x7a7066, 0.82, s);
          pk.position.set(mx, -24, mz); grp.add(pk);
        }

        // Symphony of Stones hexagonal basalt cliff columns around the promontory!
        const basaltMat = new T.StdMat({ color: 0x504d4b, roughness: 0.86 });
        for (let i = -9; i <= 9; i++) {
          const col = new T.Mesh(new T.Cyl(1.4, 1.5, 28 + (Math.abs(i) % 3) * 3, 6), basaltMat);
          col.position.set(i * 3.2, -13, -34 - Math.abs(i) * 0.4);
          grp.add(col);
        }
        for (const [cx, cz] of [[-19, 14], [19, 12], [-21, -8], [21, -10]]) grp.add(makeCypress(cx, cz, 1.0));

        // Authentic 1st-Century Greco-Armenian Temple of Garni (Basalt Podium + Grand Steps + 24 Ionic Columns!)
        const templeStone = new T.StdMat({ color: 0x7c7670, roughness: 0.76 });
        const podium = new T.Mesh(new T.Box(12.2, 2.4, 16.4), templeStone);
        podium.position.set(0, 1.2, -6); podium.castShadow = podium.receiveShadow = true; grp.add(podium);
        for (let s = 0; s < 7; s++) {
          const st = new T.Mesh(new T.Box(9.4, 0.34, 0.55), templeStone);
          st.position.set(0, 0.17 + s * 0.34, 5.2 - s * 0.48);
          grp.add(st);
        }
        const colGeo = new T.Cyl(0.32, 0.37, 6.6, 12);
        const colPositions = [];
        for (let i = 0; i < 6; i++) {
          const cx = -4.8 + i * 1.92;
          colPositions.push([cx, 1.4], [cx, -13.4]);
        }
        for (let j = 1; j < 7; j++) {
          const cz = 1.4 - j * (14.8 / 7);
          colPositions.push([-4.8, cz], [4.8, cz]);
        }
        for (const [cx, cz] of colPositions) {
          const col = new T.Mesh(colGeo, templeStone);
          col.position.set(cx, 5.7, cz); col.castShadow = true; grp.add(col);
        }
        const cella = new T.Mesh(new T.Box(6.8, 6.4, 10.6), new T.StdMat({ color: 0x5c5753, roughness: 0.84 }));
        cella.position.set(0, 5.6, -6); grp.add(cella);
        const architrave = new T.Mesh(new T.Box(12.6, 1.35, 16.8), templeStone);
        architrave.position.set(0, 9.5, -6); architrave.castShadow = true; grp.add(architrave);
        const roofPeak = new T.Mesh(new T.Cyl(0.2, 6.8, 2.8, 4).rotateY(Math.PI / 4), templeStone);
        roofPeak.scale.set(1.0, 1.0, 1.32);
        roofPeak.position.set(0, 11.4, -6); grp.add(roofPeak);

      } else if (id === "sevan") {
        // Vast shimmering turquoise Lake Sevan + emerald grassy Sevanavank peninsula!
        const waterMat = new T.StdMat({
          color: 0x16809e, roughness: 0.05, metalness: 0.28, envMapIntensity: 2.8
        });
        sevanWater = new T.Mesh(new T.Plane(2400, 2400).rotateX(-Math.PI / 2), waterMat);
        sevanWater.position.y = -2.2; grp.add(sevanWater);

        const hill = new T.Mesh(new T.Cyl(34, 52, 3.2, 28), new T.StdMat({ color: 0x5c7c48, roughness: 0.92 }));
        hill.position.y = -1.6; hill.receiveShadow = true; grp.add(hill);
        const path = new T.Mesh(new T.Plane(10, 42).rotateX(-Math.PI / 2), new T.StdMat({ color: 0x9c968b, roughness: 0.85 }));
        path.position.set(0, 0.04, 4); path.receiveShadow = true; grp.add(path);

        // Twin 9th-Century Black-Tuff Sevanavank Churches + cypresses!
        const c1 = buildArmenianChurch(0x464146, 0x2c282e, 0.85);
        c1.position.set(-7.5, 0, -9); c1.rotation.y = 0.22; grp.add(c1);
        const c2 = buildArmenianChurch(0x524c50, 0x332e33, 0.74);
        c2.position.set(8.2, 0, -5); c2.rotation.y = -0.18; grp.add(c2);
        for (const [cx, cz] of [[-16, 4], [17, 2], [-18, -12], [16, -13]]) grp.add(makeCypress(cx, cz, 0.95));

        // Lakeside Ishkhan (Sevan Trout) Grill Stall
        const stall = new T.Mesh(new T.Box(3.4, 1.1, 1.6), new T.StdMat({ color: 0x6e4326, roughness: 0.75 }));
        stall.position.set(-5.2, 0.55, 6.2); grp.add(stall);

        // Bobbing white sailboats on Lake Sevan + sculpted alpine Sevan mountain ring!
        const sailMat = new T.StdMat({ color: 0xfbfaf5, roughness: 0.5, side: T.DoubleSide });
        const hullMat = new T.StdMat({ color: 0xd9e3eb, roughness: 0.35 });
        for (let i = 0; i < 6; i++) {
          const ang = -2.2 + i * 0.55;
          const dist = 75 + (i % 3) * 32;
          const b = new T.Group();
          const hull = new T.Mesh(new T.Box(1.8, 0.7, 4.6), hullMat);
          const mast = new T.Mesh(new T.Cyl(0.06, 0.08, 5.2, 6), hullMat); mast.position.y = 2.6;
          const sail = new T.Mesh(new T.Plane(2.6, 4.2), sailMat); sail.position.set(0.1, 2.8, 0.6); sail.rotation.y = Math.PI / 2;
          b.add(hull, mast, sail);
          b.position.set(Math.sin(ang) * dist, -1.9, Math.cos(ang) * dist - 40);
          b.rotation.y = ang + 1.2;
          grp.add(b);
          animBoats.push({ mesh: b, ph: i * 1.1 });
        }
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const pk = makeAlpinePeak(175, 76 + (i % 3) * 28, 0x64758a, 0.68, i * 1.3);
          pk.position.set(Math.sin(a) * 390, -2.5, Math.cos(a) * 390);
          grp.add(pk);
        }
      }

      // Gleaming Walk Armenia Tour Bus waiting to drive you back to Yerevan!
      grp.add(buildTourBus(h.busDX, h.busDZ, -0.32));

      grp.visible = false;
      scene.add(grp);
      builtGroups[id] = grp;
      return grp;
    }

    // Floating "Back to Yerevan" Banner Pill while exploring a 3D Tour Hub
    let backPill = document.getElementById("destBackPill");
    if (!backPill) {
      backPill = document.createElement("button");
      backPill.id = "destBackPill";
      backPill.style.cssText = "display:none;position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:26;background:linear-gradient(135deg,#f3b267,#df7d41);color:#23120c;border:0;padding:10px 20px;border-radius:999px;font:700 13.5px system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.45)";
      backPill.addEventListener("click", () => exitToYerevan(false));
      document.body.appendChild(backPill);
    }

    function enterHub(id) {
      const h = HUBS[id];
      if (!h) return;
      if (window.__worldFX && window.__worldFX.getActiveVenue()) window.__worldFX.exitVenue(true);
      if (P.car && G.leaveCar) G.leaveCar();
      if (G.ui.open) UI._e();

      if (!activeHub) {
        savedYerevan = { x: P.x, z: P.z, yaw: P.yaw };
      } else {
        builtGroups[activeHub.id].visible = false;
      }

      const grp = buildHub(id);
      activeHub = h;
      grp.visible = true;
      P.x = h.ox + h.spawnDX;
      P.z = h.oz + h.spawnDZ;
      P.yaw = h.spawnYaw;
      P.cy = h.spawnYaw;
      if (P.actor && P.actor.g) { P.actor.g.position.set(P.x, 0, P.z); P.actor.g.rotation.y = P.yaw; }

      backPill.textContent = "🚌 Return to Yerevan from " + h.name.split("&")[0].trim() + " (Esc)";
      backPill.style.display = "block";
      UI.de("Arrived: " + h.name, h.hy, "Step off the tour bus and explore in 3D! Press [E] at the landmark, or board the Tour Bus / click Return to Yerevan.");
    }

    function exitToYerevan(quiet) {
      if (!activeHub) return;
      if (builtGroups[activeHub.id]) builtGroups[activeHub.id].visible = false;
      const prev = savedYerevan || { x: 268, z: 60, yaw: 0 };
      activeHub = null;
      savedYerevan = null;
      P.x = prev.x; P.z = prev.z; P.yaw = prev.yaw; P.cy = prev.yaw;
      if (P.actor && P.actor.g) { P.actor.g.position.set(P.x, 0, P.z); P.actor.g.rotation.y = P.yaw; }
      backPill.style.display = "none";
      if (!quiet) UI.de("Welcome Back to Yerevan!", "Բարի վերադարձ Երևան", "Your tour bus dropped you back in central Yerevan.");
    }

    // Chain cleanly onto __hyperPrompt and __hyperActE
    const prevPrompt = window.__hyperPrompt;
    window.__hyperPrompt = function () {
      if (activeHub) {
        const dBus = Math.hypot(P.x - (activeHub.ox + activeHub.busDX), P.z - (activeHub.oz + activeHub.busDZ));
        if (dBus < 6.5) return "[E] Board Tour Bus back to Central Yerevan";
        const dAct = Math.hypot(P.x - (activeHub.ox + activeHub.actDX), P.z - (activeHub.oz + activeHub.actDZ));
        if (dAct < 8.5) return activeHub.actPrompt;
        return "Exploring " + activeHub.name + " · Walk to landmark for [E] or Tour Bus to return";
      }
      return prevPrompt ? prevPrompt() : null;
    };

    const prevActE = window.__hyperActE;
    window.__hyperActE = function () {
      if (activeHub) {
        const dBus = Math.hypot(P.x - (activeHub.ox + activeHub.busDX), P.z - (activeHub.oz + activeHub.busDZ));
        if (dBus < 6.5) { exitToYerevan(false); return true; }
        const dAct = Math.hypot(P.x - (activeHub.ox + activeHub.actDX), P.z - (activeHub.oz + activeHub.actDZ));
        if (dAct < 8.5) {
          const he = G.G();
          he.energy = Math.min(100, (he.energy || 70) + 50);
          UI.gt(); UI.at();
          if (H.addReputation) H.addReputation(45, 45);
          UI.de(activeHub.actTitle, activeHub.actHy, activeHub.actMsg);
          return true;
        }
        return false;
      }
      return prevActE ? prevActE() : false;
    };

    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === "Escape" && activeHub && !G.ui.open) exitToYerevan(false);
    });

    // Per-frame hub boundary clamp & Lake Sevan boat bobbing
    window.__destTick = function (clock) {
      if (!activeHub) return;
      P.x = Math.max(activeHub.ox - 28, Math.min(activeHub.ox + 28, P.x));
      P.z = Math.max(activeHub.oz - 21, Math.min(activeHub.oz + 28, P.z));
      if (P.actor && P.actor.g) P.actor.g.position.set(P.x, 0, P.z);

      if (activeHub.id === "sevan") {
        for (const b of animBoats) {
          b.mesh.position.y = -1.9 + Math.sin(clock * 1.6 + b.ph) * 0.14;
          b.mesh.rotation.z = Math.sin(clock * 1.2 + b.ph) * 0.05;
        }
      }
    };

    window.__dest = {
      HUBS,
      hasHub: (id) => !!HUBS[id],
      enterHub,
      exitToYerevan,
      isActive: () => !!activeHub,
      getActiveHub: () => activeHub
    };
  }

  bootDestinations();
})();

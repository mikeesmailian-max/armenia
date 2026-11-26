// Walk Armenia — Top 10 Real-Life Armenia Tours (~3-Minute Cinematic Guided Film + Live Google Maps)
(() => {
  "use strict";

  const TOUR_KEY = "walk-armenia-tours-v1";
  let tourSave = { visited: {}, grandUnlocked: false, souvenirs: {} };
  try {
    const s = JSON.parse(localStorage.getItem(TOUR_KEY) || "null");
    if (s && typeof s === "object") {
      tourSave.visited = s.visited || {};
      tourSave.grandUnlocked = !!s.grandUnlocked;
      tourSave.souvenirs = s.souvenirs || {};
    }
  } catch {}
  const persistTours = () => { try { localStorage.setItem(TOUR_KEY, JSON.stringify(tourSave)); } catch {} };

  const TOP10 = [
    {
      id: "khor_virap", rank: 1,
      en: "Khor Virap & Mount Ararat", hy: "Խոր Վիրապ և Արարատ",
      lat: 39.8783, lon: 44.5761, elev: "825 m", dist: "42 km S of Yerevan", built: "642 AD", price: 9000,
      thumb: "tours/khor_virap_1.jpg",
      desc: "Armenia’s most iconic pilgrimage monastery standing on the Ararat plain directly beneath snow-capped Mount Ararat.",
      slides: [
        { type: "img", src: "tours/khor_virap_1.jpg", kb: [1.02, 1.13, -1.5, -0.8, 1.8, 0.8], hy: "Խոր Վիրապ՝ Արարատի ստորոտին", en: "Welcome to Khor Virap in the Ararat Valley. Right ahead rises 5,137-metre Mount Ararat — the eternal symbol of Armenia." },
        { type: "img", src: "tours/khor_virap_2.jpg", kb: [1.12, 1.02, 1.8, 0.5, -1.5, -0.5], hy: "Սուրբ Գրիգոր Լուսավորչի վիրապը", en: "Beneath these stone walls lies the royal pit where Saint Gregory the Illuminator was imprisoned before Armenia became the first Christian nation in 301 AD." }
      ]
    },
    {
      id: "garni", rank: 2,
      en: "Garni Pagan Temple & Gorge", hy: "Գառնիի տաճար և Քարերի Սիմֆոնիա",
      lat: 40.1125, lon: 44.7306, elev: "1,400 m", dist: "28 km E of Yerevan", built: "77 AD", price: 8500,
      thumb: "tours/garni_1.jpg",
      desc: "The only standing Greco-Roman colonnaded temple in the Caucasus, perched above the dramatic Azat Gorge.",
      slides: [
        { type: "img", src: "tours/garni_1.jpg", kb: [1.03, 1.14, -1.8, 0.5, 1.6, -0.8], hy: "Գառնիի արևի տաճարը՝ 77 թ.", en: "Built in 77 AD by King Tiridates I from local grey basalt, the Temple of Garni was dedicated to Mihr, the Armenian god of the sun." },
        { type: "img", src: "tours/garni_2.jpg", kb: [1.13, 1.03, 1.6, -0.6, -1.6, 0.8], hy: "Քարերի սիմֆոնիա · Ազատի կիրճ", en: "Just below the temple cliff lies the Symphony of Stones — towering hexagonal basalt organ pipes sculpted by ancient volcanic lava." }
      ]
    },
    {
      id: "geghard", rank: 3,
      en: "Geghard Monastery (UNESCO)", hy: "Գեղարդի վանք",
      lat: 40.1404, lon: 44.8185, elev: "1,750 m", dist: "36 km E of Yerevan", built: "4th c.", price: 9500,
      thumb: "tours/geghard_1.jpg",
      desc: "A breathtaking medieval monastery carved directly out of solid volcanic mountain cliffs, famous for its acoustics.",
      slides: [
        { type: "img", src: "tours/geghard_1.jpg", kb: [1.02, 1.13, -1.2, 0.8, 1.5, -0.6], hy: "Ժայռափոր Գեղարդավանք", en: "Tucked deep inside the Azat canyon, Geghard Monastery is partially hewn straight out of the surrounding mountain rock and listed by UNESCO." },
        { type: "img", src: "tours/geghard_2.jpg", kb: [1.12, 1.02, 1.5, -0.5, -1.4, 0.7], hy: "Ժայռափոր խաչքարեր", en: "Hundreds of intricate Armenian khachkars — carved stone crosses — line the cliffs, where fresh spring water still flows through the rock chapels." }
      ]
    },
    {
      id: "sevan", rank: 4,
      en: "Lake Sevan & Sevanavank", hy: "Սևանա լիճ և Սևանավանք",
      lat: 40.5639, lon: 44.9533, elev: "1,900 m", dist: "65 km NE of Yerevan", built: "874 AD", price: 11000,
      thumb: "tours/sevan_1.jpg",
      desc: "The Jewel of Armenia — one of the largest high-altitude alpine lakes on Earth, crowned by 9th-century black-tuff churches.",
      slides: [
        { type: "img", src: "tours/sevan_1.jpg", kb: [1.03, 1.14, -1.6, 0.4, 1.5, -0.4], hy: "Սևանավանք՝ 1900 մ բարձրության վրա", en: "At 1,900 metres above sea level, Lake Sevan shifts from deep sapphire to turquoise as mountain clouds sweep across the peninsula." },
        { type: "img", src: "tours/sevan_2.jpg", kb: [1.12, 1.02, 1.8, -0.5, -1.5, 0.6], hy: "Հայաստանի կապույտ մարգարիտը", en: "Princess Mariam founded Sevanavank monastery in 874 AD. Today travellers climb its stone steps for panoramic lake views and fresh Sevan trout." }
      ]
    },
    {
      id: "tatev", rank: 5,
      en: "Tatev Monastery & Wings of Tatev", hy: "Տաթևի վանք և ՏաԹևեր",
      lat: 39.3794, lon: 46.2500, elev: "1,600 m", dist: "252 km SE of Yerevan", built: "895 AD", price: 18000,
      thumb: "tours/tatev_1.jpg",
      desc: "A 9th-century cliff-edge fortress monastery reached by the world’s longest reversible aerial tramway over Vorotan Gorge.",
      slides: [
        { type: "img", src: "tours/tatev_1.jpg", kb: [1.02, 1.13, -1.4, 0.6, 1.6, -0.7], hy: "Տաթևի վանք՝ Որոտանի կիրճի եզրին", en: "Perched dramatically on a basalt plateau above the Vorotan Gorge, Tatev was medieval Armenia’s greatest university and spiritual stronghold." },
        { type: "img", src: "tours/tatev_2.jpg", kb: [1.13, 1.03, 1.6, -0.4, -1.5, 0.5], hy: "ՏաԹևեր՝ աշխարհի ամենաերկար ճոպանուղին", en: "Visitors soar 5.7 kilometres across the canyon aboard the Wings of Tatev cableway — 320 metres above the roaring river below." }
      ]
    },
    {
      id: "noravank", rank: 6,
      en: "Noravank Red-Cliff Monastery", hy: "Նորավանք · Վայոց Ձոր",
      lat: 39.6844, lon: 45.2328, elev: "1,520 m", dist: "122 km SE of Yerevan", built: "1205 AD", price: 14000,
      thumb: "tours/noravank_1.jpg",
      desc: "Master architect Momik’s two-story masterpiece glowing inside a narrow gorge of sheer brick-red limestone cliffs.",
      slides: [
        { type: "img", src: "tours/noravank_1.jpg", kb: [1.03, 1.14, -1.3, 0.9, 1.2, -0.8], hy: "Սուրբ Աստվածածին · ճարտարապետ Մոմիկ", en: "Noravank’s iconic two-storey Surb Astvatsatsin church features narrow cantilevered stone steps projecting right out of its carved facade." },
        { type: "img", src: "tours/noravank_2.jpg", kb: [1.12, 1.02, 1.7, -0.5, -1.5, 0.4], hy: "Կարմիր ժայռերի կիրճը · Արենիի գինիներ", en: "At sunset the towering red cliffs around Noravank ignite in amber fire — just minutes from Areni, home to the world’s oldest 6,100-year-old winery." }
      ]
    },
    {
      id: "dilijan", rank: 7,
      en: "Dilijan & Haghartsin Monastery", hy: "Դիլիջան և Հաղարծին",
      lat: 40.7417, lon: 44.8636, elev: "1,500 m", dist: "96 km NE of Yerevan", built: "10th c.", price: 12000,
      thumb: "tours/dilijan_1.jpg",
      desc: "Lush alpine forests known as the Little Switzerland of Armenia, wooden balconies on Sharambeyan Street, and hidden monasteries.",
      slides: [
        { type: "img", src: "tours/dilijan_1.jpg", kb: [1.02, 1.13, -1.5, 0.5, 1.5, -0.5], hy: "Հաղարծինի վանք՝ անտառի սրտում", en: "Hidden deep inside Dilijan National Park’s emerald beech forests, medieval stone monasteries emerge through drifting mountain mist." },
        { type: "img", src: "tours/dilijan_2.jpg", kb: [1.12, 1.02, 1.5, -0.4, -1.4, 0.6], hy: "Հին Դիլիջան · Շարամբեյան փողոց", en: "Old Dilijan preserves 19th-century carved wooden balconies, pottery studios, and artisan cafés serving warm Armenian herbal mountain tea." }
      ]
    },
    {
      id: "cascade", rank: 8,
      en: "The Cascade & Ararat Overlook", hy: "Երևանի Կասկադ",
      lat: 40.1912, lon: 44.5156, elev: "1,030 m", dist: "Central Yerevan", built: "1971", price: 5000,
      thumb: "tours/cascade_1.jpg",
      drop3D: { x: 344, z: -790, label: "The Cascade" },
      desc: "Yerevan’s monumental travertine limestone staircase, open-air sculpture garden, and sweeping terrace overlooking Mount Ararat.",
      slides: [
        { type: "vid", src: "air_cascade.mp4", hy: "Կասկադը թռչնի թռիչքի բարձրությունից", en: "Soaring over Yerevan’s Cascade Complex — 572 limestone steps linking downtown Kentron to the Victory Park plateau." },
        { type: "img", src: "tours/cascade_1.jpg", kb: [1.03, 1.13, -1.4, 0.6, 1.6, -0.5], hy: "Արարատի տեսարանը Կասկադից", en: "From the upper terraces, the entire Pink City unfolds beneath you with Mount Ararat framed perfectly on the southern horizon." }
      ]
    },
    {
      id: "rsq", rank: 9,
      en: "Republic Square & Singing Fountains", hy: "Հանրապետության հրապարակ",
      lat: 40.1776, lon: 44.5126, elev: "990 m", dist: "Central Yerevan", built: "1924", price: 5000,
      thumb: "tours/rsq_2.jpg",
      drop3D: { x: 96, z: 505, label: "Republic Square" },
      desc: "Alexander Tamanian’s neoclassical pink-tuff masterpiece — the vibrant ceremonial heart of modern Yerevan.",
      slides: [
        { type: "vid", src: "air_rsq.mp4", hy: "Հանրապետության հրապարակը վերևից", en: "Designed by visionary architect Alexander Tamanian, Republic Square radiates warm rose and apricot volcanic tuff stone." },
        { type: "img", src: "tours/rsq_2.jpg", kb: [1.03, 1.13, -1.6, 0.3, 1.6, -0.4], hy: "Երգող շատրվաններ և Պատմության թանգարան", en: "Every warm evening, thousands gather around the Dancing Fountains as classical Armenian music and lights fill the square." }
      ]
    },
    {
      id: "etchmiadzin", rank: 10,
      en: "Etchmiadzin Cathedral & Zvartnots", hy: "Էջմիածնի Մայր Տաճար և Զվարթնոց",
      lat: 40.1619, lon: 44.2911, elev: "853 m", dist: "21 km W of Yerevan", built: "301 AD", price: 8000,
      thumb: "tours/etchmiadzin_1.jpg",
      desc: "The world’s oldest state cathedral (301 AD) and the monumental 7th-century circular ruins of Zvartnots against Mount Ararat.",
      slides: [
        { type: "img", src: "tours/etchmiadzin_1.jpg", kb: [1.02, 1.13, -1.5, 0.4, 1.5, -0.4], hy: "Մայր Աթոռ Սուրբ Էջմիածին (301 թ.)", en: "Founded in 301 AD, Holy Etchmiadzin is the spiritual centre of the Armenian Apostolic Church and the oldest cathedral in the world." },
        { type: "img", src: "tours/etchmiadzin_2.jpg", kb: [1.13, 1.02, 1.6, -0.5, -1.6, 0.5], hy: "Զվարթնոցի տաճարի ավերակները", en: "Minutes away stand the majestic UNESCO ruins of 7th-century Zvartnots Cathedral, framed by vineyards and snow-capped Ararat." }
      ]
    }
  ];

  // Invert game.js Web Mercator projection so we know exact real-world (lat, lon) anywhere in Yerevan!
  const UA = 0.32261480016214966;
  const OM = 512 * Math.pow(2, 17.5);
  const sin40 = Math.sin(40.1825 * Math.PI / 180);
  const UM_X = (44.5115 + 180) / 360 * OM;
  const UM_Y = (0.5 - Math.log((1 + sin40) / (1 - sin40)) / (4 * Math.PI)) * OM;

  function worldToLatLon(wx, wz) {
    const px = UM_X + wx / UA;
    const py = UM_Y + wz / UA;
    const lon = (px / OM) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * py) / OM;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return [lat, lon];
  }

  function gmapEmbedUrl(lat, lon, z) {
    return `https://maps.google.com/maps?q=${lat.toFixed(5)},${lon.toFixed(5)}&t=k&z=${z || 17}&ie=UTF8&iwloc=&output=embed`;
  }
  function gmapStreetViewUrl(lat, lon) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(5)},${lon.toFixed(5)}`;
  }

  function bootTours() {
    const G = window.__game;
    const H = window.__hyper;
    if (!G || !G._ext || !H) { setTimeout(bootTours, 80); return; }
    const E = G._ext;
    const UI = E.ui;
    const P = G.player;

    const $ = (id) => document.getElementById(id);

    // ---- 1. LIVE GOOGLE MAPS LAYER INSIDE MAIN MAP (M) ----
    let liveGmapActive = false;
    function setLiveGmap(on, lat, lon, z) {
      liveGmapActive = !!on;
      const mapEl = $("map");
      const frame = $("gmapLiveFrame");
      if (!mapEl || !frame) return;
      mapEl.classList.toggle("gmap-live", liveGmapActive);
      if (liveGmapActive) {
        const [rlat, rlon] = (lat !== undefined && lon !== undefined) ? [lat, lon] : worldToLatLon(G.MV.x || P.x, G.MV.z || P.z);
        frame.src = gmapEmbedUrl(rlat, rlon, z || 17);
      }
    }

    document.querySelectorAll("#mlayers button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.layer === "gmap") {
          document.querySelectorAll("#mlayers button").forEach(b => b.classList.toggle("on", b === btn));
          setLiveGmap(true);
        } else {
          setLiveGmap(false);
        }
      });
    });

    // Clicking "My Location" while in Google Maps layer re-centers on exact real Yerevan GPS!
    const mMe = $("mMe");
    if (mMe) mMe.addEventListener("click", () => {
      if (liveGmapActive) {
        const [lat, lon] = worldToLatLon(P.x, P.z);
        $("gmapLiveFrame").src = gmapEmbedUrl(lat, lon, 18);
      }
    });
    const mArm = $("mArm");
    if (mArm) mArm.addEventListener("click", () => {
      if (liveGmapActive) $("gmapLiveFrame").src = gmapEmbedUrl(40.15, 44.8, 8);
    });

    // ---- 2. ARMENIA TOP 10 TOURS HUB (BOOKING & PASSPORT) ----
    function openTourHub() {
      if (G.ui.open && G.ui.open !== "tourHub") UI._e();
      renderTourHub();
      UI.ki("tourHub");
    }

    function renderTourHub() {
      const visitedCount = TOP10.filter(t => tourSave.visited[t.id]).length;
      const passEl = $("thPassport");
      if (passEl) passEl.textContent = `🇦🇲 Passport: ${visitedCount} / 10 Visited`;

      const grandBtn = $("thGrandGo");
      if (grandBtn) {
        grandBtn.textContent = tourSave.grandUnlocked
          ? "▶ Watch Full 3:10 Tour (Unlocked)"
          : "Book Full 3:10 Tour · ֏ 35,000";
      }

      const grid = $("thGrid");
      if (!grid) return;
      grid.textContent = "";
      for (const t of TOP10) {
        const done = !!tourSave.visited[t.id];
        const card = document.createElement("div");
        card.className = "tCard" + (done ? " done" : "");
        card.innerHTML = `
          <div class="tThumb">
            <img src="${t.thumb}" alt="${t.en}" loading="lazy">
            <span class="tBadge">#${t.rank} · ${t.built}</span>
            ${done ? '<span class="tStamp">✓ Visited</span>' : ""}
          </div>
          <div class="tBody">
            <b>${t.en}</b>
            <div class="hy" lang="hy">${t.hy}</div>
            <div class="meta">📍 ${t.dist} · ⛰ ${t.elev}</div>
            <div class="desc">${t.desc}</div>
            <div class="tActs">
              <button class="go">${done ? "▶ Replay Tour" : "🚌 Book · " + UI.Ie(t.price)}</button>
              ${window.__dest && window.__dest.hasHub(t.id) ? '<button class="w3d" title="Step off the bus and walk here in 3D!">🚶 3D</button>' : ""}
              <button class="gm" title="Inspect real Google Maps Satellite">🌍 Maps</button>
            </div>
          </div>`;
        card.querySelector(".go").addEventListener("click", () => bookSingleTour(t));
        const w3dBtn = card.querySelector(".w3d");
        if (w3dBtn) w3dBtn.addEventListener("click", () => {
          markVisited(t);
          window.__dest.enterHub(t.id);
        });
        card.querySelector(".gm").addEventListener("click", () => {
          startTourSession([t], false, true);
        });
        grid.appendChild(card);
      }
    }

    function bookGrandTour() {
      const he = G.G();
      if (!tourSave.grandUnlocked) {
        if (he.dram < 35000) {
          UI.de("Need ֏ 35,000 for Grand Tour", "Գումարը քիչ է", "You have " + UI.Ie(he.dram) + ". Try an individual tour from ֏ 5,000, or earn Dram from Jobs (P) & Street Drama (K)!");
          return;
        }
        he.dram -= 35000;
        tourSave.grandUnlocked = true;
        persistTours();
        UI.gt(); UI.at();
        G.SND && G.SND.cash && G.SND.cash();
        UI.de("🎟️ Grand Armenia Tour Booked!", "Բարի ճանապարհ", "All Top 10 attractions unlocked — boarding your 3-minute guided tour!");
      }
      startTourSession(TOP10, true, false);
    }

    function bookSingleTour(t) {
      const he = G.G();
      if (!tourSave.visited[t.id]) {
        if (he.dram < t.price) {
          UI.de("Need " + UI.Ie(t.price), "Գումարը քիչ է", "You have " + UI.Ie(he.dram) + ". Earn Dram via Jobs (P) or Drama (K), or click 🌍 Maps to explore on Google Maps free!");
          return;
        }
        he.dram -= t.price;
        UI.gt(); UI.at();
        G.SND && G.SND.cash && G.SND.cash();
      }
      startTourSession([t], false, false);
    }

    // ---- 3. ~3-MINUTE CINEMATIC GUIDED TOUR THEATER ----
    let session = null; // { items, grand, stopIdx, slideIdx, elapsed, totalDur, stopDur, slideDur, paused, narrOn, gmapOn, prevMusic, dragX, dragY, activeImg }
    let rafId = 0, lastFrame = 0;

    function fmtTime(sec) {
      const s = Math.max(0, Math.floor(sec));
      return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }

    function speakGuide(text) {
      if (!session || !session.narrOn) return;
      if (!("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.96;
        u.pitch = 1.0;
        u.volume = (H.state.muted ? 0 : Math.max(0.25, (H.state.volVoice || 85) / 100));
        window.speechSynthesis.speak(u);
      } catch {}
    }

    function stopGuideSpeech() {
      try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
    }

    function startTourSession(items, isGrand, startInGmap) {
      const prevMusic = H.state.musicMode;
      // Switch gently to Armenian Music while touring (unless user muted all audio)
      if (!H.state.muted && H.state.musicMode !== "armenia") {
        H.setMusicMode("armenia");
      }

      const stopDur = isGrand ? 19 : 36; // 10 × 19s = 190s (3 min 10 sec!) for Grand Tour; 36s for single-stop deep dive!
      session = {
        items,
        grand: isGrand,
        stopIdx: 0,
        slideIdx: -1,
        elapsed: 0,
        stopDur,
        totalDur: items.length * stopDur,
        paused: !!startInGmap,
        narrOn: !startInGmap,
        gmapOn: !!startInGmap,
        prevMusic,
        dragX: 0, dragY: 0,
        activeImg: 0
      };

      UI._e();
      UI.ki("tourPlayer");
      buildChapterPills();
      syncTourControls();
      loadStopSlide(0, 0, true);
      if (startInGmap) setTourGmap(true);
      else setTourGmap(false);

      lastFrame = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tourLoop);
    }

    function buildChapterPills() {
      const wrap = $("tpChapters");
      if (!wrap || !session) return;
      wrap.textContent = "";
      session.items.forEach((it, idx) => {
        const b = document.createElement("button");
        b.className = "tpChap" + (idx === session.stopIdx ? " on" : "");
        b.textContent = `${it.rank}. ${it.en.split(" & ")[0]}`;
        b.addEventListener("click", () => jumpToStop(idx));
        wrap.appendChild(b);
      });
    }

    function syncTourControls() {
      if (!session) return;
      $("tpPlayPause").textContent = session.paused ? "▶ Play" : "⏸ Pause";
      $("tpNarr").textContent = session.narrOn ? "🗣 Guide Voice: On" : "🗣 Guide Voice: Off";
      $("tpBtnGmap").classList.toggle("on", session.gmapOn);
      $("tpBtnGmap").textContent = session.gmapOn ? "🎬 Back to Tour Film" : "🌍 Real Google Maps";
      $("tourPlayer").classList.toggle("gmap-mode", session.gmapOn);
      document.querySelectorAll("#tpChapters .tpChap").forEach((el, i) => el.classList.toggle("on", i === session.stopIdx));
    }

    function setTourGmap(on) {
      if (!session) return;
      session.gmapOn = !!on;
      const it = session.items[session.stopIdx];
      if (session.gmapOn && it) {
        session.paused = true;
        stopGuideSpeech();
        $("tpGmap").src = gmapEmbedUrl(it.lat, it.lon, 17);
      }
      syncTourControls();
    }

    function markVisited(it) {
      if (!tourSave.visited[it.id]) {
        tourSave.visited[it.id] = 1;
        persistTours();
        H.state.respect = (H.state.respect || 0) + 8;
        H.state.clout = (H.state.clout || 0) + 40;
        UI.Jt && UI.Jt("trip");
      }
    }

    function loadStopSlide(stopIdx, slideIdx, announce) {
      if (!session) return;
      const it = session.items[stopIdx];
      if (!it) return;
      session.stopIdx = stopIdx;
      session.slideIdx = slideIdx;
      session.dragX = 0; session.dragY = 0;
      markVisited(it);

      const slide = it.slides[slideIdx % it.slides.length];
      $("tpKicker").textContent = (session.grand ? `GRAND ARMENIA TOUR · STOP ${stopIdx + 1} OF ${session.items.length}` : `ARMENIA TOP 10 · #${it.rank}`) + ` · ${it.built}`;
      $("tpTitle").textContent = `${it.en} · ${it.hy}`;
      $("tpSub").textContent = `📍 ${it.lat.toFixed(4)}° N, ${it.lon.toFixed(4)}° E · ⛰ ${it.elev} · ${it.dist}`;
      $("tpSubHy").textContent = slide.hy;
      $("tpSubEn").textContent = slide.en;
      $("tpBtnSv").href = gmapStreetViewUrl(it.lat, it.lon);

      const dropBtn = $("tpDrop3D");
      if (dropBtn) {
        if (it.drop3D) {
          dropBtn.style.display = "";
          dropBtn.textContent = "🚶 Walk at " + it.drop3D.label + " in 3D";
        } else if (window.__dest && window.__dest.hasHub(it.id)) {
          dropBtn.style.display = "";
          dropBtn.textContent = "🚶 Step Off Bus · Walk in 3D";
        } else {
          dropBtn.style.display = "none";
        }
      }

      const imgA = $("tpImgA"), imgB = $("tpImgB"), vid = $("tpVid");
      if (slide.type === "vid") {
        imgA.classList.remove("on");
        imgB.classList.remove("on");
        vid.src = slide.src;
        vid.currentTime = 0;
        vid.classList.add("on");
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.classList.remove("on");
        const nextImg = session.activeImg === 0 ? imgB : imgA;
        const prevImg = session.activeImg === 0 ? imgA : imgB;
        session.activeImg = 1 - session.activeImg;
        nextImg.src = slide.src;
        nextImg.classList.add("on");
        prevImg.classList.remove("on");
      }

      if (session.gmapOn) {
        $("tpGmap").src = gmapEmbedUrl(it.lat, it.lon, 17);
      }
      if (announce && !session.gmapOn) {
        speakGuide(slide.en);
      }
      syncTourControls();
    }

    function jumpToStop(idx) {
      if (!session) return;
      const clamped = Math.max(0, Math.min(session.items.length - 1, idx));
      session.elapsed = clamped * session.stopDur;
      loadStopSlide(clamped, 0, true);
    }

    function tourLoop(now) {
      if (!session || G.ui.open !== "tourPlayer") return;
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;

      if (!session.paused && !session.gmapOn) {
        session.elapsed += dt;
        if (session.elapsed >= session.totalDur) {
          session.elapsed = session.totalDur;
          session.paused = true;
          syncTourControls();
          UI.de("🇦🇲 Tour Complete!", "Շնորհակալություն", "All stops stamped in your Armenia Passport! Explore Real Google Maps or exit back to Yerevan.");
        }
      }

      // Compute current stop & slide
      const stopIdx = Math.min(session.items.length - 1, Math.floor(session.elapsed / session.stopDur));
      const inStop = session.elapsed - stopIdx * session.stopDur;
      const it = session.items[stopIdx];
      const slideCount = it.slides.length;
      const slideDur = session.stopDur / slideCount;
      const slideIdx = Math.min(slideCount - 1, Math.floor(inStop / slideDur));

      if (stopIdx !== session.stopIdx || slideIdx !== session.slideIdx) {
        loadStopSlide(stopIdx, slideIdx, true);
      }

      // Smooth 60 FPS Ken Burns cinematic camera motion + manual drag offset
      const slide = it.slides[slideIdx];
      if (slide.type === "img") {
        const u = Math.max(0, Math.min(1, (inStop - slideIdx * slideDur) / slideDur));
        const kb = slide.kb || [1.02, 1.12, -1.5, 0, 1.5, 0];
        const sc = kb[0] + (kb[1] - kb[0]) * u;
        const tx = kb[2] + (kb[4] - kb[2]) * u + session.dragX;
        const ty = kb[3] + (kb[5] - kb[3]) * u + session.dragY;
        const curImg = session.activeImg === 0 ? $("tpImgA") : $("tpImgB");
        curImg.style.transform = `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${sc.toFixed(4)})`;
      }

      // Progress bar & timer
      $("tpTime").textContent = `${fmtTime(session.elapsed)} / ${fmtTime(session.totalDur)}`;
      $("tpBarFill").style.width = `${Math.min(100, (session.elapsed / session.totalDur) * 100).toFixed(2)}%`;

      rafId = requestAnimationFrame(tourLoop);
    }

    function exitTour(dropTo3D) {
      cancelAnimationFrame(rafId);
      stopGuideSpeech();
      const vid = $("tpVid");
      if (vid) { vid.pause(); vid.classList.remove("on"); }
      const it = session && session.items[session.stopIdx];
      const prevMusic = session && session.prevMusic;
      session = null;
      UI._e();
      if (prevMusic && prevMusic !== H.state.musicMode && !H.state.muted) {
        H.setMusicMode(prevMusic);
      }
      if (dropTo3D && it) {
        if (it.drop3D) {
          G.goTo(it.drop3D.x, it.drop3D.z);
          UI.de("Arrived at " + it.drop3D.label, it.hy, "Your tour coach dropped you right here in 3D Yerevan!");
        } else if (window.__dest && window.__dest.hasHub(it.id)) {
          window.__dest.enterHub(it.id);
        }
      }
    }

    // ---- 4. WIRE UP ALL TOUR CONTROLS & DRAG-TO-LOOK ----
    $("thClose").addEventListener("click", () => UI._e());
    $("thGrandGo").addEventListener("click", bookGrandTour);
    $("tpBtnExit").addEventListener("click", () => exitTour(false));
    $("tpBtnGmap").addEventListener("click", () => session && setTourGmap(!session.gmapOn));
    $("tpPlayPause").addEventListener("click", () => {
      if (!session) return;
      if (session.gmapOn) setTourGmap(false);
      session.paused = !session.paused;
      if (session.paused) stopGuideSpeech();
      syncTourControls();
    });
    $("tpPrev").addEventListener("click", () => session && jumpToStop(session.stopIdx - 1));
    $("tpNext").addEventListener("click", () => session && jumpToStop(session.stopIdx + 1));
    $("tpNarr").addEventListener("click", () => {
      if (!session) return;
      session.narrOn = !session.narrOn;
      if (!session.narrOn) stopGuideSpeech();
      else {
        const it = session.items[session.stopIdx];
        speakGuide(it.slides[session.slideIdx].en);
      }
      syncTourControls();
    });
    $("tpDrop3D").addEventListener("click", () => exitTour(true));
    $("tpBtnSnap").addEventListener("click", () => {
      if (!session) return;
      const it = session.items[session.stopIdx];
      G.SND && G.SND.shutter && G.SND.shutter();
      if (!tourSave.souvenirs[it.id]) {
        tourSave.souvenirs[it.id] = 1;
        persistTours();
        H.state.respect = (H.state.respect || 0) + 10;
        H.state.clout = (H.state.clout || 0) + 60;
        UI.de("📸 Tour Postcard Saved!", it.hy, `Shared from ${it.en}! (+10 Respect, +60 Clout)`);
      } else {
        UI.de("📸 Photo Captured!", it.hy, `Great shot of ${it.en}!`);
      }
    });

    // Clickable timeline scrubber
    $("tpBarWrap").addEventListener("click", (ev) => {
      if (!session) return;
      const rect = ev.currentTarget.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      session.elapsed = frac * session.totalDur;
      const stopIdx = Math.min(session.items.length - 1, Math.floor(session.elapsed / session.stopDur));
      loadStopSlide(stopIdx, 0, true);
    });

    // Drag to pan/look around real photos inside tour stage!
    let dragPt = null;
    $("tpStage").addEventListener("pointerdown", (ev) => { dragPt = [ev.clientX, ev.clientY]; });
    window.addEventListener("pointermove", (ev) => {
      if (!dragPt || !session || session.gmapOn) return;
      session.dragX = Math.max(-5, Math.min(5, session.dragX + (ev.clientX - dragPt[0]) * 0.018));
      session.dragY = Math.max(-5, Math.min(5, session.dragY + (ev.clientY - dragPt[1]) * 0.018));
      dragPt = [ev.clientX, ev.clientY];
    });
    window.addEventListener("pointerup", () => { dragPt = null; });

    // HUD, Side, Map & Hotkey (U) Entry Points
    for (const id of ["bTours", "bToursSide", "mTourBtn"]) {
      const el = $(id);
      if (el) el.addEventListener("click", openTourHub);
    }

    window.addEventListener("keydown", (ev) => {
      if (G.ui.open === "tourHub") {
        if (ev.key === "Escape") { UI._e(); ev.preventDefault(); ev.stopImmediatePropagation(); }
        return;
      }
      if (G.ui.open === "tourPlayer") {
        if (ev.key === "Escape") { exitTour(false); ev.preventDefault(); ev.stopImmediatePropagation(); }
        else if (ev.key === " ") { $("tpPlayPause").click(); ev.preventDefault(); ev.stopImmediatePropagation(); }
        else if (ev.key === "ArrowRight") { $("tpNext").click(); ev.preventDefault(); ev.stopImmediatePropagation(); }
        else if (ev.key === "ArrowLeft") { $("tpPrev").click(); ev.preventDefault(); ev.stopImmediatePropagation(); }
        return;
      }
      if (!G.ui.open && ev.key.toLowerCase() === "u" && !ev.repeat) {
        openTourHub();
      }
    }, true);

    // Add Armenia Top 10 Tours to Phone (P)!
    if (G.REAL && typeof G.REAL.phone === "function") {
      const prevPhone = G.REAL.phone;
      G.REAL.phone = function () {
        const list = prevPhone.apply(this, arguments) || [];
        const visitedCount = TOP10.filter(t => tourSave.visited[t.id]).length;
        list.unshift({
          en: `🚌 Armenia Top 10 Tours (${visitedCount}/10) · 3-Min Film & Google Maps`,
          hy: "Հայաստանի Թոփ 10 Տուրեր",
          tr: "Armenia Grand Tours",
          fn: () => { UI._e(); openTourHub(); }
        });
        return list;
      };
    }

    // Add Interactive 3D Tour Agency Spots at Republic Square & Northern Avenue!
    function registerTourBooths() {
      if (!H.cultureSpots || !H.cultureSpots.length) { setTimeout(registerTourBooths, 400); return; }
      H.cultureSpots.push(
        { kind: "tour", x: 104, z: 486, name: "Republic Sq Tour Agency", hy: "Արմենիա Տուր", tr: "Armenia Tour", prompt: "Book Armenia Top 10 Tours · Հայաստանի Տուրեր", act: openTourHub },
        { kind: "tour", x: 274, z: 66, name: "Northern Ave Tour Desk", hy: "Երևան Տուր", tr: "Yerevan Tour", prompt: "Book Armenia Top 10 Tours · Հայաստանի Տուրեր", act: openTourHub }
      );
    }
    registerTourBooths();

    window.__tours = {
      TOP10,
      openTourHub,
      bookGrandTour,
      bookSingleTour,
      startTourSession,
      exitTour,
      setLiveGmap,
      worldToLatLon
    };
  }

  bootTours();
})();

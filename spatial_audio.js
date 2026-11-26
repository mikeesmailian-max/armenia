// Walk Armenia — Pillar 5: Real Recorded Armenian Audio, 3D Spatial HRTF Street Soundscape, Indoor Acoustics & Car Radio
(() => {
  "use strict";

  const REAL_TRACKS = [
    { id: "duduk", title: "Authentic Armenian Duduk · Real Recording", src: "audio/duduk_real.mp3" },
    { id: "kanun", title: "Live Yerevan Qanon · Real Recording", src: "audio/kanun_yerevan.mp3" },
    { id: "tar",   title: "Sari Aghjik (Armenian Folk Tar) · Real Recording", src: "audio/tar_folk.mp3" }
  ];

  const RADIO_STATIONS = [
    { id: "off",   label: "🔇 Car Radio: Off", type: "off" },
    { id: "fm102", label: "📻 FM 102.4 · Radio Yerevan (Real Duduk)", type: "real", trackIdx: 0 },
    { id: "fm104", label: "📻 FM 104.7 · Yerevan Folk (Real Qanon)", type: "real", trackIdx: 1 },
    { id: "fm99",  label: "📻 FM 99.1 · Mountain Classics (Real Tar)", type: "real", trackIdx: 2 },
    { id: "fm98",  label: "📻 FM 98.6 · Saryan Easy Chill", type: "synth", mode: "easy" }
  ];

  function bootSpatialAudio() {
    const G = window.__game;
    const H = window.__hyper;
    if (!G || !G._ext || !H) { setTimeout(bootSpatialAudio, 90); return; }

    const P = G.player;

    let ctx = null;
    let musicGain = null;
    let sfxGain = null;
    let indoorFilter = null;
    let rainGain = null;
    let buskerPanner = null;
    let buskerGain = null;

    let realAudioEl = null;
    let buskerAudioEl = null;
    let realTrackIdx = 0;
    let realStudioOn = false;
    let rainTarget = 0;
    let isIndoor = false;
    let radioIdx = 0;
    let wasInCar = false;

    function getMusicVol() {
      const sl = document.getElementById("volMusic");
      return (H.state && H.state.muted) ? 0 : (sl ? Number(sl.value) / 100 : 0.55);
    }
    function getSfxVol() {
      const sl = document.getElementById("volSfx");
      return (H.state && H.state.muted) ? 0 : (sl ? Number(sl.value) / 100 : 0.25);
    }

    function ensureAudioGraph() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return true;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();

        // Main Real-Music Bus
        musicGain = ctx.createGain();
        musicGain.gain.value = 0.0001;
        musicGain.connect(ctx.destination);

        // Outdoor Spatial Street Bus with Dynamic Indoor Low-Pass Filter!
        indoorFilter = ctx.createBiquadFilter();
        indoorFilter.type = "lowpass";
        indoorFilter.frequency.value = 18000;
        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.25;
        indoorFilter.connect(sfxGain);
        sfxGain.connect(ctx.destination);

        // Soft Pink-Filtered Yerevan Rain Ambience (zero harsh white noise!)
        const bufLen = ctx.sampleRate * 2;
        const rainBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const ch = rainBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufLen; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + w * 0.029;
          b1 = 0.985 * b1 + w * 0.032;
          b2 = 0.950 * b2 + w * 0.048;
          ch[i] = (b0 + b1 + b2) * 0.35;
        }
        const rainSrc = ctx.createBufferSource();
        rainSrc.buffer = rainBuf;
        rainSrc.loop = true;
        const rainLP = ctx.createBiquadFilter();
        rainLP.type = "bandpass";
        rainLP.frequency.value = 1150;
        rainLP.Q.value = 0.55;
        rainGain = ctx.createGain();
        rainGain.gain.value = 0.0001;
        rainSrc.connect(rainLP);
        rainLP.connect(rainGain);
        rainGain.connect(indoorFilter);
        rainSrc.start();

        // Real Recorded Music Player Element (loops cleanly across all 3 real Armenian tracks!)
        realAudioEl = new Audio();
        realAudioEl.crossOrigin = "anonymous";
        realAudioEl.preload = "none";
        realAudioEl.addEventListener("ended", () => {
          if (!realStudioOn) return;
          realTrackIdx = (realTrackIdx + 1) % REAL_TRACKS.length;
          playRealTrack(realTrackIdx);
        });
        const realSrc = ctx.createMediaElementSource(realAudioEl);
        realSrc.connect(musicGain);

        // 3D HRTF Spatial Street Busker Emitter on Northern Avenue (x: 268, z: 54)
        buskerAudioEl = new Audio("audio/duduk_real.mp3");
        buskerAudioEl.crossOrigin = "anonymous";
        buskerAudioEl.loop = true;
        buskerAudioEl.preload = "none";
        const buskerSrc = ctx.createMediaElementSource(buskerAudioEl);
        buskerPanner = ctx.createPanner();
        buskerPanner.panningModel = "HRTF";
        buskerPanner.distanceModel = "inverse";
        buskerPanner.refDistance = 5;
        buskerPanner.maxDistance = 42;
        buskerPanner.rolloffFactor = 1.6;
        buskerPanner.positionX.value = 268;
        buskerPanner.positionY.value = 1.6;
        buskerPanner.positionZ.value = 54;
        buskerGain = ctx.createGain();
        buskerGain.gain.value = 0.0001;
        buskerSrc.connect(buskerPanner);
        buskerPanner.connect(buskerGain);
        buskerGain.connect(indoorFilter);
        return true;
      } catch (err) {
        console.warn("Spatial audio init skipped:", err);
        return false;
      }
    }

    function playRealTrack(idx) {
      if (!ensureAudioGraph()) return;
      realTrackIdx = ((idx % REAL_TRACKS.length) + REAL_TRACKS.length) % REAL_TRACKS.length;
      const tr = REAL_TRACKS[realTrackIdx];
      realStudioOn = true;
      if (!realAudioEl.src.endsWith(tr.src)) realAudioEl.src = tr.src;
      realAudioEl.play().catch(() => {});
      const nowEl = document.getElementById("audioNow");
      if (nowEl) nowEl.textContent = "🎶 " + tr.title;
      const tog = document.getElementById("audioTog");
      if (tog) tog.textContent = "🎵 Real Armenian ▾";
    }

    function stopRealTrack() {
      realStudioOn = false;
      if (realAudioEl) {
        try { realAudioEl.pause(); } catch {}
      }
    }

    // ---- 1. ADD "🎶 REAL ARMENIAN" LIVE RECORDING BUTTON TO #audioModes ----
    const modesWrap = document.getElementById("audioModes");
    let realBtn = document.getElementById("btnRealArmenian");
    if (modesWrap && !realBtn) {
      realBtn = document.createElement("button");
      realBtn.id = "btnRealArmenian";
      realBtn.dataset.mode = "real_armenia";
      realBtn.textContent = "🎶 Real Duduk";
      realBtn.title = "Play real recorded Armenian Duduk, Qanon & Folk Tar";
      modesWrap.insertBefore(realBtn, modesWrap.children[2] || null);

      realBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (H.setMusicMode) H.setMusicMode("off");
        modesWrap.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === realBtn));
        if (realStudioOn) {
          // Clicking again skips to next authentic Armenian instrument!
          playRealTrack(realTrackIdx + 1);
        } else {
          playRealTrack(0);
        }
      });

      // Clicking any of the other synth modes cleanly stops real recorded track so zero overlap!
      modesWrap.querySelectorAll("button").forEach(btn => {
        if (btn === realBtn) return;
        btn.addEventListener("click", () => {
          realBtn.classList.remove("on");
          stopRealTrack();
        });
      });
    }

    // ---- 2. YEREVAN CAR RADIO WIDGET (#carRadio — Auto-appears when driving!) ----
    let radioBar = document.getElementById("carRadio");
    if (!radioBar) {
      radioBar = document.createElement("div");
      radioBar.id = "carRadio";
      radioBar.style.cssText = "display:none;position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:26;background:rgba(16,12,11,.92);border:1px solid rgba(242,179,115,.48);border-radius:999px;padding:7px 14px;gap:10px;align-items:center;color:#f7d7a8;font:600 12.5px system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.5);backdrop-filter:blur(10px)";
      radioBar.innerHTML = `<button id="crPrev" style="background:none;border:0;color:#f2b373;cursor:pointer;font-size:15px" title="Previous station ([)">‹</button><span id="crName">📻 FM 102.4 · Radio Yerevan</span><button id="crNext" style="background:none;border:0;color:#f2b373;cursor:pointer;font-size:15px" title="Next station (])">›</button>`;
      document.body.appendChild(radioBar);
      radioBar.querySelector("#crPrev").addEventListener("click", () => tuneRadio(radioIdx - 1));
      radioBar.querySelector("#crNext").addEventListener("click", () => tuneRadio(radioIdx + 1));
    }

    function tuneRadio(idx) {
      radioIdx = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
      const st = RADIO_STATIONS[radioIdx];
      const nameEl = document.getElementById("crName");
      if (nameEl) nameEl.textContent = st.label;
      if (st.type === "off") {
        stopRealTrack();
        if (H.setMusicMode) H.setMusicMode("off");
      } else if (st.type === "real") {
        if (H.setMusicMode) H.setMusicMode("off");
        playRealTrack(st.trackIdx);
      } else if (st.type === "synth") {
        stopRealTrack();
        if (H.setMusicMode) H.setMusicMode(st.mode);
      }
    }

    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (!P.car) return;
      if (e.key === "[") tuneRadio(radioIdx - 1);
      else if (e.key === "]") tuneRadio(radioIdx + 1);
    });

    // ---- 3. PER-FRAME 3D HRTF LISTENER, BUSKER PROXIMITY & CAR RADIO SYNC ----
    const fwdVec = new G._ext.THREE.Vec3();
    window.__spatialAudioTick = function () {
      // Auto-show Car Radio when driving!
      const inCar = !!P.car;
      if (inCar !== wasInCar) {
        wasInCar = inCar;
        radioBar.style.display = inCar ? "flex" : "none";
        if (inCar && radioIdx === 0) tuneRadio(1); // auto-tune Radio Yerevan on entry!
      }

      if (!ctx || ctx.state !== "running") return;
      const now = ctx.currentTime;

      // Update 3D HRTF listener position & orientation to match 35mm camera
      const cam = G.camera;
      if (cam && ctx.listener && ctx.listener.positionX) {
        ctx.listener.positionX.setTargetAtTime(cam.position.x, now, 0.05);
        ctx.listener.positionY.setTargetAtTime(cam.position.y, now, 0.05);
        ctx.listener.positionZ.setTargetAtTime(cam.position.z, now, 0.05);
        cam.getWorldDirection(fwdVec);
        ctx.listener.forwardX.setTargetAtTime(fwdVec.x, now, 0.05);
        ctx.listener.forwardY.setTargetAtTime(fwdVec.y, now, 0.05);
        ctx.listener.forwardZ.setTargetAtTime(fwdVec.z, now, 0.05);
      }

      // Sync real studio track volume with #volMusic slider
      const mVol = getMusicVol();
      musicGain.gain.setTargetAtTime(realStudioOn ? Math.max(0.0001, mVol * 0.72) : 0.0001, now, 0.15);

      // Sync outdoor SFX / Rain / Indoor Low-Pass filter
      const sVol = getSfxVol();
      sfxGain.gain.setTargetAtTime(Math.max(0.0001, sVol), now, 0.15);
      indoorFilter.frequency.setTargetAtTime(isIndoor ? 460 : 18000, now, 0.25);
      rainGain.gain.setTargetAtTime(rainTarget > 0.05 ? rainTarget * 0.28 : 0.0001, now, 0.35);

      // Spatial 3D Northern Ave Duduk Busker (only gently plays when nearby AND main music is quiet/off!)
      if (buskerAudioEl && buskerGain) {
        const dist = Math.hypot(P.x - 268, P.z - 54);
        const shouldPlayBusker = !realStudioOn && !isIndoor && dist < 34 && sVol > 0.02;
        if (shouldPlayBusker) {
          if (buskerAudioEl.paused) buskerAudioEl.play().catch(() => {});
          const duck = (H.state && H.state.musicMode !== "off") ? 0.18 : 0.65;
          buskerGain.gain.setTargetAtTime(duck, now, 0.25);
        } else {
          buskerGain.gain.setTargetAtTime(0.0001, now, 0.25);
          if (!buskerAudioEl.paused && dist > 45) { try { buskerAudioEl.pause(); } catch {} }
        }
      }
    };

    window.__spatialAudio = {
      playRealTrack,
      stopRealTrack,
      setRain: (v) => {
        rainTarget = Math.max(0, Math.min(1, v || 0));
        if (rainTarget > 0.05) ensureAudioGraph();
      },
      setIndoor: (on) => {
        isIndoor = !!on;
        ensureAudioGraph();
      },
      tuneRadio,
      REAL_TRACKS,
      RADIO_STATIONS
    };
  }

  bootSpatialAudio();
})();

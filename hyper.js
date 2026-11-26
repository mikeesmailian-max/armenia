// Walk Armenia — Hyper-Realism, Cinematic 3rd-Person Camera, Armenian Culture, Google-Style Maps & Live Street Drama
(() => {
  "use strict";

  const STORAGE_KEY = "walk-armenia-hyper-v1";
  let state = {
    respect: 10, clout: 120, dramas: 0, thieves: 0, nardiWins: 0, pulpulaks: 0,
    camMode: 0, mapLayer: "hybrid", roses: 0,
    musicMode: "easy", volMusic: 55, volVoice: 85, volSfx: 25, muted: false
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") Object.assign(state, saved);
  } catch {}
  const saveState = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };

  const RANKS = [
    [0, "Հյուր", "Visitor"],
    [25, "Երևանցի", "Local"],
    [65, "Ախպեր", "Street Bro"],
    [130, "Կենտրոնի Ավագ", "Kentron VIP"],
    [220, "Երևանի Լեգենդ", "Yerevan Legend"]
  ];
  function getRank() {
    let r = RANKS[0];
    for (const row of RANKS) if (state.respect >= row[0]) r = row;
    return r;
  }

  // ---- Studio-Warm Music Player & Volume Mixer (Zero Harsh Static/Buzz!) ----
  window.__hyperAudioOwned = true;
  const HyperAudio = (() => {
    let ctx = null, musicBus = null, sfxBus = null, reverbSend = null, stepTimer = 0, stepIdx = 0;

    const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

    // Easy Chill: Silky warm Rhodes progressions (Cmaj9 -> Am9 -> Fmaj9 -> G6/9)
    const EASY_CHORDS = [
      { bass: 48, notes: [60, 64, 67, 71, 74], mel: [76, -1, 74, -1, 71, -1, 72, -1] },
      { bass: 45, notes: [57, 60, 64, 67, 71], mel: [72, -1, 71, -1, 69, -1, 67, -1] },
      { bass: 41, notes: [53, 57, 60, 64, 67], mel: [69, -1, 72, -1, 71, -1, 67, -1] },
      { bass: 43, notes: [55, 59, 62, 64, 69], mel: [67, -1, 71, -1, 74, -1, 72, -1] }
    ];

    // Authentic Warm Armenian Folk Music (3 soulful motifs in D Hijaz / D Minor Folk)
    const ARMENIA_THEMES = [
      {
        name: "Երևանյան Երեկո · Yerevan Evening",
        chords: [
          { bass: 50, arp: [57, 62, 65, 69], mel: [74, -1, 75, 74, 72, -1, 69, -1] },
          { bass: 51, arp: [58, 63, 67, 70], mel: [70, -1, 72, 74, 75, -1, 74, -1] },
          { bass: 43, arp: [55, 58, 62, 67], mel: [74, -1, 72, 70, 69, -1, 67, -1] },
          { bass: 45, arp: [57, 61, 64, 69], mel: [69, -1, 70, 69, 67, 65, 62, -1] }
        ]
      },
      {
        name: "Սարի Աղջիկ · Sari Aghjik Mood",
        chords: [
          { bass: 50, arp: [57, 62, 65, 69], mel: [69, 70, 74, -1, 72, 70, 69, -1] },
          { bass: 48, arp: [55, 60, 64, 67], mel: [67, 69, 70, -1, 69, 67, 65, -1] },
          { bass: 46, arp: [53, 58, 62, 65], mel: [65, 67, 69, -1, 67, 65, 64, -1] },
          { bass: 45, arp: [57, 61, 64, 69], mel: [64, 65, 67, 65, 62, -1, 62, -1] }
        ]
      },
      {
        name: "Էրեբունի · Erebuni Dawn",
        chords: [
          { bass: 50, arp: [57, 62, 66, 69], mel: [69, -1, 74, -1, 76, 74, 73, -1] },
          { bass: 43, arp: [55, 58, 62, 67], mel: [74, -1, 70, -1, 69, 67, 69, -1] },
          { bass: 46, arp: [53, 58, 62, 65], mel: [70, -1, 69, 67, 65, -1, 67, -1] },
          { bass: 45, arp: [57, 61, 64, 69], mel: [69, 70, 69, 67, 62, -1, -1, -1] }
        ]
      }
    ];

    // Saryan Street Wine-Bar Lounge (Smooth Jazz-Bossa Rhodes)
    const LOUNGE_CHORDS = [
      { bass: 50, notes: [60, 64, 65, 69], mel: [72, -1, 74, -1, 76, -1, 72, -1] },
      { bass: 43, notes: [59, 64, 65, 69], mel: [71, -1, 69, -1, 67, -1, 71, -1] },
      { bass: 48, notes: [59, 62, 64, 67], mel: [72, -1, 74, 71, 67, -1, 64, -1] },
      { bass: 45, notes: [58, 61, 64, 67], mel: [69, -1, 67, -1, 64, -1, 61, -1] }
    ];

    function makeWarmReverb(c) {
      const dur = 1.8, len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let prev = 0;
        for (let i = 0; i < len; i++) {
          const decay = Math.pow(1 - i / len, 2.8);
          // Warm low-passed diffuse stereo tail (zero metallic hiss)
          prev = prev * 0.78 + (Math.random() * 2 - 1) * 0.22;
          d[i] = prev * decay * 0.55;
        }
      }
      const conv = c.createConvolver();
      conv.buffer = buf;
      return conv;
    }

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();
      const masterLP = ctx.createBiquadFilter();
      masterLP.type = "lowpass";
      masterLP.frequency.value = 4200;

      const rev = makeWarmReverb(ctx);
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.28;

      musicBus.connect(masterLP);
      musicBus.connect(reverbSend);
      reverbSend.connect(rev);
      rev.connect(masterLP);
      sfxBus.connect(masterLP);
      masterLP.connect(ctx.destination);
      applyVolumes();
      return ctx;
    }

    function resume() {
      const c = ensure();
      if (c && c.state === "suspended") c.resume().catch(() => {});
      applyVolumes();
    }

    function applyVolumes() {
      const muted = !!state.muted;
      const mVol = muted ? 0 : (state.volMusic / 100) * 0.48;
      const sVol = muted ? 0 : (state.volSfx / 100) * 0.45;
      const vVol = muted ? 0 : (state.volVoice / 100);

      if (ctx && musicBus) {
        const t = ctx.currentTime;
        musicBus.gain.setTargetAtTime(mVol, t, 0.06);
        sfxBus.gain.setTargetAtTime(sVol, t, 0.06);
      }

      // Sync cleanly with game.js internal audio buses!
      const g = window.__game;
      const au = g && g._ext && g._ext.audio;
      if (au && au.ctx) {
        const t = au.ctx.currentTime;
        if (au.sfx) au.sfx.gain.setTargetAtTime(muted ? 0 : (state.volSfx / 100) * 0.75, t, 0.06);
        if (au.amb) au.amb.gain.setTargetAtTime(muted ? 0 : (state.volSfx / 100) * 0.35, t, 0.06);
        if (au.vox) au.vox.gain.setTargetAtTime(muted ? 0 : vVol * 1.45, t, 0.06);
        if (au.oldMus) au.oldMus.gain.setTargetAtTime(0, t, 0.06);
      }
      if (g && g.SND && g.SND.on === muted) {
        g.SND.setOn(!muted);
      }
    }

    // Silky Warm Rhodes Electric Piano (pure sine + delicate bell harmonic)
    function playRhodes(freq, dur, vol, delay) {
      if (!ctx || ctx.state !== "running" || state.muted) return;
      const t = ctx.currentTime + (delay || 0);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
      const g1 = ctx.createGain(), g2 = ctx.createGain();
      o1.type = "sine"; o1.frequency.setValueAtTime(freq, t);
      o2.type = "sine"; o2.frequency.setValueAtTime(freq * 2, t);

      g1.gain.setValueAtTime(0.0001, t);
      g1.gain.linearRampToValueAtTime(vol, t + 0.025);
      g1.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 0.25), t + dur * 0.65);
      g1.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(vol * 0.16, t + 0.015);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.45, dur * 0.35));

      o1.connect(g1); g1.connect(musicBus);
      o2.connect(g2); g2.connect(musicBus);
      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }

    // Warm Plucked Nylon Guitar / Armenian Oud String
    function playPluck(freq, dur, vol, delay) {
      if (!ctx || ctx.state !== "running" || state.muted) return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, t);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(1650, t);
      lp.frequency.exponentialRampToValueAtTime(420, t + Math.min(0.9, dur));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(musicBus);
      o.start(t); o.stop(t + dur + 0.05);
    }

    // Silky Warm Armenian Flute / Mellow Apricot-Wood Duduk (ZERO harsh buzz!)
    function playDudukNote(freq, dur, vol, delay) {
      if (!ctx || ctx.state !== "running" || state.muted) return;
      const t = ctx.currentTime + (delay || 0);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator();
      const vg = ctx.createGain(), g2 = ctx.createGain(), lp = ctx.createBiquadFilter(), env = ctx.createGain();
      o1.type = "sine";
      o2.type = "triangle";
      o1.frequency.setValueAtTime(freq * 0.992, t);
      o1.frequency.exponentialRampToValueAtTime(freq, t + 0.16);
      o2.frequency.setValueAtTime(freq, t);

      vib.type = "sine"; vib.frequency.value = 4.6;
      vg.gain.value = freq * 0.0075;
      vib.connect(vg); vg.connect(o1.frequency);

      g2.gain.value = 0.22;
      lp.type = "lowpass"; lp.frequency.value = 920;

      const peak = (vol || 0.5) * 0.16;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.2);
      env.gain.setValueAtTime(peak * 0.85, t + Math.max(0.25, dur - 0.22));
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);

      o1.connect(lp); o2.connect(g2); g2.connect(lp);
      lp.connect(env); env.connect(musicBus);
      o1.start(t); o2.start(t); vib.start(t);
      o1.stop(t + dur + 0.2); o2.stop(t + dur + 0.2); vib.stop(t + dur + 0.2);
    }

    function getTrackTitle() {
      if (state.muted) return "Audio Muted";
      if (state.musicMode === "off") return "Music Off · Quiet Yerevan Streets";
      if (state.musicMode === "easy") return "Soft Yerevan Rhodes · Easy Listening";
      if (state.musicMode === "lounge") return "Saryan Wine Bar · Smooth Lounge";
      const th = ARMENIA_THEMES[Math.floor(stepIdx / 32) % ARMENIA_THEMES.length];
      return th.name;
    }

    function updateAudioUI() {
      const tog = document.getElementById("audioTog");
      const nowEl = document.getElementById("audioNow");
      const muteBtn = document.getElementById("audioMute");
      const labels = { easy: "🎵 Easy Chill", armenia: "🇦🇲 Armenian", lounge: "🍷 Lounge", off: "🎵 Music Off" };
      const open = document.getElementById("audioDock") && document.getElementById("audioDock").classList.contains("open");
      if (tog) tog.textContent = (state.muted ? "🔇 Muted" : (labels[state.musicMode] || "🎵 Music")) + (open ? " ▴" : " ▾");
      if (nowEl) nowEl.textContent = getTrackTitle();
      if (muteBtn) muteBtn.textContent = state.muted ? "🔇" : "🔊";
      document.querySelectorAll("#audioModes button").forEach(b => b.classList.toggle("on", b.dataset.mode === state.musicMode));
      const vm = document.getElementById("volMusic"), vv = document.getElementById("volVoice"), vs = document.getElementById("volSfx");
      if (vm) { vm.value = state.volMusic; document.getElementById("volMusicV").textContent = state.volMusic + "%"; }
      if (vv) { vv.value = state.volVoice; document.getElementById("volVoiceV").textContent = state.volVoice + "%"; }
      if (vs) { vs.value = state.volSfx; document.getElementById("volSfxV").textContent = state.volSfx + "%"; }
    }

    function setMode(mode) {
      state.musicMode = mode;
      if (mode !== "off") state.muted = false;
      stepIdx = 0; stepTimer = 0.05;
      saveState();
      resume();
      applyVolumes();
      updateAudioUI();
    }

    function tick(dt) {
      if (state.muted || state.musicMode === "off" || state.volMusic <= 0) return;
      if (!ctx || ctx.state !== "running") return;
      stepTimer -= dt;
      if (stepTimer > 0) return;

      const beat = stepIdx % 8;
      if (state.musicMode === "easy") {
        const bar = Math.floor(stepIdx / 8) % EASY_CHORDS.length;
        const ch = EASY_CHORDS[bar];
        if (beat === 0) {
          playRhodes(midiToHz(ch.bass), 3.6, 0.17, 0);
          ch.notes.forEach((n, i) => playRhodes(midiToHz(n), 3.2, 0.065, i * 0.035));
        } else if (beat === 4) {
          playRhodes(midiToHz(ch.bass + 12), 1.8, 0.075, 0);
        }
        const m = ch.mel[beat];
        if (m > 0 && Math.random() < 0.78) playRhodes(midiToHz(m), 1.4, 0.075, 0.02);
        stepTimer = 0.44;
      } else if (state.musicMode === "armenia") {
        const thIdx = Math.floor(stepIdx / 32) % ARMENIA_THEMES.length;
        const th = ARMENIA_THEMES[thIdx];
        const bar = Math.floor(stepIdx / 8) % th.chords.length;
        const ch = th.chords[bar];
        if (beat === 0) {
          playPluck(midiToHz(ch.bass), 2.6, 0.18, 0);
          if (stepIdx % 32 === 0) updateAudioUI();
        }
        // Gentle acoustic Armenian oud/guitar arpeggio
        const arpNote = ch.arp[beat % ch.arp.length];
        playPluck(midiToHz(arpNote), 1.15, beat % 2 === 0 ? 0.095 : 0.06, 0);
        // Soulful warm Armenian flute/duduk melody
        const mel = ch.mel[beat];
        if (mel > 0) playDudukNote(midiToHz(mel), 0.95, 0.72, 0.04);
        stepTimer = 0.42;
      } else if (state.musicMode === "lounge") {
        const bar = Math.floor(stepIdx / 8) % LOUNGE_CHORDS.length;
        const ch = LOUNGE_CHORDS[bar];
        if (beat === 0 || beat === 3) {
          ch.notes.forEach((n, i) => playRhodes(midiToHz(n), 1.9, 0.06, i * 0.02));
        }
        if (beat === 0 || beat === 5) playPluck(midiToHz(ch.bass), 1.6, 0.16, 0);
        const m = ch.mel[beat];
        if (m > 0) playRhodes(midiToHz(m), 1.1, 0.07, 0.01);
        stepTimer = 0.38;
      }
      stepIdx++;
    }

    // Clean, Gentle Acoustic SFX (ZERO harsh noise / buzz!)
    function playChime(freqs, dur, vol) {
      if (state.muted || state.volSfx <= 0) return;
      const c = ensure();
      if (!c || c.state !== "running") return;
      const t = c.currentTime;
      freqs.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(f, t + i * 0.07);
        g.gain.setValueAtTime(0.0001, t + i * 0.07);
        g.gain.linearRampToValueAtTime(vol, t + i * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + dur);
        o.connect(g); g.connect(sfxBus);
        o.start(t + i * 0.07); o.stop(t + i * 0.07 + dur + 0.04);
      });
    }

    function playWaterSplash() { playChime([523.25, 659.25, 783.99], 0.45, 0.12); }
    function playDramaSting(intense) { playChime(intense ? [293.66, 349.23, 440] : [329.63, 392, 493.88], 0.5, 0.11); }
    function playCrowdGasp(cheer) { playChime(cheer ? [440, 554.37, 659.25] : [392, 349.23], 0.4, 0.10); }
    function playDiceRoll() { playChime([620, 740, 580, 820], 0.09, 0.08); }
    function updateDuduk() {} // Replaced by clean continuous Armenian Music option so no random clashing synths!

    function bindDockUI() {
      const dock = document.getElementById("audioDock");
      const tog = document.getElementById("audioTog");
      const muteBtn = document.getElementById("audioMute");
      if (tog && dock) {
        tog.addEventListener("click", () => {
          const open = dock.classList.toggle("open");
          tog.setAttribute("aria-expanded", open);
          updateAudioUI();
        });
      }
      if (muteBtn) {
        muteBtn.addEventListener("click", () => {
          state.muted = !state.muted;
          saveState(); resume(); applyVolumes(); updateAudioUI();
        });
      }
      document.querySelectorAll("#audioModes button").forEach(btn => {
        btn.addEventListener("click", () => setMode(btn.dataset.mode));
      });
      const bindSlider = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
          state[key] = Number(el.value);
          if (state[key] > 0 && state.muted) state.muted = false;
          saveState(); resume(); applyVolumes(); updateAudioUI();
        });
      };
      bindSlider("volMusic", "volMusic");
      bindSlider("volVoice", "volVoice");
      bindSlider("volSfx", "volSfx");

      // Sync existing Menu Sound button with our mute state
      const bSound = document.getElementById("bSound");
      if (bSound) {
        bSound.addEventListener("click", () => {
          setTimeout(() => {
            const g = window.__game;
            state.muted = !(g && g.SND && g.SND.on);
            saveState(); applyVolumes(); updateAudioUI();
          }, 20);
        });
      }
      updateAudioUI();
    }

    return {
      resume, tick, updateDuduk, setMode, applyVolumes, bindDockUI, updateAudioUI,
      playWaterSplash, playDramaSting, playCrowdGasp, playDiceRoll, playDudukNote
    };
  })();

  window.addEventListener("pointerdown", () => HyperAudio.resume(), { passive: true });
  window.addEventListener("keydown", () => HyperAudio.resume(), { passive: true });

  // ---- Main Initialization once __game._ext exists ----
  function boot() {
    const G = window.__game;
    if (!G || !G._ext) { setTimeout(boot, 60); return; }
    HyperAudio.bindDockUI();
    setTimeout(() => HyperAudio.applyVolumes(), 300);
    const E = G._ext;
    const T = E.THREE;
    const { scene, renderer, sun, hemi, sky, sunDir, ararat, araratDir, nightObj } = E;
    const C = E.cam;
    const W = E.world;
    const M = E.map;
    const UI = E.ui;
    const P = G.player;

    // =========================================================================
    // 1. PHOTOREAL LIGHTING, CRISP DIAGONAL SUNLIGHT, PBR MATERIALS & GROUNDING
    // =========================================================================
    try {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMappingExposure = 1.18;
      sun.shadow.bias = -0.00025;
      sun.shadow.normalBias = 0.024;
      Object.assign(sun.shadow.camera, { left: -44, right: 44, top: 44, bottom: -44, near: 1, far: 340 });
      sun.shadow.camera.updateProjectionMatrix();
    } catch {}

    // Hide artificial glowing video-game checkpoint rings on the pavement!
    if (W.Vm && W.Vm.length) {
      for (const ring of W.Vm) {
        if (ring && ring.material) { ring.material.opacity = 0; ring.material.transparent = true; }
      }
    }

    // Boost Poly Haven CC0 scanned street furniture density near the player
    if (G.REAL && G.REAL.sp && G.REAL.sp.sets) {
      const caps = { bench: 22, trash: 16, planter: 30, terrace: 26, cart: 6 };
      for (const k in caps) {
        if (G.REAL.sp.sets[k]) G.REAL.sp.sets[k].cap = caps[k];
      }
    }

    // Enhance existing building & road PBR material micro-detail and specular depth
    function enhanceWorldPBR() {
      const mats = [nightObj.up, nightObj.gf, ...(G.REAL && G.REAL.ups ? G.REAL.ups : [])];
      for (const m of mats) {
        if (!m) continue;
        if (m.normalScale) m.normalScale.set(1.85, 1.85);
        m.envMapIntensity = 1.35;
      }
      if (G.REAL && G.REAL.roads) {
        for (const r of G.REAL.roads) {
          if (!r) continue;
          const baseRo = r.userData && r.userData.ro ? r.userData.ro : 0.8;
          r.userData.ro = Math.max(0.56, baseRo * 0.82);
          if (G.SKY.w === "clear") {
            r.roughness = r.userData.ro;
            r.envMapIntensity = 1.28;
          }
          if (r.normalScale) r.normalScale.set(1.45, 1.45);
        }
      }
    }
    setTimeout(enhanceWorldPBR, 450);

    // Subtle warm pink-tuff bounce light around the player for realistic Yerevan tufa radiance
    const tuffBounce = new T.PointLight(0xffbe94, 0.52, 16, 1.6);
    scene.add(tuffBounce);

    // Procedural Sun Disk + Volumetric Golden Halo + Anamorphic Glare in the Sky
    const sunSprite = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const g = cv.getContext("2d");
      const grad = g.createRadialGradient(128, 128, 3, 128, 128, 126);
      grad.addColorStop(0, "rgba(255,254,242,1)");
      grad.addColorStop(0.10, "rgba(255,238,195,0.95)");
      grad.addColorStop(0.30, "rgba(255,198,128,0.38)");
      grad.addColorStop(0.62, "rgba(255,168,95,0.10)");
      grad.addColorStop(1, "rgba(255,140,80,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      // Subtle horizontal anamorphic sun streak
      const streak = g.createLinearGradient(0, 128, 256, 128);
      streak.addColorStop(0, "rgba(255,220,160,0)");
      streak.addColorStop(0.5, "rgba(255,238,200,0.22)");
      streak.addColorStop(1, "rgba(255,220,160,0)");
      g.fillStyle = streak;
      g.fillRect(0, 118, 256, 20);
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      const mat = new T.BasicMat({ map: tex, transparent: true, depthWrite: false, fog: false, side: T.DoubleSide });
      const mesh = new T.Mesh(new T.Plane(1700, 1700), mat);
      mesh.renderOrder = -35;
      scene.add(mesh);
      return mesh;
    })();

    // Shared Soft Ambient Occlusion Contact Shadow Texture
    const contactShadowTex = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const g = cv.getContext("2d");
      const gr = g.createRadialGradient(64, 64, 6, 64, 64, 60);
      gr.addColorStop(0, "rgba(8,10,16,0.58)");
      gr.addColorStop(0.5, "rgba(8,10,16,0.26)");
      gr.addColorStop(1, "rgba(8,10,16,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      return new T.CanvasTex(cv);
    })();

    // Grounded Contact Shadow directly under the 3rd-person player
    const playerShadow = (() => {
      const m = new T.Mesh(
        new T.Plane(1.15, 1.15).rotateX(-Math.PI / 2),
        new T.BasicMat({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.9 })
      );
      m.position.y = 0.035;
      m.renderOrder = 2;
      scene.add(m);
      return m;
    })();

    // Instanced Contact Shadows under ALL nearby pedestrians & cops (zero floating NPCs!)
    const crowdShadows = (() => {
      const CAP = 44;
      const geo = new T.Plane(1.05, 1.05).rotateX(-Math.PI / 2);
      const mat = new T.BasicMat({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.84 });
      const im = new T.Instanced(geo, mat, CAP);
      im.frustumCulled = false;
      im.renderOrder = 2;
      im.count = 0;
      scene.add(im);
      return { im, CAP, mat4: new T.Mat4(), pos: new T.Vec3(), quat: new T.Quat(), scl: new T.Vec3(1, 1, 1) };
    })();

    // Floating Sunlit Golden Dust / Pollen Motes around camera
    const dustSystem = (() => {
      const N = 140;
      const pos = new Float32Array(N * 3);
      const phases = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 28;
        pos[i * 3 + 1] = 0.6 + Math.random() * 5.2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 28;
        phases[i] = Math.random() * 6.283;
      }
      const geo = new T.BufGeo();
      geo.setAttribute("position", new T.F32Attr(pos, 3));
      const mat = new T.PointsMat({ color: 0xffe4b5, size: 0.06, transparent: true, opacity: 0.34, depthWrite: false });
      const pts = new T.Points(geo, mat);
      pts.frustumCulled = false;
      scene.add(pts);
      return { pts, pos, phases, N, mat };
    })();

    // Diagonal Golden Sun slashes right across Northern Avenue for real architectural light & deep shadow!
    const SKY_PRESETS = {
      golden: {
        label: "Sky: Golden Sun (N)",
        dir: [-0.30, 0.72, -0.62],
        sunI: 4.15, sunCol: 0xffe0b2,
        hemiI: 0.44, hemiSky: 0xa4cbff, hemiGnd: 0x9b6e56,
        envI: 0.62, exp: 1.18, fogCol: 0xd4c6b8,
        bounce: 0.56, bounceCol: 0xffbc90, dustOp: 0.34,
        grade: "contrast(1.06) saturate(1.08)"
      },
      day: {
        label: "Sky: Bright Noon (N)",
        dir: [-0.24, 0.84, -0.48],
        sunI: 3.85, sunCol: 0xfff5e4,
        hemiI: 0.50, hemiSky: 0xb8d8ff, hemiGnd: 0x8f7e6e,
        envI: 0.68, exp: 1.12, fogCol: 0xc2d0de,
        bounce: 0.34, bounceCol: 0xffe8d6, dustOp: 0.20,
        grade: "contrast(1.04) saturate(1.04)"
      },
      dusk: {
        label: "Sky: Pink Sunset (N)",
        dir: [-0.52, 0.36, -0.77],
        sunI: 3.45, sunCol: 0xff985a,
        hemiI: 0.36, hemiSky: 0x7c8fd1, hemiGnd: 0x7d4537,
        envI: 0.52, exp: 1.22, fogCol: 0xc8927e,
        bounce: 0.78, bounceCol: 0xff8a66, dustOp: 0.45,
        grade: "contrast(1.08) saturate(1.14)"
      },
      night: {
        label: "Sky: Yerevan Night (N)",
        dir: [-0.4, 0.55, 0.4],
        sunI: 0.36, sunCol: 0x8ea8ff,
        hemiI: 0.28, hemiSky: 0x3b4d7a, hemiGnd: 0x1a171c,
        envI: 0.48, exp: 1.24, fogCol: 0x0b101c,
        bounce: 0.24, bounceCol: 0x7aa4ff, dustOp: 0.0,
        grade: "contrast(1.10) saturate(1.10)"
      }
    };

    function applySkyPolish(mode) {
      const pr = SKY_PRESETS[mode] || SKY_PRESETS.golden;
      const isRain = G.SKY && G.SKY.w !== "clear";
      sunDir.set(pr.dir[0], pr.dir[1], pr.dir[2]).normalize();
      sun.intensity = pr.sunI * (isRain ? 0.42 : 1);
      sun.color.setHex(pr.sunCol);
      hemi.intensity = pr.hemiI * (isRain ? 0.9 : 1);
      hemi.color.setHex(pr.hemiSky);
      hemi.groundColor.setHex(pr.hemiGnd);
      scene.environmentIntensity = pr.envI * (isRain ? 0.85 : 1);
      renderer.toneMappingExposure = pr.exp;
      if (scene.fog && !isRain) {
        scene.fog.color.setHex(pr.fogCol);
        renderer.setClearColor(pr.fogCol);
      }
      tuffBounce.intensity = pr.bounce;
      tuffBounce.color.setHex(pr.bounceCol);
      dustSystem.mat.opacity = isRain ? 0 : pr.dustOp;
      sunSprite.visible = mode !== "night" && !isRain;
      const btn = UI.fe("bNight");
      if (btn) btn.textContent = pr.label;
      // Photographic subtle color grade on WebGL canvas (when not in Photo Mode or drunk)
      const cv = UI.fe("c");
      if (cv && !(G.PHOTO && G.PHOTO.on) && (P.drunk || 0) <= 0.12) {
        cv.style.filter = pr.grade;
      }
      // Keep game floor rings hidden
      if (W.Vm) for (const r of W.Vm) if (r && r.material) r.material.opacity = 0;
    }
    window.__hyperOnSky = applySkyPolish;
    setTimeout(() => { UI.Yn(); applySkyPolish(G.SKY.mode || "golden"); enhanceWorldPBR(); }, 280);

    // =========================================================================
    // 2. PHOTOREAL ARMENIAN CULTURE PROPS, PBR STANDS, UMBRELLAS, PUDDLES & BIRDS
    // =========================================================================
    const cultureSpots = [];
    const wavingFlags = [];
    const waterStreams = [];
    const steamPuffs = [];
    const musicSpots = [];
    const swallows = [];
    let propsBuilt = false;

    const ARMENIAN_PROVERBS = [
      ["«Ջուրը կյանք է»", "Jure kyanq e", "Water is life — cold straight from Mount Aragats."],
      ["«Հաց ու պանիր, կեր ու բանի»", "Hats u panir, ker u banir", "Bread and cheese — simple Armenian strength."],
      ["«Ամեն քարի տակ մի պատմություն կա»", "Amen qari tak mi patmutyun ka", "Under every stone in Yerevan lies a story."],
      ["«Լավ ընկերը դժվար օրվան է»", "Lav ynkere dzhvar orvan e", "A true friend shows up on the hard day."],
      ["«Ցավդ տանեմ, ախպեր ջան»", "Tsavd tanem, akhper jan", "Take care of yourself, brother — Yerevan loves you."],
      ["«Որտեղ հաց, այնտեղ կաց»", "Vortegh hats, ayntegh kats", "Where there is warm lavash, there is home."]
    ];

    // Real CC0 PBR Materials shared across all street props (zero flat plastic!)
    const PBR = {};
    function getPBR() {
      if (PBR._ready) return PBR;
      PBR._ready = true;
      const woodC = W.tex("wood_c.jpg", { rep: 1.5 });
      const woodN = W.tex("wood_n.jpg", { lin: 1, rep: 1.5 });
      const paveC = W.tex("pave_c.jpg", { rep: 1.2 });
      const paveN = W.tex("pave_n.jpg", { lin: 1, rep: 1.2 });
      const wallC = W.tex("wall_c.jpg", { rep: 1.2 });
      const wallN = W.tex("wall_n.jpg", { lin: 1, rep: 1.2 });

      PBR.woodDark = new T.StdMat({ map: woodC, normalMap: woodN, normalScale: new T.Vec2(1.4, 1.4), color: 0xb88b68, roughness: 0.76, metalness: 0.04 });
      PBR.woodCrate = new T.StdMat({ map: woodC, normalMap: woodN, normalScale: new T.Vec2(1.2, 1.2), color: 0xc8a47c, roughness: 0.85, metalness: 0.02 });
      PBR.basalt = new T.StdMat({ map: paveC, normalMap: paveN, normalScale: new T.Vec2(1.7, 1.7), color: 0x5c5856, roughness: 0.82, metalness: 0.06 });
      PBR.pinkTuff = new T.StdMat({ map: wallC, normalMap: wallN, normalScale: new T.Vec2(1.6, 1.6), color: 0xd1957d, roughness: 0.86, metalness: 0.02 });
      PBR.clay = new T.StdMat({ map: wallC, normalMap: wallN, normalScale: new T.Vec2(1.8, 1.8), color: 0xb96a47, roughness: 0.92, metalness: 0.02 });
      PBR.wroughtIron = new T.StdMat({ color: 0x22252a, roughness: 0.36, metalness: 0.82 });
      PBR.zinc = new T.StdMat({ color: 0x9aa2ab, roughness: 0.34, metalness: 0.78 });
      PBR.bronze = new T.StdMat({ color: 0xc29548, roughness: 0.28, metalness: 0.88 });
      PBR.wetStone = new T.StdMat({ map: contactShadowTex, color: 0x1b2026, roughness: 0.08, metalness: 0.14, transparent: true, opacity: 0.42, depthWrite: false, envMapIntensity: 2.2 });
      return PBR;
    }

    // Procedural Woven Striped Café Canvas Texture
    function makeAwningTex(colA, colB) {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d");
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 === 0 ? colA : colB;
        g.fillRect(i * 32, 0, 32, 256);
      }
      // Subtle linen weave & sun-weathering gradient
      g.fillStyle = "rgba(0,0,0,0.06)";
      for (let y = 0; y < 256; y += 3) g.fillRect(0, y, 256, 1);
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "rgba(255,250,240,0.08)");
      gr.addColorStop(1, "rgba(0,0,0,0.22)");
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    // Photoreal Multi-Petal Rose & Eucalyptus Bouquet Alpha Texture (ZERO cartoon spheres!)
    function makeBouquetTex(primary, highlight, accent) {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d");
      // Lush dark eucalyptus & rose stems/leaves in back
      for (let i = 0; i < 38; i++) {
        const ang = -Math.PI * 0.88 + Math.random() * Math.PI * 0.76;
        const len = 60 + Math.random() * 68;
        const x2 = 128 + Math.cos(ang) * len;
        const y2 = 220 + Math.sin(ang) * len;
        g.strokeStyle = i % 2 ? "#1e3a22" : "#2d4f30";
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(128, 240); g.lineTo(x2, y2); g.stroke();
        g.fillStyle = i % 3 === 0 ? "#244728" : "#355e38";
        g.beginPath();
        g.ellipse(x2, y2, 12, 6, ang, 0, 6.283);
        g.fill();
      }
      // Layered photorealistic rose blossoms with inner petal swirls
      for (let i = 0; i < 24; i++) {
        const r = 18 + Math.random() * 68;
        const a = Math.PI + (Math.random() - 0.5) * 2.4;
        const bx = 128 + Math.cos(a) * r * 0.95;
        const by = 138 + Math.sin(a) * r * 0.62 - 18;
        const rad = 11 + Math.random() * 8;
        const gr = g.createRadialGradient(bx - 2, by - 3, 2, bx, by, rad);
        gr.addColorStop(0, highlight);
        gr.addColorStop(0.55, primary);
        gr.addColorStop(1, "rgba(40,6,12,0.92)");
        g.fillStyle = gr;
        g.beginPath(); g.arc(bx, by, rad, 0, 6.283); g.fill();
        // Delicate petal crescent
        g.strokeStyle = highlight;
        g.globalAlpha = 0.55;
        g.lineWidth = 1.4;
        g.beginPath(); g.arc(bx, by, rad * 0.55, 0.3, 2.7); g.stroke();
        g.globalAlpha = 1;
      }
      // Baby's breath tiny white specks
      g.fillStyle = accent || "#fff8ee";
      for (let i = 0; i < 26; i++) {
        g.beginPath();
        g.arc(62 + Math.random() * 132, 62 + Math.random() * 96, 2.1, 0, 6.283);
        g.fill();
      }
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    // Carved Armenian Eternity Wheel (Arevakhach) Stone Plaque Texture
    function makeArevakhachTex() {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d");
      g.fillStyle = "#6c5d54"; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#3a2f2a"; g.lineWidth = 8; g.strokeRect(12, 12, 232, 232);
      g.translate(128, 128);
      for (let i = 0; i < 8; i++) {
        g.save();
        g.rotate((i * Math.PI) / 4);
        g.strokeStyle = "#b89578"; g.lineWidth = 7;
        g.beginPath(); g.arc(28, 0, 46, -0.3, 1.7); g.stroke();
        g.strokeStyle = "#342a25"; g.lineWidth = 3;
        g.beginPath(); g.arc(28, 0, 42, -0.2, 1.6); g.stroke();
        g.restore();
      }
      g.beginPath(); g.arc(0, 0, 14, 0, 6.283); g.fillStyle = "#b89578"; g.fill();
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    // Blistered Golden Tonir Lavash Texture
    function makeLavashTex() {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d");
      g.fillStyle = "#e2c38f"; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 95; i++) {
        const x = Math.random() * 256, y = Math.random() * 256, r = 5 + Math.random() * 14;
        const gr = g.createRadialGradient(x, y, 1, x, y, r);
        gr.addColorStop(0, "rgba(110,56,22,0.58)");
        gr.addColorStop(0.6, "rgba(175,112,52,0.28)");
        gr.addColorStop(1, "rgba(226,195,143,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
      }
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    // Weathered Cast-Iron Yerevan Manhole Texture
    function makeManholeTex() {
      const cv = document.createElement("canvas");
      cv.width = 128; cv.height = 128;
      const g = cv.getContext("2d");
      g.clearRect(0, 0, 128, 128);
      g.beginPath(); g.arc(64, 64, 58, 0, 6.283);
      g.fillStyle = "#35383e"; g.fill();
      g.strokeStyle = "#1c1e22"; g.lineWidth = 6; g.stroke();
      g.strokeStyle = "#4d525c"; g.lineWidth = 2;
      for (let r = 18; r <= 48; r += 10) { g.beginPath(); g.arc(64, 64, r, 0, 6.283); g.stroke(); }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.283;
        g.beginPath(); g.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14);
        g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); g.stroke();
      }
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    function snapToStreet(x, z) {
      const near = W.Ta(x, z, 85, l => l.cls !== "trunk");
      let sx = x, sz = z;
      if (near) {
        const dx = x - near.x, dz = z - near.z;
        const d = Math.hypot(dx, dz) || 1;
        if (near.l.road && near.l.cls !== "service") {
          const off = (near.l.half || 4) + 2.0;
          sx = near.x + (dx / d) * off;
          sz = near.z + (dz / d) * off;
        } else {
          // Pedestrian avenue / plaza: keep on sidewalk edge, never blocking dead-center promenade
          const sideOff = Math.min((near.l.half || 8) - 2.2, Math.max(4.8, d));
          const ux = d > 0.2 ? dx / d : 1, uz = d > 0.2 ? dz / d : 0;
          sx = near.x + ux * sideOff;
          sz = near.z + uz * sideOff;
          if (W.rt(sx, sz)) { sx = near.x + ux * 3.8; sz = near.z + uz * 3.8; }
        }
      }
      if (W.rt(sx, sz) && near) { sx = near.x; sz = near.z; }
      return [sx, sz];
    }

    let arevTexCache = null;
    function buildPulpulak(x, z, title, hyTitle) {
      const [sx, sz] = snapToStreet(x, z);
      const pbr = getPBR();
      if (!arevTexCache) arevTexCache = makeArevakhachTex();
      const grp = new T.Group();
      const waterMat = new T.StdMat({ color: 0xdaf4ff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.78, envMapIntensity: 2.4 });

      // Wet dark basalt splash ring on the pavement around the fountain
      const wet = new T.Mesh(new T.Plane(1.75, 1.75).rotateX(-Math.PI / 2), pbr.wetStone);
      wet.position.y = 0.025; grp.add(wet);

      // Stepped carved basalt plinth + pink-tuff stone column + carved Arevakhach relief
      const base = new T.Mesh(new T.Box(0.88, 0.18, 0.88), pbr.basalt);
      base.position.y = 0.09; base.castShadow = base.receiveShadow = true; grp.add(base);

      const body = new T.Mesh(new T.Box(0.56, 0.94, 0.50), pbr.pinkTuff);
      body.position.y = 0.65; body.castShadow = body.receiveShadow = true; grp.add(body);

      const plaque = new T.Mesh(
        new T.Plane(0.38, 0.38),
        new T.StdMat({ map: arevTexCache, roughness: 0.75, metalness: 0.15 })
      );
      plaque.position.set(0, 0.68, 0.256); grp.add(plaque);

      const cap = new T.Mesh(new T.Box(0.68, 0.11, 0.62), pbr.basalt);
      cap.position.y = 1.16; cap.castShadow = cap.receiveShadow = true; grp.add(cap);

      const basin = new T.Mesh(new T.Cyl(0.24, 0.18, 0.12, 14), pbr.basalt);
      basin.position.set(0, 1.24, 0.07); basin.castShadow = true; grp.add(basin);

      const pool = new T.Mesh(new T.Cyl(0.18, 0.18, 0.02, 14), waterMat);
      pool.position.set(0, 1.28, 0.07); grp.add(pool);

      const spout = new T.Mesh(new T.Cyl(0.015, 0.022, 0.18, 8), pbr.bronze);
      spout.position.set(0, 1.32, -0.02); spout.rotation.x = 0.42; grp.add(spout);

      const arc = new T.Mesh(new T.Cyl(0.009, 0.016, 0.21, 8), waterMat);
      arc.position.set(0, 1.38, 0.04); arc.rotation.x = 0.55; grp.add(arc);

      const splash = new T.Mesh(
        new T.Plane(0.26, 0.26).rotateX(-Math.PI / 2),
        new T.BasicMat({ color: 0xe6f8ff, transparent: true, opacity: 0.36, depthWrite: false })
      );
      splash.position.set(0, 1.30, 0.08); grp.add(splash);
      waterStreams.push({ arc, splash, ph: Math.random() * 6.28 });

      grp.position.set(sx, 0, sz);
      scene.add(grp);

      cultureSpots.push({
        kind: "pulpulak",
        x: sx, z: sz,
        name: title || "Pulpulak Fountain",
        hy: hyTitle || "Պուլպուլակ",
        tr: "Pulpulak",
        prompt: "Drink cold water · Պուլպուլակ",
        act: () => {
          HyperAudio.playWaterSplash();
          P.energy = C.tt(P.energy + 32, 0, 100);
          P.drunk = Math.max(0, (P.drunk || 0) - 0.3);
          state.pulpulaks++;
          addRespect(3);
          UI.at();
          const pr = ARMENIAN_PROVERBS[state.pulpulaks % ARMENIAN_PROVERBS.length];
          UI.de("Պուլպուլակ · Ice-Cold Mountain Water", pr[0] + " (" + pr[1] + ")", pr[2] + " (+32 Energy, +3 Respect)");
        }
      });
    }

    function buildArmenianFlag(x, z) {
      const [sx, sz] = snapToStreet(x, z);
      const pbr = getPBR();
      const grp = new T.Group();
      const plinth = new T.Mesh(new T.Cyl(0.24, 0.3, 0.38, 12), pbr.basalt);
      plinth.position.y = 0.19; plinth.castShadow = plinth.receiveShadow = true; grp.add(plinth);
      const pole = new T.Mesh(
        new T.Cyl(0.042, 0.062, 8.2, 12),
        new T.StdMat({ color: 0xd0d6de, roughness: 0.24, metalness: 0.88 })
      );
      pole.position.y = 4.25; pole.castShadow = true; grp.add(pole);
      const finial = new T.Mesh(new T.Sph(0.10, 10, 8), pbr.bronze);
      finial.position.y = 8.4; grp.add(finial);

      // Woven fabric Tricolour canvas texture with realistic cloth shading
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 128;
      const g = cv.getContext("2d");
      g.fillStyle = "#C90E1D"; g.fillRect(0, 0, 256, 43);
      g.fillStyle = "#083696"; g.fillRect(0, 43, 256, 43);
      g.fillStyle = "#E89B0C"; g.fillRect(0, 86, 256, 42);
      g.fillStyle = "rgba(0,0,0,0.06)";
      for (let x0 = 0; x0 < 256; x0 += 4) g.fillRect(x0, 0, 1, 128);
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;

      const geo = new T.Plane(2.35, 1.18, 12, 2);
      geo.translate(1.18, 0, 0);
      const flag = new T.Mesh(geo, new T.StdMat({ map: tex, side: T.DoubleSide, roughness: 0.78 }));
      flag.position.set(0.04, 7.72, 0);
      flag.castShadow = true;
      grp.add(flag);

      grp.position.set(sx, 0, sz);
      scene.add(grp);
      wavingFlags.push({ mesh: flag, basePos: Float32Array.from(geo.attributes.position.array), ph: Math.random() * 6.28 });
    }

    function buildFestoonSpan(x1, z1, x2, z2) {
      const grp = new T.Group();
      const bulbMat = new T.BasicMat({ color: 0xffe6aa });
      const glowMat = new T.BasicMat({ color: 0xffc666, transparent: true, opacity: 0.20, depthWrite: false });
      const wireMat = new T.BasicMat({ color: 0x1a1a1e });
      const steps = 11;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = x1 + (x2 - x1) * u;
        const z = z1 + (z2 - z1) * u;
        const sag = Math.sin(u * Math.PI) * 0.92;
        const y = 5.65 - sag;
        pts.push(new T.Vec3(x, y, z));
        if (i > 0 && i < steps) {
          const bulb = new T.Mesh(new T.Sph(0.062, 6, 6), bulbMat);
          bulb.position.set(x, y - 0.08, z);
          grp.add(bulb);
          const halo = new T.Mesh(new T.Sph(0.16, 6, 6), glowMat);
          halo.position.set(x, y - 0.08, z);
          grp.add(halo);
        }
      }
      const up = new T.Vec3(0, 1, 0);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dir = new T.Vec3().subVectors(b, a);
        const len = dir.length();
        const seg = new T.Mesh(new T.Cyl(0.01, 0.01, len, 4), wireMat);
        seg.position.copy(a).addScaledVector(dir, 0.5);
        seg.quaternion.setFromUnitVectors(up, dir.normalize());
        grp.add(seg);
      }
      scene.add(grp);
    }

    // Photoreal Outdoor Café Umbrella (casts crisp real shadows across Northern Ave & Saryan!)
    function buildCafeUmbrella(x, z, colA, colB) {
      const [sx, sz] = snapToStreet(x, z);
      const pbr = getPBR();
      const grp = new T.Group();
      const base = new T.Mesh(new T.Cyl(0.32, 0.36, 0.1, 12), pbr.basalt);
      base.position.y = 0.05; base.castShadow = base.receiveShadow = true; grp.add(base);
      const pole = new T.Mesh(new T.Cyl(0.032, 0.038, 2.55, 8), pbr.woodDark);
      pole.position.y = 1.3; pole.castShadow = true; grp.add(pole);
      const canopyMat = new T.StdMat({ map: makeAwningTex(colA, colB), roughness: 0.88, side: T.DoubleSide });
      const canopy = new T.Mesh(new T.Cyl(0.08, 1.55, 0.42, 8, 1, true), canopyMat);
      canopy.position.y = 2.48; canopy.castShadow = canopy.receiveShadow = true; grp.add(canopy);
      const skirt = new T.Mesh(new T.Cyl(1.55, 1.55, 0.16, 8, 1, true), canopyMat);
      skirt.position.y = 2.20; skirt.castShadow = true; grp.add(skirt);
      const topFinial = new T.Mesh(new T.Sph(0.07, 8, 6), pbr.bronze);
      topFinial.position.y = 2.71; grp.add(topFinial);
      grp.position.set(sx, 0, sz);
      scene.add(grp);
    }

    // Photoreal Weathered Street Micro-Details (Bollards, Wet Sheen Puddles, Manhole Covers)
    function buildStreetMicroDetails() {
      const pbr = getPBR();
      // 1. Matte-black ornate Yerevan street bollards along Northern Avenue edges
      const bolGeo = new T.Cyl(0.068, 0.082, 0.84, 10);
      const capGeo = new T.Sph(0.072, 8, 6);
      const bolCoords = [];
      for (let z = -30; z <= 170; z += 18) {
        bolCoords.push([258.5, z], [277.5, z]);
      }
      for (const [bx, bz] of bolCoords) {
        if (W.rt(bx, bz)) continue;
        const g = new T.Group();
        const post = new T.Mesh(bolGeo, pbr.wroughtIron);
        post.position.y = 0.42; post.castShadow = true; g.add(post);
        const cap = new T.Mesh(capGeo, pbr.bronze);
        cap.position.y = 0.86; g.add(cap);
        const ao = new T.Mesh(new T.Plane(0.45, 0.45).rotateX(-Math.PI / 2), pbr.wetStone);
        ao.position.y = 0.022; g.add(ao);
        g.position.set(bx, 0, bz);
        scene.add(g);
      }

      // 2. Subtle glossy wet stone specular sheen patches (reflect sky & sunlight realistically!)
      const puddleMat = new T.StdMat({
        map: contactShadowTex, color: 0x3b4856,
        roughness: 0.04, metalness: 0.25,
        transparent: true, opacity: 0.28, depthWrite: false, envMapIntensity: 2.6
      });
      for (const [px, pz, sx, sz] of [
        [263, 68, 3.2, 2.4], [273, 104, 2.8, 2.2], [266, 22, 3.6, 2.5],
        [102, 502, 4.0, 3.0], [295, -275, 3.5, 2.8], [-542, -18, 3.0, 2.4]
      ]) {
        const m = new T.Mesh(new T.Plane(sx, sz).rotateX(-Math.PI / 2), puddleMat);
        m.position.set(px, 0.022, pz);
        m.rotation.z = px * 0.37;
        scene.add(m);
      }

      // 3. Cast-iron Yerevan manhole covers flush on the avenue/roads
      const mhMat = new T.StdMat({ map: makeManholeTex(), roughness: 0.48, metalness: 0.72, transparent: true, depthWrite: false });
      for (const [mx, mz] of [[268, 52], [268, 128], [268, -12], [108, 488], [302, -285], [408, 44]]) {
        const mh = new T.Mesh(new T.Plane(0.82, 0.82).rotateX(-Math.PI / 2), mhMat);
        mh.position.set(mx, 0.024, mz);
        scene.add(mh);
      }

      // 4. Flock of Yerevan Swallows gliding high in sunlit loops above the avenues!
      const wingMat = new T.StdMat({ color: 0x1f2228, roughness: 0.7, side: T.DoubleSide });
      const centers = [[268, 70], [100, 505], [300, -295], [344, -770]];
      for (let i = 0; i < 14; i++) {
        const c = centers[i % centers.length];
        const bird = new T.Group();
        const lWing = new T.Mesh(new T.Plane(0.28, 0.1), wingMat);
        lWing.position.x = -0.14; lWing.rotation.x = Math.PI / 2;
        const rWing = new T.Mesh(new T.Plane(0.28, 0.1), wingMat);
        rWing.position.x = 0.14; rWing.rotation.x = Math.PI / 2;
        bird.add(lWing, rWing);
        scene.add(bird);
        swallows.push({
          g: bird, lW: lWing, rW: rWing,
          cx: c[0], cz: c[1],
          rad: 14 + (i % 5) * 6,
          h: 11 + (i % 4) * 3.5,
          spd: 0.32 + (i % 3) * 0.11,
          ph: i * 1.15
        });
      }
    }

    function makeSignTexture(hy, en, bg, fg) {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 160;
      const g = cv.getContext("2d");
      g.fillStyle = bg; g.fillRect(0, 0, 512, 160);
      // Subtle weathered wood/slate grain
      g.fillStyle = "rgba(255,255,255,0.03)";
      for (let y = 0; y < 160; y += 4) g.fillRect(0, y, 512, 1);
      g.strokeStyle = "#d4a656"; g.lineWidth = 6; g.strokeRect(10, 10, 492, 140);
      g.fillStyle = fg; g.textAlign = "center";
      g.font = "700 44px Georgia,serif"; g.fillText(hy, 256, 76);
      g.fillStyle = "#e6bf78";
      g.font = "600 24px system-ui,sans-serif"; g.fillText(en, 256, 122);
      const tex = new T.CanvasTex(cv);
      tex.colorSpace = T.SRGB;
      return tex;
    }

    let bouquetMats = null, lavashMatCache = null;
    function buildCultureStand(cfg) {
      const [sx, sz] = snapToStreet(cfg.x, cfg.z);
      const pbr = getPBR();
      const grp = new T.Group();

      // Ground contact AO shadow under the stall
      const stallAO = new T.Mesh(new T.Plane(3.1, 2.0).rotateX(-Math.PI / 2), pbr.wetStone);
      stallAO.position.y = 0.022; grp.add(stallAO);

      // Photoreal timber counter with trim ledges + wrought-iron frame + woven striped awning
      const counter = new T.Mesh(new T.Box(2.25, 0.92, 1.02), pbr.woodDark);
      counter.position.y = 0.46; counter.castShadow = counter.receiveShadow = true; grp.add(counter);

      const tabletop = new T.Mesh(new T.Box(2.38, 0.06, 1.14), pbr.woodCrate);
      tabletop.position.y = 0.94; tabletop.castShadow = tabletop.receiveShadow = true; grp.add(tabletop);

      for (const px of [-1.05, 1.05]) {
        for (const pz of [-0.46, 0.46]) {
          const post = new T.Mesh(new T.Cyl(0.028, 0.032, 2.48, 8), pbr.wroughtIron);
          post.position.set(px, 1.24, pz); post.castShadow = true; grp.add(post);
        }
      }

      const awningMat = new T.StdMat({
        map: makeAwningTex(cfg.stripeA || "#7d2420", cfg.stripeB || "#efe5d5"),
        roughness: 0.9, side: T.DoubleSide
      });
      const canopy = new T.Mesh(new T.Box(2.58, 0.08, 1.56), awningMat);
      canopy.position.set(0, 2.48, 0.06); canopy.rotation.x = 0.14; canopy.castShadow = canopy.receiveShadow = true; grp.add(canopy);
      const valance = new T.Mesh(new T.Plane(2.58, 0.24), awningMat);
      valance.position.set(0, 2.26, 0.83); grp.add(valance);

      const sign = new T.Mesh(
        new T.Plane(1.92, 0.56),
        new T.StdMat({ map: makeSignTexture(cfg.hy, cfg.en, cfg.bg || "#1f1512", "#f6ede0"), roughness: 0.65, side: T.DoubleSide })
      );
      sign.position.set(0, 2.02, 0.56); grp.add(sign);

      // Stand-specific PHOTOREAL 3D props
      if (cfg.kind === "lavash") {
        if (!lavashMatCache) lavashMatCache = new T.StdMat({ map: makeLavashTex(), roughness: 0.92 });
        const tonir = new T.Mesh(new T.Cyl(0.42, 0.54, 0.88, 16), pbr.clay);
        tonir.position.set(-0.56, 0.98, -0.05); tonir.castShadow = true; grp.add(tonir);
        const rim = new T.Mesh(new T.Cyl(0.45, 0.45, 0.07, 16), pbr.basalt);
        rim.position.set(-0.56, 1.42, -0.05); grp.add(rim);
        const ember = new T.Mesh(new T.Cyl(0.32, 0.32, 0.04, 12), new T.BasicMat({ color: 0xe65319 }));
        ember.position.set(-0.56, 1.41, -0.05); grp.add(ember);
        // Stacked blistered lavash sheets on wooden board
        for (let i = 0; i < 4; i++) {
          const sheet = new T.Mesh(new T.Box(0.68, 0.025, 0.44), lavashMatCache);
          sheet.position.set(0.48, 0.99 + i * 0.028, 0.08);
          sheet.rotation.y = (i - 1.5) * 0.06;
          sheet.castShadow = true;
          grp.add(sheet);
        }
        for (let i = 0; i < 4; i++) {
          const sp = new T.Mesh(
            new T.Sph(0.16, 6, 6),
            new T.BasicMat({ color: 0xfff6ec, transparent: true, opacity: 0.18, depthWrite: false })
          );
          sp.position.set(sx - 0.56, 1.6 + i * 0.4, sz - 0.05);
          scene.add(sp);
          steamPuffs.push({ mesh: sp, bx: sx - 0.56, bz: sz - 0.05, ph: i * 1.57 });
        }
      } else if (cfg.kind === "pomegranate") {
        // Wooden market crate filled with deep ruby pomegranates + brass lever press + glass pitcher
        const crate = new T.Mesh(new T.Box(0.95, 0.22, 0.62), pbr.woodCrate);
        crate.position.set(-0.52, 1.07, 0.05); crate.castShadow = true; grp.add(crate);
        const pomMat = new T.StdMat({ color: 0x8c1222, roughness: 0.32, metalness: 0.05, envMapIntensity: 1.5 });
        for (let i = 0; i < 12; i++) {
          const p = new T.Mesh(new T.Sph(0.068, 10, 8), pomMat);
          p.position.set(-0.84 + (i % 4) * 0.19, 1.18 + Math.floor(i / 4) * 0.075, -0.1 + (i % 2) * 0.18);
          p.castShadow = true;
          grp.add(p);
        }
        const pressBase = new T.Mesh(new T.Box(0.24, 0.05, 0.28), pbr.wroughtIron);
        pressBase.position.set(0.48, 1.00, 0.06); grp.add(pressBase);
        const pressCol = new T.Mesh(new T.Cyl(0.032, 0.04, 0.48, 10), pbr.bronze);
        pressCol.position.set(0.48, 1.24, 0.0); grp.add(pressCol);
        const pressCup = new T.Mesh(new T.Cyl(0.075, 0.055, 0.16, 12), pbr.zinc);
        pressCup.position.set(0.48, 1.12, 0.08); grp.add(pressCup);
        const carafe = new T.Mesh(
          new T.Cyl(0.055, 0.072, 0.24, 12),
          new T.StdMat({ color: 0x7a0818, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.88 })
        );
        carafe.position.set(0.76, 1.09, 0.12); grp.add(carafe);
      } else if (cfg.kind === "flowers") {
        // Galvanized metal buckets + PHOTOREAL multi-layered crossed rose & eucalyptus sprays!
        if (!bouquetMats) {
          bouquetMats = [
            new T.StdMat({ map: makeBouquetTex("#9e1124", "#e34255", "#fff8ee"), alphaTest: 0.35, transparent: true, side: T.DoubleSide, roughness: 0.82 }),
            new T.StdMat({ map: makeBouquetTex("#c94b6d", "#f5a4ba", "#ffffff"), alphaTest: 0.35, transparent: true, side: T.DoubleSide, roughness: 0.82 }),
            new T.StdMat({ map: makeBouquetTex("#d99a26", "#ffe08a", "#fffdf5"), alphaTest: 0.35, transparent: true, side: T.DoubleSide, roughness: 0.82 }),
            new T.StdMat({ map: makeBouquetTex("#ded5c8", "#ffffff", "#e5f0d8"), alphaTest: 0.35, transparent: true, side: T.DoubleSide, roughness: 0.82 })
          ];
        }
        const bucketGeo = new T.Cyl(0.145, 0.11, 0.36, 12);
        const sprayGeo = new T.Plane(0.56, 0.56);
        for (let i = 0; i < 4; i++) {
          const bx = -0.74 + i * 0.49;
          const bucket = new T.Mesh(bucketGeo, pbr.zinc);
          bucket.position.set(bx, 1.14, 0.06); bucket.castShadow = true; grp.add(bucket);
          // 3 crossed photoreal floral planes per bucket so it looks volumetric from EVERY angle!
          for (let k = 0; k < 3; k++) {
            const sp = new T.Mesh(sprayGeo, bouquetMats[i]);
            sp.position.set(bx, 1.48, 0.06);
            sp.rotation.y = (k * Math.PI) / 3 + i * 0.4;
            sp.castShadow = true;
            grp.add(sp);
          }
        }
      } else if (cfg.kind === "duduk") {
        // Woven Armenian rug + velvet instrument case (hide stall canopy/counter)
        counter.visible = tabletop.visible = canopy.visible = valance.visible = false;
        sign.position.set(0, 1.32, -0.68);
        const rug = new T.Mesh(
          new T.Box(2.15, 0.025, 1.55),
          new T.StdMat({ map: makeAwningTex("#6e1820", "#a63a2b"), roughness: 0.96 })
        );
        rug.position.y = 0.015; rug.receiveShadow = true; grp.add(rug);
        const caseBox = new T.Mesh(new T.Box(0.62, 0.11, 0.34), pbr.woodDark);
        caseBox.position.set(0, 0.08, 0.42); caseBox.castShadow = true; grp.add(caseBox);
        musicSpots.push({ x: sx, z: sz, name: cfg.en });
      }

      grp.position.set(sx, 0, sz);
      grp.rotation.y = cfg.rot || 0;
      scene.add(grp);

      cultureSpots.push({
        kind: cfg.kind,
        x: sx, z: sz,
        name: cfg.en,
        hy: cfg.hy,
        tr: cfg.tr,
        prompt: cfg.prompt,
        act: cfg.act
      });
    }

    function openLavashStand() {
      const he = G.G();
      UI.$e("Թոնիր Լավաշ", "Tonir Lavash Bakery · Fresh off the clay wall", null,
        ["Բարի գալուստ։ Ի՞նչ կուզեք։", "Bari galust. Inch kuzek?", "Welcome! Hot lavash & khorovats straight from the tonir!"],
        [
          {
            en: "Hot Tonir Lavash + Cheese & Herbs (+45 Energy)", hy: "Տաք լավաշ և պանիր", tr: "Taq lavash yev panir", right: UI.Ie(600),
            fn: () => {
              if (UI.Oa(600)) return;
              he.dram -= 600; P.energy = C.tt(P.energy + 45, 0, 100);
              addRespect(3); UI.gt(); UI.at(); UI._e(); G.SND.cash();
              UI.de("Բարի ախորժակ · Bari akhorzhak!", "Թոնիր լավաշ", "Still steaming! Rolled with Lori cheese and fresh tarragon. (+45 Energy)");
            }
          },
          {
            en: "Khorovats Lavash Wrap (+75 Energy)", hy: "Խորովածի բրդուճ", tr: "Khorovatsi brduch", right: UI.Ie(2200),
            fn: () => {
              if (UI.Oa(2200)) return;
              he.dram -= 2200; P.energy = C.tt(P.energy + 75, 0, 100);
              addRespect(5); UI.gt(); UI.at(); UI._e(); G.SND.cash();
              UI.de("Շատ համով է · Legendary Brduch!", "Խորոված", "Charcoal-smoked khorovats wrapped in warm lavash with sumac onions. (+75 Energy)");
            }
          },
          { en: "Step back", hy: "Հաջողություն։", tr: "Hajoghutyun.", fn: () => UI._e() }
        ]
      );
    }

    function openPomegranateStand() {
      const he = G.G();
      UI.$e("Նռան Հյութ", "Fresh Armenian Pomegranate & Apricot Press", null,
        ["Բարև, ախպեր ջան։", "Barev, akhper jan.", "Freshly pressed crimson pomegranate juice — pure Meghri fruit!"],
        [
          {
            en: "Fresh Pomegranate Juice (+50 Energy, clears hangover)", hy: "Թարմ նռան հյութ", tr: "Tarm nran hyut", right: UI.Ie(1200),
            fn: () => {
              if (UI.Oa(1200)) return;
              he.dram -= 1200; P.energy = C.tt(P.energy + 50, 0, 100); P.drunk = 0;
              addRespect(4); UI.gt(); UI.at(); UI._e(); G.SND.cash();
              UI.de("Նռան Հյութ · Pure Armenian Energy!", "Կենա՛ցդ", "Ruby-red tart perfection. You feel unstoppable! (+50 Energy)");
            }
          },
          {
            en: "Buy a round for passers-by (+12 Respect, +40 Clout)", hy: "Հյուրասիրել բոլորին", tr: "Hyurasirel bolorin", right: UI.Ie(4500),
            fn: () => {
              if (UI.Oa(4500)) return;
              he.dram -= 4500; addRespect(12); addClout(40); UI.gt(); UI.at(); UI._e(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              UI.de("Ախպեր ջան!! · Yerevan Hospitality!", "Կեցցե՛ս", "Strangers toast your name with pomegranate cups! (+12 Respect, +40 Clout)");
            }
          },
          { en: "Maybe later", hy: "", tr: "", fn: () => UI._e() }
        ]
      );
    }

    function openFlowerStand() {
      const he = G.G();
      UI.$e("Ծաղիկներ", "Yerevan Street Florist · Roses & Carnations", null,
        ["Բարև ձեզ։ Ինչո՞վ օգնեմ։", "Barev dzez. Inchov ognem?", "Fresh red roses! Perfect for a date — or smoothing over lovers' drama."],
        [
          {
            en: "Buy Red Rose Bouquet (helps dates & romance drama!)", hy: "Կարմիր վարդերի փունջ", tr: "Karmir varderi punj", right: UI.Ie(4000),
            fn: () => {
              if (UI.Oa(4000)) return;
              he.dram -= 4000; state.roses = (state.roses || 0) + 1; saveState();
              addRespect(4); UI.gt(); UI.at(); UI._e(); G.SND.cash();
              UI.de("Կարմիր Վարդեր · Roses Acquired!", "Շատ գեղեցիկ է", "You now carry " + state.roses + " bouquet(s). Use them on dates or to save a lovers' quarrel!");
            }
          },
          { en: "Leave", hy: "", tr: "", fn: () => UI._e() }
        ]
      );
    }

    function openDudukMusician(spotName) {
      const he = G.G();
      UI.$e("Դուդուկահար", "Master Duduk Player · " + spotName, null,
        ["Ողջույն։ Լավ եղանակ է, չէ՞։", "Voghjuyn. Lav yeghanak e, che?", "The apricot-wood duduk carries the soul of Armenia. Request a melody?"],
        [
          {
            en: "Request «Դլե Յաման» (Dle Yaman) & Tip", hy: "Դլե Յաման", tr: "Dle Yaman", right: UI.Ie(1000),
            fn: () => {
              if (UI.Oa(1000)) return;
              he.dram -= 1000; addRespect(10); addClout(25); P.energy = C.tt(P.energy + 20, 0, 100);
              UI.gt(); UI.at(); UI._e(); G.SND.cash();
              HyperAudio.playDudukNote(293.66, 2.1, 1);
              setTimeout(() => HyperAudio.playDudukNote(311.13, 1.3, 0.9), 650);
              setTimeout(() => HyperAudio.playDudukNote(369.99, 1.8, 1), 1300);
              UI.de("Դլե Յաման · Soul of Armenia", "Շնորհակալություն", "Passers-by pause in quiet awe as the warm apricot-wood melody floats over Yerevan. (+10 Respect)");
            }
          },
          {
            en: "Request «Երևան Էրեբունի» (Erebuni-Yerevan) & Cheer!", hy: "Երևան Էրեբունի", tr: "Yerevan Erebuni", right: UI.Ie(2000),
            fn: () => {
              if (UI.Oa(2000)) return;
              he.dram -= 2000; addRespect(16); addClout(60);
              UI.gt(); UI.at(); UI._e(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              HyperAudio.playDudukNote(392.0, 1.2, 1);
              setTimeout(() => HyperAudio.playDudukNote(440.0, 1.5, 1), 500);
              UI.de("Երևան դարձած իմ Էրեբունի!", "Կեցցե՛ Երևանը", "A small crowd claps along in rhythm! (+16 Respect, +60 Clout)");
            }
          },
          { en: "Just listen quietly", hy: "", tr: "", fn: () => UI._e() }
        ]
      );
    }

    function playQuickNardi(opponentName, stake, onWin, onLose) {
      const he = G.G();
      HyperAudio.playDiceRoll();
      const p1 = 1 + Math.floor(Math.random() * 6), p2 = 1 + Math.floor(Math.random() * 6);
      const o1 = 1 + Math.floor(Math.random() * 6), o2 = 1 + Math.floor(Math.random() * 6);
      const pScore = p1 + p2 + (p1 === p2 ? 8 : 0);
      const oScore = o1 + o2 + (o1 === o2 ? 8 : 0);
      const call = (a, b) => a === 6 && b === 6 ? "Դու շեշ! (Double 6!)" : (a === 6 && b === 5) || (a === 5 && b === 6) ? "Շեշ բեշ! (6-5!)" : a === b ? `Զույգ ${a}! (Double ${a}s!)` : `${a}-${b}`;
      const won = pScore >= oScore;
      if (won) {
        he.dram += stake; state.nardiWins++; addRespect(8); addClout(35);
        UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
        UI.de("Նարդի · YOU WON " + UI.Ie(stake) + "!", call(p1, p2), "You rolled " + call(p1, p2) + " vs " + opponentName + "'s " + call(o1, o2) + "! The elders applaud!");
        if (onWin) onWin();
      } else {
        he.dram = Math.max(0, he.dram - stake); addRespect(2);
        UI.gt(); UI.at();
        UI.de("Նարդի · " + opponentName + " took the pot!", call(o1, o2), "You rolled " + call(p1, p2) + " vs " + call(o1, o2) + ". «Դե լավ էլի, մյուս անգամ!»");
        if (onLose) onLose();
      }
    }

    function buildAllCultureProps() {
      if (propsBuilt) return;
      propsBuilt = true;

      // 12 Iconic Yerevan Stone Pulpulaks
      const pulpulaks = [
        [256, 92, "Northern Avenue Pulpulak", "Հյուսիսային պողոտայի պուլպուլակ"],
        [114, 492, "Republic Square Seven Springs", "Յոթ Աղբյուր · Հանրապետության հրապարակ"],
        [290, -280, "Opera Park Pulpulak", "Օպերայի պուլպուլակ"],
        [338, -768, "Cascade Garden Pulpulak", "Կասկադի պուլպուլակ"],
        [548, 705, "Vernissage Pulpulak", "Վերնիսաժի պուլպուլակ"],
        [-528, -22, "Saryan Wine Street Pulpulak", "Սարյան փողոցի պուլպուլակ"],
        [406, 40, "Abovyan Street Pulpulak", "Աբովյան փողոցի պուլպուլակ"],
        [182, -622, "Saryan Park Pulpulak", "Սարյանի այգու պուլպուլակ"],
        [-305, 195, "Old Courtyard Pulpulak", "Բակի պուլպուլակ"],
        [145, 315, "Kentron Corner Pulpulak", "Կենտրոնի պուլպուլակ"],
        [-40, 625, "English Park Pulpulak", "Անգլիական այգու պուլպուլակ"],
        [235, -510, "Freedom Square Pulpulak", "Ազատության հրապարակի պուլպուլակ"]
      ];
      for (const p of pulpulaks) buildPulpulak(p[0], p[1], p[2], p[3]);

      // Iconic Armenian Tricolour Flags waving over landmarks
      for (const [fx, fz] of [[104, 512], [296, -295], [344, -785], [274, 72], [556, 718]]) {
        buildArmenianFlag(fx, fz);
      }

      // Warm Overhead Café Festoon String Lights on Northern Ave & Saryan Street
      buildFestoonSpan(258, 70, 278, 70);
      buildFestoonSpan(258, 95, 278, 95);
      buildFestoonSpan(258, 120, 278, 120);
      buildFestoonSpan(-555, -35, -535, -15);
      buildFestoonSpan(-555, -10, -535, 10);

      // Photoreal Outdoor Café Sun Umbrellas along Northern Avenue & Saryan Wine Street
      buildCafeUmbrella(260, 82, "#efe7d6", "#d9ccb4");
      buildCafeUmbrella(260, 106, "#efe7d6", "#d9ccb4");
      buildCafeUmbrella(276, 86, "#8a3126", "#f0e6d6");
      buildCafeUmbrella(276, 132, "#efe7d6", "#d9ccb4");
      buildCafeUmbrella(260, 38, "#2c4c3b", "#efe7d6");
      buildCafeUmbrella(-538, -28, "#8a3126", "#f0e6d6");
      buildCafeUmbrella(-540, -6, "#efe7d6", "#d9ccb4");

      // Photoreal Street Micro-Details (Bollards, Wet Sheen Puddles, Manhole Covers, Swallows)
      buildStreetMicroDetails();

      // Authentic Armenian Street Stands (Photoreal PBR Wood, Wrought Iron & Woven Awnings)
      buildCultureStand({ kind: "lavash", x: 398, z: 54, hy: "ԹՈՆԻՐ ԼԱՎԱՇ", en: "Tonir Lavash Bakery", tr: "Tonir Lavash", stripeA: "#8c4223", stripeB: "#efe4d2", prompt: "Buy hot Tonir Lavash · Թոնիր Լավաշ", act: openLavashStand });
      buildCultureStand({ kind: "lavash", x: 540, z: 728, hy: "ԹՈՆԻՐ ԼԱՎԱՇ", en: "Vernissage Tonir", tr: "Tonir Lavash", stripeA: "#8c4223", stripeB: "#efe4d2", prompt: "Buy hot Tonir Lavash · Թոնիր Լավաշ", act: openLavashStand });
      buildCultureStand({ kind: "pomegranate", x: 274, z: 112, hy: "ՆՌԱՆ ՀՅՈՒԹ", en: "Fresh Pomegranate Press", tr: "Nran Hyut", bg: "#2e0d12", stripeA: "#7d1424", stripeB: "#f2e7d8", prompt: "Fresh Pomegranate Juice · Նռան Հյութ", act: openPomegranateStand });
      buildCultureStand({ kind: "pomegranate", x: 354, z: -745, hy: "ՆՌԱՆ ՀՅՈՒԹ", en: "Cascade Pomegranate Bar", tr: "Nran Hyut", bg: "#2e0d12", stripeA: "#7d1424", stripeB: "#f2e7d8", prompt: "Fresh Pomegranate Juice · Նռան Հյութ", act: openPomegranateStand });
      buildCultureStand({ kind: "flowers", x: 282, z: -265, hy: "ԾԱՂԻԿՆԵՐ", en: "Opera Rose Seller", tr: "Tsaghikner", bg: "#1c241e", stripeA: "#2a4a36", stripeB: "#f3ece0", prompt: "Buy Red Roses · Ծաղիկներ", act: openFlowerStand });
      buildCultureStand({ kind: "flowers", x: 248, z: 62, hy: "ԾԱՂԻԿՆԵՐ", en: "Northern Ave Florist", tr: "Tsaghikner", bg: "#1c241e", stripeA: "#2a4a36", stripeB: "#f3ece0", prompt: "Buy Red Roses · Ծաղիկներ", act: openFlowerStand });
      buildCultureStand({ kind: "duduk", x: 271, z: 32, hy: "ԴՈՒԴՈՒԿ", en: "Northern Ave Duduk", tr: "Duduk", prompt: "Listen & Tip Duduk · Դուդուկ", act: () => openDudukMusician("Northern Avenue") });
      buildCultureStand({ kind: "duduk", x: 342, z: -720, hy: "ԴՈՒԴՈՒԿ", en: "Cascade Duduk", tr: "Duduk", prompt: "Listen & Tip Duduk · Դուդուկ", act: () => openDudukMusician("The Cascade") });
      buildCultureStand({ kind: "duduk", x: 112, z: 525, hy: "ԴՈՒԴՈՒԿ", en: "Republic Sq Duduk", tr: "Duduk", prompt: "Listen & Tip Duduk · Դուդուկ", act: () => openDudukMusician("Republic Square") });
    }

    // =========================================================================
    // 3. BETTER 3RD-PERSON CAMERA (OTS / CLASSIC / WIDE + COLLISION + JUICE)
    // =========================================================================
    const CAM_MODES = [
      { id: "ots",     name: "OTS",     dist: 3.55, shoulder: 0.44, height: 1.56, lookAhead: 2.8, fov: 55, sprintFov: 64 },
      { id: "classic", name: "Classic", dist: 5.05, shoulder: 0.14, height: 1.62, lookAhead: 2.5, fov: 58, sprintFov: 66 },
      { id: "wide",    name: "Wide",    dist: 7.40, shoulder: 0.00, height: 1.78, lookAhead: 3.0, fov: 60, sprintFov: 68 }
    ];
    let camModeIdx = state.camMode % CAM_MODES.length;
    let smoothDist = 3.55;
    let bobPhase = 0;
    let smoothFov = 55;
    let smoothLookX = 0, smoothLookZ = 0;
    let dramaZoomTimer = 0;
    let prevPlayerA = P.a;
    let bankAngle = 0;

    function applyCamPreset(idx, quiet) {
      camModeIdx = ((idx % CAM_MODES.length) + CAM_MODES.length) % CAM_MODES.length;
      state.camMode = camModeIdx;
      saveState();
      const m = CAM_MODES[camModeIdx];
      if (!C.Fi() && !G.INT.on) C.xr = m.dist;
      const btn = UI.fe("bCamMode");
      if (btn) btn.textContent = "3rd Cam: " + m.name + " (B)";
      if (!quiet) UI.de("3rd-Person Camera: " + m.name, "", m.id === "ots" ? "Cinematic over-the-shoulder Yerevan street framing." : m.id === "classic" ? "Balanced 3rd-person follow view." : "Wide architectural view of central Yerevan.");
    }

    const camBtn = UI.fe("bCamMode");
    if (camBtn) camBtn.addEventListener("click", () => applyCamPreset(camModeIdx + 1));
    // Start in crisp OTS camera
    setTimeout(() => applyCamPreset(camModeIdx, true), 100);

    window.__hyperCam = function (dt) {
      const t = P;
      const mode = CAM_MODES[camModeIdx];
      const baseH = t.car ? 1.68 : mode.height;

      // Smooth target zoom distance
      C.zr += (C.xr - C.zr) * Math.min(1, dt * 7);

      if (C.Fi()) {
        if (document.pointerLockElement) document.exitPointerLock();
        if (!G.ui.open) {
          const fw = (G.keys.w || G.keys.ArrowUp ? 1 : 0) - (G.keys.s || G.keys.ArrowDown ? 1 : 0);
          const rtKey = (G.keys.d || G.keys.ArrowRight ? 1 : 0) - (G.keys.a || G.keys.ArrowLeft ? 1 : 0);
          if (fw || rtKey) C.Fg(-rtKey * 700 * dt, fw * 700 * dt);
        }
      } else {
        const fLerp = Math.min(1, dt * 13);
        C.Fr.x += (t.x - C.Fr.x) * fLerp;
        C.Fr.z += (t.z - C.Fr.z) * fLerp;
      }

      const fx = C.Fr.x, fz = C.Fr.z;
      C.Gu += C.wr(C.tn ? Math.PI : 0, C.Gu) * Math.min(1, dt * 7);

      const speed = t.car ? Math.abs(t.car.vel || 0) : Math.abs(t.v || 0);
      const speedKick = t.car ? Math.min(2.4, speed * 0.08) : (speed > 4.2 ? 0.45 : 0);
      let desiredDist = C.zr + (t.car && C.zr < 12 ? 3.8 : 0) + speedKick;
      if (dramaZoomTimer > 0 && C.zr < 12) {
        dramaZoomTimer = Math.max(0, dramaZoomTimer - dt);
        desiredDist = Math.max(2.3, desiredDist - 0.85 * Math.sin(Math.min(1, dramaZoomTimer) * Math.PI));
      }

      const mapBlend = C.bS(1.3, 3, Math.log10(Math.max(1, desiredDist)));
      const pitch = (t.cp || 0.22) + (1.46 - (t.cp || 0.22)) * mapBlend;
      const yaw = (t.cy || 0) + C.Gu;
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

      // Right-shoulder vector perpendicular to yaw
      const rightX = -cosY, rightZ = sinY;
      const shoulderFactor = (C.tn || t.car || desiredDist > 12 || G.INT.on) ? 0 : (1 - C.bS(6, 12, desiredDist));
      const shoulderOff = mode.shoulder * shoulderFactor;

      // Precision 0.15m ray-march collision check against buildings
      let targetU = desiredDist;
      if (desiredDist < 42 && !G.INT.on) {
        for (let testU = desiredDist; testU > 1.15; testU -= 0.18) {
          const cx = fx + rightX * shoulderOff - sinY * testU * cosP;
          const cz = fz + rightZ * shoulderOff - cosY * testU * cosP;
          const hit = W.rt(cx, cz);
          if (!hit || baseH + testU * sinP > hit.h + 1.0) { targetU = testU; break; }
          targetU = 1.15;
        }
      }
      // Fast pull-in when hitting wall, smooth ease-out when clearing wall
      const pullRate = targetU < smoothDist ? 18 : 6.5;
      smoothDist += (targetU - smoothDist) * Math.min(1, dt * pullRate);

      // Subtle natural footstep head-bob & breathing when on foot at street level
      let bobY = 0, bobX = 0;
      if (!t.car && !C.Fi() && desiredDist < 12) {
        if (speed > 0.35) {
          const freq = speed > 4.2 ? 11.2 : 7.6;
          bobPhase += dt * freq;
          const amp = speed > 4.2 ? 0.042 : 0.022;
          bobY = Math.abs(Math.sin(bobPhase)) * amp;
          bobX = Math.cos(bobPhase * 0.5) * amp * 0.65;
        } else {
          bobPhase += dt * 1.6;
          bobY = Math.sin(bobPhase) * 0.008;
        }
      }

      let destX = fx + rightX * (shoulderOff + bobX) - sinY * smoothDist * cosP;
      let destY = baseH + smoothDist * sinP + 0.24 + bobY;
      let destZ = fz + rightZ * (shoulderOff + bobX) - cosY * smoothDist * cosP;

      if (G.INT.on && G.INT.R) {
        const R = G.INT.R;
        destX = C.tt(destX, G.INT.ox - R.hx + 0.38, G.INT.ox + R.hx - 0.38);
        destZ = C.tt(destZ, G.INT.oz - R.hz + 0.38, G.INT.oz + R.hz - 0.38);
        destY = Math.min(destY, R.H - 0.35);
      }

      const posLerp = Math.min(1, dt * 14);
      C.en.x += (destX - C.en.x) * posLerp;
      C.en.y += (destY - C.en.y) * posLerp;
      C.en.z += (destZ - C.en.z) * posLerp;

      // Smooth velocity look-ahead
      const laDist = C.tn ? 0 : (mode.lookAhead + (t.car ? Math.min(4.5, speed * 0.22) : 0)) * (1 - mapBlend);
      const tgtLookX = fx + rightX * (shoulderOff * 0.65) + sinY * laDist;
      const tgtLookZ = fz + rightZ * (shoulderOff * 0.65) + cosY * laDist;
      smoothLookX += (tgtLookX - smoothLookX) * Math.min(1, dt * 10);
      smoothLookZ += (tgtLookZ - smoothLookZ) * Math.min(1, dt * 10);
      if (Math.hypot(smoothLookX - fx, smoothLookZ - fz) > 40) { smoothLookX = tgtLookX; smoothLookZ = tgtLookZ; }

      const cam = G.camera;
      cam.position.copy(C.en);
      C.Vu.set(smoothLookX, baseH + 0.06 + bobY * 0.4, smoothLookZ);
      cam.lookAt(C.Vu);

      // Driver cockpit view when active
      if (G.COCK && G.COCK.on && t.car) {
        const car = t.car;
        const eye = C.Uo[car.type].eye;
        const sa = Math.sin(car.a), ca = Math.cos(car.a);
        const pitchM = C.tt((0.24 - t.cp) * 0.9, -0.6, 0.5) - 0.05;
        cam.position.set(car.x + ca * eye[0] + sa * eye[2], eye[1], car.z - sa * eye[0] + ca * eye[2]);
        C.Vu.set(
          cam.position.x + Math.sin(t.cy) * Math.cos(pitchM),
          cam.position.y + Math.sin(pitchM),
          cam.position.z + Math.cos(t.cy) * Math.cos(pitchM)
        );
        cam.lookAt(C.Vu);
        C.en.copy(cam.position);
      }

      // Dynamic Speed FOV for visceral movement & driving feel
      const targetFov = G.COCK && G.COCK.on && t.car ? 64
        : C.Fi() ? 56
        : t.car ? mode.fov + Math.min(12, speed * 0.55)
        : speed > 4.2 ? mode.sprintFov
        : mode.fov;
      smoothFov += (targetFov - smoothFov) * Math.min(1, dt * 5);

      const near = G.COCK && G.COCK.on ? 0.07 : G.INT.on ? 0.15 : C.tt(desiredDist * 0.04, 0.35, 20000);
      const far = Math.max(9000, desiredDist * 14 + 5000);
      if (Math.abs(cam.near - near) > near * 0.05 || Math.abs(cam.far - far) > far * 0.05 || Math.abs(cam.fov - smoothFov) > 0.12) {
        cam.fov = smoothFov;
        cam.near = near;
        cam.far = far;
        cam.updateProjectionMatrix();
      }

      // Atmospheric perspective fog & sky positioning
      if (scene.fog) {
        scene.fog.near = (G.SKY.w === "clear" ? 210 : 75) + desiredDist * 2.1;
        scene.fog.far = (G.SKY.w === "clear" ? 2200 : 760) + desiredDist * 16;
      }
      sky.scale.setScalar(Math.max(1, far * 0.85 / 7000));
      sky.position.copy(cam.position);

      // Update Sun Sprite & Ararat Billboard
      sunSprite.position.set(
        cam.position.x + sunDir.x * 5400,
        cam.position.y + sunDir.y * 5400,
        cam.position.z + sunDir.z * 5400
      );
      sunSprite.lookAt(cam.position);

      ararat.visible = desiredDist < 700 && !nightObj.on;
      ararat.position.set(cam.position.x + araratDir[0] * 5200, 300, cam.position.z + araratDir[1] * 5200);
      ararat.lookAt(cam.position.x, 300, cam.position.z);

      nightObj.lamp.position.set(t.x, 3.4, t.z);

      if ((t.drunk || 0) > 0.05) {
        cam.rotateZ(Math.sin(performance.now() * 0.0013) * 0.075 * Math.min(1.2, t.drunk));
      }
      if (C.ga > 0) {
        cam.position.x += (Math.random() - 0.5) * C.ga * 0.24;
        cam.position.y += (Math.random() - 0.5) * C.ga * 0.18;
        C.ga = Math.max(0, C.ga - dt * 2.2);
      }

      const fp = E.farPlane();
      if (fp) fp.visible = desiredDist > 6000;
      C.cw(Math.max(C.zr, C.xr));

      // Keep crisp shadows focused slightly ahead of the player
      const sx = t.x + sinY * 12, sz = t.z + cosY * 12;
      sun.target.position.set(sx, 0, sz);
      sun.position.set(sx + sunDir.x * 180, Math.max(30, sunDir.y * 180), sz + sunDir.z * 180);

      // Character sprint turn-banking & contact shadow
      const dA = C.wr(t.a, prevPlayerA);
      prevPlayerA = t.a;
      const targetBank = (!t.car && speed > 3.5) ? C.tt(-dA * 2.8, -0.14, 0.14) : 0;
      bankAngle += (targetBank - bankAngle) * Math.min(1, dt * 8);
      if (t.actor && t.actor.g && !t.car) {
        t.actor.g.rotation.z = bankAngle;
        playerShadow.visible = t.actor.g.visible && !G.INT.on;
        playerShadow.position.set(t.x, 0.035, t.z);
      } else {
        playerShadow.visible = false;
      }

      tuffBounce.position.set(t.x + sinY * 1.5, 2.2, t.z + cosY * 1.5);
      return true;
    };

    // =========================================================================
    // 4. LIVING YEREVAN STREET DRAMA DIRECTOR (6 PLAYABLE SCENARIOS!)
    // =========================================================================
    let activeDrama = null;
    let nextDramaTimer = 9; // First drama sparks fast so Yerevan feels instantly alive!
    let dramaBeaconMesh = null;
    let dramaCounter = 0;

    function addRespect(n) {
      state.respect = Math.max(0, state.respect + n);
      saveState();
      updateHyperHUD();
    }
    function addClout(n) {
      state.clout = Math.max(0, state.clout + n);
      saveState();
      updateHyperHUD();
    }

    function updateHyperHUD() {
      const rEl = UI.fe("respect");
      const cEl = UI.fe("clout");
      const rank = getRank();
      if (rEl) rEl.textContent = "🇦🇲 " + rank[1] + " · " + state.respect;
      if (cEl) cEl.textContent = "🔥 " + state.clout.toLocaleString("en-US");
    }
    updateHyperHUD();

    function getBeacon() {
      if (dramaBeaconMesh) return dramaBeaconMesh;
      const grp = new T.Group();
      const ring = new T.Mesh(
        new T.Cyl(1.4, 1.4, 0.22, 28, 1, true),
        new T.BasicMat({ color: 0xff453a, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false })
      );
      ring.position.y = 0.15;
      const beam = new T.Mesh(
        new T.Cyl(0.08, 0.35, 16, 12, 1, true),
        new T.BasicMat({ color: 0xff6b4a, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false })
      );
      beam.position.y = 8;
      grp.add(ring, beam);
      grp.visible = false;
      scene.add(grp);
      dramaBeaconMesh = grp;
      return grp;
    }

    function pickDramaActors(minCount, preferMixed) {
      const cands = G.walkers.filter(w =>
        w.actor && w.state === "walk" && !w.robbed && !w.hold && !w.dramaLock &&
        Math.hypot(w.x - P.x, w.z - P.z) > 10 && Math.hypot(w.x - P.x, w.z - P.z) < 62
      );
      if (cands.length < minCount) return null;
      // Sort by closest to a nice visible distance (~24m ahead)
      const camDir = new T.Vec3();
      G.camera.getWorldDirection(camDir);
      cands.sort((a, b) => {
        const da = Math.hypot(a.x - P.x, a.z - P.z), db = Math.hypot(b.x - P.x, b.z - P.z);
        const fa = ((a.x - P.x) * camDir.x + (a.z - P.z) * camDir.z) / (da || 1);
        const fb = ((b.x - P.x) * camDir.x + (b.z - P.z) * camDir.z) / (db || 1);
        return (Math.abs(da - 24) - fa * 16) - (Math.abs(db - 24) - fb * 16);
      });
      if (preferMixed) {
        const m = cands.find(w => w.male);
        const f = cands.find(w => !w.male);
        if (m && f) return [f, m];
      }
      return cands.slice(0, minCount);
    }

    function releaseDrama(nextWait) {
      if (!activeDrama) return;
      for (const a of activeDrama.actors || []) {
        a.dramaLock = false;
        if (a.state === "brawl" || a.state === "watch" || a.state === "stop") {
          a.ba = null; a.bs = 1; a.fall = 0; W.zi(a);
        }
      }
      for (const w of activeDrama.crowd || []) {
        w.dramaLock = false;
        if (w.state === "watch") { w.ba = null; w.bs = 1; W.zi(w); }
      }
      if (dramaBeaconMesh) dramaBeaconMesh.visible = false;
      activeDrama = null;
      nextDramaTimer = nextWait || (32 + Math.random() * 20);
      updateDramaBanner();
    }

    function faceEachOther(a, b, dt) {
      const angAB = Math.atan2(b.x - a.x, b.z - a.z);
      const angBA = Math.atan2(a.x - b.x, a.z - b.z);
      a.a += C.wr(angAB, a.a) * Math.min(1, dt * 8);
      b.a += C.wr(angBA, b.a) * Math.min(1, dt * 8);
    }

    function gatherCrowd(d, dt) {
      d.crowdT = (d.crowdT || 0) - dt;
      if (d.crowdT <= 0 && d.crowd.length < 5) {
        d.crowdT = 1.2;
        for (const w of G.walkers) {
          if (d.crowd.length >= 5) break;
          if (!w.actor || w.state !== "walk" || w.dramaLock || d.actors.includes(w)) continue;
          const dist = Math.hypot(w.x - d.x, w.z - d.z);
          if (dist > 3.2 && dist < 16) {
            w.dramaLock = true;
            w.state = "watch";
            w.ba = Math.random() < 0.45 ? "phone" : "wait";
            w.bs = 1;
            d.crowd.push(w);
          }
        }
      }
      for (const w of d.crowd) {
        if (!w.actor) continue;
        const ang = Math.atan2(d.x - w.x, d.z - w.z);
        w.a += C.wr(ang, w.a) * Math.min(1, dt * 6);
        const dist = Math.hypot(w.x - d.x, w.z - d.z);
        if (dist > 5.2) {
          const nx = w.x + Math.sin(ang) * 1.4 * dt, nz = w.z + Math.cos(ang) * 1.4 * dt;
          if (!W.rt(nx, nz)) { w.x = nx; w.z = nz; }
          w.ba = "walk";
        } else {
          w.ba = w.ba === "walk" ? (Math.random() < 0.5 ? "phone" : "wait") : w.ba;
        }
      }
    }

    const DRAMA_TYPES = ["lovers", "thief", "roadrage", "nardi", "vip"];

    function spawnDrama(forceType, forceNear) {
      if (G.INT.on || activeDrama) return false;
      const type = forceType || DRAMA_TYPES[dramaCounter % DRAMA_TYPES.length];
      dramaCounter++;

      const actors = pickDramaActors(2, type === "lovers");
      if (!actors) return false;
      const [a, b] = actors;

      // Position drama cleanly near the first actor (or 18m in front of player if forced)
      let cx = a.x, cz = a.z;
      if (forceNear) {
        const fx = P.x + Math.sin(P.a) * 18, fz = P.z + Math.cos(P.a) * 18;
        const [sx, sz] = snapToStreet(fx, fz);
        cx = sx; cz = sz;
        a.x = cx - 0.7; a.z = cz;
      }
      // Place actor B next to A cleanly
      const bx = cx + 1.35, bz = cz + 0.25;
      if (!W.rt(bx, bz)) { b.x = bx; b.z = bz; } else { b.x = cx - 1.35; b.z = cz; }

      for (const p of [a, b]) {
        p.dramaLock = true;
        p.cone = false;
        if (p.coneM) p.coneM.visible = false;
        p.fall = 0;
      }

      const d = {
        type, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2,
        actors: [a, b], crowd: [], t: 0, sayT: 0.6, turn: 0,
        resolved: false, chasing: false
      };

      if (type === "lovers") {
        d.title = "💔 Lovers' Meltdown";
        d.hy = "Սիրային Սկանդալ";
        d.sub = a.name + " & " + b.name + " are having a huge breakup scene!";
        d.prompt = "Step into Lovers' Drama · Խառնվել";
        a.state = b.state = "brawl"; a.ba = b.ba = "argue"; a.bs = 1.05; b.bs = 1.12;
        d.lines = [
          ["Ամո՛թ քեզ։", "Amot qez!", "Shame on you!"],
          ["Հանգիստ թող ինձ։", "Hangist togh indz.", "Leave me alone!"],
          ["Ի՞նչ ես անում։", "Inch es anum?", "What are you even doing?!"],
          ["Չէ՛, սխալ ես։", "Che, skhal es!", "No, you've got it all wrong!"],
          ["Հերի՛ք է։", "Herik e!", "That's enough!"]
        ];
        UI.Er(a, "Ամո՛թ քեզ։", "Amot qez!", "Shame on you!", 3.2);
      } else if (type === "thief") {
        d.title = "🏃 Pickpocket Chase!";
        d.hy = "Գո՛ղ!! Օգնությո՜ւն!!";
        d.sub = b.name + " snatched " + a.name + "'s bag! Sprint & press E or R to tackle!";
        d.prompt = "Tackle the Thief! · Բռնել գողին";
        d.chasing = true;
        a.state = "watch"; a.ba = "argue"; a.bs = 1.1;
        b.state = "brawl"; b.ba = "run"; b.bs = 1.25;
        b.fleeAngle = Math.atan2(b.x - P.x, b.z - P.z) + (Math.random() - 0.5) * 0.8;
        UI.Er(a, "Գո՛ղ։", "Gogh!", "THIEF!!", 3.6);
        setTimeout(() => { if (activeDrama === d && d.chasing) UI.Er(a, "Օգնությո՜ւն։", "Ognutyun!", "Somebody stop him!", 3.4); }, 1800);
      } else if (type === "roadrage") {
        d.title = "🚗 Yerevan Road Rage";
        d.hy = "Ճանապարհային Վեճ";
        d.sub = "Drivers shouting over a blocked lane — horns blaring!";
        d.prompt = "Step into Road Rage · Վեճ";
        a.state = b.state = "brawl"; a.ba = b.ba = "argue"; a.bs = 1.15; b.bs = 1.15;
        d.lines = [
          ["Մեքենա՛ս։", "Meqenas!", "My car!!"],
          ["Կո՞ւյր ես։", "Kuyr es?", "Are you blind?!"],
          ["Քեզ ի՞նչ։ Գնա քո գործին։", "Qez inch? Gna qo gortsin.", "Mind your own business!"],
          ["Ձեռքդ քաշի՛ր։", "Dzerqd qashir!", "Get your hands off me!"],
          ["Հիմա կտեսնես։", "Hima ktesnes.", "Now you're gonna see!"]
        ];
        UI.Er(a, "Մեքենա՛ս։", "Meqenas!", "My car!!", 3.2);
        if (G.SND && G.SND.horn) G.SND.horn();
      } else if (type === "nardi") {
        d.title = "🎲 High-Stakes Nardi Dispute";
        d.hy = "Նարդիի Սկանդալ";
        d.sub = a.name + " accused " + b.name + " of loaded dice for 5,000 ֏!";
        d.prompt = "Settle the Nardi Dispute · Նարդի";
        a.state = b.state = "brawl"; a.ba = b.ba = "argue"; a.bs = 1.0; b.bs = 1.1;
        d.lines = [
          ["Չէ՛, սխալ ես։", "Che, skhal es!", "No, you cheated!"],
          ["Ասացի՝ ոչ։", "Asatsi voch!", "I said NO!"],
          ["Հազար դրամ։", "Hazar dram!", "Put your money down!"],
          ["Դուրս արի՛։", "Durs ari!", "Step outside then!"]
        ];
        UI.Er(a, "Չէ՛, սխալ ես։", "Che, skhal es!", "No, you cheated!", 3.0);
      } else {
        d.title = "🍷 Saryan VIP Bar Showdown";
        d.hy = "VIP Սկանդալ";
        d.sub = "A loud VIP refuses to leave outside the bar!";
        d.prompt = "Handle the VIP Showdown · Խառնվել";
        a.state = b.state = "brawl"; a.ba = b.ba = "argue"; a.bs = 1.05; b.bs = 1.1;
        d.lines = [
          ["Դու շատ ես խմել։ Գնա տուն։", "Du shat es khmel. Gna tun.", "You drank too much. Go home!"],
          ["Քեզ ի՞նչ։ Գնա քո գործին։", "Qez inch? Gna qo gortsin.", "Do you know who I am?!"],
          ["Ասացի՝ ոչ։", "Asatsi voch.", "I said you're not getting in!"],
          ["Դուրս արի՛։", "Durs ari!", "Make me!"]
        ];
        UI.Er(a, "Դու շատ ես խմել։ Գնա տուն։", "Du shat es khmel. Gna tun.", "You've had too much. Go home!", 3.2);
      }

      activeDrama = d;
      HyperAudio.playDramaSting(type === "thief" || type === "roadrage");
      updateDramaBanner();
      UI.de("🔥 " + d.title, d.hy, d.sub + " (Press K for GPS)");
      return true;
    }

    function openDramaChoices(d) {
      const [a, b] = d.actors;
      const he = G.G();
      d.resolved = true;

      if (d.type === "lovers") {
        const opts = [
          {
            en: "Play Peacemaker («Ախպեր, ներողություն խնդրիր»)", hy: "Լավ, լավ, հերիք է։", tr: "Lav, lav, herik e.",
            fn: () => {
              UI._e(); he.dram += 3000; addRespect(14); addClout(45); state.dramas++;
              UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              UI.Er(b, "Լավ, հարց չկա։", "Lav, harts chka.", "You're right... I'm sorry.", 3.2);
              UI.de("💔→❤️ Drama Resolved!", "Խաղաղություն", "You smoothed things over! They hug and insist on buying your coffee (+3,000 ֏, +14 Respect).");
              releaseDrama(34);
            }
          },
          {
            en: "Stir the pot! (\"Wait—I saw him at Cabaret last night!\")", hy: "Ամո՛թ քեզ։", tr: "Amot qez!",
            fn: () => {
              UI._e(); addClout(180); state.dramas++; C.ga = 0.55; dramaZoomTimer = 1.0;
              HyperAudio.playCrowdGasp(false);
              UI.Er(a, "Հիմա կտեսնես։", "Hima ktesnes!!", "YOU WERE AT CABARET?!", 3.5);
              b.fall = 0.9;
              UI.de("🔥 TOTAL CHAOS · VIRAL IN YEREVAN!", "Սկանդալ!!", "She slaps him across Northern Ave while 6 people film it! (+180 Clout!)");
              setTimeout(() => releaseDrama(28), 3200);
            }
          },
          {
            en: "Film it for Yerevan Reels (+110 Clout, +2,500 ֏ ad tip)", hy: "Տեսախցիկ", tr: "Film for Clout",
            fn: () => {
              UI._e(); he.dram += 2500; addClout(110); state.dramas++; UI.gt(); UI.at(); G.SND.cash();
              UI.de("📱 42K Views in 10 Minutes!", "Երևան Թրենդ", "Your clip goes viral across Yerevan! (+110 Clout, +2,500 ֏)");
              releaseDrama(32);
            }
          }
        ];
        if (state.roses > 0) {
          opts.unshift({
            en: "🌹 Hand him your Red Roses to save their love! (+30 Respect, +8,000 ֏)", hy: "Վարդեր նվիրել", tr: "Give your roses",
            fn: () => {
              UI._e(); state.roses--; he.dram += 8000; addRespect(30); addClout(120); state.dramas++;
              saveState(); UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              UI.Er(a, "Վա՜յ։", "Vay!!", "Oh my god... roses!!", 3.4);
              UI.de("🌹 YEREVAN ROMANCE HERO!", "Կեցցե՛ս, ախպեր", "The whole crowd bursts into applause! He slips you 8,000 ֏ (+30 Respect, +120 Clout).");
              releaseDrama(35);
            }
          });
        }
        UI.$e(d.hy, d.title, null, ["Ամո՛թ քեզ։", "Amot qez!", a.name + " glares at " + b.name + " while a crowd films on their phones. What's your move?"], opts);
      } else if (d.type === "roadrage") {
        UI.$e(d.hy, d.title, null, ["Մեքենա՛ս։", "Meqenas!", "Two Yerevan drivers are nose-to-nose screaming while traffic backs up!"], [
          {
            en: "Calm them down («Ախպերներ, ամոթ է, մարդիկ են նայում»)", hy: "Լավ, լավ, հերիք է։", tr: "Lav, lav, herik e.",
            fn: () => {
              UI._e(); he.dram += 4000; addRespect(15); addClout(50); state.dramas++;
              UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              UI.Er(a, "Լավ, հարց չկա։", "Lav, harts chka.", "Fine, bro. Respect to you.", 3.0);
              UI.de("🤝 Traffic Cleared Like a Boss!", "Ախպեր ջան", "Both drivers shake hands and honk in salute. (+4,000 ֏, +15 Respect)");
              releaseDrama(34);
            }
          },
          {
            en: "Hype up the fight! (\"Don't let him talk to you like that!\")", hy: "Դուրս արի՛։", tr: "Durs ari!",
            fn: () => {
              UI._e(); addClout(150); state.dramas++; C.ga = 0.5; dramaZoomTimer = 1.0;
              HyperAudio.playCrowdGasp(false);
              UI.Er(b, "Հիմա կտեսնես։", "Hima ktesnes!", "Now you'll see!", 3.2);
              releaseDrama(26);
              if (G.REAL && G.REAL.brawlNow) G.REAL.brawlNow(true);
              UI.de("🥊 IT'S ON!!", "Կռիվ փողոցում", "You poured gasoline on the fire! Fists start flying (+150 Clout).");
            }
          },
          {
            en: "Call the Police to fine both of them!", hy: "Ոստիկանություն", tr: "Call Police",
            fn: () => {
              UI._e(); addRespect(8); addClout(75); state.dramas++;
              UI.Er(a, "Կանգնի՛ր։ Ոստիկանություն։", "Vostikanutyun!", "Uh oh, police!!", 3.0);
              UI.de("🚓 Police Dispatched!", "Տուգանք", "Both drivers scramble back to their cars in panic! (+8 Respect, +75 Clout)");
              releaseDrama(32);
            }
          }
        ]);
      } else if (d.type === "nardi") {
        UI.$e(d.hy, d.title, null, ["Չէ՛, սխալ ես։", "Che, skhal es!", "Loaded dice accusation! The crowd wants YOU to settle the 5,000 ֏ pot."], [
          {
            en: "Roll the tie-breaker dice yourself! (Win 5,000 ֏!)", hy: "Խաղալ նարդի", tr: "Roll Nardi",
            fn: () => {
              UI._e(); state.dramas++;
              playQuickNardi(b.name, 5000);
              releaseDrama(34);
            }
          },
          {
            en: "Rule it a draw & declare peace (+10 Respect)", hy: "Լավ, հերիք է։", tr: "Call a draw",
            fn: () => {
              UI._e(); addRespect(10); addClout(35); state.dramas++;
              UI.de("⚖️ Fair Referee!", "Հարգանք", "Both elders nod in respect and pour you Armenian coffee. (+10 Respect)");
              releaseDrama(34);
            }
          },
          {
            en: "Accuse BOTH of cheating! (Pure Chaos +140 Clout)", hy: "Ամո՛թ ձեզ։", tr: "Both cheated!",
            fn: () => {
              UI._e(); addClout(140); state.dramas++; HyperAudio.playCrowdGasp(false);
              UI.Er(b, "Քեզ ի՞նչ։ Գնա քո գործին։", "Qez inch?!", "Mind your own business!!", 3.0);
              G.startFight(b);
              UI.de("🎲 TABLE FLIPPED!!", "Կռիվ!!", b.name + " squares up with you! Press R to defend yourself! (+140 Clout)");
              releaseDrama(36);
            }
          }
        ]);
      } else if (d.type === "vip") {
        UI.$e(d.hy, d.title, null, ["Դու շատ ես խմել։ Գնա տուն։", "Du shat es khmel. Gna tun.", "A flashy VIP is yelling at the bouncer on Saryan Street!"], [
          {
            en: "Help the bouncer escort him out (+6,000 ֏ bonus, +12 Respect)", hy: "Դուրս արի՛։", tr: "Help Bouncer",
            fn: () => {
              UI._e(); he.dram += 6000; addRespect(12); addClout(70); state.dramas++; C.ga = 0.4;
              UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              b.fall = 0.8;
              UI.de("💪 Bouncer Bonus!", "Շնորհակալություն, ախպեր", "You handled the VIP cleanly. The bouncer slips you 6,000 ֏! (+12 Respect)");
              setTimeout(() => releaseDrama(32), 2000);
            }
          },
          {
            en: "Cover his 4,000 ֏ tab & make a rich VIP ally (+22 Respect, +130 Clout)", hy: "Ես եմ վճարում", tr: "Cover his tab", right: UI.Ie(4000),
            fn: () => {
              if (UI.Oa(4000)) return;
              UI._e(); he.dram -= 4000; addRespect(22); addClout(130); state.dramas++;
              UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
              UI.Er(b, "Բարև, ախպեր ջան։", "Akhper jan!!", "You're a real brother!!", 3.2);
              UI.de("🍷 Saryan Street Legend!", "Կենա՛ցդ", "The whole patio raises a glass to you! (+22 Respect, +130 Clout)");
              releaseDrama(35);
            }
          },
          {
            en: "Film the meltdown (+120 Clout)", hy: "Տեսախցիկ", tr: "Film it",
            fn: () => {
              UI._e(); addClout(120); state.dramas++;
              UI.de("📹 Yerevan Nightlife Viral Clip!", "Թրենդ", "The VIP demands you delete it — which makes it even funnier. (+120 Clout)");
              releaseDrama(30);
            }
          }
        ]);
      }
    }

    function tackleThief(d) {
      const [victim, thief] = d.actors;
      const he = G.G();
      d.chasing = false;
      d.resolved = true;
      thief.fall = 1.0;
      thief.ba = "wait";
      C.ga = 0.7;
      dramaZoomTimer = 1.1;
      G.SND.hit && G.SND.hit(0.95);
      HyperAudio.playCrowdGasp(true);
      UI.Er(thief, "Վա՜յ։", "Vay!!", "Ow! I give up!", 2.8);

      setTimeout(() => {
        UI.$e("Բռնեցի՛ր գողին", "You Tackled the Pickpocket!", null,
          ["Լավ, լավ, հերիք է։", "Lav, lav, herik e!", "You wrestled the stolen bag back from " + thief.name + ". Inside is 25,000 ֏ cash!"],
          [
            {
              en: "Return the bag to " + victim.name + " (+12,000 ֏ reward, +28 Respect, +140 Clout)", hy: "Վերադարձնել պայուսակը", tr: "Return the bag",
              fn: () => {
                UI._e(); he.dram += 12000; state.thieves++; state.dramas++;
                addRespect(28); addClout(140); UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
                UI.de("🦸 YEREVAN STREET HERO!", "Ապրե՛ս, ախպեր ջան", victim.name + " is overjoyed and rewards you 12,000 ֏! The street cheers! (+28 Respect)");
                releaseDrama(36);
              }
            },
            {
              en: "Keep the 25,000 ֏ and walk away (-10 Respect, 1 Wanted Star)", hy: "Պահել գումարը", tr: "Keep the cash",
              fn: () => {
                UI._e(); he.dram += 25000; state.dramas++;
                addRespect(-10); addClout(90); UI.gt(); UI.at(); G.SND.cash(); UI.$a(1);
                UI.de("💸 Shady Payday (+25,000 ֏)", "Զգո՛ւյշ", "Someone spotted you pocketing the cash — 1 star, move fast!");
                releaseDrama(36);
              }
            }
          ]
        );
      }, 450);
    }

    function openBrawlIntervention(sc) {
      const he = G.G();
      UI.$e("Փողոցային Կռիվ", "Live Yerevan Street Brawl!", null,
        ["Հիմա կտեսնես։", "Hima ktesnes!", sc.a.name + " and " + sc.b.name + " are trading punches while the crowd roars!"],
        [
          {
            en: "Step in & break up the fight! (+18 Respect, +60 Clout)", hy: "Հերի՛ք է։", tr: "Herik e!",
            fn: () => {
              UI._e(); addRespect(18); addClout(60); state.dramas++; HyperAudio.playCrowdGasp(true);
              sc.ph = "out"; sc.t = 0; sc.fight = false;
              UI.Er(sc.a, "Լավ, լավ, հերիք է։", "Lav, lav, herik e.", "Alright bro, out of respect for you.", 3.0);
              UI.de("🕊️ Peacemaker of Kentron!", "Հարգանք", "Both guys back down out of respect for you! (+18 Respect, +60 Clout)");
            }
          },
          {
            en: "Bet 3,000 ֏ on " + sc.a.name + " to win! (Double or nothing)", hy: "Գրազ գալ", tr: "Place a bet", right: UI.Ie(3000),
            fn: () => {
              if (UI.Oa(3000)) return;
              UI._e(); he.dram -= 3000; UI.gt(); UI.at(); addClout(90);
              const win = Math.random() < 0.58;
              setTimeout(() => {
                if (win) {
                  he.dram += 6000; UI.gt(); UI.at(); G.SND.cash(); HyperAudio.playCrowdGasp(true);
                  UI.de("💰 BET WON! +6,000 ֏", "Կեցցե՛ս", sc.a.name + " landed the knockout! The bystander pays up!");
                } else {
                  UI.de("😅 Bet Lost", "Մյուս անգամ", sc.b.name + " turned the tables!");
                }
              }, 2600);
            }
          },
          {
            en: "Film the brawl for Yerevan Reels (+130 Clout)", hy: "Տեսախցիկ", tr: "Film for Clout",
            fn: () => {
              UI._e(); addClout(130); state.dramas++;
              UI.de("🔥 Viral Street Clip!", "Երևան Թրենդ", "Your front-row footage explodes online! (+130 Clout)");
            }
          },
          { en: "Step back and watch", hy: "", tr: "", fn: () => UI._e() }
        ]
      );
    }

    function getActiveDramaCoords() {
      if (activeDrama) return { x: activeDrama.x, z: activeDrama.z, title: activeDrama.title, hy: activeDrama.hy };
      const sc = G.REAL && G.REAL.bw && G.REAL.bw.sc;
      if (sc && sc.a && sc.b) return { x: (sc.a.x + sc.b.x) / 2, z: (sc.a.z + sc.b.z) / 2, title: "🥊 Street Brawl", hy: "Կռիվ" };
      return null;
    }

    function updateDramaBanner() {
      const bar = UI.fe("dramaBar");
      if (!bar) return;
      const d = getActiveDramaCoords();
      if (!d || G.INT.on || G.ui.open === "start") {
        bar.classList.remove("on");
        return;
      }
      const dist = Math.round(Math.hypot(d.x - P.x, d.z - P.z));
      UI.fe("dramaTitle").textContent = d.title + " · " + d.hy;
      UI.fe("dramaSub").textContent = dist < 8 ? "Right next to you — press E to jump in!" : dist + " m away · Walk over or press K for GPS";
      bar.classList.add("on");
    }

    function triggerDramaRadar() {
      if (G.INT.on) { UI.de("Go outside first", "", "Street drama happens out on the avenues of Yerevan!"); return; }
      let d = getActiveDramaCoords();
      if (!d) {
        const ok = spawnDrama(null, true);
        if (!ok && G.REAL && G.REAL.brawlNow) { G.REAL.brawlNow(true); }
        d = getActiveDramaCoords();
      }
      if (d) {
        W.pa(d.x, d.z, d.title);
        updateDramaBanner();
      } else {
        UI.de("Scanning Yerevan…", "Որոնում", "Walk a few steps toward Northern Ave or Republic Square and press K again!");
      }
    }

    const dramaGoBtn = UI.fe("dramaGo");
    if (dramaGoBtn) dramaGoBtn.addEventListener("click", triggerDramaRadar);
    const bDramaBtn = UI.fe("bDrama");
    if (bDramaBtn) bDramaBtn.addEventListener("click", triggerDramaRadar);

    function updateDramaTick(dt) {
      if (G.INT.on) {
        if (dramaBeaconMesh) dramaBeaconMesh.visible = false;
        updateDramaBanner();
        return;
      }
      if (!activeDrama) {
        nextDramaTimer -= dt;
        if (nextDramaTimer <= 0) {
          if (!spawnDrama()) nextDramaTimer = 6;
        }
        updateDramaBanner();
        return;
      }

      const d = activeDrama;
      const [a, b] = d.actors;
      if (!a.actor || !b.actor) { releaseDrama(15); return; }
      d.t += dt;

      if (d.type === "thief" && d.chasing) {
        // Thief flees along streets away from player
        const away = Math.atan2(b.x - P.x, b.z - P.z);
        b.fleeAngle += C.wr(away, b.fleeAngle) * Math.min(1, dt * 1.4);
        const spd = 4.6;
        const nx = b.x + Math.sin(b.fleeAngle) * spd * dt;
        const nz = b.z + Math.cos(b.fleeAngle) * spd * dt;
        if (!W.rt(nx, nz)) { b.x = nx; b.z = nz; }
        else { b.fleeAngle += 1.1; }
        b.a = b.fleeAngle;
        b.ba = "run"; b.bs = 1.25;
        d.x = b.x; d.z = b.z;
        // Victim faces thief
        a.a = Math.atan2(b.x - a.x, b.z - a.z);
        if (d.t > 34 || Math.hypot(b.x - P.x, b.z - P.z) > 105) {
          UI.de("The thief got away!", "Փախավ", "Next time hold Shift to sprint or intercept by car!");
          releaseDrama(26);
          return;
        }
      } else if (!d.resolved) {
        faceEachOther(a, b, dt);
        d.x = (a.x + b.x) / 2;
        d.z = (a.z + b.z) / 2;
        gatherCrowd(d, dt);
        d.sayT -= dt;
        if (d.sayT <= 0 && d.lines) {
          d.sayT = 2.6 + Math.random() * 1.2;
          const line = d.lines[d.turn % d.lines.length];
          const speaker = d.turn % 2 === 0 ? a : b;
          d.turn++;
          if (Math.hypot(d.x - P.x, d.z - P.z) < 42) {
            UI.Er(speaker, line[0], line[1], line[2], 2.5);
          }
          if (d.type === "roadrage" && Math.random() < 0.45 && Math.hypot(d.x - P.x, d.z - P.z) < 35) {
            G.SND && G.SND.horn && G.SND.horn();
          }
        }
        if (d.t > 55 || Math.hypot(d.x - P.x, d.z - P.z) > 110) {
          releaseDrama(24);
          return;
        }
      }

      // Pulse 3D Drama Beacon
      const beacon = getBeacon();
      beacon.visible = true;
      beacon.position.set(d.x, 0, d.z);
      const pulse = 1 + Math.sin(performance.now() * 0.007) * 0.14;
      beacon.scale.set(pulse, 1, pulse);
      updateDramaBanner();
    }

    // Hook Phone menu to add Yerevan Drama & Culture hub!
    if (G.REAL && typeof G.REAL.phone === "function") {
      const origPhone = G.REAL.phone;
      G.REAL.phone = function () {
        const list = origPhone.apply(this, arguments) || [];
        const rank = getRank();
        list.unshift({
          en: "🔥 Yerevan Drama & Culture · " + rank[2] + " (" + state.clout + " Clout)",
          hy: "Երևանի Դրամա և Մշակույթ",
          tr: "Drama & Culture",
          fn: () => {
            UI.$e("Երևանի Կյանք", rank[1] + " · " + rank[2] + " · " + state.respect + " Respect · " + state.clout + " Clout", null,
              ["Բարև, ախպեր ջան։", "Barev, akhper jan.", "Dramas resolved: " + state.dramas + " · Thieves caught: " + state.thieves + " · Nardi wins: " + state.nardiWins + " · Roses: " + state.roses],
              [
                { en: "🔥 Spark Live Drama Ahead & Set GPS", hy: "Դրամա հիմա", tr: "Drama now", fn: () => { UI._e(); triggerDramaRadar(); } },
                { en: "💧 GPS to Nearest Pulpulak (Free Cold Water)", hy: "Մոտակա պուլպուլակ", tr: "Nearest Pulpulak", fn: () => { UI._e(); gpsNearestCulture("pulpulak"); } },
                { en: "🎵 GPS to Nearest Duduk Musician", hy: "Դուդուկահար", tr: "Nearest Duduk", fn: () => { UI._e(); gpsNearestCulture("duduk"); } },
                { en: "🫓 GPS to Tonir Lavash Bakery", hy: "Թոնիր լավաշ", tr: "Tonir Lavash", fn: () => { UI._e(); gpsNearestCulture("lavash"); } },
                { en: "🍷 GPS to Fresh Pomegranate Juice", hy: "Նռան հյութ", tr: "Pomegranate Juice", fn: () => { UI._e(); gpsNearestCulture("pomegranate"); } },
                { en: "🌹 GPS to Rose Seller", hy: "Ծաղիկներ", tr: "Rose Seller", fn: () => { UI._e(); gpsNearestCulture("flowers"); } },
                { en: "Close", hy: "", tr: "", fn: () => UI._e() }
              ]
            );
          }
        });
        return list;
      };
    }

    function gpsNearestCulture(kind) {
      let best = null, bestD = 1e9;
      for (const s of cultureSpots) {
        if (s.kind !== kind) continue;
        const d = Math.hypot(s.x - P.x, s.z - P.z);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best) W.pa(best.x, best.z, best.name + " · " + best.hy);
    }

    // =========================================================================
    // 5. INTERACT (E / R) & PROMPT HOOKS FOR CULTURE & DRAMA
    // =========================================================================
    function findNearbyTarget() {
      if (G.INT.on || P.car) return null;
      // Priority 1: Active Drama (especially fleeing thief!)
      if (activeDrama && !activeDrama.resolved) {
        const dist = Math.hypot(activeDrama.x - P.x, activeDrama.z - P.z);
        if (dist < (activeDrama.chasing ? 3.8 : 4.8)) {
          return { type: "drama", obj: activeDrama, prompt: activeDrama.prompt };
        }
      }
      // Priority 2: Active j.brawl fight
      const sc = G.REAL && G.REAL.bw && G.REAL.bw.sc;
      if (sc && sc.a && sc.b && (sc.ph === "argue" || sc.ph === "fight")) {
        const mx = (sc.a.x + sc.b.x) / 2, mz = (sc.a.z + sc.b.z) / 2;
        if (Math.hypot(mx - P.x, mz - P.z) < 4.6) {
          return { type: "brawl", obj: sc, prompt: "Step into the Street Fight · Խառնվել" };
        }
      }
      // Priority 3: Culture Spot (Pulpulak, Lavash, Pomegranate, Flowers, Duduk)
      let best = null, bestD = 3.5;
      for (const s of cultureSpots) {
        const d = Math.hypot(s.x - P.x, s.z - P.z);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best) return { type: "culture", obj: best, prompt: best.prompt };
      return null;
    }

    window.__hyperPrompt = function (items) {
      if (G.INT.on || C.Fi()) return;
      const t = findNearbyTarget();
      if (t) {
        items.unshift(["E", t.prompt]);
      }
    };

    window.__hyperActE = function () {
      const t = findNearbyTarget();
      if (!t) return false;
      if (t.type === "drama") {
        if (t.obj.chasing) tackleThief(t.obj);
        else openDramaChoices(t.obj);
        return true;
      }
      if (t.type === "brawl") {
        openBrawlIntervention(t.obj);
        return true;
      }
      if (t.type === "culture") {
        t.obj.act();
        return true;
      }
      return false;
    };

    // Extra hotkeys: B = 3rd-person camera mode, K = Drama Radar, R tackles thief when close!
    window.addEventListener("keydown", (ev) => {
      if (G.ui.open) return;
      const k = ev.key.toLowerCase();
      if (k === "b" && !ev.repeat) {
        applyCamPreset(camModeIdx + 1);
      } else if (k === "k" && !ev.repeat) {
        triggerDramaRadar();
      } else if (k === "r" && !ev.repeat && activeDrama && activeDrama.chasing) {
        if (Math.hypot(activeDrama.x - P.x, activeDrama.z - P.z) < 4.2) {
          tackleThief(activeDrama);
        }
      }
    });

    // =========================================================================
    // 6. BETTER GOOGLE MAPS (HYBRID / STREET VECTOR / SATELLITE + FILTERS + MINIMAP)
    // =========================================================================
    let mapLayer = state.mapLayer || "hybrid";
    let mapCat = "all";

    // Wire up Google Maps Layer Switcher & Category Filter Chips
    document.querySelectorAll("#mlayers button").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.layer === mapLayer);
      btn.addEventListener("click", () => {
        mapLayer = btn.dataset.layer;
        state.mapLayer = mapLayer;
        saveState();
        document.querySelectorAll("#mlayers button").forEach(b => b.classList.toggle("on", b === btn));
        M.Rn();
      });
    });

    function buildFilteredMapList() {
      const listEl = UI.fe("mlist");
      const q = (UI.fe("mq").value || "").trim().toLowerCase();
      if (!listEl) return;
      listEl.textContent = "";

      const entries = [];
      // Live Drama always at top when active or filtered
      const d = getActiveDramaCoords();
      if (d) {
        entries.push({ n: d.title, sub: d.hy + " · LIVE NOW · " + Math.round(Math.hypot(d.x - P.x, d.z - P.z)) + " m", x: d.x, z: d.z, cat: "drama", prio: 0 });
      }
      // Culture & Pulpulaks
      for (const s of cultureSpots) {
        entries.push({
          n: (s.kind === "pulpulak" ? "💧 " : s.kind === "duduk" ? "🎵 " : s.kind === "lavash" ? "🫓 " : s.kind === "flowers" ? "🌹 " : "🍷 ") + s.name,
          sub: s.hy + " · " + Math.round(Math.hypot(s.x - P.x, s.z - P.z)) + " m",
          x: s.x, z: s.z,
          cat: s.kind === "pulpulak" ? "pulpulak" : "culture",
          prio: 1
        });
      }
      // Existing places, panoramas, landmarks, stores, streets
      for (const p of G.places) {
        entries.push({
          n: p.name || p.M.en,
          sub: p.M.hy + " · " + Math.round(Math.hypot(p.x - P.x, p.z - P.z)) + " m",
          x: p.x, z: p.z,
          cat: p.kind === "club" ? "b" : p.kind,
          prio: p.special ? 1 : 3
        });
      }
      for (const l of W.bn.L || []) {
        entries.push({ n: "🏛️ " + l[0], sub: "Yerevan Landmark · " + Math.round(Math.hypot(l[1] - P.x, l[2] - P.z)) + " m", x: l[1], z: l[2], cat: "land", prio: 2 });
      }
      for (const f of W.Fa || []) {
        if (f.pano) entries.push({ n: "📷 " + f.en, sub: f.hy + " · 360° Street View", x: f.x, z: f.z, pano: f, cat: "land", prio: 2 });
      }
      if (q) {
        for (const st of G.stores || []) {
          const sx = (st.p || st).x, sz = (st.p || st).z;
          entries.push({ n: st.n, sub: W.Cu[st.cat][0], x: sx, z: sz, cat: "store", prio: 4 });
        }
        for (const str of W.bn.N || []) {
          entries.push({ n: str[0], sub: str[1] + " · Street", x: str[2][0][0], z: str[2][0][1], cat: "street", prio: 4 });
        }
      }

      const filtered = entries.filter(e => {
        if (mapCat !== "all" && e.cat !== mapCat) return false;
        if (!q) return mapCat !== "all" || e.prio <= 2;
        return e.n.toLowerCase().includes(q) || (e.sub && e.sub.toLowerCase().includes(q));
      });
      filtered.sort((a, b) => a.prio - b.prio || Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));

      if (!filtered.length && mapCat === "drama") {
        const btn = document.createElement("button");
        btn.className = "mit";
        btn.innerHTML = "🔥 No active drama right this second<small>Click to spark live Yerevan drama now!</small>";
        btn.onclick = () => { UI._e(); triggerDramaRadar(); };
        listEl.appendChild(btn);
        return;
      }

      for (const a of filtered.slice(0, 48)) {
        const btn = document.createElement("button");
        btn.className = "mit";
        btn.textContent = a.n;
        if (a.sub) {
          const sm = document.createElement("small");
          sm.textContent = a.sub;
          btn.appendChild(sm);
        }
        btn.addEventListener("click", () => {
          G.MV.x = a.x; G.MV.z = a.z;
          G.MV.s = a.pano ? Math.max(G.MV.s, 0.004) : Math.max(G.MV.s, 2.2);
          M.ld(a.x, a.z, a.n.replace(/^[^\w\u0530-\u058F]+/, ""), a.pano);
          enhanceMapPopup();
        });
        listEl.appendChild(btn);
      }
    }

    document.querySelectorAll("#mchips .mchip").forEach(chip => {
      chip.addEventListener("click", () => {
        mapCat = chip.dataset.cat;
        document.querySelectorAll("#mchips .mchip").forEach(c => c.classList.toggle("on", c === chip));
        buildFilteredMapList();
        M.Rn();
      });
    });

    const mqInput = UI.fe("mq");
    if (mqInput) mqInput.addEventListener("input", buildFilteredMapList);

    const mDramaBtn = UI.fe("mDramaBtn");
    if (mDramaBtn) mDramaBtn.addEventListener("click", () => {
      const d = getActiveDramaCoords();
      if (d) {
        G.MV.x = d.x; G.MV.z = d.z; G.MV.s = Math.max(G.MV.s, 2.5);
        M.ld(d.x, d.z, d.title);
        enhanceMapPopup();
        M.Rn();
      } else {
        UI._e();
        triggerDramaRadar();
      }
    });

    function enhanceMapPopup() {
      const sel = G.MV.sel;
      if (!sel) return;
      const dist = Math.hypot(sel.x - P.x, sel.z - P.z);
      if (M.Gg(sel.x, sel.z) && !sel.pano) {
        const walkMin = Math.max(1, Math.round(dist / 78));
        const driveMin = Math.max(1, Math.round(dist / 420));
        const distTxt = dist > 950 ? (dist / 1000).toFixed(2) + " km" : Math.round(dist) + " m";
        UI.fe("mpS").textContent = `🚶 ${walkMin} min walk · 🚗 ${driveMin} min drive · ${distTxt}`;
      }
    }

    // Refresh custom list when map opens & support direct click-on-pin for Drama & Culture spots
    let mDownPt = null;
    M.Ar.addEventListener("pointerdown", (ev) => { mDownPt = [ev.clientX, ev.clientY]; });
    M.Ar.addEventListener("pointerup", (ev) => {
      const moved = mDownPt ? Math.hypot(ev.clientX - mDownPt[0], ev.clientY - mDownPt[1]) : 99;
      mDownPt = null;
      if (moved < 6) {
        const wpt = M.Vg(ev.clientX, ev.clientY);
        const hitR = 22 / Math.max(0.01, G.MV.s);
        const liveD = getActiveDramaCoords();
        if (liveD && Math.hypot(liveD.x - wpt[0], liveD.z - wpt[1]) < hitR * 1.4) {
          setTimeout(() => { M.ld(liveD.x, liveD.z, liveD.title + " · " + liveD.hy); enhanceMapPopup(); }, 10);
          return;
        }
        for (const s of cultureSpots) {
          if (Math.hypot(s.x - wpt[0], s.z - wpt[1]) < hitR) {
            setTimeout(() => { M.ld(s.x, s.z, s.name + " · " + s.hy); enhanceMapPopup(); }, 10);
            return;
          }
        }
      }
      setTimeout(enhanceMapPopup, 15);
    });
    const mapObserver = new MutationObserver(() => {
      if (UI.fe("map").classList.contains("on")) {
        buildFilteredMapList();
        M.Rn();
      }
    });
    mapObserver.observe(UI.fe("map"), { attributes: true, attributeFilter: ["class"] });

    function drawTeardropPin(ctx, x, y, color, glyph, big) {
      const r = big ? 11 : 7.5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - r - 4, r, Math.PI * 0.82, Math.PI * 0.18, false);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = big ? 2.2 : 1.6;
      ctx.stroke();
      if (glyph) {
        ctx.fillStyle = "#ffffff";
        ctx.font = (big ? "700 11px " : "700 9px ") + "system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(glyph, x, y - r - 3.5);
      }
      ctx.restore();
    }

    function updateScaleBar(scale) {
      const txtEl = UI.fe("mscaleTxt");
      const barEl = document.querySelector("#mscale i");
      if (!txtEl || !barEl) return;
      const targetMeters = 80 / Math.max(1e-5, scale);
      const nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000];
      let meters = nice[0];
      for (const n of nice) if (n <= targetMeters * 1.4) meters = n;
      const px = Math.max(28, Math.min(130, meters * scale));
      barEl.style.width = Math.round(px) + "px";
      txtEl.textContent = meters >= 1000 ? (meters / 1000) + " km" : meters + " m";
    }

    // Full-screen Google Maps Renderer Hook
    window.__hyperMap = function () {
      const ze = G.MV;
      const canvas = M.Ar;
      const Wpx = canvas.width = window.innerWidth;
      const Hpx = canvas.height = window.innerHeight;
      const ctx = M.ES;
      const toScreen = (wx, wz) => [(wx - ze.x) * ze.s + Wpx / 2, (wz - ze.z) * ze.s + Hpx / 2];
      const inView = (p, pad = 30) => p[0] > -pad && p[1] > -pad && p[0] < Wpx + pad && p[1] < Hpx + pad;

      ctx.imageSmoothingQuality = "high";

      // 1. Base Layer: Satellite / Hybrid vs Crisp Google Vector Street Map
      if (mapLayer === "street" && ze.s > 0.12) {
        ctx.fillStyle = "#1b222c";
        ctx.fillRect(0, 0, Wpx, Hpx);

        // Soft park/plaza tint around Opera, Cascade, English Park, Circular Park
        ctx.fillStyle = "#1f382d";
        for (const [px, pz, rad] of [[290, -290, 95], [185, -630, 85], [-45, 635, 110], [540, 690, 85], [345, -780, 75]]) {
          const sp = toScreen(px, pz);
          ctx.beginPath(); ctx.arc(sp[0], sp[1], rad * ze.s, 0, 6.2832); ctx.fill();
        }

        // Render real building footprints from W.Em!
        ctx.fillStyle = "#293342";
        ctx.strokeStyle = "#364457";
        ctx.lineWidth = ze.s > 1.5 ? 1 : 0.6;
        for (const b of W.Em) {
          const p0 = toScreen(b.x0, b.z0), p1 = toScreen(b.x1, b.z1);
          if (p1[0] < 0 || p0[0] > Wpx || p1[1] < 0 || p0[1] > Hpx) continue;
          ctx.beginPath();
          for (let i = 0; i < b.P.length; i++) {
            const pt = toScreen(b.P[i][0], b.P[i][1]);
            if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
          }
          ctx.closePath();
          ctx.fill();
          if (ze.s > 0.9) ctx.stroke();
        }
      } else {
        ctx.fillStyle = "#10151c";
        ctx.fillRect(0, 0, Wpx, Hpx);
        M.SS.forEach((lvl, idx) => {
          const pxPerTile = ze.s * lvl.W / 1280;
          if (idx > 0 && pxPerTile < 0.42) return;
          const orig = toScreen(lvl.x0, lvl.z0);
          const tw = lvl.W * ze.s, th = lvl.H * ze.s;
          for (let r = 0; r < lvl.r; r++) {
            for (let c = 0; c < lvl.c; c++) {
              const x = orig[0] + c * tw, y = orig[1] + r * th;
              if (x > Wpx || y > Hpx || x + tw < 0 || y + th < 0) continue;
              const img = M.TS(lvl, c, r);
              if (img.complete && img.naturalWidth) ctx.drawImage(img, x, y, tw + 0.6, th + 0.6);
            }
          }
        });
      }

      // 2. Google Maps Road Network Overlay (Hybrid & Street modes!)
      if (mapLayer !== "sat" && ze.s > 0.25) {
        const isStreet = mapLayer === "street";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const road of W.Vr) {
          if (!road.pts || road.pts.length < 2) continue;
          const w = Math.max(1.5, (road.half || 3) * 1.45 * ze.s);
          ctx.beginPath();
          let anyIn = false;
          for (let i = 0; i < road.pts.length; i++) {
            const pt = toScreen(road.pts[i][0], road.pts[i][1]);
            if (inView(pt, 100)) anyIn = true;
            if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
          }
          if (!anyIn) continue;
          if (road.cls === "trunk" || road.cls === "avenue") {
            ctx.strokeStyle = isStreet ? "#d69e36" : "rgba(248, 200, 96, 0.36)";
            ctx.lineWidth = w * (isStreet ? 1.15 : 0.68);
          } else if (road.road) {
            ctx.strokeStyle = isStreet ? "#506075" : "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = w * (isStreet ? 0.95 : 0.52);
          } else {
            ctx.strokeStyle = isStreet ? "#3c4c5d" : "rgba(180, 220, 255, 0.16)";
            ctx.lineWidth = Math.max(1.2, w * 0.42);
          }
          ctx.stroke();
        }
      }

      // 3. Armenia National Border when zoomed out
      if (ze.s < 0.05 && window.ARM) {
        ctx.lineJoin = "round";
        for (const [col, lw] of [["rgba(0,0,0,.65)", 4.5], ["#8ab4f8", 2]]) {
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
          for (const poly of window.ARM) {
            poly.forEach((pt, idx) => {
              const d = W.qa(pt[0], pt[1]);
              const sp = toScreen(d[0], d[1]);
              if (idx) ctx.lineTo(sp[0], sp[1]); else ctx.moveTo(sp[0], sp[1]);
            });
          }
          ctx.stroke();
        }
      }

      // Google Maps-style bounding-box label declutterer (zero overlapping text!)
      const placedBoxes = [];
      const drawLabel = (text, x, y, color, big, force) => {
        ctx.font = (big ? "700 13.5px " : "600 11.5px ") + "system-ui,sans-serif";
        const tw = ctx.measureText(text).width + 10;
        const th = big ? 18 : 15;
        const x0 = x - tw / 2, y0 = y - th + 3, x1 = x + tw / 2, y1 = y + 4;
        if (!force) {
          for (const b of placedBoxes) {
            if (x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]) return false;
          }
        }
        placedBoxes.push([x0, y0, x1, y1]);
        ctx.textAlign = "center";
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(8,12,18,0.9)";
        ctx.strokeText(text, x, y);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        return true;
      };

      // Country / Regional Panorama Pins when zoomed out
      if (ze.s < 0.25) {
        for (const f of W.Fa) {
          if (f.en === "Armenia" ? ze.s > 0.0012 : ze.s < 9e-4 || (!f.pano && ze.s > 0.03 && f.en !== "Yerevan")) continue;
          const sp = toScreen(f.x, f.z);
          if (f.pano) drawTeardropPin(ctx, sp[0], sp[1], "#f4b04a", "📷", true);
          drawLabel(f.en, sp[0], sp[1] - (f.pano ? 28 : 10), f.pano ? "#ffd28a" : "#ffffff", true);
        }
      }

      // 4. Google Maps Vivid Blue GPS Route Ribbon!
      const yt = W.yt();
      if (ze.s > 0.08 && yt && yt.path && yt.path.length > 1) {
        ctx.save();
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        yt.path.forEach((p, idx) => {
          const sp = toScreen(p[0], p[1]);
          if (idx) ctx.lineTo(sp[0], sp[1]); else ctx.moveTo(sp[0], sp[1]);
        });
        ctx.strokeStyle = "#174ea6"; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = "#4285f4"; ctx.lineWidth = 5.5; ctx.stroke();
        ctx.setLineDash([8, 10]);
        ctx.lineDashOffset = -(performance.now() * 0.03);
        ctx.strokeStyle = "#d2e3fc"; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.restore();
      }

      // 5. Priority-ordered Pins & Decluttered Labels
      if (ze.s > 0.08) {
        // Live traffic dots
        if (ze.s > 0.9) {
          ctx.fillStyle = "rgba(255,255,255,0.68)";
          for (const car of G.cars) {
            if (car.parked) continue;
            const sp = toScreen(car.x, car.z);
            if (!inView(sp, 10)) continue;
            ctx.beginPath(); ctx.arc(sp[0], sp[1], 2.5, 0, 6.2832); ctx.fill();
          }
        }

        // Subtle POI dots (only at closer zoom or when filtered so map stays clean!)
        for (const o of G.places) {
          const catMatch = mapCat === "all" || mapCat === o.kind || (mapCat === "b" && o.kind === "club");
          if (!catMatch) continue;
          if (!o.special && o.kind !== "club" && mapCat === "all" && ze.s < 2.1) continue;
          const sp = toScreen(o.x, o.z);
          if (!inView(sp)) continue;
          const col = o.kind === "club" ? "#d946ef" : o.special ? "#f59e0b" : o.kind === "r" ? "#f97316" : o.kind === "b" ? "#8b5cf6" : "#0ea5e9";
          const glyph = o.kind === "c" ? "☕" : o.kind === "b" || o.kind === "club" ? "🍷" : o.kind === "r" ? "🍽" : "★";
          if (o.special || ze.s > 2.4 || mapCat !== "all") {
            drawTeardropPin(ctx, sp[0], sp[1], col, glyph, o.special);
          } else {
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(sp[0], sp[1], 3.5, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1; ctx.stroke();
          }
        }

        // Armenian Culture Spots & Pulpulaks pins
        for (const s of cultureSpots) {
          const isPulp = s.kind === "pulpulak";
          if (mapCat !== "all" && ((isPulp && mapCat !== "pulpulak") || (!isPulp && mapCat !== "culture"))) continue;
          if (mapCat === "all" && ze.s < 0.75) continue;
          const sp = toScreen(s.x, s.z);
          if (!inView(sp)) continue;
          const col = isPulp ? "#06b6d4" : s.kind === "duduk" ? "#eab308" : "#e11d48";
          const glyph = isPulp ? "💧" : s.kind === "duduk" ? "🎵" : s.kind === "lavash" ? "🫓" : s.kind === "flowers" ? "🌹" : "🍷";
          drawTeardropPin(ctx, sp[0], sp[1], col, glyph, !isPulp || mapCat === "pulpulak");
        }

        // LIVE DRAMA PULSING MARKER (Highest label priority!)
        const liveD = getActiveDramaCoords();
        if (liveD) {
          const sp = toScreen(liveD.x, liveD.z);
          if (inView(sp, 60)) {
            const pulse = (performance.now() % 1400) / 1400;
            ctx.save();
            ctx.beginPath();
            ctx.arc(sp[0], sp[1], 10 + pulse * 26, 0, 6.2832);
            ctx.strokeStyle = `rgba(255,75,62,${(1 - pulse) * 0.9})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
            drawTeardropPin(ctx, sp[0], sp[1], "#e2362b", "🔥", true);
            drawLabel(liveD.title + " · LIVE", sp[0], sp[1] - 30, "#ff9e92", true, true);
          }
        }

        // Priority 2 Labels: Major Yerevan Landmarks
        if (ze.s > 0.45 && (mapCat === "all" || mapCat === "land")) {
          for (const l of W.bn.L) {
            const sp = toScreen(l[1], l[2]);
            if (inView(sp)) drawLabel(l[0], sp[0], sp[1], "#ffffff", true);
          }
        }

        // Priority 3 Labels: Culture Spots & Pulpulaks
        for (const s of cultureSpots) {
          const isPulp = s.kind === "pulpulak";
          if (mapCat !== "all" && ((isPulp && mapCat !== "pulpulak") || (!isPulp && mapCat !== "culture"))) continue;
          if (ze.s > 1.35 || mapCat !== "all") {
            const sp = toScreen(s.x, s.z);
            if (inView(sp)) drawLabel(s.name, sp[0], sp[1] - 25, isPulp ? "#a5f3fc" : "#fde68a", false);
          }
        }

        // Priority 4 Labels: Special Places
        for (const o of G.places) {
          const catMatch = mapCat === "all" || mapCat === o.kind || (mapCat === "b" && o.kind === "club");
          if (!catMatch) continue;
          if ((o.special && ze.s > 0.45) || ze.s > 2.6 || mapCat !== "all") {
            const sp = toScreen(o.x, o.z);
            if (inView(sp)) drawLabel(o.name || o.M.en, sp[0], sp[1] - (o.special ? 27 : 20), "#fff6e5", false);
          }
        }

        // Priority 5 Labels: Street Names
        if (ze.s > 1.05 && mapLayer !== "sat") {
          for (const st of W.bn.N) {
            const p = st[2][0];
            const sp = toScreen(p[0], p[1]);
            if (inView(sp)) drawLabel(st[0], sp[0], sp[1], "#c7d8ee", false);
          }
        }

        // OSM Stores at high zoom
        if (ze.s > 2.9 && mapCat === "all") {
          for (const st of G.stores) {
            if (st.p) continue;
            const sp = toScreen(st.x, st.z);
            if (!inView(sp)) continue;
            ctx.fillStyle = "#e8f0fe";
            ctx.beginPath(); ctx.arc(sp[0], sp[1], 2.8, 0, 6.2832); ctx.fill();
            if (ze.s > 4.4) drawLabel(st.n, sp[0], sp[1] - 7, "#e8f0fe", false);
          }
        }

        // Police beacons
        for (const cop of G.cops) {
          const sp = toScreen(cop.x, cop.z);
          if (!inView(sp)) continue;
          ctx.fillStyle = ((performance.now() / 240) | 0) % 2 ? "#3b82f6" : "#ef4444";
          ctx.beginPath(); ctx.arc(sp[0], sp[1], 7, 0, 6.2832); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        }
      }

      // 6. Iconic Google Maps Blue User Dot + Directional Vision Cone
      const pSp = toScreen(P.x, P.z);
      ctx.save();
      ctx.translate(pSp[0], pSp[1]);
      const coneRot = Math.PI - (P.cy || P.a);
      ctx.rotate(coneRot);
      const coneGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      coneGrad.addColorStop(0, "rgba(66,133,244,0.48)");
      coneGrad.addColorStop(1, "rgba(66,133,244,0)");
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 46, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.beginPath(); ctx.arc(pSp[0], pSp[1], 10, 0, 6.2832);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.beginPath(); ctx.arc(pSp[0], pSp[1], 7.2, 0, 6.2832);
      ctx.fillStyle = "#4285f4"; ctx.fill();

      // Selected Pin & Popup positioning
      if (ze.sel) {
        const sp = toScreen(ze.sel.x, ze.sel.z);
        drawTeardropPin(ctx, sp[0], sp[1], "#ea4335", "●", true);
        const pop = UI.fe("mpop");
        if (pop) {
          pop.style.left = C.tt(sp[0] - 145, 10, Wpx - 304) + "px";
          pop.style.top = C.tt(sp[1] + 12, 60, Hpx - 165) + "px";
        }
      }

      updateScaleBar(ze.s);
      // Keep pulsing animations alive smoothly while map is open
      if (getActiveDramaCoords() || yt) {
        setTimeout(() => { if (G.ui.open === "map") M.Rn(); }, 90);
      }
      return true;
    };

    // Upgraded Google Maps-Style Circular Minimap!
    window.__hyperMini = function () {
      const ctx = M.pt;
      const t = 352, r = 215;
      const n = -1.5 * W.Rs, i = -2 * W.Ps, s = t / (2 * r);
      const toM = (wx, wz) => [(wx - P.x + r) * s, (wz - P.z + r) * s];

      ctx.save();
      ctx.clearRect(0, 0, t, t);
      ctx.beginPath();
      ctx.arc(t / 2, t / 2, t / 2, 0, 6.2832);
      ctx.clip();
      ctx.fillStyle = "#18202c";
      ctx.fillRect(0, 0, t, t);

      // Satellite base tiles
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          const hx = n + col * W.Rs, dz = i + row * W.Ps;
          if (hx > P.x + r || hx + W.Rs < P.x - r || dz > P.z + r || dz + W.Ps < P.z - r) continue;
          const tile = M.PS(col, row);
          if (tile.complete && tile.naturalWidth) {
            ctx.drawImage(tile, 0, 0, 1280, 720, (hx - P.x + r) * s, (dz - P.z + r) * s, W.Rs * s, W.Ps * s);
          }
        }
      }

      // Subtle Google Maps tint overlay for crisp readability
      ctx.fillStyle = "rgba(12,18,28,0.16)";
      ctx.fillRect(0, 0, t, t);

      // Google Blue GPS Route Ribbon
      const yt = W.yt();
      if (yt && yt.path) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        yt.path.forEach((p, idx) => {
          const u = toM(p[0], p[1]);
          if (idx) ctx.lineTo(u[0], u[1]); else ctx.moveTo(u[0], u[1]);
        });
        ctx.strokeStyle = "#174ea6"; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = "#4285f4"; ctx.lineWidth = 5.5; ctx.stroke();
      }

      // Places (clean subtle dots for normal spots, prominent rings for special spots)
      for (const l of G.places) {
        if (Math.abs(l.x - P.x) > r || Math.abs(l.z - P.z) > r) continue;
        const u = toM(l.x, l.z);
        ctx.globalAlpha = l.special ? 1 : 0.65;
        ctx.fillStyle = l.kind === "club" ? "#d946ef" : l.special ? "#f59e0b" : l.kind === "r" ? "#f97316" : l.kind === "b" ? "#8b5cf6" : "#38bdf8";
        ctx.beginPath(); ctx.arc(u[0], u[1], l.special ? 6.2 : 2.8, 0, 6.2832); ctx.fill();
        if (l.special) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.stroke(); }
      }
      ctx.globalAlpha = 1;

      // Pulpulaks & Culture spots
      for (const cs of cultureSpots) {
        if (Math.abs(cs.x - P.x) > r || Math.abs(cs.z - P.z) > r) continue;
        const u = toM(cs.x, cs.z);
        ctx.fillStyle = cs.kind === "pulpulak" ? "#06b6d4" : "#facc15";
        ctx.beginPath(); ctx.arc(u[0], u[1], 5.2, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "#111"; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Live Drama Pulsing Crimson Ping (clamped to rim if further away so you always see direction!)
      const liveD = getActiveDramaCoords();
      if (liveD) {
        const dx = liveD.x - P.x, dz = liveD.z - P.z;
        const dist = Math.hypot(dx, dz) || 1;
        const clamped = dist > r * 0.88;
        const ux = clamped ? (t / 2 + (dx / dist) * (t * 0.43)) : toM(liveD.x, liveD.z)[0];
        const uz = clamped ? (t / 2 + (dz / dist) * (t * 0.43)) : toM(liveD.x, liveD.z)[1];
        const pulse = (performance.now() % 1100) / 1100;
        ctx.beginPath(); ctx.arc(ux, uz, 7 + pulse * 14, 0, 6.2832);
        ctx.strokeStyle = `rgba(255,69,58,${1 - pulse})`; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "#ff3b30"; ctx.beginPath(); ctx.arc(ux, uz, 7, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      }

      // Police blips
      for (const cop of G.cops) {
        const u = toM(cop.x, cop.z);
        ctx.fillStyle = ((performance.now() / 260) | 0) % 2 ? "#3b82f6" : "#ef4444";
        ctx.beginPath(); ctx.arc(u[0], u[1], 7, 0, 6.2832); ctx.fill();
      }

      // Google Maps Blue Dot + Vision Cone in center
      ctx.save();
      ctx.translate(t / 2, t / 2);
      ctx.rotate(Math.PI - (P.cy || P.a));
      const cone = ctx.createRadialGradient(0, 0, 6, 0, 0, 62);
      cone.addColorStop(0, "rgba(66,133,244,0.52)");
      cone.addColorStop(1, "rgba(66,133,244,0)");
      ctx.fillStyle = cone;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 62, -Math.PI * 0.72, -Math.PI * 0.28); ctx.closePath(); ctx.fill();
      ctx.restore();

      ctx.beginPath(); ctx.arc(t / 2, t / 2, 11, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.beginPath(); ctx.arc(t / 2, t / 2, 7.8, 0, 6.2832); ctx.fillStyle = "#4285f4"; ctx.fill();

      // Crisp North compass badge
      ctx.fillStyle = "rgba(12,16,24,0.85)";
      ctx.beginPath(); ctx.arc(t / 2, 22, 14, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#ff5b4d";
      ctx.font = "800 17px system-ui,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("N", t / 2, 23);

      ctx.restore();
      return true;
    };

    // =========================================================================
    // 7. MAIN FRAME TICK: ANIMATE FLAGS, WATER, STEAM, DUST, DUDUK & DRAMA!
    // =========================================================================
    let simTime = 0, audioSynced = false;
    window.__hyperTick = function (dt, paused) {
      if (!window.__ready) return;
      if (!propsBuilt) buildAllCultureProps();
      simTime += dt;

      // Animate waving Armenian Tricolour Flags
      for (const f of wavingFlags) {
        const attr = f.mesh.geometry.attributes.position;
        const base = f.basePos;
        for (let i = 0; i < attr.count; i++) {
          const x = base[i * 3];
          const w = Math.sin(simTime * 5.2 - x * 2.6 + f.ph) * 0.12 * (x / 2.3);
          attr.setZ(i, w);
        }
        attr.needsUpdate = true;
      }

      // Animate Pulpulak Water Streams
      for (const w of waterStreams) {
        const pulse = 0.88 + Math.sin(simTime * 14 + w.ph) * 0.14;
        w.arc.scale.set(pulse, 1, pulse);
        w.splash.scale.setScalar(0.85 + Math.sin(simTime * 9 + w.ph) * 0.22);
      }

      // Animate Tonir Lavash Steam Puffs
      for (const sp of steamPuffs) {
        const cycle = (simTime * 0.45 + sp.ph) % 1;
        sp.mesh.position.set(
          sp.bx + Math.sin(simTime * 1.4 + sp.ph) * 0.18 * cycle,
          1.45 + cycle * 1.6,
          sp.bz + Math.cos(simTime * 1.1 + sp.ph) * 0.15 * cycle
        );
        sp.mesh.scale.setScalar(0.45 + cycle * 1.35);
        sp.mesh.material.opacity = (1 - cycle) * 0.28;
      }

      // Grounded AO Contact Shadows under EVERY nearby pedestrian & cop (zero floating NPCs!)
      if (!G.INT.on) {
        let count = 0;
        const { im, CAP, mat4, pos, quat, scl } = crowdShadows;
        for (const w of G.walkers) {
          if (count >= CAP) break;
          if (!w.actor || !w.actor.g.visible) continue;
          const dx = w.x - P.x, dz = w.z - P.z;
          if (dx * dx + dz * dz > 58 * 58) continue;
          pos.set(w.x, 0.032, w.z);
          mat4.compose(pos, quat, scl);
          im.setMatrixAt(count++, mat4);
        }
        for (const cop of G.cops) {
          if (count >= CAP) break;
          pos.set(cop.x, 0.032, cop.z);
          mat4.compose(pos, quat, scl);
          im.setMatrixAt(count++, mat4);
        }
        im.count = count;
        im.instanceMatrix.needsUpdate = true;
        im.visible = count > 0;
      } else {
        crowdShadows.im.visible = false;
      }

      // Animate gliding Yerevan Swallows high over Northern Ave & Republic Square
      for (const sw of swallows) {
        const ang = simTime * sw.spd + sw.ph;
        const bx = sw.cx + Math.cos(ang) * sw.rad;
        const bz = sw.cz + Math.sin(ang) * sw.rad;
        const by = sw.h + Math.sin(ang * 2.1) * 1.4;
        sw.g.position.set(bx, by, bz);
        sw.g.rotation.y = -ang;
        sw.g.rotation.z = 0.25;
        const flap = Math.sin(simTime * 11 + sw.ph) * 0.45;
        sw.lW.rotation.y = flap;
        sw.rW.rotation.y = -flap;
      }

      // Keep artificial game checkpoint rings invisible on the pavement
      if (W.Vm) for (const r of W.Vm) if (r && r.material && r.material.opacity !== 0) r.material.opacity = 0;

      // Animate Sunlit Dust Motes around player
      if (dustSystem.mat.opacity > 0.01 && !G.INT.on) {
        dustSystem.pts.visible = true;
        dustSystem.pts.position.set(P.x, 0, P.z);
        const attr = dustSystem.pts.geometry.attributes.position;
        for (let i = 0; i < dustSystem.N; i++) {
          const ph = dustSystem.phases[i];
          const y = 0.5 + ((dustSystem.pos[i * 3 + 1] + simTime * 0.18 + Math.sin(simTime + ph) * 0.15) % 5.2);
          attr.setY(i, y);
        }
        attr.needsUpdate = true;
      } else {
        dustSystem.pts.visible = false;
      }

      // Clean Easy Chill / Armenian Music / Lounge Player & Volume Sync
      if (!audioSynced && E.audio && E.audio.ctx) {
        audioSynced = true;
        HyperAudio.applyVolumes();
      }
      HyperAudio.tick(dt);

      // Update Living Drama Director
      if (!paused) {
        updateDramaTick(dt);
      }
    };

    // Expose Hyper API for debugging/testing
    window.__hyper = {
      state,
      applyCamPreset,
      spawnDrama,
      triggerDramaRadar,
      setMapLayer: (l) => { mapLayer = l; M.Rn(); },
      setMusicMode: (m) => HyperAudio.setMode(m),
      cultureSpots,
      getActiveDrama: () => activeDrama,
      applySkyPolish
    };
  }

  boot();
})();

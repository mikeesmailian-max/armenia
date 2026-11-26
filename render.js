// Walk Armenia — AAA Multi-Pass HDR GPU Post-Processing, PBR Shaders & Cinema 3rd-Person Rendering Engine
(() => {
  "use strict";

  const GFX_KEY = "walk-armenia-gfx-v1";
  let gfxMode = "ultra"; // "ultra" | "balanced" | "native"
  try {
    const saved = localStorage.getItem(GFX_KEY);
    if (saved === "ultra" || saved === "balanced" || saved === "native") gfxMode = saved;
  } catch {}

  const FS_VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  // Pass 2: Soft-Knee HDR Bright-Pass Extraction
  const BRIGHT_FRAG = `
    uniform sampler2D tDiffuse;
    uniform float uThresh;
    uniform float uKnee;
    varying vec2 vUv;
    void main() {
      vec3 c = max(texture2D(tDiffuse, vUv).rgb, vec3(0.0));
      float br = max(c.r, max(c.g, c.b));
      float rq = clamp(br - uThresh + uKnee, 0.0, 2.0 * uKnee);
      rq = (0.25 / max(uKnee, 0.0001)) * rq * rq;
      float weight = max(rq, br - uThresh) / max(br, 0.0001);
      // Warm optical highlight weighting
      vec3 outC = c * max(weight, 0.0) * vec3(1.06, 1.01, 0.94);
      gl_FragColor = vec4(min(outC, vec3(6.0)), 1.0);
    }
  `;

  // Pass 3: Wide 9-Tap Separable Gaussian Optical Blur
  const BLUR_FRAG = `
    uniform sampler2D tDiffuse;
    uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
      sum += (texture2D(tDiffuse, vUv + uDir * 1.3846).rgb + texture2D(tDiffuse, vUv - uDir * 1.3846).rgb) * 0.316216;
      sum += (texture2D(tDiffuse, vUv + uDir * 3.2308).rgb + texture2D(tDiffuse, vUv - uDir * 3.2308).rgb) * 0.070270;
      gl_FragColor = vec4(sum, 1.0);
    }
  `;

  // Pass 4: Cinema Master Composite — FidelityFX CAS Sharpening + Optical Bloom + 35mm Bokeh DoF + Lens Rain + ACES Filmic
  const COMPOSITE_FRAG = `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBloom;
    uniform vec2 uTexel;
    uniform float uExposure;
    uniform float uBloomStrength;
    uniform float uSharp;
    uniform float uTime;
    uniform float uWarmth;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uDof;
    uniform float uRainLens;
    varying vec2 vUv;

    // ACES Filmic Tone Mapping with silky highlight roll-off
    vec3 acesFilmic(vec3 x) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    // Subtle 35mm camera-lens raindrop refraction beads
    vec2 rainDropOffset(vec2 uv, float t) {
      vec2 grid = uv * vec2(11.0, 6.2);
      float colId = floor(grid.x);
      float dropY = grid.y + t * (0.45 + 0.35 * hash12(vec2(colId, 3.7)));
      vec2 cell = vec2(colId, floor(dropY));
      vec2 f = vec2(fract(grid.x), fract(dropY)) - 0.5;
      float seed = hash12(cell);
      if (seed < 0.62) return vec2(0.0);
      vec2 ctr = vec2((seed - 0.8) * 0.65, 0.0);
      vec2 d = f - ctr;
      d.y *= 1.45;
      float r = length(d);
      float m = smoothstep(0.19, 0.03, r);
      return -d * m * 0.022;
    }

    void main() {
      vec2 uv = vUv;
      if (uRainLens > 0.01) {
        uv = clamp(uv + rainDropOffset(vUv, uTime) * uRainLens, vec2(0.001), vec2(0.999));
      }

      vec2 dc = uv - 0.5;
      float r2 = dot(dc, dc);

      // Subtle 35mm radial corner chromatic dispersion (zero blur at center!)
      vec2 caOff = dc * r2 * 0.0022;
      vec3 c;
      c.r = texture2D(tDiffuse, uv + caOff).r;
      c.g = texture2D(tDiffuse, uv).g;
      c.b = texture2D(tDiffuse, uv - caOff).b;

      // GPU 35mm Cinematic Depth-of-Field Bokeh (focuses on center subject during conversations, drama & photo mode)
      if (uDof > 0.01) {
        float coc = smoothstep(0.14, 0.52, length(dc * vec2(1.0, 1.25))) * uDof;
        if (coc > 0.01) {
          vec2 rad = uTexel * (coc * 6.5);
          vec3 acc = c * 0.2;
          acc += texture2D(tDiffuse, clamp(uv + vec2( 1.0,  0.0) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2(-1.0,  0.0) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2( 0.0,  1.0) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2( 0.0, -1.0) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2( 0.707,  0.707) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2(-0.707,  0.707) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2( 0.707, -0.707) * rad, 0.001, 0.999)).rgb * 0.1;
          acc += texture2D(tDiffuse, clamp(uv + vec2(-0.707, -0.707) * rad, 0.001, 0.999)).rgb * 0.1;
          c = mix(c, acc, clamp(coc * 1.15, 0.0, 1.0));
        }
      }

      // FidelityFX Contrast-Adaptive Sharpening (5-tap micro-detail pop)
      if (uSharp > 0.001) {
        vec3 n = texture2D(tDiffuse, uv + vec2(0.0, uTexel.y)).rgb;
        vec3 s = texture2D(tDiffuse, uv - vec2(0.0, uTexel.y)).rgb;
        vec3 e = texture2D(tDiffuse, uv + vec2(uTexel.x, 0.0)).rgb;
        vec3 w = texture2D(tDiffuse, uv - vec2(uTexel.x, 0.0)).rgb;
        vec3 mn = min(c, min(min(n, s), min(e, w)));
        vec3 mx = max(c, max(max(n, s), max(e, w)));
        vec3 amp = clamp(min(mn, 2.0 - mx) / max(mx, vec3(0.0001)), 0.0, 1.0);
        amp = sqrt(amp);
        float k = -0.145 * uSharp * (1.0 - uDof * 0.65);
        vec3 wt = amp * k;
        c = max((c + (n + s + e + w) * wt) / (1.0 + 4.0 * wt), vec3(0.0));
      }

      // Add silky optical HDR bloom
      vec3 bloom = texture2D(tBloom, uv).rgb;
      c += bloom * uBloomStrength;

      // Exposure & ACES Filmic Tone Map
      c *= uExposure;
      c = acesFilmic(c);

      // Cinema Split-Tone Grading: cool sky shadows + warm Yerevan golden-tuff highlights
      float luma = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 shadowTint = vec3(0.955, 0.985, 1.055);
      vec3 highTint   = mix(vec3(1.03, 1.005, 0.96), vec3(1.08, 0.985, 0.91), uWarmth);
      c *= mix(shadowTint, highTint, smoothstep(0.08, 0.85, luma));

      // Gentle photographic S-curve & rich natural color saturation
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.16);
      float l2 = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l2), c, 1.09);

      // Natural 35mm optical lens vignette
      float vig = 1.0 - smoothstep(0.18, 0.88, r2 * 1.45) * uVignette;
      c *= vig;

      // sRGB output encoding
      c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));

      // Subtle dynamic 35mm photographic grain (in perceptual sRGB space for clean night shadows)
      if (uGrain > 0.0001) {
        float g = (hash12(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * uGrain;
        c = clamp(c + vec3(g), 0.0, 1.0);
      }

      gl_FragColor = vec4(c, 1.0);
    }
  `;

  function bootRender() {
    const G = window.__game;
    const H = window.__hyper;
    if (!G || !G._ext || !H || !G._ext.THREE.RT) { setTimeout(bootRender, 70); return; }

    const E = G._ext;
    const T = E.THREE;
    const { scene, renderer, sunDir, nightObj } = E;
    const P = G.player;
    const UI = E.ui;
    const isGL2 = !!(renderer.capabilities && renderer.capabilities.isWebGL2);

    // =========================================================================
    // 1. MULTI-PASS HDR GPU POST-PROCESSING COMPOSITOR
    // =========================================================================
    const fsCam = new T.OrthoCam(-1, 1, 1, -1, 0, 1);
    const fsGeo = new T.BufGeo();
    fsGeo.setAttribute("position", new T.F32Attr(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    fsGeo.setAttribute("uv", new T.F32Attr(new Float32Array([0, 0, 2, 0, 0, 2]), 2));

    const brightMat = new T.ShaderMat({
      uniforms: { tDiffuse: { value: null }, uThresh: { value: 0.90 }, uKnee: { value: 0.35 } },
      vertexShader: FS_VERT, fragmentShader: BRIGHT_FRAG, depthTest: false, depthWrite: false
    });
    const blurMat = new T.ShaderMat({
      uniforms: { tDiffuse: { value: null }, uDir: { value: new T.Vec2(1 / 320, 0) } },
      vertexShader: FS_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false
    });
    const compMat = new T.ShaderMat({
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        uTexel: { value: new T.Vec2(1 / 1280, 1 / 720) },
        uExposure: { value: 1.15 },
        uBloomStrength: { value: 0.28 },
        uSharp: { value: 0.85 },
        uTime: { value: 0 },
        uWarmth: { value: 0.55 },
        uVignette: { value: 0.24 },
        uGrain: { value: 0.016 },
        uDof: { value: 0.0 },
        uRainLens: { value: 0.0 }
      },
      vertexShader: FS_VERT, fragmentShader: COMPOSITE_FRAG, depthTest: false, depthWrite: false
    });

    const roadUniforms = {
      uWetness: { value: 0.0 },
      uRainActive: { value: 0.0 },
      uRainTime: { value: 0.0 }
    };
    const fxState = { wetness: 0, rainActive: 0, rainLens: 0, dofOverride: 0, dofCur: 0 };

    const fsQuad = new T.Mesh(fsGeo, compMat);
    fsQuad.frustumCulled = false;
    const fsScene = new T.Scene();
    fsScene.add(fsQuad);

    let rtScene = null, rtBloomA = null, rtBloomB = null;
    let curW = 0, curH = 0, postFailed = false;
    const drawSize = new T.Vec2();

    function ensureTargets() {
      renderer.getDrawingBufferSize(drawSize);
      const w = Math.max(2, Math.floor(drawSize.x));
      const h = Math.max(2, Math.floor(drawSize.y));
      if (rtScene && curW === w && curH === h) return;
      curW = w; curH = h;
      if (rtScene) rtScene.dispose();
      if (rtBloomA) rtBloomA.dispose();
      if (rtBloomB) rtBloomB.dispose();

      const rtOpts = {
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
        type: T.HalfFloat,
        depthBuffer: true
      };
      if (isGL2 && gfxMode === "ultra") rtOpts.samples = 4;
      rtScene = new T.RT(w, h, rtOpts);

      const bw = Math.max(64, w >> 2), bh = Math.max(64, h >> 2);
      const bloomOpts = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, type: T.HalfFloat, depthBuffer: false };
      rtBloomA = new T.RT(bw, bh, bloomOpts);
      rtBloomB = new T.RT(bw, bh, bloomOpts);
      compMat.uniforms.uTexel.value.set(1 / w, 1 / h);
    }

    // =========================================================================
    // 2. WORLD-SPACE PBR SHADER INJECTIONS (GROUND-CONTACT AO + WET PUDDLES & RIPPLES!)
    // =========================================================================
    let shadersPatched = false;
    function injectWorldPBRShaders() {
      if (shadersPatched) return;
      if (!nightObj.gf || !G.REAL || !G.REAL.roads || !G.REAL.roads.length) return;
      shadersPatched = true;

      // A. Architectural Ground-to-Wall Contact Ambient Occlusion on EVERY Yerevan shopfront!
      const gf = nightObj.gf;
      gf.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vAOwp;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAOwp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vAOwp;")
          .replace("#include <color_fragment>", `
            #include <color_fragment>
            float baseAO = mix(0.58, 1.0, smoothstep(0.0, 2.3, vAOwp.y));
            diffuseColor.rgb *= baseAO;
          `);
      };
      gf.needsUpdate = true;

      // B. Procedural World-Space Travertine / Asphalt Micro-Roughness, Mirror Wet Puddles & Animated Rain Ripples!
      for (const roadMat of G.REAL.roads) {
        if (!roadMat || roadMat._hyperSheen) continue;
        roadMat._hyperSheen = true;
        roadMat.envMapIntensity = Math.max(roadMat.envMapIntensity || 1.0, 1.9);
        roadMat.onBeforeCompile = (sh) => {
          sh.uniforms.uWetness = roadUniforms.uWetness;
          sh.uniforms.uRainActive = roadUniforms.uRainActive;
          sh.uniforms.uRainTime = roadUniforms.uRainTime;
          sh.vertexShader = sh.vertexShader
            .replace("#include <common>", "#include <common>\nvarying vec3 vRoadWP;")
            .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRoadWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
          sh.fragmentShader = sh.fragmentShader
            .replace("#include <common>", `
              #include <common>
              varying vec3 vRoadWP;
              uniform float uWetness;
              uniform float uRainActive;
              uniform float uRainTime;
              float rHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
              float rNoise(vec2 p){
                vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                return mix(mix(rHash(i),rHash(i+vec2(1,0)),f.x),mix(rHash(i+vec2(0,1)),rHash(i+vec2(1,1)),f.x),f.y);
              }
            `)
            .replace("#include <color_fragment>", `
              #include <color_fragment>
              if (uWetness > 0.01) {
                float pN = rNoise(vRoadWP.xz * 0.09) * 0.65 + rNoise(vRoadWP.xz * 0.28 + 3.1) * 0.35;
                float puddle = smoothstep(0.46, 0.72, pN) * uWetness;
                // Wet travertine / asphalt darkens naturally with water absorption
                diffuseColor.rgb *= mix(1.0, 0.56, clamp(uWetness * 0.55 + puddle * 0.45, 0.0, 0.85));
                // Subtle shimmering raindrop rings inside puddles
                if (uRainActive > 0.05 && puddle > 0.15) {
                  vec2 rc = vRoadWP.xz * 1.45;
                  vec2 ri = floor(rc);
                  vec2 rf = fract(rc) - 0.5;
                  float ph = fract(uRainTime * 1.35 + rHash(ri));
                  float ring = smoothstep(0.05, 0.0, abs(length(rf) - ph * 0.46)) * (1.0 - ph);
                  diffuseColor.rgb += vec3(0.11, 0.13, 0.16) * ring * puddle * uRainActive;
                }
              }
            `)
            .replace("#include <roughnessmap_fragment>", `
              #include <roughnessmap_fragment>
              float n1 = rNoise(vRoadWP.xz * 0.14);
              float n2 = rNoise(vRoadWP.xz * 0.65 + 4.1);
              float wear = n1 * 0.65 + n2 * 0.35;
              roughnessFactor = clamp(roughnessFactor * mix(0.42, 1.12, wear), 0.16, 0.95);
              if (uWetness > 0.01) {
                float pN2 = rNoise(vRoadWP.xz * 0.09) * 0.65 + rNoise(vRoadWP.xz * 0.28 + 3.1) * 0.35;
                float puddle2 = smoothstep(0.42, 0.68, pN2) * uWetness;
                float damp = uWetness * 0.48;
                roughnessFactor = mix(roughnessFactor, 0.035, clamp(damp + puddle2 * 0.78, 0.0, 0.97));
              }
            `);
        };
        roadMat.needsUpdate = true;
      }
    }

    // =========================================================================
    // 3. BEST 3RD-PERSON CHARACTER RENDERING (HERO RIM LIGHT + PBR CLOTH TUNING)
    // =========================================================================
    const heroRim = new T.PointLight(0xffdca8, 0.85, 8.5, 1.5);
    scene.add(heroRim);

    let lastTunedActor = null;
    function tuneHeroCharacterPBR() {
      const act = P && P.actor;
      if (!act || !act.inner || act === lastTunedActor) return;
      lastTunedActor = act;
      act.inner.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (!m) continue;
            if (typeof m.roughness === "number") m.roughness = Math.max(0.70, m.roughness);
            if (typeof m.metalness === "number") m.metalness = Math.min(0.15, m.metalness);
            m.envMapIntensity = 1.05;
            if (m.normalScale) m.normalScale.set(1.35, 1.35);
          }
        }
      });
    }

    // =========================================================================
    // 4. VOLUMETRIC DIAGONAL SUN-SHAFTS & REPUBLIC SQUARE REFLECTING FOUNTAINS
    // =========================================================================
    const sunShafts = [];
    const fountainJets = [];
    let heroEnvBuilt = false;

    function buildHeroAtmosphere() {
      if (heroEnvBuilt) return;
      heroEnvBuilt = true;

      // Subtle Diagonal Volumetric Sun-Shafts slicing through Northern Avenue
      const shaftCv = document.createElement("canvas");
      shaftCv.width = 128; shaftCv.height = 256;
      const sg = shaftCv.getContext("2d");
      const gr = sg.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "rgba(255,228,175,0)");
      gr.addColorStop(0.28, "rgba(255,228,175,0.14)");
      gr.addColorStop(0.75, "rgba(255,214,150,0.06)");
      gr.addColorStop(1, "rgba(255,214,150,0)");
      sg.fillStyle = gr; sg.fillRect(0, 0, 128, 256);
      // Soft side feathering
      sg.globalCompositeOperation = "destination-in";
      const hgr = sg.createLinearGradient(0, 0, 128, 0);
      hgr.addColorStop(0, "rgba(0,0,0,0)");
      hgr.addColorStop(0.5, "rgba(0,0,0,1)");
      hgr.addColorStop(1, "rgba(0,0,0,0)");
      sg.fillStyle = hgr; sg.fillRect(0, 0, 128, 256);
      const shaftTex = new T.CanvasTex(shaftCv);
      shaftTex.colorSpace = T.SRGB;
      const shaftMat = new T.BasicMat({ map: shaftTex, transparent: true, opacity: 0.42, depthWrite: false, side: T.DoubleSide });

      for (const [sx, sz] of [[268, 45], [268, 108], [268, -22], [104, 505], [344, -775]]) {
        const beam = new T.Mesh(new T.Plane(16, 26), shaftMat);
        beam.position.set(sx, 12.5, sz);
        beam.rotation.z = -0.34;
        beam.rotation.y = 0.45;
        beam.renderOrder = 3;
        scene.add(beam);
        sunShafts.push(beam);
      }

      // Upgrade the REAL Republic Square Singing Fountains (G.FOUNT) with mirror water & evening under-glow!
      if (G.FOUNT) {
        const fx = G.FOUNT.x || 177, fz = G.FOUNT.z || 464, fa = G.FOUNT.a || 0.836;
        if (G.FOUNT.water && G.FOUNT.water.material) {
          const wm = G.FOUNT.water.material;
          if (typeof wm.roughness === "number") wm.roughness = 0.03;
          if (typeof wm.metalness === "number") wm.metalness = 0.34;
          wm.envMapIntensity = 3.2;
          wm.needsUpdate = true;
        }
        // Subtle animated underwater singing-fountain spotlights (active at sunset & night)
        const s = Math.sin(fa), c = Math.cos(fa);
        for (const off of [-14, 0, 14]) {
          const pl = new T.PointLight(0x6ad4ff, 0, 22, 1.6);
          pl.position.set(fx + off * s, 1.6, fz + off * c);
          scene.add(pl);
          fountainJets.push({ light: pl, ph: off * 0.12 });
        }
      }
    }

    // =========================================================================
    // 5. MAIN GPU RENDER HOOK + GRAPHICS QUALITY BUTTON
    // =========================================================================
    // Add Graphics Quality button right into the Menu (#cam)
    const camMenu = UI.fe("cam");
    let gfxBtn = UI.fe("bGfx");
    if (camMenu && !gfxBtn) {
      gfxBtn = document.createElement("button");
      gfxBtn.id = "bGfx";
      gfxBtn.title = "Switch 3D rendering quality";
      camMenu.appendChild(gfxBtn);
    }
    function updateGfxBtn() {
      if (!gfxBtn) return;
      const labels = { ultra: "✨ Render: Ultra Cinema", balanced: "✨ Render: Balanced", native: "✨ Render: Native" };
      gfxBtn.textContent = labels[gfxMode] || labels.ultra;
    }
    if (gfxBtn) {
      gfxBtn.addEventListener("click", () => {
        const order = ["ultra", "balanced", "native"];
        gfxMode = order[(order.indexOf(gfxMode) + 1) % order.length];
        try { localStorage.setItem(GFX_KEY, gfxMode); } catch {}
        curW = 0; // recreate MSAA targets if needed
        updateGfxBtn();
        UI.de("Render Mode: " + gfxMode.toUpperCase(), "", gfxMode === "ultra" ? "Full HDR Optical Bloom + CAS Sharpening + 35mm Cinema Filmic Grade + MSAA." : gfxMode === "balanced" ? "Smooth HDR Bloom + Filmic Grade." : "Direct native WebGL rendering.");
      });
    }
    updateGfxBtn();

    let renderClock = 0;
    const filmEl = UI.fe("film");
    window.__hyperRender = function () {
      if (!window.__ready) { renderer.render(scene, G.camera); return; }
      renderClock += 0.016;

      injectWorldPBRShaders();
      tuneHeroCharacterPBR();
      buildHeroAtmosphere();

      // Position dedicated 3rd-person Hero Rim Light behind the player relative to camera!
      const mode = G.SKY && G.SKY.mode ? G.SKY.mode : "golden";
      if (!P.car && !G.INT.on && P.actor && P.actor.g && P.actor.g.visible) {
        const dx = P.x - G.camera.position.x, dz = P.z - G.camera.position.z;
        const d = Math.hypot(dx, dz) || 1;
        heroRim.position.set(P.x + (dx / d) * 1.45, 2.35, P.z + (dz / d) * 1.45);
        heroRim.color.setHex(mode === "night" ? 0x9ec5ff : mode === "dusk" ? 0xffa875 : 0xffe0b2);
        heroRim.intensity = mode === "night" ? 1.45 : mode === "dusk" ? 1.25 : 0.92;
      } else {
        heroRim.intensity = 0;
      }

      // Animate volumetric sun-shafts & Republic Square Singing Fountains night glow
      const shaftsVisible = !G.INT.on && (mode === "golden" || mode === "dusk") && G.SKY.w === "clear";
      for (const b of sunShafts) b.visible = shaftsVisible;
      const fGlow = (mode === "night" ? 2.6 : mode === "dusk" ? 1.1 : 0);
      for (const fj of fountainJets) {
        if (fj.light) {
          fj.light.intensity = fGlow * (0.75 + 0.25 * Math.sin(renderClock * 1.4 + fj.ph));
          const hue = (0.54 + 0.08 * Math.sin(renderClock * 0.45 + fj.ph)) % 1;
          fj.light.color.setHSL(hue, 0.72, 0.62);
        }
      }

      // Fix native streetlight ground glow pools so they stay flat on the stone pavement (never float over people/poles!)
      if (nightObj.glow && nightObj.glow.material) {
        nightObj.glow.material.depthTest = true;
        nightObj.glow.material.fog = true;
        nightObj.glow.renderOrder = 1;
        if (nightObj.glow.visible) nightObj.glow.material.opacity = Math.min(nightObj.glow.material.opacity, 0.22);
      }

      // Update live wet-pavement & rain uniforms every frame
      roadUniforms.uWetness.value = fxState.wetness;
      roadUniforms.uRainActive.value = fxState.rainActive;
      roadUniforms.uRainTime.value = renderClock;

      // Smoothly ramp 35mm cinematic bokeh DoF during conversations, drama dialogs & Photo Mode
      const talkEl = UI.fe("talk");
      const inTalk = !!(talkEl && talkEl.classList.contains("on"));
      const inPhoto = !!(G.PHOTO && G.PHOTO.on);
      const dofTarget = Math.max(fxState.dofOverride, inTalk ? 0.92 : inPhoto ? 0.58 : 0.0);
      fxState.dofCur += (dofTarget - fxState.dofCur) * 0.14;

      // Call auxiliary world systems (weather, 3rd-person lean, destinations, story, spatial audio)
      if (window.__worldFXTick) window.__worldFXTick(renderClock);
      if (window.__destTick) window.__destTick(renderClock);
      if (window.__storyTick) window.__storyTick(renderClock);
      if (window.__spatialAudioTick) window.__spatialAudioTick(renderClock);

      // Bypass post-processing if Native mode or failed
      const cv = UI.fe("c");
      if (gfxMode === "native" || postFailed) {
        if (filmEl) filmEl.style.opacity = "";
        renderer.render(scene, G.camera);
        return;
      }
      if (filmEl) filmEl.style.opacity = "0";

      // Avoid double CSS grading when GPU Cinema Composite is active (keep Photo Mode / drunk filters!)
      if (cv && !(G.PHOTO && G.PHOTO.on) && (P.drunk || 0) <= 0.12 && cv.style.filter) {
        cv.style.filter = "";
      }

      try {
        ensureTargets();

        // Calibrate HDR bloom & cinema split-tone per atmosphere
        const isDusk = mode === "dusk", isNight = mode === "night";
        brightMat.uniforms.uThresh.value = isNight ? 0.56 : isDusk ? 0.78 : 0.94;
        compMat.uniforms.uExposure.value = isNight ? 1.38 : isDusk ? 1.16 : mode === "day" ? 1.06 : 1.12;
        compMat.uniforms.uBloomStrength.value = (isNight ? 0.48 : isDusk ? 0.34 : 0.22) + fxState.wetness * 0.08;
        compMat.uniforms.uWarmth.value = isDusk ? 0.95 : isNight ? 0.15 : mode === "golden" ? 0.62 : 0.25;
        compMat.uniforms.uSharp.value = gfxMode === "ultra" ? 0.92 : 0.45;
        compMat.uniforms.uGrain.value = gfxMode === "ultra" ? 0.018 : 0.0;
        compMat.uniforms.uDof.value = gfxMode === "ultra" ? fxState.dofCur : fxState.dofCur * 0.65;
        compMat.uniforms.uRainLens.value = gfxMode === "ultra" ? fxState.rainLens : 0.0;
        compMat.uniforms.uTime.value = renderClock;

        // PASS 1: Render linear HDR scene into rtScene (temporarily disable built-in tonemapping so HDR > 1.0 survives!)
        const prevTM = renderer.toneMapping;
        const prevRT = renderer.getRenderTarget();
        renderer.toneMapping = 0; // NoToneMapping -> pure linear HDR
        renderer.setRenderTarget(rtScene);
        renderer.render(scene, G.camera);

        // PASS 2: Extract bright highlights into quarter-res rtBloomA
        fsQuad.material = brightMat;
        brightMat.uniforms.tDiffuse.value = rtScene.texture;
        renderer.setRenderTarget(rtBloomA);
        renderer.render(fsScene, fsCam);

        // PASS 3A: Horizontal 9-tap Gaussian Blur -> rtBloomB
        fsQuad.material = blurMat;
        blurMat.uniforms.tDiffuse.value = rtBloomA.texture;
        blurMat.uniforms.uDir.value.set(1.6 / rtBloomA.width, 0);
        renderer.setRenderTarget(rtBloomB);
        renderer.render(fsScene, fsCam);

        // PASS 3B: Vertical 9-tap Gaussian Blur -> rtBloomA
        blurMat.uniforms.tDiffuse.value = rtBloomB.texture;
        blurMat.uniforms.uDir.value.set(0, 1.6 / rtBloomA.height);
        renderer.setRenderTarget(rtBloomA);
        renderer.render(fsScene, fsCam);

        // PASS 4: Cinema Master Composite to Screen (CAS Sharpening + Optical Bloom + 35mm Bokeh + Lens Rain + ACES)
        fsQuad.material = compMat;
        compMat.uniforms.tDiffuse.value = rtScene.texture;
        compMat.uniforms.tBloom.value = rtBloomA.texture;
        renderer.setRenderTarget(prevRT);
        renderer.render(fsScene, fsCam);

        renderer.toneMapping = prevTM;
      } catch (err) {
        console.warn("Ultra Cinema post-processing fallback:", err);
        postFailed = true;
        renderer.setRenderTarget(null);
        renderer.render(scene, G.camera);
      }
    };

    window.__render = {
      getMode: () => gfxMode,
      setMode: (m) => { gfxMode = m; curW = 0; updateGfxBtn(); },
      isPostActive: () => gfxMode !== "native" && !postFailed,
      setWeatherFX: (opts = {}) => {
        if (typeof opts.wetness === "number") fxState.wetness = opts.wetness;
        if (typeof opts.rainActive === "number") fxState.rainActive = opts.rainActive;
        if (typeof opts.rainLens === "number") fxState.rainLens = opts.rainLens;
      },
      setDofOverride: (v) => { fxState.dofOverride = Math.max(0, Math.min(1, v || 0)); },
      getFXState: () => ({ ...fxState })
    };
  }

  bootRender();
})();

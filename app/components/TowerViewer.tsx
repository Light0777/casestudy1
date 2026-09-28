"use client";

import { useEffect, useRef, useState } from "react";
import { HOTSPOTS } from "../data";

export default function TowerViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(4);
  const [night, setNight] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  const nightRef = useRef(night);
  nightRef.current = night;
  const spinRef = useRef(spinning);
  spinRef.current = spinning;

  const api = useRef<{ zoom: (d: number) => void; reset: () => void; focus: (id: string | null) => void } | null>(null);
  const activeInfo = HOTSPOTS.find((h) => h.id === active) ?? null;

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setDismissed(true), 900);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    let dead = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    const disposers: Array<() => void> = [];

    async function boot() {
      const THREE = await import("three");
      if (dead || !canvasRef.current || !wrapRef.current) return;
      const canvas = canvasRef.current;
      const box = wrapRef.current;

      setProgress(22);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();
      const daySky = new THREE.Color(0x9fcdf0);
      const nightSky = new THREE.Color(0x060a14);
      scene.background = daySky.clone();
      scene.fog = new THREE.Fog(0x9fcdf0, 120, 280);

      const camera = new THREE.PerspectiveCamera(44, 1, 0.5, 900);
      let radius = 185;
      let theta = 0.45;
      let phi = 1.12;
      let wantTheta: number | null = null;
      let wantRadius: number | null = null;
      let wantPhi: number | null = null;

      const hemi = new THREE.HemisphereLight(0xd6e9ff, 0x5f7050, 0.85);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff0d2, 1.35);
      sun.position.set(60, 95, 45);
      sun.castShadow = true;
      scene.add(sun);
      const moon = new THREE.DirectionalLight(0x7e93cc, 0);
      moon.position.set(-50, 70, -30);
      scene.add(moon);
      /* night dressing (faded in with the night mix in tick) */
      const glbMats: import("three").MeshStandardMaterial[] = [];
      const spotA = new THREE.SpotLight(0xffe7c4, 0, 500, 0.5, 0.7, 2);
      spotA.position.set(-90, 40, 110);
      spotA.target.position.set(0, 45, 0);
      scene.add(spotA, spotA.target);
      const spotB = new THREE.SpotLight(0xcfe0ff, 0, 500, 0.5, 0.7, 2);
      spotB.position.set(90, 55, 90);
      spotB.target.position.set(0, 60, 0);
      scene.add(spotB, spotB.target);
      const podiumGlow = new THREE.PointLight(0xffd9a0, 0, 70, 2);
      podiumGlow.position.set(0, 8, 14);
      scene.add(podiumGlow);
      const starGeo = new THREE.BufferGeometry();
      const starPos: number[] = [];
      for (let si = 0; si < 400; si++) {
        const a = Math.random() * Math.PI * 2;
        const e = 0.12 + Math.random() * 1.3;
        const r = 400;
        starPos.push(r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a));
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xcfd8ff, size: 2, sizeAttenuation: false,
        transparent: true, opacity: 0, depthWrite: false, fog: false,
      });
      scene.add(new THREE.Points(starGeo, starMat));

      const world = new THREE.Group();
      scene.add(world);
      const mat = (c: number, extra: Record<string, unknown> = {}) =>
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.05, ...extra });

      const concrete = mat(0xcfc9bd);
      const dark = mat(0x2a2c30, { roughness: 0.6 });
      const sand = mat(0xd9c9a4, { roughness: 1 });
      const rock = mat(0x8d8d88, { roughness: 1 });
      const leaf = mat(0x4f7a3f, { roughness: 1 });

      function block(w: number, h: number, d: number, m: import("three").Material, x: number, y: number, z: number) {
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        o.position.set(x, y, z);
        o.castShadow = true;
        o.receiveShadow = true;
        world.add(o);
        return o;
      }
      function disc(r: number, h: number, m: import("three").Material, x: number, y: number, z: number, seg = 40) {
        const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
        o.position.set(x, y, z);
        o.castShadow = true;
        o.receiveShadow = true;
        world.add(o);
        return o;
      }

      setProgress(48);
      /* sea + island + shore */
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 600),
        mat(0x2f7d9d, { roughness: 0.3, metalness: 0.15 })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.5;
      water.receiveShadow = true;
      world.add(water);
      disc(39, 1.4, rock, 0, -1.1, 0, 48);
      disc(34, 2.6, sand, 0, -1.3, 0, 48);
      const foam = new THREE.Mesh(
        new THREE.RingGeometry(34.5, 39.5, 48),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false })
      );
      foam.rotation.x = -Math.PI / 2;
      foam.position.y = -0.32;
      world.add(foam);
      const breakwater = new THREE.Group();
      const bwArc = new THREE.Mesh(new THREE.TorusGeometry(58, 2.4, 8, 48, 1.15), rock);
      bwArc.rotation.x = -Math.PI / 2;
      bwArc.castShadow = true;
      breakwater.add(bwArc);
      breakwater.position.y = -0.9;
      breakwater.rotation.y = 2.4;
      world.add(breakwater);
      block(220, 2, 46, sand, 0, -0.2, 118);
      /* shoreline houses: plaster walls, pyramid roofs, doors + lit windows */
      const wallCols = [0xf2ede2, 0xe8dcc8, 0xdfd3bd, 0xf5f0e6];
      const roofCols = [0xa8573c, 0x8d8d88, 0x7a5c48];
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffe2b8 });
      const doorMat = mat(0x4a3f35, { roughness: 0.9 });
      for (let b = 0; b < 7; b++) {
        const w = 7 + (b % 3);
        const d = 6 + ((b + 1) % 3);
        const h = 3.6 + ((b * 5) % 3) * 0.7;
        const hx = -72 + b * 24;
        const hz = 118 + ((b * 13) % 9);
        const wall = mat(wallCols[b % wallCols.length], { roughness: 0.95 });
        block(w, h, d, wall, hx, 0.8 + h / 2, hz);
        const roofH = 2.4 + (b % 2);
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1, roofH, 4),
          mat(roofCols[b % roofCols.length], { roughness: 0.9, flatShading: true })
        );
        roof.rotation.y = Math.PI / 4;
        roof.scale.set((w / 2 + 0.9) * 1.414, 1, (d / 2 + 0.9) * 1.414);
        roof.position.set(hx, 0.8 + h + roofH / 2, hz);
        roof.castShadow = true;
        world.add(roof);
        block(1.4, 2.4, 0.3, doorMat, hx - w / 4, 0.8 + 1.2, hz + d / 2 + 0.05);
        block(1.2, 1.1, 0.2, winMat, hx + w / 4, 0.8 + h - 1.3, hz + d / 2 + 0.05);
        block(1.2, 1.1, 0.2, winMat, hx - w / 4 - 0.4, 0.8 + h - 1.3, hz + d / 2 + 0.05);
        if (b % 2 === 0) block(0.7, 1.8, 0.7, wall, hx + w / 4, 0.8 + h + roofH - 0.6, hz - 1);
      }
      /* causeway to shore + lamps */
      block(7, 1, 64, concrete, 0, 0.6, 64);
      block(0.25, 0.9, 64, concrete, -3.4, 1.6, 64);
      block(0.25, 0.9, 64, concrete, 3.4, 1.6, 64);
      for (let l = 0; l < 5; l++) {
        for (const sx of [-4.5, 4.5]) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5, 6), dark);
          pole.position.set(sx, 3, 40 + l * 12);
          world.add(pole);
          const lamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffe2a0 })
          );
          lamp.position.set(sx, 5.6, 40 + l * 12);
          world.add(lamp);
        }
      }
      /* palms around the island */
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2 + 0.3;
        const px = Math.cos(a) * 26;
        const pz = Math.sin(a) * 26;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 4.5, 6), mat(0x8a6b4a));
        trunk.position.set(px, 2.25, pz);
        trunk.castShadow = true;
        world.add(trunk);
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), leaf);
        crown.scale.y = 0.6;
        crown.position.set(px, 5, pz);
        crown.castShadow = true;
        world.add(crown);
      }
      /* podium + canopy */
      block(30, 3, 22, concrete, 0, 1.5, 0);
      block(10, 0.4, 6, concrete, 0, 3.8, 13);
      block(0.4, 3.6, 0.4, dark, -4.4, 1.9, 15.2);
      block(0.4, 3.6, 0.4, dark, 4.4, 1.9, 15.2);
      /* glass entrance pavilion + reflecting pool */
      block(9, 3, 5, mat(0x9fc4e0, { transparent: true, opacity: 0.55 }), 0, 4.5, 8);
      block(10, 0.4, 6, concrete, 0, 6.2, 8);
      block(12, 0.3, 5, mat(0x3f8fae, { roughness: 0.2, metalness: 0.2 }), 15, 0.15, 12);
      /* real building model (step 6: procedural tower removed) */
      const burjModel = new THREE.Group();
      burjModel.scale.setScalar(0.05);
      burjModel.position.set(0, 0.16, 0.85);
      world.add(burjModel);
      setProgress(82);
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const gltf = await new GLTFLoader().loadAsync("/models/18-burj-al-arab-jumeirah.glb");
        if (dead) return;
        gltf.scene.traverse((o) => {
          const mesh = o as unknown as import("three").Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const raw of mats) {
              const m = raw as unknown as import("three").MeshStandardMaterial;
              if (!m || !m.color || glbMats.includes(m)) continue;
              const bc = m.color;
              const lum = 0.2126 * bc.r + 0.7152 * bc.g + 0.0722 * bc.b;
              const isGreen = bc.g > bc.r && bc.g > bc.b;
              m.emissive.set(isGreen ? 0x9fd08a : lum > 0.35 ? 0xffe2b8 : 0x8fb8ff);
              m.userData.glow = isGreen ? 0.25 : 0.3 + 0.35 * lum;
              glbMats.push(m);
            }
          }
        });
        burjModel.add(gltf.scene);
      } catch (err) {
        console.warn("building model unavailable", err);
      }
      /* procedural sail membrane, hotel core, floor bands + mullions removed (step 6) */
      /* procedural mast, restaurant + helipad removed (step 6: present in the GLB) */
      /* superseded by the curved hotel core above */
      /* drifting clouds */
      const clouds: { g: import("three").Group; sp: number }[] = [];
      const cloudMat = mat(0xffffff, { transparent: true, opacity: 0.85, roughness: 1 });
      const cloudSpots: Array<[number, number, number]> = [[-90, 108, -60], [40, 122, -110], [110, 100, 40], [-40, 115, 90]];
      for (const [cx, cy, cz] of cloudSpots) {
        const g = new THREE.Group();
        for (let bi = 0; bi < 3; bi++) {
          const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(5 - bi, 0), cloudMat);
          blob.scale.set(1.6, 0.55, 1);
          blob.position.set(bi * 6 - 6, bi % 2, 0);
          g.add(blob);
        }
        g.position.set(cx, cy, cz);
        world.add(g);
        clouds.push({ g, sp: 0.04 + Math.random() * 0.05 });
      }

      setProgress(92);

      function place() {
        if (!renderer) return;
        const w = box.clientWidth || 800;
        const h = box.clientHeight || 500;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      place();
      ro = new ResizeObserver(place);
      ro.observe(box);

      let dragging = false;
      let px = 0;
      let py = 0;
      const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        theta -= (e.clientX - px) * 0.006;
        phi = Math.min(1.35, Math.max(0.55, phi - (e.clientY - py) * 0.004));
        px = e.clientX; py = e.clientY;
        wantTheta = null;
        wantRadius = null;
        wantPhi = null;
      };
      const onUp = () => { dragging = false; };
      const onWheel = (e: WheelEvent) => { e.preventDefault(); radius = Math.min(185, Math.max(60, radius + e.deltaY * 0.06)); wantRadius = null; };
      canvas.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      disposers.push(() => {
        canvas.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("wheel", onWheel);
      });

      function focus(id: string | null) {
        // tuned to the GLB: broad sail faces +z, helipad disc sits high at y~69 on -z,
        // mast tops out at y~100, island disc r~34 with causeway +z
        if (id === "sail") { wantTheta = 0.4; wantRadius = 150; wantPhi = 1.12; }
        else if (id === "helipad") { wantTheta = 2.9; wantRadius = 120; wantPhi = 0.62; }
        else if (id === "mast") { wantTheta = 1.3; wantRadius = 145; wantPhi = 1.12; }
        else if (id === "island") { wantTheta = -0.55; wantRadius = 185; wantPhi = 1.12; }
        else { wantTheta = null; wantRadius = null; wantPhi = null; }
      }
      api.current = {
        zoom: (d: number) => { radius = Math.min(185, Math.max(60, radius + d)); wantRadius = null; },
        reset: () => { radius = 185; theta = 0.45; phi = 1.12; wantTheta = null; wantRadius = null; wantPhi = null; },
        focus,
      };

      let mix = 0;
      let first = true;
      function tick() {
        if (dead || !renderer) return;
        raf = requestAnimationFrame(tick);
        const target = nightRef.current ? 1 : 0;
        mix += (target - mix) * 0.06;
        (scene.background as import("three").Color).copy(daySky).lerp(nightSky, mix);
        if (scene.fog) scene.fog.color.copy(scene.background as import("three").Color);
        sun.intensity = 1.35 * (1 - mix);
        moon.intensity = 0.9 * mix;
        hemi.intensity = 0.85 - mix * 0.45;
        spotA.intensity = mix * 10000;
        spotB.intensity = mix * 7000;
        podiumGlow.intensity = mix * 300;
        starMat.opacity = mix * 0.9;
        for (const m of glbMats) m.emissiveIntensity = mix * (m.userData.glow as number);
        water.position.y = -0.5 + Math.sin(performance.now() * 0.0006) * 0.12;
        for (const c of clouds) {
          c.g.position.x += c.sp;
          if (c.g.position.x > 190) c.g.position.x = -190;
        }
        if (spinRef.current && !dragging) theta += 0.0035;
        if (wantTheta !== null) {
          let d = wantTheta - theta;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          theta += d * 0.08;
          if (Math.abs(d) < 0.01) wantTheta = null;
        }
        if (wantRadius !== null) {
          radius += (wantRadius - radius) * 0.08;
          if (Math.abs(wantRadius - radius) < 0.4) wantRadius = null;
        }
        if (wantPhi !== null) {
          phi += (wantPhi - phi) * 0.08;
          if (Math.abs(wantPhi - phi) < 0.01) wantPhi = null;
        }
        camera.position.set(
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi) + 30,
          radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(0, 30, 0);
        renderer.render(scene, camera);
        if (first) {
          first = false;
          setProgress(100);
          setReady(true);
        }
      }
      tick();
    }

    boot();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      disposers.forEach((d) => d());
      renderer?.dispose();
      api.current = null;
    };
  }, []);

  function pick(id: string) {
    setActive((a) => {
      const next = a === id ? null : id;
      api.current?.focus(next);
      return next;
    });
  }

  function toggleFs() {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) void el.requestFullscreen?.().catch(() => {});
    else void document.exitFullscreen?.().catch(() => {});
  }

  return (
    <div ref={wrapRef} className="viewer">
      <canvas ref={canvasRef} aria-label="Interactive 3D model of a sail-form island hotel" tabIndex={0} />
      <div className="viewer-label">INTERACTIVE 3D EXPERIENCE</div>
      <div className="viewer-tools" role="toolbar" aria-label="3D controls">
        <button className={spinning ? "on" : ""} onClick={() => setSpinning((s) => !s)} title="Auto rotate">↻ Rotate</button>
        <button onClick={() => api.current?.zoom(-8)} aria-label="Zoom in">+</button>
        <button onClick={() => api.current?.zoom(8)} aria-label="Zoom out">−</button>
        <button onClick={() => { api.current?.reset(); setActive(null); }}>Reset</button>
        <button className={!night ? "on" : ""} onClick={() => setNight(false)}>☀ Day</button>
        <button className={night ? "on" : ""} onClick={() => setNight(true)}>☾ Night</button>
        <button onClick={toggleFs}>⛶ Fullscreen</button>
      </div>
      {activeInfo && (
        <div className="info-card" role="status">
          <button aria-label="Close panel" onClick={() => { setActive(null); api.current?.focus(null); }}>×</button>
          <h3>{activeInfo.title}</h3>
          <p>{activeInfo.text}</p>
        </div>
      )}
      <div className="hotbar">
        {HOTSPOTS.map((h) => (
          <button key={h.id} className={active === h.id ? "on" : ""} onClick={() => pick(h.id)}>
            {h.label}
          </button>
        ))}
      </div>
      {!dismissed && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "grid", placeItems: "center", background: "#f3f1ed", textAlign: "center", padding: 20, opacity: ready ? 0 : 1, transition: "opacity .6s", pointerEvents: ready ? "none" : "auto" }}>
          <div>
            <small style={{ letterSpacing: "0.1em", color: "#666666", fontSize: "12px" }}>LOADING ARCHITECTURAL EXPERIENCE</small>
            <code style={{ display: "block", color: "#181011", margin: "14px 0 6px", fontSize: "15px" }}>
              [{ "█".repeat(Math.round(progress / 100 * 16)).padEnd(16, "░") }] {progress}%
            </code>
            <div style={{ width: "min(340px, 80vw)", height: 2, background: "#d8d4d4", margin: "0 auto 12px" }}>
              <i style={{ display: "block", height: "100%", width: `${progress}%`, background: "#181011" }} />
            </div>
            <small style={{ letterSpacing: "0.1em", color: "#666666", fontSize: "12px" }}>
              {ready ? "MODEL READY" : "INITIALIZING 3D MODEL..."}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

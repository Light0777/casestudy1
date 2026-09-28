"use client";

import { useEffect, useRef, useState } from "react";
import { HOTSPOTS } from "../data";

export default function TowerViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
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
      let radius = 122;
      let theta = 0.7;
      let phi = 1.0;
      let wantTheta: number | null = null;

      const hemi = new THREE.HemisphereLight(0xd6e9ff, 0x5f7050, 0.85);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff0d2, 1.35);
      sun.position.set(60, 95, 45);
      sun.castShadow = true;
      scene.add(sun);
      const moon = new THREE.DirectionalLight(0x7e93cc, 0);
      moon.position.set(-50, 70, -30);
      scene.add(moon);

      const world = new THREE.Group();
      scene.add(world);
      const mat = (c: number, extra: Record<string, unknown> = {}) =>
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.05, ...extra });

      function facadeTexture(lit: boolean) {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        g.fillStyle = lit ? "#050505" : "#31465e";
        g.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 4; x++) {
            if (lit) {
              if (Math.random() < 0.5) {
                g.fillStyle = Math.random() < 0.5 ? "#ffd58a" : "#fff2cf";
                g.fillRect(x * 64 + 8, y * 64 + 10, 48, 44);
              }
            } else {
              g.fillStyle = "#5d84a6";
              g.fillRect(x * 64 + 8, y * 64 + 10, 48, 44);
              g.fillStyle = "#8fb0c9";
              g.fillRect(x * 64 + 8, y * 64 + 10, 48, 4);
            }
          }
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 3);
        return t;
      }

      const glassMat = new THREE.MeshStandardMaterial({
        map: facadeTexture(false),
        emissiveMap: facadeTexture(true),
        emissive: 0xffffff,
        emissiveIntensity: 0,
        roughness: 0.35,
        metalness: 0.4,
      });
      const sailMat = new THREE.MeshStandardMaterial({
        color: 0xf4f1ea,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
        emissive: 0xbfd4ff,
        emissiveIntensity: 0,
      });

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
      for (let b = 0; b < 6; b++) {
        block(10, 6 + ((b * 7) % 12), 10, b % 2 ? concrete : sand, -70 + b * 28, 3, 122);
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
      /* twin legs splayed in plan: wide at the back base, meeting at the sea apex */
      function beam(ax: number, ay: number, az: number, bx: number, by: number, bz: number, w: number, d: number, m: import("three").Material) {
        const a = new THREE.Vector3(ax, ay, az);
        const b = new THREE.Vector3(bx, by, bz);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), m);
        o.position.copy(a).addScaledVector(dir, 0.5);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        o.castShadow = true;
        o.receiveShadow = true;
        world.add(o);
        return o;
      }
      function strut(ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, m: import("three").Material) {
        const a = new THREE.Vector3(ax, ay, az);
        const b = new THREE.Vector3(bx, by, bz);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), m);
        o.position.copy(a).addScaledVector(dir, 0.5);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        o.castShadow = true;
        world.add(o);
        return o;
      }
      for (const s of [-1, 1] as const) {
        const a = new THREE.Vector3(11 * s, 3, -7);
        const b = new THREE.Vector3(0, 58, 5);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const g = new THREE.Group();
        g.position.copy(a).addScaledVector(dir, 0.5);
        g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        world.add(g);
        const core = new THREE.Mesh(new THREE.BoxGeometry(5.5, len, 8), glassMat);
        core.castShadow = true;
        core.receiveShadow = true;
        g.add(core);
        for (let bi = 0; bi < 7; bi++) {
          const bandM = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.55, 8.6), concrete);
          bandM.position.y = -len / 2 + 6 + (bi * (len - 12)) / 6;
          bandM.castShadow = true;
          g.add(bandM);
        }
        for (let di = 0; di < 6; di++) {
          for (const tilt of [-0.55, 0.55]) {
            const brace = new THREE.Mesh(new THREE.BoxGeometry(0.28, 9, 1.5), concrete);
            brace.position.set(s * 2.85, -len / 2 + 10 + di * 7.5, 0);
            brace.rotation.x = tilt;
            g.add(brace);
          }
        }
      }
      /* white edge fins along the outer faces of both legs */
      beam(-13.5, 3, -7.8, -1.6, 58, 4.4, 1.0, 1.3, concrete);
      beam(13.5, 3, -7.8, 1.6, 58, 4.4, 1.0, 1.3, concrete);
      block(8, 1.6, 9, concrete, 0, 58, 5);
      block(5, 1.6, 6, concrete, 0, 59.4, 4.7);
      disc(1.3, 1.2, concrete, 0, 60.4, 4.5, 16);
      /* stacked curved guest-room ribs on the sea face: narrow + step forward as they rise */
      const slabMat = mat(0xe8e2d4, { roughness: 0.8 });
      for (let f = 0; f <= 13; f++) {
        const y = 8 + f * 3.4;
        const t = (y - 3) / 55;
        const halfW = 11 * (1 - t) + 2.2;
        const fz = -7 + 12 * t + 6;
        const chord = halfW * 2;
        const R = 20;
        const len = 2 * Math.asin(Math.min(chord / (2 * R), 0.95));
        const slab = new THREE.Mesh(
          new THREE.CylinderGeometry(R, R, 1.5, 20, 1, true, -len / 2, len),
          slabMat
        );
        slab.position.set(0, y, fz - R);
        slab.castShadow = true;
        slab.receiveShadow = true;
        world.add(slab);
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(R + 0.12, R + 0.12, 0.85, 20, 1, true, -len / 2, len),
          glassMat
        );
        band.position.set(0, y + 0.1, fz - R);
        world.add(band);
        const lip = new THREE.Mesh(
          new THREE.CylinderGeometry(R + 0.15, R + 0.15, 0.35, 20, 1, true, -len / 2, len),
          concrete
        );
        lip.position.set(0, y - 0.85, fz - R);
        world.add(lip);
      }
      /* tensioned fabric sail closing the back of the V, with batten ribs */
      const sail = new THREE.Mesh(
        new THREE.CylinderGeometry(26, 26, 56, 24, 1, true, Math.PI - 0.45, 0.9),
        sailMat
      );
      sail.position.set(0, 31, 21);
      sail.castShadow = true;
      world.add(sail);
      for (const by of [14, 27, 40, 51]) {
        const batten = new THREE.Mesh(
          new THREE.CylinderGeometry(26.25, 26.25, 0.55, 24, 1, true, Math.PI - 0.45, 0.9),
          concrete
        );
        batten.position.set(0, by, 21);
        world.add(batten);
      }
      for (const off of [-0.3, -0.15, 0, 0.15, 0.3]) {
        const seam = new THREE.Mesh(
          new THREE.CylinderGeometry(26.2, 26.2, 56, 6, 1, true, Math.PI + off - 0.012, 0.024),
          concrete
        );
        seam.position.set(0, 31, 21);
        world.add(seam);
      }
      /* crown mast leaning back over the fabric, with back-stays */
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 34, 10), concrete);
      mast.position.set(0, 75, 3.4);
      mast.rotation.x = -0.1;
      mast.castShadow = true;
      world.add(mast);
      for (const [cy, cz] of [[64, 4.5], [72, 3.7], [80, 2.9]] as const) {
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.13, 8, 20), dark);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, cy, cz);
        world.add(collar);
      }
      strut(0, 70, 3.9, -5.5, 50, -3, 0.2, concrete);
      strut(0, 70, 3.9, 5.5, 50, -3, 0.2, concrete);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3b2f }));
      beacon.position.set(0, 92.6, 1.7);
      world.add(beacon);
      /* sky restaurant capsule hung off the back, on twin struts */
      const restGlass = new THREE.MeshStandardMaterial({
        color: 0x9fc4e0, transparent: true, opacity: 0.65,
        emissive: 0xffe9b0, emissiveIntensity: 0, roughness: 0.2, metalness: 0.3,
      });
      disc(4.2, 1.1, concrete, 0, 48.6, -10, 28);
      const restBand = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 2.2, 28, 1, true), restGlass);
      restBand.position.set(0, 50.2, -10);
      world.add(restBand);
      disc(4.2, 0.6, concrete, 0, 51.6, -10, 28);
      strut(-3.5, 42, -3, -1.6, 48.4, -9.4, 0.3, dark);
      strut(3.5, 42, -3, 1.6, 48.4, -9.4, 0.3, dark);
      /* cantilevered helipad off the sea face, with H marking + edge lights */
      disc(5.5, 0.6, dark, 0, 44, 15.5, 36);
      const padTop = document.createElement("canvas");
      padTop.width = padTop.height = 128;
      const pg = padTop.getContext("2d")!;
      pg.fillStyle = "#3a4148";
      pg.fillRect(0, 0, 128, 128);
      pg.strokeStyle = "#f2f2ef";
      pg.lineWidth = 5;
      pg.beginPath();
      pg.arc(64, 64, 52, 0, Math.PI * 2);
      pg.stroke();
      pg.fillStyle = "#f2f2ef";
      pg.font = "700 64px sans-serif";
      pg.textAlign = "center";
      pg.textBaseline = "middle";
      pg.fillText("H", 64, 68);
      const padTex = new THREE.CanvasTexture(padTop);
      const padMark = new THREE.Mesh(
        new THREE.CircleGeometry(4.7, 36),
        new THREE.MeshBasicMaterial({ map: padTex })
      );
      padMark.rotation.x = -Math.PI / 2;
      padMark.position.set(0, 44.35, 15.5);
      world.add(padMark);
      const rail = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.1, 8, 44), concrete);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(0, 44.8, 15.5);
      world.add(rail);
      for (let e = 0; e < 8; e++) {
        const a = (e / 8) * Math.PI * 2;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0x9fe8ff })
        );
        dot.position.set(Math.cos(a) * 5.5, 44.9, 15.5 + Math.sin(a) * 5.5);
        world.add(dot);
      }
      strut(-3, 35, 8.5, -2, 43.7, 14.6, 0.35, dark);
      strut(3, 35, 8.5, 2, 43.7, 14.6, 0.35, dark);
      strut(0, 34, 8, 0, 43.7, 14.8, 0.4, dark);
      strut(-4.5, 36, 10, 2.5, 43.7, 14.5, 0.28, dark);
      strut(4.5, 36, 10, -2.5, 43.7, 14.5, 0.28, dark);
      /* full-height atrium glass glowing between the legs */
      const atriumMat = new THREE.MeshStandardMaterial({
        color: 0x9fc4e0, transparent: true, opacity: 0.55,
        emissive: 0xffe9b0, emissiveIntensity: 0, roughness: 0.2, metalness: 0.3,
      });
      const atrium = new THREE.Mesh(new THREE.BoxGeometry(3.5, 46, 1.6), atriumMat);
      atrium.position.set(0, 27, 2.5);
      world.add(atrium);
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

      setProgress(74);

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
      };
      const onUp = () => { dragging = false; };
      const onWheel = (e: WheelEvent) => { e.preventDefault(); radius = Math.min(185, Math.max(60, radius + e.deltaY * 0.06)); };
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
        if (id === "island") wantTheta = 2.6;
        else if (id === "helipad") { wantTheta = 0.1; radius = Math.min(radius, 88); }
        else if (id === "mast") wantTheta = 1.2;
        else if (id === "sail") wantTheta = 0.55;
        else wantTheta = null;
      }
      api.current = {
        zoom: (d: number) => { radius = Math.min(185, Math.max(60, radius + d)); },
        reset: () => { radius = 122; theta = 0.7; phi = 1.0; wantTheta = null; },
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
        glassMat.emissiveIntensity = mix * 1.4;
        sailMat.emissiveIntensity = mix * 0.85;
        restGlass.emissiveIntensity = mix * 1.1;
        atriumMat.emissiveIntensity = mix * 0.8;
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
        camera.position.set(
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi) + 25,
          radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(0, 25, 0);
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
      {activeInfo && entered && (
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
      {!entered && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "grid", placeItems: "center", background: "#f3f1ed", textAlign: "center", padding: 20 }}>
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
            <div>
              {ready && (
                <button className="btn" style={{ marginTop: 20 }} onClick={() => setEntered(true)}>
                  Explore Building
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

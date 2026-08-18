/**
 * TRX-4 エンジンのジオメトリ・マテリアル一式を組み立てる。
 * t-rex-engine-v3.html の造形をそのまま踏襲する(寸法・配置・気筒位相は変更しない)。
 *
 * three は呼び出し側が動的importしたネームスペースを渡す。この方式なら
 * このモジュール自体は初期バンドルに載っても three を引き込まない。
 *
 * r128 → r185 で直した点(見た目を合わせるための対応):
 *  - ライト強度は全て ×Math.PI。r155 で useLegacyLights の既定が false になり、
 *    レガシー時に掛かっていた π 倍が無くなったため。
 *  - PointLight の decay を明示的に 1 にする(r128 の既定。現行の既定は 2)。
 *  - map として使う CanvasTexture には colorSpace = SRGBColorSpace を付ける。
 *    bumpMap はデータテクスチャなので NoColorSpace のまま触らない。
 */

import type * as THREE_NS from "three";

type THREE = typeof THREE_NS;

export const CYLX = [-1.8, -0.6, 0.6, 1.8];
/** 直列4気筒のクランク位相(1-4 / 2-3 が対) */
export const PH = [0, Math.PI, Math.PI, 0];
/** クランク半径とコンロッド長 */
export const R = 0.45;
export const L = 1.35;

/** レガシーライト相当に戻すための係数(r155でπ倍が外れたぶんを足す) */
const LIGHT_PI = Math.PI;

export type SpinPart = { g: THREE_NS.Group; off: number };
export type ValvePart = { g: THREE_NS.Group; off: number; baseY: number };

export type EngineParts = {
  /** 点火ライトの強度にも掛けるための係数 */
  lightScale: number;
  root: THREE_NS.Group;
  shellG: THREE_NS.Group;
  headG: THREE_NS.Group;
  panG: THREE_NS.Group;
  crankRoot: THREE_NS.Group;
  crank: THREE_NS.Group;
  pistons: THREE_NS.Group[];
  rods: THREE_NS.Group[];
  caps: THREE_NS.Group[];
  spin: SpinPart[];
  valves: ValvePart[];
  glowMats: THREE_NS.SpriteMaterial[];
  fires: THREE_NS.PointLight[];
  pipeM: THREE_NS.MeshStandardMaterial;
  dust: { geo: THREE_NS.BufferGeometry; mat: THREE_NS.PointsMaterial; count: number };
  setShell: (o: number) => void;
  dispose: () => void;
};

export type BuildOptions = {
  /** 塵の粒数。モバイルは半減させる */
  dustCount?: number;
  /** 影を落とすか(低性能端末では切る) */
  shadows?: boolean;
  /** ライト強度の係数。既定は π(r155でレガシー時のπ倍が外れたぶんを戻す) */
  lightScale?: number;
};

export function buildEngine(
  THREE: THREE,
  scene: THREE_NS.Scene,
  options: BuildOptions = {},
): EngineParts {
  const dustN = options.dustCount ?? 110;
  const shadows = options.shadows ?? true;
  const lightScale = options.lightScale ?? LIGHT_PI;

  /* 破棄用に自前で集める(three は自動解放しない) */
  const geometries: THREE_NS.BufferGeometry[] = [];
  const materials: THREE_NS.Material[] = [];
  const textures: THREE_NS.Texture[] = [];
  const track = <T extends THREE_NS.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackM = <T extends THREE_NS.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  /* ---- Canvasテクスチャ ------------------------------------------- */
  function texCanvas(
    w: number,
    h: number,
    draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    srgb: boolean,
  ): THREE_NS.CanvasTexture {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    draw(cv.getContext("2d") as CanvasRenderingContext2D, w, h);
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 4;
    /* 色として見せるテクスチャだけ sRGB。bumpMap はデータなので既定のまま */
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    return t;
  }

  const castTex = texCanvas(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, w, h);
      for (let n = 0; n < 4200; n++) {
        g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.25})`;
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    false,
  );
  castTex.wrapS = castTex.wrapT = THREE.RepeatWrapping;
  castTex.repeat.set(2, 2);

  const crinkleTex = texCanvas(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, w, h);
      for (let n = 0; n < 2600; n++) {
        g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.4})`;
        const s = 1 + Math.random() * 3;
        g.fillRect(Math.random() * w, Math.random() * h, s, s);
      }
    },
    false,
  );
  crinkleTex.wrapS = crinkleTex.wrapT = THREE.RepeatWrapping;

  const hairTex = texCanvas(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) {
        g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.12})`;
        g.fillRect(0, y, w, 1);
      }
    },
    false,
  );
  hairTex.wrapS = hairTex.wrapT = THREE.RepeatWrapping;

  const glowTex = texCanvas(
    128,
    128,
    (g) => {
      const gr = g.createRadialGradient(64, 64, 2, 64, 64, 60);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    },
    true,
  );

  function textTex(txt: string, fg: string, bg: string, w: number): THREE_NS.CanvasTexture {
    return texCanvas(
      w,
      128,
      (g, cw) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, cw, 128);
        g.fillStyle = fg;
        g.font = "800 62px Helvetica,Arial,sans-serif";
        g.textBaseline = "middle";
        const sp = 14;
        let tw = 0;
        for (const ch of txt) tw += g.measureText(ch).width + sp;
        let cx = (cw - tw + sp) / 2;
        for (const ch of txt) {
          g.fillText(ch, cx, 70);
          cx += g.measureText(ch).width + sp;
        }
      },
      true,
    );
  }

  /* ---- ライト・床・接地影 ------------------------------------------ */
  const key = new THREE.DirectionalLight(0xf2f4f8, 1.15 * lightScale);
  key.position.set(5, 7.5, 4.5);
  key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -4;
  scene.add(key);

  const rim = new THREE.PointLight(0x3ec1f0, 0.95 * lightScale, 24);
  rim.decay = 1; // r128 の既定に戻す(現行の既定 2 だと届かない)
  rim.position.set(-6, 2.6, -4.5);
  scene.add(rim);

  const fill = new THREE.PointLight(0xc9b08a, 0.3 * lightScale, 26);
  fill.decay = 1;
  fill.position.set(4, 1.2, -6);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x2a3038, 0.55 * lightScale));

  const floorGeo = track(new THREE.PlaneGeometry(40, 40));
  const floorMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.95, metalness: 0 }),
  );
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.62;
  floor.receiveShadow = shadows;
  scene.add(floor);

  const cshTex = texCanvas(
    256,
    128,
    (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(0,0,0,.5)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    true,
  );
  const cshGeo = track(new THREE.PlaneGeometry(9, 4.6));
  const cshMat = trackM(
    new THREE.MeshBasicMaterial({ map: cshTex, transparent: true, depthWrite: false }),
  );
  const csh = new THREE.Mesh(cshGeo, cshMat);
  csh.rotation.x = -Math.PI / 2;
  csh.position.y = -1.6;
  scene.add(csh);

  /* ---- マテリアル --------------------------------------------------- */
  type StdExtra = Partial<THREE_NS.MeshStandardMaterialParameters>;
  const std = (c: number, r: number, m: number, ex?: StdExtra) =>
    trackM(
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: r,
        metalness: m,
        envMapIntensity: 1.15,
        ...(ex || {}),
      }),
    );

  const ironM = std(0x272e38, 0.8, 0.35, { transparent: true, bumpMap: castTex, bumpScale: 0.015 });
  const headM = std(0x39424e, 0.6, 0.6, { transparent: true, bumpMap: castTex, bumpScale: 0.008 });
  const coverM = trackM(
    new THREE.MeshPhysicalMaterial({
      color: 0x114268,
      roughness: 0.72,
      metalness: 0.2,
      clearcoat: 0.55,
      clearcoatRoughness: 0.3,
      transparent: true,
      envMapIntensity: 1.2,
      bumpMap: crinkleTex,
      bumpScale: 0.02,
    }),
  );
  const panM = std(0x121821, 0.7, 0.4, { transparent: true });
  const alumM = std(0xb9bdc2, 0.32, 0.92, { bumpMap: hairTex, bumpScale: 0.004 });
  const alumHot = std(0x8d9096, 0.4, 0.9);
  const steelM = std(0x4c5158, 0.35, 0.95);
  const polishM = std(0x9aa2ab, 0.18, 1.0);
  const darkM = std(0x171b21, 0.5, 0.7);
  const goldM = std(0xb59a6a, 0.4, 1.0);
  const pipeM = std(0x3c4046, 0.42, 0.88, { emissive: 0xff3808, emissiveIntensity: 0 });
  const sleeveM = std(0x7c8794, 0.25, 0.9, { transparent: true, opacity: 0.15, depthWrite: false });
  const fadeMats: THREE_NS.Material[] = [ironM, headM, coverM];
  const hudFade: THREE_NS.Material[] = [];

  /* ---- 造形ヘルパー ------------------------------------------------- */
  const root = new THREE.Group();
  scene.add(root);

  const plate = (
    w: number,
    h: number,
    tex: THREE_NS.Texture,
    x: number,
    y: number,
    z: number,
    parent?: THREE_NS.Object3D,
  ) => {
    const mat = trackM(new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    mat.toneMapped = false;
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), mat);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE_NS.Object3D,
    shadow?: boolean,
  ) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z);
    if (shadow && shadows) m.castShadow = true;
    m.receiveShadow = shadows;
    (parent || root).add(m);
    return m;
  };
  const cylY = (
    r: number,
    h: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE_NS.Object3D,
    seg?: number,
  ) => {
    const m = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, h, seg || 24)), mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    (parent || root).add(m);
    return m;
  };
  const cylX = (
    r: number,
    h: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE_NS.Object3D,
    seg?: number,
  ) => {
    const m = cylY(r, h, mat, x, y, z, parent, seg);
    m.rotation.z = Math.PI / 2;
    return m;
  };
  const torX = (
    r: number,
    t: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE_NS.Object3D,
  ) => {
    const m = new THREE.Mesh(track(new THREE.TorusGeometry(r, t, 10, 26)), mat);
    m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = shadows;
    (parent || root).add(m);
    return m;
  };

  const hexGeo = track(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 6));

  /* ---- 外殻(ブロック) ----------------------------------------------- */
  const shellG = new THREE.Group();
  root.add(shellG);
  box(5.7, 2.75, 1.7, ironM, 0, 0.83, 0, shellG);
  box(5.85, 0.16, 1.82, ironM, 0, 2.14, 0, shellG);
  box(5.85, 0.14, 1.82, ironM, 0, -0.48, 0, shellG);
  box(0.5, 0.5, 1.9, ironM, -2.85, 0.5, 0, shellG);
  box(0.5, 0.5, 1.9, ironM, 2.85, 0.5, 0, shellG);
  [-2.4, -1.2, 1.2, 2.4].forEach((wx) => box(0.14, 1.6, 0.1, ironM, wx, 0.95, 0.83, shellG));
  box(5.4, 0.06, 0.1, darkM, 0, 1.88, 0.85, shellG);
  box(5.4, 0.06, 0.1, darkM, 0, 0.16, 0.85, shellG);
  CYLX.forEach((x) => {
    const fp = new THREE.Mesh(track(new THREE.CylinderGeometry(0.15, 0.15, 0.07, 20)), alumM);
    fp.rotation.x = Math.PI / 2;
    fp.position.set(x, 0.6, 0.88);
    shellG.add(fp);
    const fr = new THREE.Mesh(track(new THREE.TorusGeometry(0.15, 0.02, 8, 22)), darkM);
    fr.position.set(x, 0.6, 0.91);
    shellG.add(fr);
  });
  const oilF = new THREE.Mesh(track(new THREE.CylinderGeometry(0.26, 0.26, 0.44, 22)), goldM);
  oilF.rotation.x = Math.PI / 2;
  oilF.position.set(2.2, 0.14, 1.0);
  oilF.castShadow = shadows;
  shellG.add(oilF);
  box(2.06, 0.54, 0.05, darkM, 0, 1.52, 0.85, shellG);
  const badge = plate(1.9, 0.44, textTex("TRX-4 · 1998", "#3EC1F0", "#0a0f16", 720), 0, 1.52, 0.885, shellG);

  /* ---- ヘッド周り --------------------------------------------------- */
  const headG = new THREE.Group();
  root.add(headG);
  box(5.7, 0.7, 1.6, headM, 0, 2.55, 0, headG);
  box(5.15, 0.42, 1.28, coverM, 0, 3.1, 0, headG);
  box(4.7, 0.12, 1.06, coverM, 0, 3.35, 0, headG);
  for (let i = 0; i < 7; i++) box(0.07, 0.3, 1.14, darkM, -2.1 + i * 0.7, 3.1, 0, headG);
  const coilM = trackM(new THREE.MeshBasicMaterial({ color: 0x3ec1f0, transparent: true }));
  coilM.toneMapped = false;
  hudFade.push(coilM);
  CYLX.forEach((x) => {
    box(0.24, 0.14, 0.3, darkM, x, 3.46, 0, headG);
    box(0.24, 0.05, 0.3, coilM, x, 3.55, 0, headG);
  });
  cylY(0.14, 0.1, polishM, -2.15, 3.44, 0, headG);

  const headBolts = new THREE.InstancedMesh(hexGeo, polishM, 10);
  {
    const m4 = new THREE.Matrix4();
    let k = 0;
    [-2.1, -1.05, 0, 1.05, 2.1].forEach((x) => {
      [0.62, -0.62].forEach((z) => {
        m4.setPosition(x, 2.95, z);
        headBolts.setMatrixAt(k++, m4);
      });
    });
    headBolts.instanceMatrix.needsUpdate = true;
  }
  headG.add(headBolts);

  cylX(0.07, 5.3, steelM, 0, 2.55, 0.33, headG);
  cylX(0.07, 5.3, steelM, 0, 2.55, -0.33, headG);

  const spin: SpinPart[] = [];
  const valves: ValvePart[] = [];
  CYLX.forEach((x, i) => {
    [0.33, -0.33].forEach((z, j) => {
      const g = new THREE.Group();
      g.position.set(x, 2.55, z);
      headG.add(g);
      const c = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.16, 0.11, 20)), alumM);
      c.rotation.z = Math.PI / 2;
      g.add(c);
      const k = new THREE.Mesh(track(new THREE.BoxGeometry(0.11, 0.26, 0.16)), alumM);
      k.position.y = 0.1;
      g.add(k);
      const off = (i * Math.PI) / 2 + j * 0.6;
      spin.push({ g, off });

      const vg = new THREE.Group();
      vg.position.set(x, 2.32, z * 0.72);
      headG.add(vg);
      const stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 10)), polishM);
      stem.position.y = 0.05;
      vg.add(stem);
      const vh = new THREE.Mesh(track(new THREE.CylinderGeometry(0.075, 0.06, 0.03, 14)), polishM);
      vh.position.y = -0.11;
      vg.add(vh);
      const spr = new THREE.Mesh(track(new THREE.TorusGeometry(0.05, 0.012, 6, 14)), steelM);
      spr.rotation.x = Math.PI / 2;
      spr.position.y = 0.12;
      vg.add(spr);
      valves.push({ g: vg, off, baseY: 2.32 });
    });
    cylY(0.05, 0.42, goldM, x, 2.04, 0, headG, 12);
  });
  cylX(0.045, 4.2, polishM, 0, 2.36, 0.52, headG, 12);
  CYLX.forEach((x) => cylY(0.035, 0.18, goldM, x, 2.26, 0.52, headG, 10));

  [0.33, -0.33].forEach((z, j) => {
    const g = new THREE.Group();
    g.position.set(-2.72, 2.55, z);
    headG.add(g);
    const d = new THREE.Mesh(track(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 26)), alumM);
    d.rotation.z = Math.PI / 2;
    d.castShadow = shadows;
    g.add(d);
    for (let t = 0; t < 12; t++) {
      const a = (t / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(track(new THREE.BoxGeometry(0.07, 0.07, 0.07)), darkM);
      tooth.position.set(0, Math.cos(a) * 0.33, Math.sin(a) * 0.33);
      tooth.rotation.x = a;
      g.add(tooth);
    }
    const b = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6)), polishM);
    b.rotation.z = Math.PI / 2;
    g.add(b);
    spin.push({ g, off: j * 0.5 });
  });

  CYLX.forEach((x, i) => {
    box(0.3, 0.3, 0.06, goldM, x, 2.35, -0.82, headG);
    const endX = -0.9 + i * 0.6;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 2.35, -0.86),
      new THREE.Vector3(x, 2.28, -1.28),
      new THREE.Vector3(x * 0.72 + endX * 0.28, 1.82, -1.44),
      new THREE.Vector3(x * 0.3 + endX * 0.7, 1.4, -1.48),
      new THREE.Vector3(endX, 1.16, -1.48),
    ]);
    const tube = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 24, 0.13, 12, false)), pipeM);
    tube.castShadow = shadows;
    headG.add(tube);
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.14, 0.02, 8, 18)), goldM);
    ring.position.set(endX, 1.16, -1.48);
    ring.rotation.x = Math.PI / 2;
    headG.add(ring);
  });
  box(3.6, 0.34, 0.44, pipeM, 0, 0.98, -1.48, headG, true);
  cylY(0.12, 0.3, goldM, 1.9, 0.85, -1.48, headG, 14);

  /* ---- オイルパン --------------------------------------------------- */
  const panG = new THREE.Group();
  root.add(panG);
  box(5.1, 0.4, 1.5, panM, 0, -0.75, 0, panG);
  box(3.0, 0.5, 1.3, panM, 0, -1.15, 0, panG);
  cylY(0.06, 0.08, goldM, 0, -1.42, 0, panG);
  const panBolts = new THREE.InstancedMesh(hexGeo, polishM, 10);
  {
    const m4 = new THREE.Matrix4();
    let k = 0;
    [-2.2, -1.1, 0, 1.1, 2.2].forEach((x) => {
      [0.72, -0.72].forEach((z) => {
        m4.setPosition(x, -0.55, z);
        panBolts.setMatrixAt(k++, m4);
      });
    });
    panBolts.instanceMatrix.needsUpdate = true;
  }
  panG.add(panBolts);

  /* ---- シリンダースリーブ ------------------------------------------- */
  CYLX.forEach((x) => {
    const s = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.44, 0.44, 1.25, 26, 1, true)),
      sleeveM,
    );
    s.position.set(x, 1.575, 0);
    root.add(s);
  });

  /* ---- クランクシャフト --------------------------------------------- */
  const crankRoot = new THREE.Group();
  root.add(crankRoot);
  const crank = new THREE.Group();
  crankRoot.add(crank);
  cylX(0.14, 6.0, steelM, 0, 0, 0, crank);
  [-2.4, -1.2, 0, 1.2, 2.4].forEach((x) => cylX(0.18, 0.2, polishM, x, 0, 0, crank));
  CYLX.forEach((x, i) => {
    const thr = new THREE.Group();
    thr.position.x = x;
    thr.rotation.x = PH[i];
    crank.add(thr);
    [-0.19, 0.19].forEach((dx) => {
      box(0.13, 1.02, 0.46, steelM, dx, 0.1, 0, thr, true);
      box(0.16, 0.44, 0.72, steelM, dx, -0.5, 0, thr, true);
      cylX(0.3, 0.15, steelM, dx, -0.52, 0, thr);
    });
    cylX(0.13, 0.36, polishM, 0, R, 0, thr);
  });

  const timing = new THREE.Group();
  timing.position.x = -2.72;
  crank.add(timing);
  const td = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20)), steelM);
  td.rotation.z = Math.PI / 2;
  timing.add(td);
  for (let t = 0; t < 8; t++) {
    const a = (t / 8) * Math.PI * 2;
    const to = new THREE.Mesh(track(new THREE.BoxGeometry(0.07, 0.06, 0.06)), darkM);
    to.position.set(0, Math.cos(a) * 0.2, Math.sin(a) * 0.2);
    to.rotation.x = a;
    timing.add(to);
  }

  const fly = new THREE.Group();
  fly.position.x = 3.35;
  crank.add(fly);
  const fd = new THREE.Mesh(track(new THREE.CylinderGeometry(1.05, 1.05, 0.18, 40)), steelM);
  fd.rotation.z = Math.PI / 2;
  fd.castShadow = shadows;
  fly.add(fd);
  const toothGeo = track(new THREE.BoxGeometry(0.16, 0.09, 0.1));
  const flyTeeth = new THREE.InstancedMesh(toothGeo, darkM, 36);
  {
    const m4 = new THREE.Matrix4();
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    for (let t = 0; t < 36; t++) {
      const a = (t / 36) * Math.PI * 2;
      p.set(0, Math.cos(a) * 1.1, Math.sin(a) * 1.1);
      e.set(a, 0, 0);
      q.setFromEuler(e);
      m4.compose(p, q, s);
      flyTeeth.setMatrixAt(t, m4);
    }
    flyTeeth.instanceMatrix.needsUpdate = true;
  }
  fly.add(flyTeeth);

  const pul = new THREE.Group();
  pul.position.x = -3.3;
  crank.add(pul);
  const pd = new THREE.Mesh(track(new THREE.CylinderGeometry(0.55, 0.55, 0.24, 30)), darkM);
  pd.rotation.z = Math.PI / 2;
  pd.castShadow = shadows;
  pul.add(pd);
  const pr = new THREE.Mesh(track(new THREE.TorusGeometry(0.55, 0.05, 8, 30)), steelM);
  pr.rotation.y = Math.PI / 2;
  pul.add(pr);
  const markMat = trackM(new THREE.MeshBasicMaterial({ color: 0x3ec1f0 }));
  markMat.toneMapped = false;
  const mark = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 0.1, 0.08)), markMat);
  mark.position.set(0, 0.5, 0);
  pul.add(mark);

  /* ---- ピストンとコンロッド ----------------------------------------- */
  const crownPts = [
    new THREE.Vector2(0, 0.355),
    new THREE.Vector2(0.14, 0.385),
    new THREE.Vector2(0.27, 0.395),
    new THREE.Vector2(0.36, 0.36),
    new THREE.Vector2(0.4, 0.3),
    new THREE.Vector2(0.4, 0.08),
  ];
  const crownGeo = track(new THREE.LatheGeometry(crownPts, 26));

  const rodShape = new THREE.Shape();
  rodShape.moveTo(-0.06, 0.07);
  rodShape.lineTo(0.06, 0.07);
  rodShape.lineTo(0.06, 0.045);
  rodShape.lineTo(0.016, 0.045);
  rodShape.lineTo(0.016, -0.045);
  rodShape.lineTo(0.06, -0.045);
  rodShape.lineTo(0.06, -0.07);
  rodShape.lineTo(-0.06, -0.07);
  rodShape.lineTo(-0.06, -0.045);
  rodShape.lineTo(-0.016, -0.045);
  rodShape.lineTo(-0.016, 0.045);
  rodShape.lineTo(-0.06, 0.045);
  rodShape.lineTo(-0.06, 0.07);
  const shankLen = L - 0.56;
  const rodGeo = track(
    new THREE.ExtrudeGeometry(rodShape, {
      depth: shankLen,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 4,
    }),
  );
  rodGeo.rotateX(-Math.PI / 2);
  rodGeo.translate(0, 0.02 - shankLen / 2, 0);

  const pistons: THREE_NS.Group[] = [];
  const rods: THREE_NS.Group[] = [];
  const caps: THREE_NS.Group[] = [];
  const glowMats: THREE_NS.SpriteMaterial[] = [];
  const fires: THREE_NS.PointLight[] = [];

  const buildPiston = (x: number) => {
    const p = new THREE.Group();
    p.position.set(x, 1.6, 0);
    root.add(p);
    const crown = new THREE.Mesh(crownGeo, alumM);
    crown.castShadow = shadows;
    p.add(crown);
    const band = new THREE.Mesh(track(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 26)), alumHot);
    band.position.y = 0.05;
    p.add(band);
    ([[0.31, darkM, 0.016], [0.25, darkM, 0.016], [0.18, goldM, 0.013]] as const).forEach((rr) => {
      const g = new THREE.Mesh(track(new THREE.TorusGeometry(0.4, rr[2], 8, 30)), rr[1]);
      g.rotation.x = Math.PI / 2;
      g.position.y = rr[0];
      p.add(g);
    });
    [-1.15, Math.PI - 1.15].forEach((ts) => {
      const sk = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.4, 0.38, 0.42, 20, 1, true, ts, 2.3)),
        alumM,
      );
      sk.position.y = -0.13;
      sk.castShadow = shadows;
      p.add(sk);
    });
    cylX(0.14, 0.12, alumM, -0.2, 0, 0, p);
    cylX(0.14, 0.12, alumM, 0.2, 0, 0, p);
    cylX(0.068, 0.6, polishM, 0, 0, 0, p);
    torX(0.075, 0.012, darkM, -0.29, 0, 0, p);
    torX(0.075, 0.012, darkM, 0.29, 0, 0, p);
    return p;
  };

  const buildRod = () => {
    const g = new THREE.Group();
    root.add(g);
    torX(0.12, 0.05, alumM, 0, L / 2, 0, g);
    const shank = new THREE.Mesh(rodGeo, alumM);
    shank.castShadow = shadows;
    g.add(shank);
    torX(0.19, 0.055, alumM, 0, -L / 2, 0, g);
    const cap = new THREE.Group();
    g.add(cap);
    box(0.17, 0.12, 0.3, steelM, 0, -L / 2 - 0.14, 0, cap, true);
    [0.13, -0.13].forEach((z) => {
      const b = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.17, 6)), polishM);
      b.position.set(0, -L / 2 - 0.03, z);
      cap.add(b);
    });
    caps.push(cap);
    return g;
  };

  CYLX.forEach((x) => {
    pistons.push(buildPiston(x));
    rods.push(buildRod());
    const gm = trackM(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffa64d,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ) as THREE_NS.SpriteMaterial;
    glowMats.push(gm);
    const sp = new THREE.Sprite(gm);
    sp.position.set(x, 2.02, 0);
    sp.scale.set(1.1, 1.1, 1);
    root.add(sp);
    const li = new THREE.PointLight(0xff7a30, 0, 2.8);
    li.decay = 1;
    li.position.set(x, 1.95, 0);
    root.add(li);
    fires.push(li);
  });

  /* ---- 舞う塵 -------------------------------------------------------- */
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (Math.random() * 2 - 1) * 4;
    dustPos[i * 3 + 1] = Math.random() * 4 - 1;
    dustPos[i * 3 + 2] = (Math.random() * 2 - 1) * 2.4;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = trackM(
    new THREE.PointsMaterial({
      color: 0xafc8d8,
      size: 0.035,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  ) as THREE_NS.PointsMaterial;
  scene.add(new THREE.Points(dustGeo, dustMat));

  /* ---- 外装の透過(X線) ---------------------------------------------- */
  const setShell = (o: number) => {
    fadeMats.forEach((m) => {
      m.opacity = o;
    });
    const ho = Math.max(0, (o - 0.45) / 0.55);
    hudFade.forEach((m) => {
      m.opacity = ho;
    });
    panM.opacity = 0.3 + 0.7 * o;
    badge.material.opacity = o;
    shellG.visible = o > 0.02;
  };
  setShell(1);

  const dispose = () => {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    headBolts.dispose();
    panBolts.dispose();
    flyTeeth.dispose();
    scene.remove(root);
  };

  return {
    lightScale,
    root,
    shellG,
    headG,
    panG,
    crankRoot,
    crank,
    pistons,
    rods,
    caps,
    spin,
    valves,
    glowMats,
    fires,
    pipeM,
    dust: { geo: dustGeo, mat: dustMat, count: dustN },
    setShell,
    dispose,
  };
}

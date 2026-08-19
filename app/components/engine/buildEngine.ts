/**
 * TRX-4 エンジンの造形。ブロックとクランク機構は GLTF モデル、
 * シリンダーヘッド・カム・バルブ・オイルパンは t-rex-engine-v3.html の自作ジオメトリ。
 *
 * three と GLTFLoader は呼び出し側が動的importしたものを渡す。この方式なら
 * このモジュール自体は初期バンドルに載っても three を引き込まない。
 *
 * ── 使用している 3D モデル(いずれも CC-BY-4.0 / 商用可・要クレジット) ──
 *  ブロック: "Inline 4 engine block diagram (see through)" by Lame3D models
 *  クランク機構: "Rigged 4-Cylinder Engine (FREE)" by david.gnzlv
 *  クレジットは app/engine/page.tsx のフッターに記載している。
 *
 * ── 2モデルとv3座標系の合わせ方(実測値。動かすと噛み合わなくなる) ──
 *  クランク軸を y=0、気筒をX方向に置くのは v3 と同じ。
 *  ブロックのボア中心(モデル素の値) : -1.020 / -0.280 / +0.448 / +1.192
 *  クランク機構の気筒中心(素の値)   : 0 / 2.2534 / 4.4898 / 6.761、クランク軸 y=-3.0204
 *  両者のボア間隔を 1.300 に揃えると BLOCK_SCALE / CRANK_SCALE が決まる。
 *  最後に FIT_SCALE で全体をv3のシルエットに縮め、カメラのキーフレームを流用する。
 *
 * ── r128 → r185 で直した点 ──
 *  - ライト強度は全て ×π(r155で useLegacyLights のπ倍が外れたため)
 *  - PointLight の decay は明示的に 1(r128の既定。現行の既定は2)
 *  - map に使う CanvasTexture は colorSpace = SRGBColorSpace。bumpMap は触らない
 */

import type * as THREE_NS from "three";
import type { GLTFLoader as GLTFLoaderType } from "three/examples/jsm/loaders/GLTFLoader.js";

type THREE = typeof THREE_NS;

/** 気筒の中心X。ブロックモデルのボア間隔(1.300)に合わせてある */
export const CYLX = [-1.949, -0.65, 0.65, 1.949];
/** 直列4気筒のクランク位相(1-4 / 2-3 が対)。点火タイミングに使う */
export const PH = [0, Math.PI, Math.PI, 0];

/* ---- 2モデルの配置(すべて実測から算出) ---- */
const BLOCK_SCALE = 1.7645; // ボア間隔 0.7373 → 1.300
const BLOCK_X = -0.15; //     ボア中心の平均をv3の気筒中心に合わせる
const BLOCK_Y = 0.95; //      デッキ面がピストン上死点の上に来る高さ
const CRANK_SCALE = 0.57691; // 気筒間隔 2.2534 → 1.300
const CRANK_AXIS_RAW_Y = 3.0204; // モデル素のクランク軸を y=0 へ持ち上げる量
const CRANK_CENTER_RAW_X = 6.761 / 2; // 気筒1と気筒4の中点
/** クランク1回転ぶんのアニメーション長(秒)。回転角からこの尺へ写像する */
export const CRANK_CYCLE = 4 / 3;
/** ブロックのデッキ面(この上にヘッドを載せる) */
const DECK_Y = BLOCK_Y + (2.09 * BLOCK_SCALE) / 2;
/** ブロックのスカート下端(この下にオイルパンを吊る) */
const SKIRT_Y = BLOCK_Y - (2.09 * BLOCK_SCALE) / 2;
/** v3のヘッド/パンをブロックに合わせて動かす量 */
const HEAD_LIFT = DECK_Y - 2.2;
const PAN_DROP = SKIRT_Y - -0.55;
/** 組み上がった全体をv3のシルエットまで縮める。カメラのキーフレームを流用するため */
const FIT_SCALE = 0.78;
const FIT_Y = 0.046;

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
  spin: SpinPart[];
  valves: ValvePart[];
  glowMats: THREE_NS.SpriteMaterial[];
  fires: THREE_NS.PointLight[];
  pipeM: THREE_NS.MeshStandardMaterial;
  dust: { geo: THREE_NS.BufferGeometry; mat: THREE_NS.PointsMaterial; count: number };
  /** クランク機構のアニメーション。クランク角から時間へ写像して駆動する */
  crankMixer: THREE_NS.AnimationMixer;
  /** ロッドキャップ。分解の第一手として下へずらす */
  setCapSlide: (v: number) => void;
  setShell: (o: number) => void;
  dispose: () => void;
};

export type BuildOptions = {
  dustCount?: number;
  shadows?: boolean;
  lightScale?: number;
  /** public 配下のベースパス(GitHub Pages のサブパス配信用) */
  basePath?: string;
};

export async function buildEngine(
  THREE: THREE,
  loader: GLTFLoaderType,
  scene: THREE_NS.Scene,
  options: BuildOptions = {},
): Promise<EngineParts> {
  const dustN = options.dustCount ?? 110;
  const shadows = options.shadows ?? true;
  const lightScale = options.lightScale ?? LIGHT_PI;
  const base = options.basePath ?? "";

  const geometries: THREE_NS.BufferGeometry[] = [];
  const materials: THREE_NS.Material[] = [];
  const textures: THREE_NS.Texture[] = [];
  const track = <T extends THREE_NS.BufferGeometry>(g: T): T => (geometries.push(g), g);
  const trackM = <T extends THREE_NS.Material>(m: T): T => (materials.push(m), m);

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
  rim.decay = 1;
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
  const steelM = std(0x4c5158, 0.35, 0.95);
  const polishM = std(0x9aa2ab, 0.18, 1.0);
  const darkM = std(0x171b21, 0.5, 0.7);
  const goldM = std(0xb59a6a, 0.4, 1.0);
  const pipeM = std(0x3c4046, 0.42, 0.88, { emissive: 0xff3808, emissiveIntensity: 0 });
  const fadeMats: THREE_NS.Material[] = [ironM, headM, coverM];
  const hudFade: THREE_NS.Material[] = [];

  /* ---- グループ構成 --------------------------------------------------
     root   … 始動時の微振動(v3が毎フレーム position を書く)
     fit    … 2モデルを組んだ実寸を、v3のカメラで収まる大きさへ一括で縮める */
  const root = new THREE.Group();
  scene.add(root);
  const fit = new THREE.Group();
  fit.scale.setScalar(FIT_SCALE);
  fit.position.y = FIT_Y;
  root.add(fit);

  const plate = (
    w: number,
    h: number,
    tex: THREE_NS.Texture,
    x: number,
    y: number,
    z: number,
    parent: THREE_NS.Object3D,
  ) => {
    const mat = trackM(new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    mat.toneMapped = false;
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), mat);
    m.position.set(x, y, z);
    parent.add(m);
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
    parent: THREE_NS.Object3D,
    shadow?: boolean,
  ) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z);
    if (shadow && shadows) m.castShadow = true;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  };
  const cylY = (
    r: number,
    h: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE_NS.Object3D,
    seg?: number,
  ) => {
    const m = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, h, seg || 24)), mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  };
  const cylX = (
    r: number,
    h: number,
    mat: THREE_NS.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE_NS.Object3D,
    seg?: number,
  ) => {
    const m = cylY(r, h, mat, x, y, z, parent, seg);
    m.rotation.z = Math.PI / 2;
    return m;
  };

  const hexGeo = track(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 6));

  /* ---- 外殻: シリンダーブロック(GLTF) -------------------------------- */
  const shellG = new THREE.Group();
  fit.add(shellG);
  const blockGltf = await loader.loadAsync(`${base}/models/engine-block.glb`);
  const blockRoot = blockGltf.scene;
  {
    const bbox = new THREE.Box3().setFromObject(blockRoot);
    blockRoot.position.sub(bbox.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();
    holder.add(blockRoot);
    holder.scale.setScalar(BLOCK_SCALE);
    holder.position.set(BLOCK_X, BLOCK_Y, 0);
    shellG.add(holder);
    blockRoot.traverse((o) => {
      const mesh = o as THREE_NS.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = ironM;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      geometries.push(mesh.geometry);
    });
  }
  /* 型式プレート。ブロック側面に貼るのでX線と一緒に消える */
  const badge = plate(
    1.9,
    0.44,
    textTex("TRX-4 · 1998", "#3EC1F0", "#0a0f16", 720),
    0,
    1.5,
    (1.526 * BLOCK_SCALE) / 2 + 0.02,
    shellG,
  );

  /* ---- ヘッド周り(v3の自作。ブロックのデッキ面に載せる) -------------- */
  const headG = new THREE.Group();
  headG.position.y = HEAD_LIFT;
  fit.add(headG);
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

  /* ---- オイルパン(v3の自作。ブロックのスカート下端に吊る) ------------ */
  const panG = new THREE.Group();
  panG.position.y = PAN_DROP;
  fit.add(panG);
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

  /* ---- 可動内部: クランク + コンロッド + ピストン(GLTF・リグ付き) ----
     モデルのアニメーションがクランク1回転そのものなので、
     クランク角を時間へ写像して駆動する(スクロール連動はこの1本で効く)。 */
  const crankRoot = new THREE.Group();
  fit.add(crankRoot);
  const crankGltf = await loader.loadAsync(`${base}/models/engine-crank.glb`);
  const crankModel = crankGltf.scene;
  crankModel.position.set(-CRANK_CENTER_RAW_X, CRANK_AXIS_RAW_Y, 0);
  const crankHolder = new THREE.Group();
  crankHolder.add(crankModel);
  crankHolder.scale.setScalar(CRANK_SCALE);
  crankRoot.add(crankHolder);

  const capNodes: { node: THREE_NS.Object3D; baseY: number }[] = [];
  crankModel.traverse((o) => {
    const mesh = o as THREE_NS.Mesh;
    if (mesh.isMesh) {
      const name = (o.parent?.name || o.name).toLowerCase();
      mesh.material = /pist|biela/.test(name) ? alumM : /bul/.test(name) ? polishM : steelM;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      geometries.push(mesh.geometry);
    }
    /* ロッドキャップ(Biela inferior)は分解の第一手で下へ抜く */
    if (/inferior/i.test(o.name)) capNodes.push({ node: o, baseY: o.position.y });
  });
  const crankMixer = new THREE.AnimationMixer(crankModel);
  crankMixer.clipAction(crankGltf.animations[0]).play();
  crankMixer.setTime(0);

  const setCapSlide = (v: number) => {
    /* ミキサーが毎フレーム position を書くので、setTime の後に呼ぶこと */
    for (const c of capNodes) c.node.position.y = c.baseY - 1.05 * v;
  };

  /* ---- 点火の閃光(気筒の上、ブロックのデッキ直下) --------------------- */
  const glowMats: THREE_NS.SpriteMaterial[] = [];
  const fires: THREE_NS.PointLight[] = [];
  const FLASH_Y = DECK_Y - 0.1;
  CYLX.forEach((x) => {
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
    sp.position.set(x, FLASH_Y, 0);
    sp.scale.set(1.3, 1.3, 1);
    fit.add(sp);
    const li = new THREE.PointLight(0xff7a30, 0, 2.8);
    li.decay = 1;
    li.position.set(x, FLASH_Y - 0.1, 0);
    fit.add(li);
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
    crankMixer.stopAllAction();
    crankMixer.uncacheRoot(crankModel);
    scene.remove(root);
  };

  return {
    lightScale,
    root,
    shellG,
    headG,
    panG,
    crankRoot,
    spin,
    valves,
    glowMats,
    fires,
    pipeM,
    dust: { geo: dustGeo, mat: dustMat, count: dustN },
    crankMixer,
    setCapSlide,
    setShell,
    dispose,
  };
}

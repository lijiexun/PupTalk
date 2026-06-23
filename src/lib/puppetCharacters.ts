import type { CharacterId, PuppetControls } from "../types/puppet";
import { drawDogPuppet } from "./puppetDog";
import { clamp } from "./smoothing";

export interface CharacterOption {
  id: CharacterId;
  name: string;
  shortName: string;
  marker: string;
  color: string;
}

interface DrawOptions {
  time: number;
}

interface RigState {
  mouthOpen: number;
  jawAngle: number;
  blink: boolean;
  bounce: number;
}

export const CHARACTERS: CharacterOption[] = [
  { id: "dog", name: "Dog", shortName: "Dog", marker: "D", color: "#f6a24a" },
  { id: "cat", name: "Cat", shortName: "Cat", marker: "C", color: "#252525" },
  { id: "lion", name: "Lion", shortName: "Lion", marker: "L", color: "#d9903e" },
  { id: "tin-man", name: "Tin man", shortName: "Tin", marker: "T", color: "#aebcc0" },
  { id: "scarecrow", name: "Scarecrow", shortName: "Scare", marker: "S", color: "#d99546" },
  { id: "cowboy", name: "Cowboy", shortName: "Cowboy", marker: "W", color: "#a66435" },
  { id: "space-ranger", name: "Space ranger", shortName: "Ranger", marker: "R", color: "#48a96e" },
];

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function path(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}

function strokePath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number, points: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawEyes(ctx: CanvasRenderingContext2D, blink: boolean, nearColor = "#fff6dc"): void {
  if (blink) {
    ctx.strokeStyle = "#33201c";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(34, -39);
    ctx.quadraticCurveTo(43, -35, 52, -39);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-31, -42);
    ctx.quadraticCurveTo(-14, -34, 3, -42);
    ctx.stroke();
    return;
  }

  ellipse(ctx, 44, -38, 8, 12, "#33201c");
  ellipse(ctx, 47, -43, 2.2, 3, "#fff");
  ellipse(ctx, -13, -42, 17, 21, nearColor);
  ellipse(ctx, -11, -41, 9, 14, "#33201c");
  ellipse(ctx, -7, -48, 3, 4, "#fff");
}

function drawGenericJaw(ctx: CanvasRenderingContext2D, color: string, innerColor: string, mouthOpen: number): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-2, 1);
  ctx.quadraticCurveTo(34, -4, 72, 1);
  ctx.quadraticCurveTo(95, 9 + mouthOpen * 4, 91, 21 + mouthOpen * 6);
  ctx.quadraticCurveTo(59, 36, 20, 29);
  ctx.quadraticCurveTo(2, 25, -4, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(38, 2, 67, 6);
  ctx.quadraticCurveTo(82, 11, 78, 17 + mouthOpen * 3);
  ctx.quadraticCurveTo(54, 25, 22, 22);
  ctx.quadraticCurveTo(10, 19, 5, 14);
  ctx.closePath();
  ctx.fill();
}

function drawMouthGap(ctx: CanvasRenderingContext2D, mouthOpen: number, x = 66, y = 39): void {
  if (mouthOpen <= 0.03) {
    return;
  }

  ctx.fillStyle = "#2c1714";
  ctx.beginPath();
  ctx.ellipse(x, y + mouthOpen * 7, 48, 7 + mouthOpen * 17, 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function drawRigShadow(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ellipse(ctx, -35, 199, 102, 17, "#10265c");
  ctx.globalAlpha = 0.08;
  ellipse(ctx, -25, 122, 72, 94, "#10265c");
  ellipse(ctx, 10, -5, 118, 86, "#10265c");
  ctx.restore();
}

function withRig(
  ctx: CanvasRenderingContext2D,
  controls: PuppetControls,
  width: number,
  height: number,
  options: DrawOptions,
  draw: (state: RigState) => void,
): void {
  const mouthOpen = clamp(controls.mouthOpen, 0, 1);
  const scale = clamp(controls.scale ?? 1, 0.68, 1.5);
  const state = {
    mouthOpen,
    jawAngle: mouthOpen * 0.72,
    blink: options.time % 4300 > 4100,
    bounce: Math.sin(options.time / 170) * mouthOpen * 2.5,
  };

  ctx.save();
  ctx.translate(width * 0.5 + controls.headX, height * 0.48 + controls.headY + state.bounce);
  ctx.scale(controls.facing * scale, scale);
  ctx.rotate(controls.headTilt);
  drawRigShadow(ctx);
  draw(state);
  ctx.restore();
}

function drawAnimalMuzzle(ctx: CanvasRenderingContext2D, muzzle: string, jaw: string, jawInner: string, state: RigState): void {
  ellipse(ctx, 24, 30, 82, 44, muzzle);
  drawMouthGap(ctx, state.mouthOpen);
  path(ctx, [[-2, -16], [85, -18], [134, 8], [119, 31], [54, 32], [12, 21]], muzzle);
  ctx.save();
  ctx.translate(36, 34);
  ctx.rotate(state.jawAngle);
  drawGenericJaw(ctx, jaw, jawInner, state.mouthOpen);
  ctx.restore();
}

function drawSmallCatEyes(ctx: CanvasRenderingContext2D, blink: boolean): void {
  if (blink) {
    strokePath(ctx, [[-49, -36], [-31, -34], [-13, -36]], "#bde86b", 4);
    strokePath(ctx, [[25, -34], [39, -33], [52, -35]], "#bde86b", 4);
    return;
  }

  ellipse(ctx, -31, -36, 21, 24, "#d8ff79");
  ellipse(ctx, -29, -36, 8, 15, "#1a201b");
  ellipse(ctx, -37, -44, 5, 5, "#ffffff");
  ellipse(ctx, 39, -34, 17, 21, "#d8ff79");
  ellipse(ctx, 40, -34, 6, 13, "#1a201b");
  ellipse(ctx, 35, -42, 4, 4, "#ffffff");
}

function drawHumanEyes(ctx: CanvasRenderingContext2D, blink: boolean, iris = "#3a5c80"): void {
  if (blink) {
    strokePath(ctx, [[-33, -34], [-17, -31], [-1, -34]], "#2b211b", 4);
    strokePath(ctx, [[38, -32], [48, -31], [58, -33]], "#2b211b", 4);
    return;
  }

  ellipse(ctx, -17, -34, 14, 17, "#fff8e8");
  ellipse(ctx, -15, -33, 6, 8, iris);
  ellipse(ctx, -13, -37, 2.5, 3, "#ffffff");
  ellipse(ctx, 49, -32, 9, 12, "#fff8e8");
  ellipse(ctx, 50, -31, 4, 6, iris);
  ellipse(ctx, 52, -35, 1.8, 2, "#ffffff");
}

function drawHumanMouth(ctx: CanvasRenderingContext2D, state: RigState, skin: string, shadow = "#2b1714"): void {
  if (state.mouthOpen > 0.03) {
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(46, 30 + state.mouthOpen * 11, 38, 8 + state.mouthOpen * 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  strokePath(ctx, [[14, 24], [42, 31], [72, 25]], "#553226", 4);
  ctx.save();
  ctx.translate(18, 31);
  ctx.rotate(state.jawAngle * 1.35);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(30, 7, 65, -1);
  ctx.quadraticCurveTo(59, 34, 27, 39);
  ctx.quadraticCurveTo(5, 32, 0, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCat(ctx: CanvasRenderingContext2D, state: RigState): void {
  const earBob = state.mouthOpen * 3;
  strokePath(ctx, [[-86, 86], [-143, 92], [-145, 17], [-123, 4], [-115, 62]], "#222222", 16);
  ellipse(ctx, -47, 114, 64, 82, "#282828");
  ellipse(ctx, -30, 125, 41, 63, "#3a3a3a");
  strokePath(ctx, [[-63, 96], [-73, 151]], "#1f1f1f", 5);
  strokePath(ctx, [[-30, 96], [-29, 153]], "#1f1f1f", 5);
  path(ctx, [[-84, -39], [-65, -112 - earBob], [-17, -50]], "#1f1f1f");
  path(ctx, [[-69, -48], [-61, -86 - earBob], [-38, -54]], "#515151");
  path(ctx, [[23, -48], [60, -113 - earBob], [77, -31]], "#1f1f1f");
  path(ctx, [[37, -54], [58, -88 - earBob], [66, -39]], "#515151");
  ellipse(ctx, -9, -7, 99, 78, "#242424");
  ellipse(ctx, 23, -2, 78, 59, "#343434");
  ellipse(ctx, -47, 4, 14, 10, "rgba(255, 255, 255, 0.08)");
  drawSmallCatEyes(ctx, state.blink);
  ellipse(ctx, 64, 7, 9, 6, "#111111");
  strokePath(ctx, [[64, 14], [55, 25], [42, 17]], "#111111", 3);
  strokePath(ctx, [[70, 12], [92, 6], [111, 8]], "#111111", 2.2);
  strokePath(ctx, [[70, 20], [93, 21], [112, 26]], "#111111", 2.2);
  strokePath(ctx, [[69, 28], [90, 36], [107, 45]], "#111111", 2.2);
  strokePath(ctx, [[54, 14], [10, 2], [-31, 2]], "#111111", 2.5);
  strokePath(ctx, [[55, 23], [11, 23], [-29, 33]], "#111111", 2.5);
  strokePath(ctx, [[56, 31], [18, 47], [-18, 58]], "#111111", 2.5);
  if (state.mouthOpen > 0.03) {
    ellipse(ctx, 50, 32 + state.mouthOpen * 11, 31, 8 + state.mouthOpen * 24, "#140d0d");
  }
  ctx.save();
  ctx.translate(31, 28);
  ctx.rotate(state.jawAngle * 1.15);
  path(ctx, [[0, 0], [48, 1], [41, 29], [10, 31]], "#3a3a3a");
  ctx.restore();
}

function drawLion(ctx: CanvasRenderingContext2D, state: RigState): void {
  const manePulse = state.mouthOpen * 5;
  strokePath(ctx, [[-64, 145], [-139, 160], [-166, 105], [-157, 64], [-136, 111]], "#7a3719", 16);
  strokePath(ctx, [[-64, 145], [-132, 153], [-156, 108], [-151, 78], [-140, 108]], "#b76027", 8);
  path(ctx, [[-137, 108], [-157, 93], [-170, 120], [-146, 132]], "#7a3719");
  path(ctx, [[-139, 109], [-153, 99], [-160, 116], [-146, 124]], "#b76027");

  ellipse(ctx, -42, 120, 54, 72, "#d78637");
  ellipse(ctx, -21, 132, 34, 56, "#efb45b");
  strokePath(ctx, [[-52, 162], [-61, 197]], "#7a3719", 8);
  strokePath(ctx, [[-15, 164], [-5, 197]], "#7a3719", 8);

  ellipse(ctx, -17, -11, 151 + manePulse, 132 + manePulse, "#7a3719");
  ellipse(ctx, -95, -7, 67 + manePulse, 105 + manePulse, "#8f471f");
  ellipse(ctx, 53, -5, 74 + manePulse, 103 + manePulse, "#8f471f");
  ellipse(ctx, -21, -92, 92 + manePulse, 54 + manePulse, "#9f5224");
  ellipse(ctx, -20, 70, 105 + manePulse, 60 + manePulse, "#9f5224");
  ellipse(ctx, -103, -58, 45 + manePulse, 46 + manePulse, "#b75a24");
  ellipse(ctx, 76, -58, 47 + manePulse, 47 + manePulse, "#b75a24");
  ellipse(ctx, -100, 48, 47 + manePulse, 48 + manePulse, "#b75a24");
  ellipse(ctx, 78, 46, 50 + manePulse, 48 + manePulse, "#b75a24");
  ellipse(ctx, -22, -14, 115, 96, "#b76027");
  ellipse(ctx, -12, -12, 96, 78, "#eda64a");
  ellipse(ctx, 16, -5, 75, 62, "#f4bd62");
  ellipse(ctx, 37, 22, 49, 35, "#ffe0a4");
  drawMouthGap(ctx, state.mouthOpen * 0.72, 58, 35);
  ellipse(ctx, 74, 11, 16, 12, "#2d1d18");
  strokePath(ctx, [[67, 23], [45, 34], [21, 26]], "#57301f", 4);
  ctx.save();
  ctx.translate(38, 38);
  ctx.rotate(state.jawAngle * 0.72);
  ctx.scale(0.72, 0.72);
  drawGenericJaw(ctx, "#d78637", "#f4bd62", state.mouthOpen);
  ctx.restore();
  drawEyes(ctx, state.blink, "#fff4c4");
  strokePath(ctx, [[-42, -62], [-17, -71], [10, -63]], "#5f2d17", 5);
  strokePath(ctx, [[28, -61], [45, -67], [59, -59]], "#5f2d17", 4);
  ellipse(ctx, -61, 9, 11, 9, "rgba(255, 225, 142, 0.28)");
}

function drawTinMan(ctx: CanvasRenderingContext2D, state: RigState): void {
  roundedRect(ctx, -78, 80, 96, 111, 18, "#9aa7ab");
  roundedRect(ctx, -61, 92, 61, 78, 14, "#d3dcde");
  strokePath(ctx, [[-80, 103], [-122, 139]], "#8c9aa0", 16);
  strokePath(ctx, [[17, 104], [66, 140]], "#8c9aa0", 16);
  strokePath(ctx, [[-55, 168], [-66, 197]], "#87959a", 10);
  strokePath(ctx, [[-15, 168], [-6, 197]], "#87959a", 10);
  roundedRect(ctx, -58, 44, 72, 52, 14, "#9aa7ab");
  path(ctx, [[-51, -100], [0, -166], [50, -100]], "#909da2");
  ellipse(ctx, 0, -99, 60, 13, "#d2dcdf");
  roundedRect(ctx, -75, -94, 142, 139, 22, "#aebcc0");
  roundedRect(ctx, -58, -76, 108, 103, 16, "#d9e2e5");
  ellipse(ctx, -69, -18, 13, 23, "#849197");
  drawHumanEyes(ctx, state.blink, "#577b8b");
  roundedRect(ctx, 2, 6, 70, 26, 6, "#7d8b91");
  if (state.mouthOpen > 0.03) {
    roundedRect(ctx, 5, 16, 64, 16 + state.mouthOpen * 25, 6, "#233035");
  }
  ctx.save();
  ctx.translate(4, 29);
  ctx.rotate(state.jawAngle * 1.2);
  roundedRect(ctx, 0, -2, 68, 34, 7, "#c2ced2");
  ctx.restore();
  ellipse(ctx, -45, -2, 5, 5, "#748287");
  ellipse(ctx, 54, -2, 5, 5, "#748287");
  strokePath(ctx, [[-27, -105], [28, -105]], "#7c878b", 5);
}

function drawScarecrow(ctx: CanvasRenderingContext2D, state: RigState): void {
  const strawBob = state.mouthOpen * 6;
  strokePath(ctx, [[-79, 103], [-139, 137]], "#8b5b24", 10);
  strokePath(ctx, [[4, 100], [62, 136]], "#8b5b24", 10);
  strokePath(ctx, [[-69, 151], [-91, 198]], "#8b5b24", 9);
  strokePath(ctx, [[-24, 151], [-13, 198]], "#8b5b24", 9);
  roundedRect(ctx, -82, 80, 101, 91, 12, "#2d8d8c");
  path(ctx, [[-105, 88], [36, 86], [8, 132], [-88, 130]], "#cf5d38");
  strokePath(ctx, [[-79, 103], [-133, 132]], "#e7bf63", 4);
  strokePath(ctx, [[4, 101], [57, 131]], "#e7bf63", 4);
  strokePath(ctx, [[-69, 151], [-87, 191]], "#e7bf63", 4);
  strokePath(ctx, [[-24, 151], [-14, 191]], "#e7bf63", 4);
  for (let i = 0; i < 15; i += 1) {
    strokePath(ctx, [[-103 + i * 13, -61], [-125 + i * 17, -95 - strawBob]], "#e3b14f", 5);
  }
  path(ctx, [[-103, -115], [-57, -144], [66, -123], [92, -95], [26, -82], [-89, -86]], "#6d4925");
  path(ctx, [[-45, -144], [28, -178], [49, -112], [-42, -105]], "#8a5b2e");
  strokePath(ctx, [[-82, -98], [72, -106]], "#4d321d", 5);
  ctx.save();
  ctx.rotate(-0.03);
  roundedRect(ctx, -83, -82, 149, 126, 28, "#d99546");
  roundedRect(ctx, -61, -65, 108, 91, 22, "#ebb45e");
  ctx.restore();
  drawHumanEyes(ctx, state.blink, "#31a9c6");
  roundedRect(ctx, -61, 9, 28, 19, 5, "#d84f45");
  strokePath(ctx, [[2, 24], [26, 36], [62, 24]], "#4c2c1d", 4);
  for (let i = 0; i < 5; i += 1) {
    strokePath(ctx, [[16 + i * 10, 27], [20 + i * 10, 37]], "#4c2c1d", 2);
  }
  drawHumanMouth(ctx, state, "#d99546", "#371d16");
}

function drawCowboy(ctx: CanvasRenderingContext2D, state: RigState): void {
  roundedRect(ctx, -78, 80, 91, 112, 18, "#ffd353");
  path(ctx, [[-86, 76], [20, 77], [-4, 125], [-71, 121]], "#cc2f36");
  strokePath(ctx, [[-69, 97], [-17, 118]], "#8f612a", 4);
  star(ctx, -22, 113, 15, 7, 5, "#ffd35a");
  ellipse(ctx, -22, 113, 5, 5, "#8f612a");
  strokePath(ctx, [[-60, 160], [-67, 197]], "#316aa0", 10);
  strokePath(ctx, [[-18, 160], [-6, 197]], "#316aa0", 10);
  strokePath(ctx, [[-87, 102], [-128, 138]], "#ffd353", 15);
  strokePath(ctx, [[17, 102], [65, 135]], "#ffd353", 15);
  roundedRect(ctx, -147, -122, 253, 34, 17, "#7b4727");
  roundedRect(ctx, -61, -178, 103, 88, 16, "#a66435");
  path(ctx, [[-65, -103], [43, -104], [92, -86], [-111, -86]], "#6d3f24");
  ellipse(ctx, -16, -8, 96, 89, "#d9915a");
  roundedRect(ctx, -59, -67, 104, 109, 34, "#d9915a");
  ellipse(ctx, 22, -1, 72, 62, "#f3bc82");
  ellipse(ctx, -77, -17, 14, 22, "#bd7540");
  strokePath(ctx, [[-55, -55], [-59, 0]], "#6a3925", 13);
  drawHumanEyes(ctx, state.blink, "#4f78ae");
  strokePath(ctx, [[-47, -70], [-8, -80], [28, -70]], "#5a3524", 6);
  strokePath(ctx, [[-2, 24], [28, 33], [63, 23]], "#5a3529", 4);
  drawHumanMouth(ctx, state, "#d9915a", "#341b17");
}

function drawSpaceRanger(ctx: CanvasRenderingContext2D, state: RigState): void {
  roundedRect(ctx, -95, 74, 118, 124, 25, "#f3f6f3");
  path(ctx, [[-94, 83], [23, 83], [8, 132], [-83, 132]], "#45b36b");
  path(ctx, [[-76, 88], [-36, 128], [10, 88]], "#6d4cc8");
  roundedRect(ctx, -68, 103, 76, 38, 12, "#ffffff");
  ellipse(ctx, -48, 119, 7, 7, "#d43f48");
  ellipse(ctx, -25, 119, 7, 7, "#39a45d");
  ellipse(ctx, -2, 119, 7, 7, "#654bd2");
  strokePath(ctx, [[-101, 101], [-148, 141]], "#f3f6f3", 19);
  strokePath(ctx, [[30, 102], [88, 141]], "#f3f6f3", 19);
  strokePath(ctx, [[-63, 166], [-74, 199]], "#f3f6f3", 10);
  strokePath(ctx, [[-18, 166], [-7, 199]], "#f3f6f3", 10);
  roundedRect(ctx, -91, -82, 180, 128, 38, "#f6f8f4");
  roundedRect(ctx, -82, -72, 164, 109, 33, "#4bb66f");
  path(ctx, [[-74, -55], [-46, -84], [-20, -56]], "#6d4cc8");
  ellipse(ctx, -14, -14, 124, 96, "rgba(183, 236, 255, 0.58)");
  ellipse(ctx, -16, -15, 92, 78, "#d9c8ff");
  ellipse(ctx, 7, -12, 83, 72, "#f0b985");
  ellipse(ctx, 21, -7, 65, 56, "#ffd6a8");
  drawHumanEyes(ctx, state.blink, "#4d72b8");
  strokePath(ctx, [[-3, 24], [25, 31], [58, 23]], "#523329", 4);
  drawHumanMouth(ctx, state, "#f0b985", "#2b1714");
}

export function drawCharacterPuppet(
  ctx: CanvasRenderingContext2D,
  characterId: CharacterId,
  controls: PuppetControls,
  width: number,
  height: number,
  options: DrawOptions,
): void {
  if (characterId === "dog") {
    drawDogPuppet(ctx, controls, width, height, options);
    return;
  }

  withRig(ctx, controls, width, height, options, (state) => {
    if (characterId === "cat") {
      drawCat(ctx, state);
    } else if (characterId === "lion") {
      drawLion(ctx, state);
    } else if (characterId === "tin-man") {
      drawTinMan(ctx, state);
    } else if (characterId === "scarecrow") {
      drawScarecrow(ctx, state);
    } else if (characterId === "cowboy") {
      drawCowboy(ctx, state);
    } else {
      drawSpaceRanger(ctx, state);
    }
  });
}

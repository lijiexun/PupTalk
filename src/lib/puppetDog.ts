import type { PuppetControls } from "../types/puppet";
import { clamp } from "./smoothing";

interface DrawOptions {
  time: number;
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedPath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i];
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function strokedSmile(ctx: CanvasRenderingContext2D, mouthOpen: number): void {
  ctx.strokeStyle = "#4c2b1f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(112, 31);
  ctx.quadraticCurveTo(82, 43 + mouthOpen * 4, 51, 33 + mouthOpen * 2);
  ctx.stroke();
}

function drawLowerJaw(ctx: CanvasRenderingContext2D, mouthOpen: number): void {
  ctx.fillStyle = "#d38848";
  ctx.beginPath();
  ctx.moveTo(-2, 1);
  ctx.quadraticCurveTo(34, -4, 72, 1);
  ctx.quadraticCurveTo(96, 8 + mouthOpen * 3, 94, 17 + mouthOpen * 6);
  ctx.quadraticCurveTo(60, 36, 20, 29);
  ctx.quadraticCurveTo(2, 25, -4, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f3c889";
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(38, 2, 67, 6);
  ctx.quadraticCurveTo(82, 10, 80, 16 + mouthOpen * 3);
  ctx.quadraticCurveTo(54, 25, 22, 22);
  ctx.quadraticCurveTo(10, 19, 5, 14);
  ctx.closePath();
  ctx.fill();
}

function drawDogShapeShadow(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(9, 13);
  ctx.filter = "blur(3px)";
  ellipse(ctx, -101, 145, 18, 60, "rgba(52, 32, 24, 0.14)");
  ellipse(ctx, -66, 112, 61, 93, "rgba(52, 32, 24, 0.16)");
  ellipse(ctx, -90, 187, 14, 31, "rgba(52, 32, 24, 0.14)");
  ellipse(ctx, -44, 187, 14, 31, "rgba(52, 32, 24, 0.14)");
  ellipse(ctx, -78, -70, 36, 91, "rgba(52, 32, 24, 0.14)");
  ellipse(ctx, 22, -93, 33, 82, "rgba(52, 32, 24, 0.14)");
  ellipse(ctx, -18, -8, 112, 91, "rgba(52, 32, 24, 0.18)");
  ellipse(ctx, 54, 20, 91, 49, "rgba(52, 32, 24, 0.16)");
  ctx.restore();
}

export function drawDogPuppet(
  ctx: CanvasRenderingContext2D,
  controls: PuppetControls,
  width: number,
  height: number,
  options: DrawOptions,
): void {
  const mouthOpen = clamp(controls.mouthOpen, 0, 1);
  const baseX = width * 0.5 + controls.headX;
  const baseY = height * 0.48 + controls.headY;
  const jawAngle = mouthOpen * 0.72;
  const bounce = Math.sin(options.time / 170) * mouthOpen * 2.5;
  const blink = options.time % 4300 > 4100;
  const scale = clamp(controls.scale ?? 1, 0.68, 1.5);

  ctx.save();
  ctx.translate(baseX, baseY + bounce);
  ctx.scale(controls.facing * scale, scale);
  ctx.rotate(controls.headTilt);
  drawDogShapeShadow(ctx);

  ctx.save();
  ctx.translate(-101, 145);
  ctx.rotate(-0.72 + mouthOpen * 0.05);
  ellipse(ctx, 0, 0, 15, 61, "#8f552e");
  ellipse(ctx, 0, -13, 9, 39, "#b87a42");
  ctx.restore();

  ctx.save();
  ctx.translate(-66, 112);
  ctx.rotate(-0.05);
  ellipse(ctx, 0, 0, 58, 92, "#c98545");
  ellipse(ctx, 18, 4, 36, 74, "#f0b265");
  ellipse(ctx, -10, 45, 26, 18, "rgba(128, 78, 44, 0.18)");
  ctx.restore();

  ctx.save();
  ctx.translate(-90, 187);
  ctx.rotate(0.06);
  ellipse(ctx, 0, 0, 13, 31, "#8f552e");
  ellipse(ctx, 10, 4, 11, 25, "#d89b56");
  ctx.restore();

  ctx.save();
  ctx.translate(-44, 187);
  ctx.rotate(-0.08);
  ellipse(ctx, 0, 0, 13, 31, "#8f552e");
  ellipse(ctx, 10, 4, 11, 25, "#d89b56");
  ctx.restore();

  ctx.save();
  ctx.translate(-78, -70);
  ctx.rotate(-0.46 - mouthOpen * 0.08);
  ellipse(ctx, 0, 0, 34, 91, "#8f552e");
  ellipse(ctx, 6, 4, 22, 70, "#b87a42");
  ctx.restore();

  ctx.save();
  ctx.translate(22, -93);
  ctx.rotate(0.34 + mouthOpen * 0.1);
  ellipse(ctx, 0, 0, 31, 82, "#8f552e");
  ellipse(ctx, -3, 2, 20, 63, "#b87a42");
  ctx.restore();

  ellipse(ctx, -18, -8, 111, 90, "#dc9853");
  ellipse(ctx, 24, -2, 85, 71, "#edb166");
  ellipse(ctx, 25, 30, 86, 48, "#ffdda8");

  if (mouthOpen > 0.03) {
    ctx.fillStyle = "#321b16";
    ctx.beginPath();
    ctx.ellipse(70, 40 + mouthOpen * 7, 52, 8 + mouthOpen * 17, 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  roundedPath(
    ctx,
    [
      [-2, -18],
      [88, -19],
      [139, 8],
      [123, 32],
      [56, 33],
      [12, 21],
    ],
    "#ffdda8",
  );

  ctx.save();
  ctx.translate(36, 34);
  ctx.rotate(jawAngle);
  drawLowerJaw(ctx, mouthOpen);
  if (mouthOpen > 0.28) {
    ctx.fillStyle = "#e9797f";
    ctx.beginPath();
    ctx.ellipse(44, 18, 22, 7 + mouthOpen * 5, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ellipse(ctx, 127, 4, 24, 19, "#2b1b1a");
  ellipse(ctx, 135, -2, 7, 5, "rgba(255,255,255,0.75)");

  strokedSmile(ctx, mouthOpen);

  ctx.fillStyle = "#33201c";
  if (blink) {
    ctx.strokeStyle = "#33201c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(34, -39);
    ctx.quadraticCurveTo(43, -35, 52, -39);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-31, -42);
    ctx.quadraticCurveTo(-14, -34, 3, -42);
    ctx.stroke();
  } else {
    ellipse(ctx, 44, -38, 8, 12, "#33201c");
    ellipse(ctx, 47, -43, 2.2, 3, "#fff");
    ellipse(ctx, -13, -42, 17, 21, "#fff6dc");
    ellipse(ctx, -11, -41, 9, 14, "#33201c");
    ellipse(ctx, -7, -48, 3, 4, "#fff");
  }

  ctx.strokeStyle = "#704125";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(22, -67);
  ctx.quadraticCurveTo(39, -78, -1, -66);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-31, -67);
  ctx.quadraticCurveTo(-14, -79, 7, -66);
  ctx.stroke();

  ellipse(ctx, -88, -19, 18, 25, "rgba(128, 78, 44, 0.18)");
  ellipse(ctx, -55, 18, 12, 9, "rgba(255, 230, 172, 0.35)");

  ctx.restore();
}

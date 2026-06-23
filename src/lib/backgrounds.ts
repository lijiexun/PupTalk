import type { BackgroundId } from "../types/puppet";

export interface BackgroundOption {
  id: BackgroundId;
  name: string;
  shortName: string;
  marker: string;
  color: string;
}

export const BACKGROUNDS: BackgroundOption[] = [
  { id: "stage", name: "Theater stage", shortName: "Stage", marker: "St", color: "#b52b45" },
  { id: "classroom", name: "Classroom", shortName: "Class", marker: "Cl", color: "#315f50" },
  { id: "forest", name: "Forest", shortName: "Forest", marker: "Fo", color: "#4f9b59" },
  { id: "space", name: "Space", shortName: "Space", marker: "Sp", color: "#2b2f69" },
  { id: "birthday", name: "Birthday party", shortName: "Party", marker: "Pa", color: "#9b5bd3" },
  { id: "plain", name: "Plain color", shortName: "Plain", marker: "Pl", color: "#88d8e8" },
];

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBackground(ctx: CanvasRenderingContext2D, id: BackgroundId, width: number, height: number): void {
  if (id === "plain") {
    ctx.fillStyle = "#88d8e8";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    for (let i = 0; i < 18; i += 1) {
      dot(ctx, (i * 91) % width, 60 + (i % 4) * 78, 9 + (i % 3) * 5, "rgba(255,255,255,0.24)");
    }
    ctx.fillStyle = "#f7f1da";
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    ctx.fillStyle = "rgba(226, 177, 92, 0.22)";
    for (let x = 0; x < width; x += 92) {
      ctx.fillRect(x, height * 0.82, 48, 9);
    }
    return;
  }

  if (id === "stage") {
    const wall = ctx.createLinearGradient(0, 0, 0, height);
    wall.addColorStop(0, "#7d1836");
    wall.addColorStop(0.58, "#b52b45");
    wall.addColorStop(1, "#35151d");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#f8c95d";
    ctx.fillRect(0, height * 0.76, width, height * 0.03);
    ctx.fillStyle = "#6b3a22";
    ctx.fillRect(0, height * 0.79, width, height * 0.21);

    ctx.fillStyle = "rgba(255, 214, 109, 0.2)";
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.05);
    ctx.lineTo(width * 0.22, height * 0.78);
    ctx.lineTo(width * 0.78, height * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let x = 36; x < width; x += 82) {
      ctx.fillRect(x, height * 0.02, 18, height * 0.72);
    }
    ctx.fillStyle = "#ffd96e";
    for (let x = 42; x < width; x += 120) {
      dot(ctx, x, height * 0.81, 8, "#ffd96e");
    }
    return;
  }

  if (id === "classroom") {
    ctx.fillStyle = "#f6e4b8";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#315f50";
    ctx.fillRect(width * 0.14, height * 0.12, width * 0.72, height * 0.38);
    ctx.strokeStyle = "#c28a48";
    ctx.lineWidth = 12;
    ctx.strokeRect(width * 0.14, height * 0.12, width * 0.72, height * 0.38);
    ctx.fillStyle = "#f2f0df";
    ctx.fillRect(0, height * 0.64, width, height * 0.36);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 9; i += 1) {
      dot(ctx, width * 0.2 + i * 82, height * 0.2 + (i % 2) * 28, 5, "rgba(255,255,255,0.18)");
    }
    ctx.fillStyle = "#d9a86c";
    for (let x = 0; x < width; x += 160) {
      ctx.fillRect(x, height * 0.84, 100, 16);
    }
    return;
  }

  if (id === "forest") {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#a4d7ff");
    sky.addColorStop(1, "#e8f5cd");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#4f9b59";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.quadraticCurveTo(width * 0.28, height * 0.54, width * 0.5, height * 0.69);
    ctx.quadraticCurveTo(width * 0.75, height * 0.84, width, height * 0.62);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#27643e";
    for (let i = 0; i < 8; i += 1) {
      const x = 80 + i * 165;
      ctx.fillRect(x, height * 0.43, 28, height * 0.28);
      ctx.beginPath();
      ctx.moveTo(x - 55, height * 0.48);
      ctx.lineTo(x + 14, height * 0.18);
      ctx.lineTo(x + 83, height * 0.48);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 246, 184, 0.34)";
    for (let i = 0; i < 16; i += 1) {
      dot(ctx, 42 + i * 86, height * 0.18 + (i % 4) * 42, 4 + (i % 3), "rgba(255, 246, 184, 0.34)");
    }
    return;
  }

  if (id === "space") {
    ctx.fillStyle = "#171b3d";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff7b0";
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 97) % width;
      const y = (i * 53) % Math.floor(height * 0.7);
      const radius = 1 + (i % 3);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(165, 204, 255, 0.28)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.2, 76, 0.25, Math.PI * 1.45);
    ctx.stroke();
    ctx.fillStyle = "#6d73c9";
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.2, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2b2f69";
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    return;
  }

  ctx.fillStyle = "#ffe1e8";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff4a7";
  for (let x = 0; x < width; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 35, 52);
    ctx.lineTo(x + 70, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let x = 20; x < width; x += 140) {
    ctx.fillRect(x, height * 0.1, 72, 12);
  }
  ctx.fillStyle = "#9b5bd3";
  ctx.fillRect(0, height * 0.74, width, height * 0.26);
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 24; i += 1) {
    const x = 35 + i * 55;
    const y = 115 + (i % 5) * 68;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

import type { FacingDirection, GestureSnapshot, HandChoice, PuppetControls } from "../types/puppet";
import { applyDeadZone, clamp, normalize } from "./smoothing";

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

type PositionSource = "palm" | "mouth";

const DEFAULT_CLOSED_DISTANCE = 0.035;
const DEFAULT_OPEN_DISTANCE = 0.18;
const HEAD_X_SCALE = 440;
const HEAD_Y_SCALE = 360;
const HEAD_X_LIMIT = 192;
const HEAD_Y_LIMIT = 168;
const HAND_SIZE_FAR = 0.09;
const HAND_SIZE_NEAR = 0.22;
const PUPPET_SCALE_MIN = 0.74;
const PUPPET_SCALE_MAX = 1.42;

function distance(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function average(points: LandmarkPoint[]): { x: number; y: number } {
  const total = points.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

export function facingForHand(hand: HandChoice): 1 | -1 {
  return hand === "left" ? 1 : -1;
}

export function neutralControls(hand: HandChoice): PuppetControls {
  return {
    mouthOpen: 0,
    headX: 0,
    headY: 0,
    headTilt: 0,
    scale: 1,
    facing: facingForHand(hand),
  };
}

export function mapLandmarksToGesture(
  landmarks: LandmarkPoint[],
  hand: HandChoice,
  confidence: number,
  facingOverride?: FacingDirection,
  positionSource: PositionSource = "palm",
): GestureSnapshot | null {
  if (landmarks.length < 21) {
    return null;
  }

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];
  const thumbIndexDistance = distance(thumbTip, indexTip);
  const rawMouth = normalize(thumbIndexDistance, DEFAULT_CLOSED_DISTANCE, DEFAULT_OPEN_DISTANCE);
  const mouthOpen = applyDeadZone(rawMouth, 0.07);
  const handCenter = average([wrist, indexMcp, middleMcp, ringMcp, pinkyMcp]);
  const positionCenter = positionSource === "mouth" ? average([thumbTip, indexTip]) : handCenter;
  const headX = clamp((0.5 - positionCenter.x) * HEAD_X_SCALE, -HEAD_X_LIMIT, HEAD_X_LIMIT);
  const headY = clamp((positionCenter.y - 0.5) * HEAD_Y_SCALE, -HEAD_Y_LIMIT, HEAD_Y_LIMIT);
  const palmRoll = Math.atan2(pinkyMcp.y - indexMcp.y, pinkyMcp.x - indexMcp.x);
  const headTilt = clamp(palmRoll * 0.75, -0.42, 0.42);
  const apparentHandSize = (distance(indexMcp, pinkyMcp) + distance(wrist, middleMcp)) * 0.5;
  const depthAmount = normalize(apparentHandSize, HAND_SIZE_FAR, HAND_SIZE_NEAR);
  const scale = PUPPET_SCALE_MIN + depthAmount * (PUPPET_SCALE_MAX - PUPPET_SCALE_MIN);

  return {
    thumbIndexDistance,
    confidence,
    handCenter: positionCenter,
    controls: {
      mouthOpen,
      headX,
      headY,
      headTilt,
      scale,
      facing: facingOverride ?? facingForHand(hand),
    },
  };
}

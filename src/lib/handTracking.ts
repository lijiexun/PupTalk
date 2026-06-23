import type { GestureSnapshot, HandChoice } from "../types/puppet";
import { mapLandmarksToGesture } from "./gestureMapping";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export interface HandTrackingResult {
  gesture: GestureSnapshot | null;
  message: string;
}

export interface TwoHandTrackingResult {
  leftGesture: GestureSnapshot | null;
  rightGesture: GestureSnapshot | null;
  message: string;
}

export interface HandTracker {
  detect(video: HTMLVideoElement, hand: HandChoice): HandTrackingResult;
  detectTwoHands(video: HTMLVideoElement): TwoHandTrackingResult;
  close(): void;
}

interface DetectedHand {
  confidence: number;
  screenCenterX: number;
  landmarks: Array<{ x: number; y: number; z?: number }>;
}

interface VisionModule {
  FilesetResolver: {
    forVisionTasks(path: string): Promise<unknown>;
  };
  HandLandmarker: {
    createFromOptions(
      vision: unknown,
      options: {
        baseOptions: {
          modelAssetPath: string;
          delegate: "GPU" | "CPU";
        };
        runningMode: "VIDEO";
        numHands: number;
        minHandDetectionConfidence: number;
        minHandPresenceConfidence: number;
        minTrackingConfidence: number;
      },
    ): Promise<{
      detectForVideo(video: HTMLVideoElement, time: number): {
        landmarks: Array<Array<{ x: number; y: number; z?: number }>>;
        handednesses?: Array<Array<{ score: number; categoryName: string }>>;
      };
      close(): void;
    }>;
  };
}

export async function createHandTracker(): Promise<HandTracker> {
  const visionTasks = (await import("@mediapipe/tasks-vision")) as VisionModule;
  const vision = await visionTasks.FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const landmarker = await visionTasks.HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  });

  return {
    detect(video, hand) {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return {
          gesture: null,
          message: "Waiting for the camera.",
        };
      }

      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.landmarks[0];
      const confidence = result.handednesses?.[0]?.[0]?.score ?? 0;

      if (!landmarks) {
        return {
          gesture: null,
          message: "I lost your hand. Move it back into the camera.",
        };
      }

      return {
        gesture: mapLandmarksToGesture(landmarks, hand, confidence),
        message: confidence > 0.2 ? "Hand found." : "Move your hand clearly into the camera.",
      };
    },
    detectTwoHands(video) {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return {
          leftGesture: null,
          rightGesture: null,
          message: "Waiting for the camera.",
        };
      }

      const result = landmarker.detectForVideo(video, performance.now());
      const detected: DetectedHand[] = result.landmarks
        .map((landmarks, index): DetectedHand => {
          const confidence = result.handednesses?.[index]?.[0]?.score ?? 0;
          const cameraCenterX = landmarks.reduce((sum, point) => sum + point.x, 0) / landmarks.length;
          return {
            confidence,
            screenCenterX: 1 - cameraCenterX,
            landmarks,
          };
        })
        .sort((a, b) => a.screenCenterX - b.screenCenterX);

      if (detected.length === 0) {
        return {
          leftGesture: null,
          rightGesture: null,
          message: "I lost your hands. Move them back into the camera.",
        };
      }

      let leftHand: DetectedHand | null = null;
      let rightHand: DetectedHand | null = null;

      if (detected.length === 1) {
        if (detected[0].screenCenterX < 0.5) {
          leftHand = detected[0];
        } else {
          rightHand = detected[0];
        }
      } else {
        leftHand = detected[0];
        rightHand = detected[detected.length - 1];
      }

      const leftGesture = leftHand ? mapLandmarksToGesture(leftHand.landmarks, "left", leftHand.confidence, 1, "mouth") : null;
      const rightGesture = rightHand ? mapLandmarksToGesture(rightHand.landmarks, "right", rightHand.confidence, -1, "mouth") : null;

      return {
        leftGesture,
        rightGesture,
        message:
          detected.length >= 2
            ? "Two hands found."
            : leftGesture
              ? "Left hand found. Add your right hand for duet mode."
              : "Right hand found. Add your left hand for duet mode.",
      };
    },
    close() {
      landmarker.close();
    },
  };
}

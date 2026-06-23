export type HandChoice = "left" | "right";

export type FacingDirection = 1 | -1;

export type PlayMode = "solo" | "duet";

export type BackgroundId =
  | "stage"
  | "classroom"
  | "forest"
  | "space"
  | "birthday"
  | "plain";

export type CharacterId =
  | "dog"
  | "cat"
  | "lion"
  | "tin-man"
  | "scarecrow"
  | "cowboy"
  | "space-ranger";

export interface PuppetControls {
  mouthOpen: number;
  headX: number;
  headY: number;
  headTilt: number;
  scale: number;
  facing: FacingDirection;
}

export interface GestureSnapshot {
  controls: PuppetControls;
  thumbIndexDistance: number;
  confidence: number;
  handCenter: {
    x: number;
    y: number;
  };
}

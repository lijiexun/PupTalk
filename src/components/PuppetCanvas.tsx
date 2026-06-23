import { useEffect, useRef } from "react";
import type { BackgroundId, CharacterId, PlayMode, PuppetControls } from "../types/puppet";
import { drawBackground } from "../lib/backgrounds";
import { drawCharacterPuppet } from "../lib/puppetCharacters";

interface PuppetCanvasProps {
  backgroundId: BackgroundId;
  characterId: CharacterId;
  partnerCharacterId: CharacterId;
  controls: PuppetControls;
  partnerControls: PuppetControls;
  playMode: PlayMode;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  active?: boolean;
  paused?: boolean;
}

const ACTIVE_FRAME_MS = 1000 / 24;
const IDLE_FRAME_MS = 250;
const DUET_X_SCALE = 1.45;
const DUET_Y_SCALE = 0.92;

const mouthAnchorOffset: Record<CharacterId, number> = {
  dog: 92,
  cat: 50,
  lion: 92,
  "tin-man": 38,
  scarecrow: 44,
  cowboy: 45,
  "space-ranger": 43,
};

function duetControls(controls: PuppetControls, characterId: CharacterId, facing: 1 | -1): PuppetControls {
  const targetMouthX = controls.headX * DUET_X_SCALE;
  const scale = controls.scale ?? 1;

  return {
    ...controls,
    headX: targetMouthX - facing * mouthAnchorOffset[characterId] * scale,
    headY: controls.headY * DUET_Y_SCALE,
    scale,
    facing,
  };
}

export default function PuppetCanvas({
  backgroundId,
  characterId,
  partnerCharacterId,
  controls,
  partnerControls,
  playMode,
  canvasRef,
  active = false,
  paused = false,
}: PuppetCanvasProps) {
  const propsRef = useRef({ backgroundId, characterId, partnerCharacterId, controls, partnerControls, playMode, active, paused });

  useEffect(() => {
    propsRef.current = { backgroundId, characterId, partnerCharacterId, controls, partnerControls, playMode, active, paused };
  }, [backgroundId, characterId, partnerCharacterId, controls, partnerControls, playMode, active, paused]);

  useEffect(() => {
    let timer = 0;
    let isCancelled = false;

    function draw(time: number) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx) {
        drawBackground(ctx, propsRef.current.backgroundId, canvas.width, canvas.height);
        if (propsRef.current.playMode === "duet") {
          drawCharacterPuppet(
            ctx,
            propsRef.current.characterId,
            duetControls(propsRef.current.controls, propsRef.current.characterId, 1),
            canvas.width,
            canvas.height,
            { time },
          );
          drawCharacterPuppet(
            ctx,
            propsRef.current.partnerCharacterId,
            duetControls(propsRef.current.partnerControls, propsRef.current.partnerCharacterId, -1),
            canvas.width,
            canvas.height,
            { time },
          );
        } else {
          drawCharacterPuppet(ctx, propsRef.current.characterId, propsRef.current.controls, canvas.width, canvas.height, { time });
        }
      }
    }

    function loop() {
      if (isCancelled) {
        return;
      }

      const shouldDraw = !propsRef.current.paused && document.visibilityState === "visible";
      if (shouldDraw) {
        draw(performance.now());
      }

      timer = window.setTimeout(loop, shouldDraw && propsRef.current.active ? ACTIVE_FRAME_MS : IDLE_FRAME_MS);
    }

    draw(performance.now());
    loop();

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="puppet-canvas"
      aria-label="PupTalk puppet stage"
    />
  );
}

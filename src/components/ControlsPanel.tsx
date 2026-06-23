import type { CSSProperties } from "react";
import type { BackgroundId, CharacterId, HandChoice, PlayMode } from "../types/puppet";
import { BACKGROUNDS } from "../lib/backgrounds";
import { CHARACTERS } from "../lib/puppetCharacters";

interface ControlsPanelProps {
  playMode: PlayMode;
  onPlayModeChange: (mode: PlayMode) => void;
  selectedHand: HandChoice;
  onSelectedHandChange: (hand: HandChoice) => void;
  characterId: CharacterId;
  onCharacterChange: (id: CharacterId) => void;
  partnerCharacterId: CharacterId;
  onPartnerCharacterChange: (id: CharacterId) => void;
  backgroundId: BackgroundId;
  onBackgroundChange: (id: BackgroundId) => void;
}

function CharacterSelect({
  title,
  selectedId,
  onSelect,
}: {
  title: string;
  selectedId: CharacterId;
  onSelect: (id: CharacterId) => void;
}) {
  return (
    <label className="performer-select-label">
      <span>{title}</span>
      <select value={selectedId} onChange={(event) => onSelect(event.target.value as CharacterId)}>
        {CHARACTERS.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function backgroundTileStyle(color: string): CSSProperties {
  return { "--tile-color": color } as CSSProperties;
}

export default function ControlsPanel({
  playMode,
  onPlayModeChange,
  selectedHand,
  onSelectedHandChange,
  characterId,
  onCharacterChange,
  partnerCharacterId,
  onPartnerCharacterChange,
  backgroundId,
  onBackgroundChange,
}: ControlsPanelProps) {
  return (
    <>
      <section className="panel cast-panel">
        <div className="panel-header">
          <h2>Cast</h2>
          <span className="soft-pill">{playMode}</span>
        </div>

        <div className="segmented mode-toggle" aria-label="Performance mode">
          <button className={playMode === "solo" ? "active" : ""} onClick={() => onPlayModeChange("solo")}>
            Solo
          </button>
          <button className={playMode === "duet" ? "active" : ""} onClick={() => onPlayModeChange("duet")}>
            Duet
          </button>
        </div>

        {playMode === "solo" && (
          <div className="segmented hand-choice" aria-label="Solo hand">
            <button className={selectedHand === "left" ? "active" : ""} onClick={() => onSelectedHandChange("left")}>
              Left hand
            </button>
            <button className={selectedHand === "right" ? "active" : ""} onClick={() => onSelectedHandChange("right")}>
              Right hand
            </button>
          </div>
        )}

        <div className={playMode === "duet" ? "performer-select-grid" : "performer-select-grid solo"}>
          <CharacterSelect title={playMode === "duet" ? "Left performer" : "Performer"} selectedId={characterId} onSelect={onCharacterChange} />

          {playMode === "duet" && (
            <CharacterSelect title="Right performer" selectedId={partnerCharacterId} onSelect={onPartnerCharacterChange} />
          )}
        </div>
      </section>

      <section className="panel scene-panel">
        <div className="panel-header">
          <h2>Scene</h2>
          <span className="soft-pill">{BACKGROUNDS.find((background) => background.id === backgroundId)?.shortName}</span>
        </div>

        <div className="background-tile-grid">
          {BACKGROUNDS.map((background) => (
            <button
              key={background.id}
              type="button"
              className={backgroundId === background.id ? "choice-tile background-tile active" : "choice-tile background-tile"}
              style={backgroundTileStyle(background.color)}
              onClick={() => onBackgroundChange(background.id)}
              aria-pressed={backgroundId === background.id}
            >
              <span className="background-swatch" />
              <span>{background.shortName}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

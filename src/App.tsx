import { useCallback, useEffect, useRef, useState } from "react";
import CameraPreview from "./components/CameraPreview";
import ControlsPanel from "./components/ControlsPanel";
import PuppetCanvas from "./components/PuppetCanvas";
import RecorderPanel from "./components/RecorderPanel";
import { createHandTracker, type HandTracker } from "./lib/handTracking";
import { neutralControls } from "./lib/gestureMapping";
import { smoothAngle, smoothNumber } from "./lib/smoothing";
import { startCanvasRecording, type RecordingSession } from "./lib/recorder";
import type { BackgroundId, CharacterId, HandChoice, PlayMode, PuppetControls } from "./types/puppet";

function blendControls(current: PuppetControls, target: PuppetControls, amount: number): PuppetControls {
  return {
    mouthOpen: smoothNumber(current.mouthOpen, target.mouthOpen, amount),
    headX: smoothNumber(current.headX, target.headX, amount),
    headY: smoothNumber(current.headY, target.headY, amount),
    headTilt: smoothAngle(current.headTilt, target.headTilt, amount),
    scale: smoothNumber(current.scale, target.scale, amount),
    facing: target.facing,
  };
}

const leftDuetNeutral: PuppetControls = {
  mouthOpen: 0,
  headX: -118,
  headY: 0,
  headTilt: 0,
  scale: 1,
  facing: 1,
};

const rightDuetNeutral: PuppetControls = {
  mouthOpen: 0,
  headX: 118,
  headY: 0,
  headTilt: 0,
  scale: 1,
  facing: -1,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const recordingRef = useRef<RecordingSession | null>(null);
  const liveControlsRef = useRef<PuppetControls>(neutralControls("left"));
  const recordingUrlRef = useRef<string | null>(null);
  const trackingStatusRef = useRef("Camera is off.");
  const lastTrackingTimeRef = useRef(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const leftDuetControlsRef = useRef<PuppetControls>(leftDuetNeutral);
  const rightDuetControlsRef = useRef<PuppetControls>(rightDuetNeutral);

  const [selectedHand, setSelectedHand] = useState<HandChoice>("left");
  const [playMode, setPlayMode] = useState<PlayMode>("solo");
  const [characterId, setCharacterId] = useState<CharacterId>("dog");
  const [partnerCharacterId, setPartnerCharacterId] = useState<CharacterId>("cat");
  const [backgroundId, setBackgroundId] = useState<BackgroundId>("stage");
  const [liveControls, setLiveControls] = useState<PuppetControls>(neutralControls("left"));
  const [leftDuetControls, setLeftDuetControls] = useState<PuppetControls>(leftDuetNeutral);
  const [rightDuetControls, setRightDuetControls] = useState<PuppetControls>(rightDuetNeutral);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState("Camera is off.");
  const [isLoadingTracker, setIsLoadingTracker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFinalizingRecording, setIsFinalizingRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const hasMedia = Boolean(cameraStream || microphoneStream);

  useEffect(() => {
    setLiveControls((current) => ({ ...current, facing: neutralControls(selectedHand).facing }));
    liveControlsRef.current = { ...liveControlsRef.current, facing: neutralControls(selectedHand).facing };
  }, [selectedHand]);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    microphoneStreamRef.current = microphoneStream;
  }, [microphoneStream]);

  useEffect(() => {
    return () => {
      trackerRef.current?.close();
      for (const stream of [cameraStreamRef.current, microphoneStreamRef.current]) {
        stream?.getTracks().forEach((track) => track.stop());
      }
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
    };
  }, []);

  const startCameraAndMic = useCallback(async (): Promise<boolean> => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const nextCameraStream = new MediaStream(stream.getVideoTracks());
      const nextMicrophoneStream = new MediaStream(stream.getAudioTracks());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = nextCameraStream;
      microphoneStreamRef.current = nextMicrophoneStream;
      setCameraStream(nextCameraStream);
      setMicrophoneStream(nextMicrophoneStream);
      updateTrackingStatus("Camera ready. Start hand tracking when you are ready.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Camera or microphone permission was blocked.";
      setPermissionError(message);
      updateTrackingStatus("Camera or microphone permission is needed.");
      return false;
    }
  }, []);

  const stopCameraAndMic = useCallback(() => {
    setTrackingEnabled(false);
    trackerRef.current?.close();
    trackerRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    microphoneStreamRef.current = null;
    setCameraStream(null);
    setMicrophoneStream(null);
    const neutral = neutralControls(selectedHand);
    liveControlsRef.current = neutral;
    leftDuetControlsRef.current = leftDuetNeutral;
    rightDuetControlsRef.current = rightDuetNeutral;
    setLiveControls(neutral);
    setLeftDuetControls(leftDuetNeutral);
    setRightDuetControls(rightDuetNeutral);
    updateTrackingStatus("Camera is off.");
  }, [selectedHand]);

  function updateTrackingStatus(message: string) {
    if (trackingStatusRef.current !== message) {
      trackingStatusRef.current = message;
      setTrackingStatus(message);
    }
  }

  const enableTracking = useCallback(async () => {
    if (!cameraStream) {
      const mediaStarted = await startCameraAndMic();
      if (!mediaStarted) {
        return;
      }
    }

    setIsLoadingTracker(true);
    updateTrackingStatus("Loading hand tracker.");
    try {
      if (!trackerRef.current) {
        trackerRef.current = await createHandTracker();
      }
      setTrackingEnabled(true);
      updateTrackingStatus("Hand tracking is ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hand tracking failed to load.";
      updateTrackingStatus(message);
    } finally {
      setIsLoadingTracker(false);
    }
  }, [cameraStream, startCameraAndMic]);

  const stopTracking = useCallback(() => {
    setTrackingEnabled(false);
    const neutral = neutralControls(selectedHand);
    liveControlsRef.current = neutral;
    leftDuetControlsRef.current = leftDuetNeutral;
    rightDuetControlsRef.current = rightDuetNeutral;
    setLiveControls(neutral);
    setLeftDuetControls(leftDuetNeutral);
    setRightDuetControls(rightDuetNeutral);
    updateTrackingStatus("Hand tracking is off.");
  }, [selectedHand]);

  useEffect(() => {
    if (!trackingEnabled) {
      return;
    }

    let animationFrame = 0;
    let isCancelled = false;

    function updateTracking() {
      if (isCancelled) {
        return;
      }

      const tracker = trackerRef.current;
      const video = videoRef.current;
      const targetNeutral = neutralControls(selectedHand);
      const now = performance.now();

      if (tracker && video && document.visibilityState === "visible" && now - lastTrackingTimeRef.current >= 67) {
        lastTrackingTimeRef.current = now;
        if (playMode === "duet") {
          const result = tracker.detectTwoHands(video);
          updateTrackingStatus(result.message);

          const nextLeftControls = blendControls(
            leftDuetControlsRef.current,
            result.leftGesture?.controls ?? leftDuetNeutral,
            result.leftGesture ? 0.34 : 0.08,
          );
          const nextRightControls = blendControls(
            rightDuetControlsRef.current,
            result.rightGesture?.controls ?? rightDuetNeutral,
            result.rightGesture ? 0.34 : 0.08,
          );
          leftDuetControlsRef.current = nextLeftControls;
          rightDuetControlsRef.current = nextRightControls;
          setLeftDuetControls(nextLeftControls);
          setRightDuetControls(nextRightControls);
        } else {
          const result = tracker.detect(video, selectedHand);
          updateTrackingStatus(result.message);

          const target = result.gesture?.controls ?? targetNeutral;
          const amount = result.gesture ? 0.34 : 0.08;
          const nextControls = blendControls(liveControlsRef.current, target, amount);
          liveControlsRef.current = nextControls;
          setLiveControls(nextControls);
        }
      }

      animationFrame = requestAnimationFrame(updateTracking);
    }

    animationFrame = requestAnimationFrame(updateTracking);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrame);
    };
  }, [playMode, selectedHand, trackingEnabled]);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !microphoneStream) {
      return;
    }

    setRecordingError(null);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
    }
    setRecordingUrl(null);
    setShowPlayback(false);

    try {
      const session = await startCanvasRecording(canvasRef.current, microphoneStream);
      recordingRef.current = session;
      setIsRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Recording could not start.";
      setRecordingError(message);
    }
  }, [microphoneStream]);

  const stopRecording = useCallback(async () => {
    const session = recordingRef.current;
    if (!session) {
      return;
    }

    setIsRecording(false);
    setIsFinalizingRecording(true);
    setRecordingError(null);

    try {
      const blob = await session.stop();
      const url = URL.createObjectURL(blob);
      recordingUrlRef.current = url;
      recordingRef.current = null;
      setRecordingUrl(url);
      setShowPlayback(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Recording could not finish.";
      setRecordingError(message);
    } finally {
      setIsFinalizingRecording(false);
    }
  }, []);

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="brand-lockup">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}puptalk-logo.png`} alt="PupTalk dog puppet logo" />
          <div className="brand-copy">
            <h1 className="brand-title" aria-label="PupTalk">
              <span className="brand-title-pup">Pup</span>
              <span className="brand-title-talk">Talk</span>
            </h1>
            <p>
              <span>Wave, wiggle, and talk.</span>
              <span>Turn your hands and voice into a tiny puppet show.</span>
            </p>
          </div>
        </div>
        <button className="primary-button hero-action" onClick={hasMedia ? stopCameraAndMic : startCameraAndMic}>
          {hasMedia ? "Stop camera/mic" : "Start camera/mic"}
        </button>
      </header>

      {permissionError && <p className="error-banner">{permissionError}</p>}

      <section className="workspace">
        <div className="stage-column">
          <div className="stage-frame">
            <PuppetCanvas
              canvasRef={canvasRef}
              backgroundId={backgroundId}
              characterId={characterId}
              partnerCharacterId={partnerCharacterId}
              controls={playMode === "duet" ? leftDuetControls : liveControls}
              partnerControls={rightDuetControls}
              playMode={playMode}
              active={trackingEnabled || isRecording}
              paused={showPlayback}
            />
            {recordingUrl && showPlayback && !isRecording && (
              <div className="stage-playback-shell">
                <video className="stage-playback" src={recordingUrl} controls aria-label="Recorded PupTalk performance" />
                <button className="stage-return-button" onClick={() => setShowPlayback(false)}>
                  Back to animation
                </button>
              </div>
            )}
          </div>
          <RecorderPanel
            hasMic={Boolean(microphoneStream)}
            isRecording={isRecording}
            isFinalizing={isFinalizingRecording}
            recordingError={recordingError}
            recordingUrl={recordingUrl}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>

        <aside className="control-column">
          <section className="panel action-panel">
            <div className="panel-header">
              <h2>Camera + Action</h2>
              <span className={trackingEnabled ? "good-pill" : "soft-pill"}>{trackingEnabled ? "Ready" : playMode}</span>
            </div>
            <CameraPreview stream={cameraStream} videoRef={videoRef} status={isLoadingTracker ? "Loading hand tracker." : trackingStatus} />
            <div className="tracking-actions">
              <button className="primary-button" onClick={enableTracking} disabled={trackingEnabled || isLoadingTracker}>
                {trackingEnabled ? "Tracking on" : "Start hand tracking"}
              </button>
              <button onClick={stopTracking} disabled={!trackingEnabled}>
                Stop tracking
              </button>
            </div>
          </section>
          <ControlsPanel
            playMode={playMode}
            onPlayModeChange={setPlayMode}
            selectedHand={selectedHand}
            onSelectedHandChange={setSelectedHand}
            characterId={characterId}
            onCharacterChange={setCharacterId}
            partnerCharacterId={partnerCharacterId}
            onPartnerCharacterChange={setPartnerCharacterId}
            backgroundId={backgroundId}
            onBackgroundChange={setBackgroundId}
          />
        </aside>
      </section>
    </main>
  );
}

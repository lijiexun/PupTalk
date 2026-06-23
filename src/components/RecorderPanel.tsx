interface RecorderPanelProps {
  hasMic: boolean;
  isRecording: boolean;
  isFinalizing: boolean;
  recordingError: string | null;
  recordingUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecorderPanel({
  hasMic,
  isRecording,
  isFinalizing,
  recordingError,
  recordingUrl,
  onStartRecording,
  onStopRecording,
}: RecorderPanelProps) {
  const status = isRecording ? "Recording" : isFinalizing ? "Finishing" : recordingUrl ? "Replay ready" : "Ready";

  return (
    <section className={isRecording ? "panel recorder-panel recording" : "panel recorder-panel"}>
      <div className="showtime-title">
        <h2>Showtime</h2>
        <span className={isRecording ? "recording-pill" : "soft-pill"}>{status}</span>
      </div>

      <div className="button-row">
        <button className="primary-button" disabled={!hasMic || isRecording || isFinalizing} onClick={onStartRecording}>
          Start recording
        </button>
        <button disabled={!isRecording || isFinalizing} onClick={onStopRecording}>
          Stop recording
        </button>
      </div>

      {recordingError && <p className="recording-error">{recordingError}</p>}

      {recordingUrl && !isRecording && (
        <a href={recordingUrl} download="puptalk-performance.webm" className="download-button">
          Download video
        </a>
      )}
    </section>
  );
}

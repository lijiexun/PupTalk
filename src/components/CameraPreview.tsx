import { useEffect } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: string;
}

export default function CameraPreview({ stream, videoRef, status }: CameraPreviewProps) {
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className="tracking-preview-block">
      <div className="preview-header">
        <h3>Tracking preview</h3>
        <span className="privacy-pill">Not exported</span>
      </div>
      <video ref={videoRef} className="camera-preview" autoPlay playsInline muted />
      <p className="status-line">{status}</p>
    </div>
  );
}

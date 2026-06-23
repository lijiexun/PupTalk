export interface RecordingSession {
  stop(): Promise<Blob>;
}

function chooseMimeType(): string {
  const options = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];

  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export async function startCanvasRecording(canvas: HTMLCanvasElement, microphoneStream: MediaStream): Promise<RecordingSession> {
  const canvasStream = canvas.captureStream(24);
  const combinedStream = new MediaStream();

  for (const track of canvasStream.getVideoTracks()) {
    combinedStream.addTrack(track);
  }

  for (const track of microphoneStream.getAudioTracks()) {
    combinedStream.addTrack(track.clone());
  }

  const chunks: BlobPart[] = [];
  const mimeType = chooseMimeType();
  const recorder = new MediaRecorder(combinedStream, {
    ...(mimeType ? { mimeType } : {}),
    audioBitsPerSecond: 96_000,
    videoBitsPerSecond: 1_400_000,
  });
  let isStopping = false;

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.start(1000);

  return {
    stop() {
      return new Promise((resolve, reject) => {
        if (recorder.state === "inactive") {
          resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
          return;
        }

        if (isStopping) {
          reject(new Error("Recording is already stopping."));
          return;
        }

        isStopping = true;

        recorder.addEventListener(
          "stop",
          () => {
            for (const track of combinedStream.getTracks()) {
              track.stop();
            }
            resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
          },
          { once: true },
        );
        recorder.addEventListener("error", (event) => reject(event instanceof ErrorEvent ? event.error : event), { once: true });
        try {
          recorder.requestData();
          recorder.stop();
        } catch (error) {
          reject(error);
        }
      });
    },
  };
}

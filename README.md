# PupTalk MVP

PupTalk is a browser-based 2D puppet animation prototype for kids. Use one or both hands like talking puppets, speak into the microphone, and record a short WebM video of selected cartoon characters on a selected background.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal. For a production build:

```bash
npm run build
```

## Browser Permissions

Click **Start camera/mic** and allow camera and microphone access. The camera feed is only used for local hand tracking and appears as a small tracking preview. It is not drawn into the export canvas and is not included in recorded videos.

## Hand Tracking

Choose **Solo** or **Duet**, then click **Start hand tracking**. In solo mode, PupTalk uses the selected hand. In duet mode, it tracks two visible hands and assigns them to the left and right characters so they face each other. PupTalk maps the distance between each thumb tip and index tip into `mouthOpen` from 0 to 1 using a forgiving default range.

## Characters

The MVP includes simple Canvas-vector puppet rigs for dog, cat, lion, tin man, scarecrow, cowboy, and space ranger. The cowboy and space ranger are original archetypes, not direct copies of named commercial characters. Duet mode lets any two characters perform together.

## Recording And Export

Recording uses `canvas.captureStream()` for the animation and `getUserMedia()` for microphone audio. PupTalk combines those tracks with the browser `MediaRecorder` API, creates a WebM preview, and provides a local download link. The exported WebM contains only the animated character and selected background, not the webcam preview.

## Known Limitations

- MediaPipe model and WASM assets are loaded from public MediaPipe/CDN URLs in this MVP. No camera or microphone content is uploaded, but the app is not fully offline on first load.
- Hand tracking is rule-based. Duet mode supports two hands, but crowded or overlapping hands can still confuse tracking.
- Characters are simple vector rigs, not imported art.
- No mobile optimization, timeline editor, cloud upload, or accounts yet.

## Next-Step Ideas

- Vendor the MediaPipe assets into `public/mediapipe` for fully offline startup.
- Add a kid-friendly setup walkthrough with large step cards.
- Add more character expressions, blink timing, and simple secondary motion options.
- Add a countdown and recording duration limit.

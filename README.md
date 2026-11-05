# LiveKit + Effects SDK demo

This browser demo shows how to process a LiveKit local camera track with Effects SDK before publishing it. The processed stream is also used for the local preview.

Current dependencies:

- `effects-sdk` 3.13.1
- `livekit-client` 2.23.0
- Vite 5 and TypeScript

## Features

The demo currently includes:

- Background blur, solid color, and image replacement
- Color correction and low-light enhancement
- Smart zoom and presenter layout
- Beautification, portrait lighting, and sharpness
- Output mirroring
- Animated lower-third example
- Effects SDK error reporting in the browser console
- Processed local preview and processed LiveKit publication

## Requirements

- A modern browser with hardware-accelerated WebGL
- HTTPS or `localhost` for camera access
- A LiveKit server URL and access token
- An Effects SDK Customer ID

Request an Effects SDK trial Customer ID from the [Effects SDK trial page](https://effectssdk.ai/request-trial).

## Setup

Install dependencies:

```shell
npm install
```

Replace `CUSTOMER_ID` in [`src/EffectsVideoProcessor.ts`](src/EffectsVideoProcessor.ts) with your Effects SDK Customer ID:

```ts
const sdk = new tsvb('YOUR_CUSTOMER_ID');
```

Start the development server:

```shell
npm run dev
```

Open the displayed local URL, enter the LiveKit URL and token, and connect. Use the effect buttons after the local camera has been published.

Create a production build with:

```shell
npm run build
```

## Integration architecture

The integration uses LiveKit's standard `TrackProcessor` API:

```text
Camera MediaStreamTrack
  -> LiveKit LocalVideoTrack
  -> EffectsVideoProcessor
  -> Effects SDK processedTrack
  -> LiveKit publication and local preview
```

The processor is attached before publication in [`src/demo.ts`](src/demo.ts):

```ts
if (track instanceof LocalVideoTrack) {
  await track.setProcessor(videoProcessor, true);
}
await room.localParticipant.publishTrack(track);
```

The second `setProcessor` argument enables the processed local preview.

[`src/EffectsVideoProcessor.ts`](src/EffectsVideoProcessor.ts) implements the processor lifecycle:

1. Configure Effects SDK before preloading or supplying a stream.
2. Register `onReady` and error handling before `useStream()`.
3. Pass LiveKit's input video track to Effects SDK.
4. Call `run()` when Effects SDK becomes ready.
5. Read the output track after readiness and expose it as `processedTrack`.
6. Reinitialize safely after LiveKit destroys the processor.

Effect state and reusable UI components are managed in [`src/EffectsStateManagement.ts`](src/EffectsStateManagement.ts). Calls from the demo buttons are defined in [`src/demo.ts`](src/demo.ts).

## Important behavior

- Effects SDK processes video only. LiveKit publishes the original audio track separately.
- SDK effect methods must be called after `onReady`.
- `run()` is required; otherwise the output contains unprocessed frames.
- Camera or resolution changes can replace the Effects SDK output stream, so the processor reads `getStream()` again after every initialization.
- `destroy()` makes an Effects SDK instance unusable. The processor creates a new instance if LiveKit later reuses it.
- SDK mirroring changes the published output, so remote participants also see the mirrored image.
- When Effects SDK is unsupported, the processor falls back to the original camera track.

## Troubleshooting

Initialization and publication failures appear both in the browser console and the demo log. Effects SDK runtime errors are logged with the `[EffectsSDK]` prefix.

Common issues:

- Invalid or unauthorized Customer ID
- Camera permission denied
- Effects SDK model or authentication requests blocked by CSP/network policy
- Hardware acceleration disabled
- Background image missing CORS headers

## Documentation

- [Effects SDK Web integration guide](https://effectssdk.ai/sdk/web/llms.txt)
- [Effects SDK Web repository](https://github.com/EffectsSDK/video-effects-sdk-web)
- [LiveKit JavaScript client](https://github.com/livekit/client-sdk-js)
- [LiveKit track processors](https://github.com/livekit/track-processors-js)

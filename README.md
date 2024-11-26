# LiveKit & Video Effects SDK Integration Sample

Enhance your video calls, conferencing, or recordings with real-time popular video effects, seamlessly integrated with LiveKit.

This example builds upon the LiveKit test app, available here: [https://github.com/livekit/client-sdk-js/tree/main/examples/demo](https://github.com/livekit/client-sdk-js/tree/main/examples/demo)


https://github.com/user-attachments/assets/6422a72c-e13f-45f1-a537-0332639ce0af



## Docs

- [Effects SDK for Web](https://github.com/EffectsSDK/web-integration-sample)
- [API Reference](https://effectssdk.ai/sdk/web/docs/classes/tsvb.html)
- [Feature Usage](docs/Features-Usage-Examples.md)
- [Best Practices](docs/Best-Practices.md)

## Installation

### NPM

```shell
npm install
npm run dev
```

## Usage

LiveKit has introduced Audio/Video Processor functionality for real-time stream modification.

Here’s a simple implementation of a Video Processor we created.

```typescript
import { Room, Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';
import { tsvb } from 'effects-sdk';

import { EffectsStateManagement, EffectsStates} from './EffectsStateManagement';

export class EffectsVideoProcessor implements TrackProcessor<Track.Kind, VideoProcessorOptions> {
    name: string = 'effects-sdk';
    states: EffectsStateManagement = new EffectsStateManagement();
    
    effectsSdk: tsvb;
    processedTrack?: MediaStreamTrack;

    constructor() {
        console.log('EffectsVideoProcessor.constructor',);
        //put your customer_id here
        this.effectsSdk = new tsvb('CUSTOMER_ID');
        this.effectsSdk.config({
            provider: "webgpu",
            wasmPaths: { 
                     'ort-wasm.wasm': 'https://effectssdk.ai/sdk/web/3.4.3/ort-wasm.wasm',
                     'ort-wasm-simd.wasm': 'https://effectssdk.ai/sdk/web/3.4.3/ort-wasm-simd.wasm'
                 }
        });
        this.effectsSdk.preload();
    }

    apply(state: Partial<EffectsStates>) {
        this.states.apply(this.effectsSdk, state);
    }

    clear() {
        this.states.clear(this.effectsSdk);
    }
    
    async init(opts: VideoProcessorOptions) {
        if (opts.kind !== Track.Kind.Video) {
            return Promise.reject(new Error('Supported only video tracks'));
        }

        this.effectsSdk.clear();
        this.effectsSdk.useStream(new MediaStream([opts.track]));
        this.processedTrack = this.effectsSdk.getStream()?.getVideoTracks()[0];
        await new Promise((r) => this.effectsSdk.onReady = r);
        
        //update sdk states from state manager
        this.states.update(this.effectsSdk);
    };

    async restart(opts: VideoProcessorOptions) {
        if (opts.kind !== Track.Kind.Video) {
            return Promise.reject(new Error('Supported only video tracks'));
        }

        this.effectsSdk.clear();
        this.effectsSdk.useStream(new MediaStream([opts.track]));
        this.processedTrack = this.effectsSdk.getStream()?.getVideoTracks()[0];
        await new Promise((r) => this.effectsSdk.onReady = r);
        
        //update sdk states from state manager
        this.states.update(this.effectsSdk);
    }

    async destroy() {
        this.effectsSdk.stop();
        this.effectsSdk.clear();
        this.processedTrack = undefined;
        return;
    }
    
    async onPublish(room: Room) {
        console.log('EffectsVideoProcessor.onPublish', room);
        //handle it if needed
        return;
    }
    async onUnpublish() {
        console.log('EffectsVideoProcessor.onUnpublish');
        //handle it if needed
        return;
    }
}
```

Since the Effects SDK does not internally manage the state of active effects, we have created a simple example of a state management layer.

```typescript
import { tsvb } from 'effects-sdk';

export enum LayoutMode {
    CENTER = 'center',
    LFTBOTTOM = 'left-bottom',
    RIGHTBOTTOM = 'right-bottom',
}

export interface EffectsStates {
    running: boolean;
    blur: number;
    color: number;
    replace: string;
    ccorrection: number;
    lowlight: number;
    mirroring: boolean;
    freeze: boolean;
    smartzoom: number;
    beautification: number;
    sharpness: number;
    layout: LayoutMode
}

export class EffectsStateManagement {

    defaultStates: EffectsStates = {
        running: false,
        blur: 0,
        color: 0,
        replace: '',
        ccorrection: 0,
        lowlight: 0,
        mirroring: false,
        freeze: false,
        smartzoom: 0,
        beautification: 0,
        sharpness: 0,
        layout: LayoutMode.CENTER
    }

    states: Partial<EffectsStates> = {};

    constructor() {
        Object.assign(this.states as EffectsStates, this.defaultStates);
    }
    
    update(sdk: tsvb) {
        this.apply(sdk, this.states as Partial<EffectsStates>);
    }

    apply(sdk: tsvb, state: Partial<EffectsStates>) {
        let feature: keyof Partial<EffectsStates>;
        for(feature in state) {
            state[feature];
            switch(feature) { 
                case 'running': { 
                   state[feature] ? sdk.run() : sdk.stop();
                   break; 
                } 
                case 'blur': { 
                   state[feature] ? sdk.setBlur(state[feature] as number) : sdk.clearBlur();
                   break; 
                }
                case 'color': { 
                    if (state[feature]) {
                        sdk.setBackgroundColor(state[feature] as number);
                        sdk.setBackground('color');
                    } else {
                        sdk.clearBackground();
                    }
                    break; 
                }
                case 'replace': { 
                    if (state[feature]) {
                        sdk.setBackground(state[feature]);
                    } else {
                        sdk.clearBackground();
                    }
                    break; 
                }
                case 'ccorrection': { 
                    if (state[feature]) {
                        sdk.enableColorCorrector();
                        sdk.setColorCorrectorPower(state[feature] as number);
                    } else {
                        sdk.disableColorCorrector();
                    }
                    break; 
                }
                case 'lowlight': { 
                    if (state[feature]) {
                        sdk.enableLowLightEffect();
                        sdk.setLowLightEffectPower(state[feature] as number);
                    } else {
                        sdk.disableLowLightEffect();
                    }
                    break; 
                }
                case 'mirroring': { 
                    state[feature] ? sdk.enableMirroring() : sdk.disableMirroring();
                    break; 
                }
                case 'freeze': { 
                    state[feature] ? sdk.freeze() : sdk.unfreeze();
                    break; 
                }
                case 'smartzoom': { 
                    if (state[feature]) {
                        sdk.enableSmartZoom();
                        sdk.setFaceArea(state[feature] as number);
                    } else {
                        sdk.disableSmartZoom();
                    }
                    break;
                }
                case 'beautification': { 
                    if (state[feature]) {
                        sdk.enableBeautification()
                        sdk.setBoundaryLevel(state[feature] as number);
                    } else {
                        sdk.disableBeautification();
                    }
                    break;
                }
                case 'sharpness': { 
                    if (state[feature]) {
                        sdk.enableSharpnessEffect();
                        sdk.setSharpnessEffectConfig({ power: state[feature] as number });
                    } else {
                        sdk.disableSharpnessEffect();
                    }
                    break;
                }
                case 'layout': { 
                    sdk.setLayout(state[feature] as string);
                    break;
                }
             } 
        }

        Object.assign(this.states, state);
    }
    
    clear(sdk: tsvb) {
        this.apply(sdk, this.defaultStates);
    }
}
```

To apply a custom video processor, follow these steps:

- Retrieve the tracks using the LiveKit API when you're ready to publish local streams.
- Set the custom video processor on the desired VideoTrack.
- Publish the processed streams.

```typescript
 try {
    const tracks: LocalTrack[] = await room.localParticipant.createTracks({
        audio: true,
        video: true
    });

    await Promise.all(tracks.map(async (track) => {
        if (track instanceof LocalVideoTrack) {
            await track.setProcessor(videoProcessor);
        }
        await room.localParticipant.publishTrack(track)
    }));
} catch(e: any) {

}
```

> [!NOTE]
> LiveKit also supports passing a video processor as part of the options during track creation.
> However, this method is currently not functional because LiveKit attempts to perform a deep clone of the options object, which causes an error with our processor.

Another approach to implement the integration is to publish a pure MediaTrack with the effects already applied, as shown below.

```typescript

room.localParticipant.publishTrack(modifiedTrack: MediaStreamTrack);

```

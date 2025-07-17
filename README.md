# LiveKit & Video Effects SDK Integration Sample

Enhance your video calls, conferencing, or recordings with real-time popular video effects, seamlessly integrated with LiveKit.

This example builds upon the LiveKit test app, available here: [https://github.com/livekit/client-sdk-js/tree/main/examples/demo](https://github.com/livekit/client-sdk-js/tree/main/examples/demo)


https://github.com/user-attachments/assets/6422a72c-e13f-45f1-a537-0332639ce0af



## Docs

- [Effects SDK for Web](https://github.com/EffectsSDK/web-integration-sample)
- [API Reference](https://effectssdk.ai/sdk/web/docs/classes/tsvb.html)
- [Feature Usage](https://github.com/EffectsSDK/video-effects-sdk-web/blob/main/docs/Features-Usage-Examples.md)
- [Best Practices](https://github.com/EffectsSDK/video-effects-sdk-web/blob/main/docs/Best-Practices.md)

## Installation

### NPM

```shell
npm install
npm run dev
```

## Trial Evaluation

A Customer ID is required for the Effects SDK.

To receive a new trial Customer ID, please fill out the contact form on the [effectssdk.ai](https://effectssdk.ai/request-trial) website.


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
    LEFT = 'left',
    RIGHT = 'right',
    CUSTOM = 'custom',
}

export type LayoutConfig = {
    type: LayoutMode,
    xOffset?: number,
    yOffset?: number,
    size?: number,   
}

export type lowerThird = {
    show: boolean,
    type: "lowerthird_1" | "lowerthird_2" | "lowerthird_3" | "lowerthird_4" | "lowerthird_5",
    options?: Partial<lowerThirdConfig>
}

export type lowerThirdConfig = {
    color: {
        primary: number,
        secondary: number,
    },
    offset: {
       x: number,
       y: number,
    },

    text: {
       title: string,
       subtitle: string,
    },
}
export type cfilterConfig = {
    power: number,
    lut: string,
}

export type WatermarkConfig = {
    url: string,
    position?: { 
        placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "custom", 
        x: number, 
        y: number 
    },
    size?: number,
}

export type StickerConfig = {
    url: string,
    position?: { 
        placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "custom", 
        x: number, 
        y: number 
    },
    duration?: number,
    size?: number,
}

export type EmojiConfig = {
    url: string,
    position?: { 
        placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "custom", 
        x: number, 
        y: number 
    },
    duration?: number,
    size?: number,
}

export type BackgroundConfig = {
    replace: string | MediaStream,
    mode?: 'fill' | 'fit'
}

export interface EffectsStates {
    running: boolean;
    metrics: boolean,
    blur: number;
    color: number;
    background: BackgroundConfig;
    ccorrection: number;
    cfilter: cfilterConfig;
    lowlight: number;
    mirroring: boolean;
    freeze: boolean;
    smartzoom: number;
    beautification: number;
    sharpness: number;
    layout: LayoutConfig;
    overlay: string;
    lowerthird: lowerThird;
    logo: WatermarkConfig,
    sticker: StickerConfig,
    emoji: EmojiConfig,
}

export class EffectsStateManagement {
    overlay?: any;
    overlayResolve?: Function;
    lowerthirds: Map<string, any> = new Map();
    logo?: any;
    stickers?: any;
    stickersMap: Map<string, any> = new Map();
    emojis: Map<string, any> = new Map();
    
    defaultStates: EffectsStates = {
        running: false,
        metrics: false,
        blur: 0,
        color: 0,
        background: {
           replace: '',
           mode: 'fill'
        },
        cfilter: { power: 0, lut: ''},
        ccorrection: 0,
        lowlight: 0,
        mirroring: false,
        freeze: false,
        smartzoom: 0,
        beautification: 0,
        sharpness: 0,
        layout: {
            type: LayoutMode.CENTER,
            xOffset: 0,
            yOffset: 0,
            size: 1,
        },
        overlay: '',
        logo: {
            url: "",
            position: { placement: "custom", x: 0.05, y: 0.05 },
            size: 0.08,
        },
        sticker: {
            url: "",
            position: { placement: "custom", x: 0.1, y: 0.1 },
            duration: 3500,
            size: 0.5,
        },
        
        emoji: {
            url: "",
            position: { placement: "custom", x: 0.8, y: 0.1 },
            duration: 3500,
            size: 0.3,
        },
        lowerthird: {
            show: false,
            type: "lowerthird_1",
            options: {
                color: {
                    primary: 0xff5500,
                    secondary: 0x5100ff,
                 },
    
                 offset: {
                    x: 0.1,
                    y: 0.1,
                 },
           
                 text: {
                    title: "Lower Third Title",
                    subtitle: "Lower Third Subtitle",
                 },
            }
        }
    }

    states: Partial<EffectsStates> = {};

    constructor() {
        Object.assign(this.states as EffectsStates, this.defaultStates);
    }
    
    async update(sdk: tsvb) {
        await this.apply(sdk, this.states as Partial<EffectsStates>);
    }

    async apply(sdk: tsvb, state: Partial<EffectsStates>) {
        let feature: keyof Partial<EffectsStates>;
        for(feature in state) {
            switch(feature) { 
                case 'running': { 
                   state[feature] ? sdk.run() : sdk.stop();
                   break; 
                }
                case 'metrics': { 
                    state[feature] ? sdk.showFps() : sdk.hideFps();
                    break; 
                } 
                case 'blur': { 
                   if (state[feature]) {
                    let p = new Promise(r => { sdk.onBackgroundSuccess(() => { r(true) }) });
                    sdk.setBlur(state[feature] as number)
                    await p;
                   } else {
                    sdk.clearBlur();
                   }
                   break; 
                }
                case 'color': { 
                    if (state[feature]) {
                        let p = new Promise(r => { sdk.onBackgroundSuccess(() => { r(true) }) });
                        sdk.setBackgroundColor(state[feature] as number);
                        sdk.setBackground('color');
                        await p;
                    } else {
                        sdk.clearBackground();
                    }
                    break; 
                }
                case 'background': { 
                    Object.assign(this.states[feature] as BackgroundConfig, state[feature] as Partial<BackgroundConfig>);
                    let config = this.states[feature] as BackgroundConfig;

                    if (config.replace) {
                        let p = new Promise(r => { sdk.onBackgroundSuccess(() => { r(true) }) });
                        sdk.setBackground(config.replace);
                        sdk.setBackgroundFitMode(config.mode ? config.mode : 'fill');
                        await p;
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
                case 'cfilter': { 
                    if (state[feature]?.power) {
                        let r: Function;
                        let p = new Promise((resolve) => {
                            r = resolve;
                        });
                        
                        sdk.setColorFilterConfig({
                            power: state[feature]?.power,
                            lut: state[feature]?.lut,
                            promise: { 
                                resolve: () => { r(); }, 
                                reject: () => { r(); }
                            }
                        });
                        await p;
                        sdk.enableColorFilter();
                    } else {
                        sdk.disableColorFilter();
                    }
                    break; 
                }
                case 'lowlight': { 
                    if (state[feature]) {
                        let p = new Promise(resolve => sdk.onLowLightSuccess(() => {
                            resolve(true);
                        }));
                        sdk.enableLowLightEffect();
                        sdk.setLowLightEffectPower(state[feature] as number);
                      
                        await p;                        
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
                    let config: any = {}; 
                    Object.assign(config, this.states[feature], state[feature] as LayoutConfig);
                    state[feature] = config;

                    if (config.type == 'custom') {
                        sdk.setCustomLayout({
                            xOffset: config.xOffset,
                            yOffset: config.yOffset,
                            size: config.size,
                        })
                    } else {
                        sdk.setLayout(config.type);
                    }
                    
                    break;
                }
                case 'overlay': { 
                    if(!state[feature] && this.overlay) {
                        this.overlay.hide();
                    } else {
                        let r: Function;
                        let p = new Promise((resolve) => {
                            r = resolve;
                        });
                        if (!this.overlay) {
                            this.overlay = sdk.createComponent({
                                component: "overlay_screen",
                                options: {
                                  url: state[feature],
                                  promise: {
                                    resolve: () => { r();},
                                    reject: () => { r(); }
                                    }
                                },
                              });
                            sdk.addComponent(this.overlay, 'overlay');
                            this.overlay.onAfterShow(() => sdk.enablePipelineSkipping());
                            this.overlay.onBeforeHide(() => sdk.disablePipelineSkipping());
                        } else {                            
                            this.overlay.setOptions({
                                url: state[feature], 
                                promise: {
                                    resolve: () => { r();},
                                    reject: () => { r(); }
                                }
                            });
                        }
                        
                        await p;
                        this.overlay.show();
                    }
                    
                    break;
                }
                case 'lowerthird': {
                    let options = {};
                    let lt: any;
                    let config = state[feature] as lowerThird;

                    if (config.options) {
                         Object.assign(options, this.defaultStates[feature].options, state[feature]?.options);
                         (state[feature] as lowerThird).options = options;
                    }

                    if (this.lowerthirds.has(state[feature]?.type as string)) {
                        lt = this.lowerthirds.get(state[feature]?.type as string)
                    }

                    if(!config.show) {
                        for (const [_key, value] of this.lowerthirds) {
                            value.hideLowerThird();
                        }
                        break;
                    }
                    
                    if (!lt) {
                        lt = sdk.createComponent({
                            component: config.type,
                            options: config.options ? config.options : this.defaultStates[feature].options,
                        });
                        sdk.addComponent(lt, config.type);
                        this.lowerthirds.set(config.type, lt);
                        lt.showLowerThird();
                    } else {
                        lt.setOptions(config.options ? config.options : this.defaultStates[feature].options);
                        lt.showLowerThird();
                    }
                    
                    break;
                }
                case 'logo': {
                    let config = state[feature] as Partial<WatermarkConfig>;
                    if (!config.position) {
                        config.position = this.defaultStates[feature].position;
                    }
                    if (!config.size) {
                        config.size = this.defaultStates[feature].size;
                    }
                    
                    state[feature] = config as WatermarkConfig;
                    
                    if (!this.logo) {
                        this.logo = sdk.createComponent({
                            component: "watermark",
                        });
                        sdk.addComponent(this.logo, "logo");
                    }
                    
                    if (config.url) {
                        this.logo.setOptions({
                            url: config.url,
                            position: config.position,
                            size: config.size
                        });
                        this.logo.show();
                    } else {
                        this.logo.hide();
                    }
                    
                        
                    break;
                }

                case 'sticker': {
                    let config = state[feature] as StickerConfig;
                    if (!config.url) {
                        break;
                    }

                    if (!config.position) {
                        config.position = this.defaultStates[feature].position;
                    }
                    if (!config.size) {
                        config.size = this.defaultStates[feature].size;
                    }
                    if (!config.duration) {
                        config.duration = this.defaultStates[feature].duration;
                    }

                    if (!this.stickers) {
                        this.stickers = sdk.createComponent({
                            component: "stickers",
                        });
                        sdk.addComponent(this.stickers, "sticker");
                           
                    }

                    if (!this.stickersMap.has(config.url)) {
                        this.stickers.setOptions({
                            sticker: {
                                url: config.url,     
                            },
                            position: config.position,
                            size: config.size,
                            duration: config.duration
                        }) 
                        this.stickersMap.set(config.url, '');
                        break;
                    }

                    this.stickers.setOptions({
                        id: config.url,
                        position: config.position,
                        size: config.size,
                        duration: config.duration
                    })
                    //}
                        
                    break;
                }
             } 
        }

        Object.assign(this.states, state);
    }
    
    clear(sdk: tsvb) {
        this.apply(sdk, structuredClone(this.defaultStates));
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

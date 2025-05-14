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
                     'ort-wasm.wasm': 'https://effectssdk.ai/sdk/web/3.5.3/ort-wasm.wasm',
                     'ort-wasm-simd.wasm': 'https://effectssdk.ai/sdk/web/3.5.3/ort-wasm-simd.wasm'
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

        const ready = new Promise((r) => this.effectsSdk.onReady = r);

        this.effectsSdk.clear();
        this.effectsSdk.useStream(new MediaStream([opts.track]));
        this.processedTrack = this.effectsSdk.getStream()?.getVideoTracks()[0];
        
        await ready;
        
        //update sdk states from state manager
        this.states.update(this.effectsSdk);
    };

    async restart(opts: VideoProcessorOptions) {
        await this.init(opts);
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
        //handle it if needed — you may need to stop the SDK processing.
        return;
    }
}
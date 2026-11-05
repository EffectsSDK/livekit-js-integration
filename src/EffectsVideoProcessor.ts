import { Room, Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';
import { tsvb } from 'effects-sdk';

import { EffectsStateManagement, EffectsStates } from './EffectsStateManagement';

export class EffectsVideoProcessor implements TrackProcessor<Track.Kind, VideoProcessorOptions> {
    name = 'effects-sdk';
    states = new EffectsStateManagement();

    effectsSdk: tsvb;
    processedTrack?: MediaStreamTrack;
    private destroyed = false;

    constructor() {
        this.effectsSdk = this.createSdk();
    }

    private createSdk() {
        const sdk = new tsvb('CUSTOMER_ID');
        sdk.config({
            preset: 'balanced',
            provider: 'auto',
        });
        sdk.onError((error) => {
            if (error.type === 'error') {
                console.error('[EffectsSDK]', error.code, error.message, error.data);
            }
        });
        sdk.preload();
        return sdk;
    }

    apply(state: Partial<EffectsStates>) {
        return this.states.apply(this.effectsSdk, state);
    }

    clear() {
        return this.states.clear(this.effectsSdk);
    }

    async init(opts: VideoProcessorOptions) {
        if (opts.kind !== Track.Kind.Video) {
            throw new Error('Effects SDK supports only video tracks');
        }

        if (this.destroyed) {
            this.effectsSdk = this.createSdk();
            // Components belong to their SDK instance and cannot be reused after destroy().
            this.states = new EffectsStateManagement();
            this.destroyed = false;
        }

        if (!this.effectsSdk.isSupported()) {
            console.warn('[EffectsSDK] Unsupported environment; using the original video track');
            this.processedTrack = opts.track;
            return;
        }

        const ready = new Promise<void>((resolve) => {
            this.effectsSdk.onReady = () => {
                this.effectsSdk.run();
                resolve();
            };
        });

        // Register onReady before providing input. useStream also handles camera or
        // resolution changes and may replace the SDK's output stream.
        this.effectsSdk.useStream(new MediaStream([opts.track]));
        await ready;

        this.processedTrack = this.effectsSdk.getStream()?.getVideoTracks()[0];
        if (!this.processedTrack) {
            throw new Error('Effects SDK did not create an output video track');
        }

        await this.states.update(this.effectsSdk);
    }

    async restart(opts: VideoProcessorOptions) {
        await this.init(opts);
    }

    async destroy() {
        this.processedTrack = undefined;
        await this.effectsSdk.destroy();
        this.destroyed = true;
    }

    async onPublish(room: Room) {
        console.log('EffectsVideoProcessor.onPublish', room);
        this.effectsSdk.run();
    }

    async onUnpublish() {
        this.effectsSdk.stop();
    }
}

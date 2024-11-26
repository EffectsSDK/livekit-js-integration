/**
 * Effects SDK dosn't keep the current states of acive effects internally
 * Here is simple example of state management layer
 */

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
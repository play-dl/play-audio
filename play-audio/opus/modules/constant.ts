export interface OpusHandlerOptions {
    rate: 8000 | 12000 | 16000 | 24000 | 48000;
    channels: 1 | 2;
    frameSize: number;
}

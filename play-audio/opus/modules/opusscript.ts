import { OpusHandlerOptions } from './constant';

export class OpusHandler {
    protected options: OpusHandlerOptions;
    private encoder: any;
    constructor(options: OpusHandlerOptions) {
        const OpusScript = require('opusscript');
        this.options = options;
        this.encoder = new OpusScript(options.rate, options.channels);
    }

    encode(buf: Buffer): Buffer {
        return this.encoder.encode(buf, this.options.frameSize);
    }

    decode(buf: Buffer): Buffer {
        return this.encoder.decode(buf);
    }

    encode_ctl(ctl: number, val: number) {
        this.encode_ctl(ctl, val);
    }

    decode_ctl(ctl: number, val: number) {
        this.decode_ctl(ctl, val);
    }

    delete() {
        this.encoder.delete();
    }
}

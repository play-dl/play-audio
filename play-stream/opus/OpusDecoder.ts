import { TransformCallback } from "stream";
import { OpusDuplexStream, OpusTransformOptions } from "./DuplexStream";

const OPUS_HEAD = Buffer.from('OpusHead');
const OPUS_TAGS = Buffer.from('OpusTags');

export class OpusDecoder extends OpusDuplexStream {
    opusHead?: Buffer;
	opusTags?: Buffer;

    constructor(options : OpusTransformOptions){
        super(options)
    }

    public _write(chunk: Buffer, _ : BufferEncoding, done: TransformCallback): void {
		if (chunk.compare(OPUS_HEAD, 0, 8, 0, 8) === 0) {
			this.opusHead = chunk;
			this.emit('opusHead', chunk);
		} else if (chunk.compare(OPUS_TAGS, 0, 8, 0, 8) === 0) {
			this.opusTags = chunk;
			this.emit('opusTags', chunk);
		} else {
			let frame: Buffer;
			try {
				frame = this.encoder.decode(chunk);
			} catch (err : any) {
				done(err);
				return;
			}
			this.push(frame);
		}
		done();
	}

    applyCTL(ctl : number, value : number){
        this.encoder.decode_ctl(ctl, value)
    }
}
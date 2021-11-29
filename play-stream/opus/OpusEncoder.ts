import { TransformCallback } from "stream";
import { OpusDuplexStream, OpusTransformOptions } from "./DuplexStream";


export class OpusEncoder extends OpusDuplexStream {
    private remaining : Buffer
    
    constructor(options : OpusTransformOptions){
        super(options)
        this.remaining = Buffer.allocUnsafe(0)
    }

    public _write(chunk : Buffer, _: BufferEncoding, done : TransformCallback) : void {
        const pcmChunk = Buffer.concat([this.remaining, chunk])

        let i = 0;
        while ( pcmChunk.length >= i + this.pcm_length ){
            const pcm = pcmChunk.slice(i, i + this.pcm_length)

            let opus : Buffer;

            try {
                opus = this.encode(pcm)
            } catch (err : any) {
                done(err);
                return;
            }
            this.push(opus)
            i += this.pcm_length
        }

        if( i > 0 ) this.remaining = pcmChunk.slice(i)
        done();
    }

    applyCTL(ctl : number, value : number){
        this.encoder.encode_ctl(ctl, value)
    }
}
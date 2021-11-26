import { AbstractOpusHandler, OpusHandlerOptions } from "./constant";


export class OpusHandler extends AbstractOpusHandler {

    private encoder : any
    constructor(options : OpusHandlerOptions){
        const pack = require('play-opus')
        super(options)
        this.encoder = new pack.OpusHandler(options.rate, options.channels)
    }

    encode(buf : Buffer) : Buffer{
       return this.encoder.encode(buf) 
    }
    
    decode(buf : Buffer) : Buffer{
       return this.encoder.decode(buf) 
    }

    encode_ctl(ctl : number, val : number){
        this.encode_ctl(ctl, val)
    }

    decode_ctl(ctl : number, val : number){
        this.decode_ctl(ctl, val)
    }

    delete(){
        this.encoder.delete()
    }
}
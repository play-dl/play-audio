import { Duplex, DuplexOptions, Transform, TransformOptions } from "stream";
import { OpusHandlerOptions } from "./modules/constant";
import { createOpusHandler, OpusEncoder } from "./modules/loader";

export enum OpusCTL {
	SetBitrate = 4002,
	SetFEC = 4012,
	SetPLP = 4014,
}

export interface OpusTransformOptions extends OpusHandlerOptions {
	transform?: TransformOptions
	encoder?: "play-opus" | "opusscript"
	duplex?: DuplexOptions
}

export abstract class OpusTransformStream extends Transform {
	protected encoder : OpusEncoder;
	protected pcm_length : number;
	constructor(options : OpusTransformOptions){
		super(options.transform)
		const handler = createOpusHandler(options, options.encoder)
		if(handler instanceof Error) throw handler
		this.encoder = handler 
		this.pcm_length = options.frameSize * options.channels * 2.
	}

	protected encode(buf : Buffer){
		return this.encoder.encode(buf)
	}

	protected decode(buffer: Buffer) {
		return this.encoder.decode(buffer);
	}

	public _destroy(error: Error | null, callback: (error: Error | null) => void): void {
		this.cleanup();
		callback(error);
	}

	public _final(callback: (error?: Error | null) => void): void {
		this.cleanup();
		callback();
	}

	public abstract applyCTL(ctl: number, value: number): void;

	public bitrate(bitrate: number) {
		return this.applyCTL(OpusCTL.SetBitrate, bitrate);
	}

	public setFEC(enabled: boolean) {
		return this.applyCTL(OpusCTL.SetFEC, enabled ? 1 : 0);
	}

	public setPLP(percentage: number) {
		return this.applyCTL(OpusCTL.SetPLP, Math.min(100, Math.max(0, percentage * 100)));
	}

	private cleanup() {
		this.encoder.delete();
	}
}

export abstract class OpusDuplexStream extends Duplex{
	protected pcm_length : number
	protected encoder : OpusEncoder

	constructor(options : OpusTransformOptions){
		super(options.duplex)
		const handler = createOpusHandler(options, options.encoder)
		if(handler instanceof Error) throw handler
		this.encoder = handler 
		this.pcm_length = options.frameSize * options.channels * 2
	}

	protected encode(buf : Buffer){
		return this.encoder.encode(buf)
	}

	protected decode(buffer: Buffer) {
		return this.encoder.decode(buffer);
	}

	private cleanup(){
		this.encoder.delete()
	}

	_read(){}

	_destroy() : void {
		this.cleanup();
	}

	public abstract _write(chunk : Buffer, enc : BufferEncoding, next: (error?: Error | null) => void) : void

	_final(next: (error?: Error | null) => void){
		this.cleanup();
		next();
	}

	public abstract applyCTL(ctl: number, value: number): void;

	public bitrate(bitrate: number) {
		return this.applyCTL(OpusCTL.SetBitrate, bitrate);
	}

	public setFEC(enabled: boolean) {
		return this.applyCTL(OpusCTL.SetFEC, enabled ? 1 : 0);
	}

	public setPLP(percentage: number) {
		return this.applyCTL(OpusCTL.SetPLP, Math.min(100, Math.max(0, percentage * 100)));
	}
}
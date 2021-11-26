export interface OpusHandlerOptions {
	rate: 8000 | 12000 | 16000 | 24000 | 48000;
	channels: 1 | 2;
	frameSize: number;
}

export abstract class AbstractOpusHandler {
	protected readonly options: OpusHandlerOptions;

	public constructor(options: OpusHandlerOptions) {
		this.options = options;
	}

	public abstract encode(buffer: Buffer): Buffer;
	public abstract decode(buffer: Buffer): Buffer;
	public abstract encode_ctl(ctl: number, value: number): void;
	public abstract decode_ctl(ctl: number, value: number): void;
	public abstract delete(): void;
}
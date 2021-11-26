import { Transform, TransformOptions } from "stream";
import { OpusHandlerOptions } from "./modules/constant";

export enum OpusCTL {
	SetBitrate = 4002,
	SetFEC = 4012,
	SetPLP = 4014,
}

export interface OpusTransformOptions extends OpusHandlerOptions {
	transform?: TransformOptions
}

export class OpusTransformStream extends Transform {

	constructor(options : OpusTransformOptions){
		super(options.transform)
	}
}
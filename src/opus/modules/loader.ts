import { OpusHandlerOptions } from './constant'
import { OpusHandler as PlayHandler } from './play-opus'
import { OpusHandler as ScriptHandler } from './opusscript'

type OpusEncoder = PlayHandler | ScriptHandler

export function createOpusHandler(options : OpusHandlerOptions ,preference?: "play-opus" | "opusscript"): OpusEncoder{
    if(preference){
        try {
            require(preference)
        } catch {
            throw new Error(`Preferred Opus package [${preference}] Not Found`)
        }
        if( preference === "play-opus") return new PlayHandler(options)
        if( preference === "opusscript") return new ScriptHandler(options)
    }
    else {
        try {
            require('play-opus')
            return new PlayHandler(options) 
        } catch {
            try {
                require('opusscript')
                return new ScriptHandler(options) 
            } catch {
                throw new Error("No Opus Packages Found \nTry to install one of following\n  - play-opus\n  -opusscript")
            }   
        }
    }
}
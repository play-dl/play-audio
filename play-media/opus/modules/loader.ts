import { OpusHandlerOptions } from './constant'
import { OpusHandler as PlayHandler } from './play-opus'
import { OpusHandler as ScriptHandler } from './opusscript'

export type OpusEncoder = PlayHandler | ScriptHandler

const modules = {
    "play-opus" : (options : OpusHandlerOptions) => new PlayHandler(options),
    "opusscript" : (options : OpusHandlerOptions) => new ScriptHandler(options)
}

export function createOpusHandler(options : OpusHandlerOptions, preference?: "play-opus" | "opusscript"): OpusEncoder | Error{
    if( preference !== "opusscript" && preference !== "play-opus" ) return new Error('Supported modules for play-media :\n- play-opus\n- opusscript')
    if(preference) {
        try {
            require(preference)
        } catch {
            return new Error(`Module [${preference}] Not Found.`)
        }
        return modules[preference](options)
    }
    else {
        for (const [ name, exec ] of Object.entries(modules)){
            try {
                require(name)
                return exec(options)
            } catch {
                continue;
            }
        }
        return new Error('No modules found. Try to install one of following :\n- play-opus\n- opusscript')
    }
}
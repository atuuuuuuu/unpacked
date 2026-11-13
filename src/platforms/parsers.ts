// Worker-side registry. Adding a platform = add its parser here (UI lives in src/platforms/ui.ts).
import { instagramParser } from './instagram/parse'
import { spotifyParser } from './spotify/parse'
import { youtubeParser } from './youtube/parse'

export const parsers = [spotifyParser, instagramParser, youtubeParser] as const

import { Jimp } from "jimp";

// NOTE: jimp docs say the read return type JIMP but ts says otherwise. They haven't fully ironed out their types, once they do we can remove this
export type JimpImg = Awaited<ReturnType<typeof Jimp.read>>;

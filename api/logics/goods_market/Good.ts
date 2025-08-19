import { GoodQuality } from "./GoodQuality.ts";

export default class Good {

    static nextId = 0;

    id: number;
    quality: GoodQuality;

    constructor(quality: GoodQuality) {
        this.id = Good.nextId++;
        this.quality = quality;
    }
    
}
import Phase0 from './phases/0.js';
import Phase1 from './phases/1.js';
import Phase2 from './phases/2.js';
import Phase3 from './phases/3.js';
import Phase4 from './phases/4.js';
import Phase5 from './phases/5.js';
import Phase6 from './phases/6.js';
import Phase7 from './phases/7.js';
import Phase8 from './phases/8.js';
import Phase9 from './phases/9.js';
import Logic from "../Logic.js";

export default class Futarchy extends Logic {
    constructor(data) {
        super(data, [Phase0, Phase1, Phase2, Phase3, Phase4,
            Phase5, Phase6, Phase7, Phase8, Phase9], 'Futarchy');
    }
}

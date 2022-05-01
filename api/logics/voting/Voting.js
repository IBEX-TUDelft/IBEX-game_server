import Logic from "../Logic.js";

import Phase0 from './phases/0.js';
import Phase1 from './phases/1.js';
import Phase2 from './phases/2.js';
import Phase3 from './phases/3.js';
import Phase4 from './phases/4.js';
import Phase5 from './phases/5.js';

export default class Voting extends Logic {
    constructor(data) {
        super(data, [Phase0, Phase1, Phase2, Phase3, Phase4, Phase5], 'Voting');
    }

    getRecoveryData(number) {
        const self = this;

        const data = {
            "game": {
                "round": self.data.round,
                "phase": self.data.phase,
                "boundaries": self.data.boundaries
            }
        };
  
        return data;
    }
}

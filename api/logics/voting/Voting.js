import Logic from "../Logic.js";

import Phase0 from './phases/0.js';

export default class Voting extends Logic {
    constructor(data) {
        super(data, [Phase0], 'Voting');
    }
}

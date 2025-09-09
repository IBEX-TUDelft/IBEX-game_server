import assert from "assert";
import fs from "fs";
import { SimulationService } from "../services/SimulationService.ts";
import { AppEvents, ResultsSaved } from "../helpers/AppEvents.js";

/*describe("Array", function () {
    describe("#indexOf()", function () {
        it("should return -1 when the value is not present", function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});*/

const recordsDir = "../extra-data/records";
const backupDir = "../extra-data/backup";

/***
In total 38 market record files have a backup file [
  285, 291, 296, 297, 298, 299, 300,
  301, 302, 303, 304, 305, 306, 307,
  308, 310, 312, 313, 314, 315, 316,
  317, 318, 319, 320, 321, 322, 323,
  324, 343, 351, 377, 379, 380, 381,
  382, 383, 384
]
 */

async function playOne(gameId: number) {
    console.log(`Found! `, gameId);

    const recordPath = `${recordsDir}/${gameId}.log.json`;
    const backupPath = `${backupDir}/${gameId}.json`;

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    if (backup.parameters.game_type !== 'market') {
        return;
    }

    console.log(`Found! ${gameId}`, backup.parameters.game_type);

    const dataSource: any = {};

    dataSource.realValue = backup.realValue;
    dataSource.publicSignal = backup.publicSignal;

    backup.players.forEach((player) => {
        dataSource[`privateSignal_player_${player.number}`] = player.signal;
    });

    const record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));

    console.log(`Replaying game ${gameId} with data source:`, dataSource);

    const replayedGameId = await SimulationService.createLoaded(record, `record_${gameId}`, `Replayed ${gameId}`);

    const waitPhase2Over = new Promise(resolve => {
        AppEvents.get(replayedGameId).addListener(ResultsSaved, async (data: { phase: number }) => {
            console.log(`ResultsSaved event received for phase`, data.phase);

            if (data.phase === 2) {
                resolve(true);
            }
        });
    });

    const replayedGame = await SimulationService.runLoaded(record, `record_${gameId}`, replayedGameId, dataSource);

    console.log(`Replayed game has ID ${replayedGameId}`);

    const results = replayedGame.data.results;
    
    await waitPhase2Over;

    assert.equal(results[1].phase[1].log.length, backup.results[1].phase[1].log.length);

    results[1].phase[2].profits.forEach((profit: {number: number, profit: number}) => {
        const comparison = backup.results[1].phase[2].profits.find((p: {number: number, profit: number}) => p.number === profit.number);

        assert.equal(profit.profit, comparison.profit, `Mismatch in profits for player ${profit.number}`);
    });

    assert.equal(results[1].phase[0].publicSignal, backup.results[1].phase[0].publicSignal, "Mismatch in public signal");
    assert.equal(results[1].phase[0].realValue, backup.results[1].phase[0].realValue, "Mismatch in real value");
}

describe("Market Games", function () {
    it("Market 1", async function () {
        SimulationService.init();

        try {
            await playOne(1);
        } catch (error) {
            console.error(`Error occurred while playing game 384: ${error.message}`);
        }

        await SimulationService.kill();
    });
});
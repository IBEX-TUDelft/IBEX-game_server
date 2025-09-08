import fs from "fs";
import { SimulationService } from "../services/SimulationService.ts";
import { AppEvents, ResultsSaved } from "../helpers/AppEvents.js";
import assert from "assert";

const recordsDir = "../extra-data/records";
const backupDir = "../extra-data/backup";

async function generateDataSourceForGame(gameId: number) {
    const backupPath = `${backupDir}/${gameId}.json`;

    if (!fs.existsSync(backupPath)) {
        throw new Error(`No backup file found for game ${gameId}`);
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    const dataSource: any = {};

    backup.players.forEach((player) => {
        dataSource[`hq_${player.number}`] = player.signals.highQualitySignal;
        dataSource[`lq_${player.number}`] = player.signals.lowQualitySignal;

        if (player.role === 0) {
            dataSource[`verification_${player.number}`] = {
                role: 0
            };
        }
    });

    return dataSource;
}

/**
 * Usable records for testing: [ 392, 393, 395, 396 ]
 */
async function spotRecordsUsableForTesting() {
    const files: string[] = await new Promise((resolve, reject) => {
        fs.readdir(recordsDir, (error, files) => {
            if (error == null) {
                resolve(files);
            } else {
                reject(error);
            }
        });
    });

    console.log(`Found ${files.length} record files:`, files);

    const usableRecords = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const gameId = parseInt(file.split('.')[0]);

        if (isNaN(gameId)) {
            continue;
        }

        const comparisonPath = `${backupDir}/${gameId}.json`;

        if (!fs.existsSync(comparisonPath)) {
            console.log(`No comparison file found for game ${gameId}, skipping ...`);
            continue;
        }

        const backup = JSON.parse(fs.readFileSync(comparisonPath, 'utf-8'));

        if (backup.parameters.game_type !== 'goods-market') {
            console.log(`Game ${gameId} is not of type 'goods-market' (it is ${backup.parameters.game_type}), skipping ...`);
            continue;
        }

        usableRecords.push(gameId);
    }

    return usableRecords;
}

async function playOne(gameId: number, dataSource?: any) {
    console.log(`Found! `, gameId);

    const recordPath = `${recordsDir}/${gameId}.log.json`;
    const backupPath = `${backupDir}/${gameId}.json`;

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    if (backup.parameters.game_type !== 'goods-market') {
        console.log(`Game ${gameId} is not of type 'goods-market' (it is ${backup.parameters.game_type}), skipping ...`);
        return;
    }

    console.log(`Found! ${gameId}`, backup.parameters.game_type);

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

    return results;
}

function compareResults(gameId: number, actual: any) {
    const backupPath = `${backupDir}/${gameId}.json`;

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    assert.equal(actual[1].phase[2].profits.length, backup.results[1].phase[2].profits.length);

    actual[1].phase[2].profits.forEach((profit: any) => {
        const comparison = backup.results[1].phase[2].profits.find((p: any) => p.number === profit.number);

        console.log(profit);
        console.log(comparison);

        assert.equal(profit.profit, comparison.profit, `Mismatch in profits for player ${profit.number}: actual ${profit.profit} vs backup ${comparison.profit}`);
        assert.deepEqual(profit.signals, comparison.signals, `Mismatch in signals for player ${profit.number}`);

        assert.equal(profit.initialWallet.cash, comparison.initialWallet.cash, `Mismatch in initialWallet for player ${profit.number}`);
        assert.equal(profit.initialWallet.goods.length, comparison.initialWallet.goods.length, `Mismatch in initialWallet for player ${profit.number}`);
        assert.equal(
            profit.initialWallet.goods.filter(g => g.quality === 'good').length,
            comparison.initialWallet.goods.filter(g => g.quality === 'good').length,
            `Mismatch in initialWallet for player ${profit.number}`
        );
        assert.equal(
            profit.initialWallet.goods.filter(g => g.quality === 'bad').length,
            comparison.initialWallet.goods.filter(g => g.quality === 'bad').length,
            `Mismatch in initialWallet for player ${profit.number}`
        );

        assert.equal(profit.finalWallet.cash, comparison.finalWallet.cash, `Mismatch in finalWallet for player ${profit.number}`);
        assert.equal(profit.finalWallet.goods.length, comparison.finalWallet.goods.length, `Mismatch in finalWallet for player ${profit.number}`);
        assert.equal(
            profit.finalWallet.goods.filter(g => g.quality === 'good').length,
            comparison.finalWallet.goods.filter(g => g.quality === 'good').length,
            `Mismatch in finalWallet for player ${profit.number}`
        );
        assert.equal(
            profit.finalWallet.goods.filter(g => g.quality === 'bad').length,
            comparison.finalWallet.goods.filter(g => g.quality === 'bad').length,
            `Mismatch in finalWallet for player ${profit.number}`
        );
    });
}

const gid = 392;

async function execute(id: number) {
    try {
        SimulationService.init();

        const dataSource = await generateDataSourceForGame(id);

        console.log(`Data source for game ${id}:`, dataSource);

        const results = await playOne(id, dataSource);

        console.log(`Results for game ${id}.0:`, results[1].phase[0]);
        console.log(`Results for game ${id}.1:`, results[1].phase[1]);
        console.log(`Results for game ${id}.2:`, results[1].phase[2].profits);

        compareResults(id, results);

        console.log(`Game ${id} results match the backup.`);

        await SimulationService.kill();
    } catch (error) {
        console.error(`Error occurred while playing game ${id}: ${error.message}`);
    }
}

describe("GoodsMarket Games", async function () {
    it(`GoodsMarket 393`, async function () {
        await execute(393);
    });

    it(`GoodsMarket 395`, async function () {
        await execute(395);
    });

    it(`GoodsMarket 396`, async function () {
        await execute(396);
    });
});
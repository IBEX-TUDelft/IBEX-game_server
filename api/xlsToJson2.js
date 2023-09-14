'use strict';

import fs from 'fs';
import XLSX from 'xlsx';

const consonants = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M','N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function numberToCell(row, column) {
    if (row < 26) {
        return consonants[row] + '' + column;
    } else {
        return consonants[Math.floor(row / 26) - 1] + '' + consonants[Math.floor(row % 26)] + '' + column;
    }
}

(() => {
    const workbook = XLSX.readFile('resources/Distributions_new_analysisSR-speculators15-06.xlsx');

    function tabToCellValue(row, column, tab) {
        const cellId = numberToCell(row, column);
    
        const cell = workbook.Sheets[tab][cellId];

        if (cell == null) {
            throw new Error(`Cell ${row},${column} (${cellId}) not found`);
        }

        if (cell.v == null) {
            throw new Error(`Cell ${row},${column} (${cellId}) is empty`);
        }
    
        if (typeof cell.v != 'number') {
            throw new Error(`Cell ${row},${column} (${cellId}) is a ${typeof cell.v}, not a number: ${cell.v}`);
        }
        
        return cell.v;
    }

    function signalToCellValue(row, column) {
        return Math.round(1000 * tabToCellValue(row, column, 'signals'));
    }

    function distributionToCellValue(row, column) {
        return Math.round(tabToCellValue(row, column, 'distributions'));
    }

    let draws = 0;

    const sessions = [];

    const initialOffset = 1;
    const developerOffset = 6;
    const ownerOffset = 7;
    const sniperOffset = 12;

    let counter = 1;

    for (let s = 1; s <= 11; s++) {
        const sessionOffset = initialOffset + (s - 1) * 9 * 6;

        const sx = {
            "id": s,
            "rounds": []
        }

        sessions.push(sx);

        for (let r = 0; r <= 5; r ++) {
            sx.rounds.push({
                "signals": [
                    {
                        "speculator": [],
                        "developer": null,
                        "owner": []
                    },
                    {
                        "speculator": [],
                        "developer": null,
                        "owner": []
                    }
                ],
                "values": [
                    {
                        "developer": null,
                        "owner": []
                    }, {
                        "developer": null,
                        "owner": []
                    }
                ]
            });
        }

        for (let r = 0; r <= 5; r ++) {
            //console.log(`Values New round: ${s}:${r}`);
        }

        for (let r = 0; r <= 5; r ++) {
            //console.log(`Signals New round: ${s}:${r}`);

            const rx = sx.rounds[r];

            const valueRoundOffset = 2 + (s - 1) * 9 * 6 + r * 9;

            console.log(counter + `) Round ${s}.${r} offset: ` + valueRoundOffset + ` (${numberToCell(valueRoundOffset, 1)})`);
            counter++;

            //Values
            rx.values[0].developer = distributionToCellValue(valueRoundOffset, 35);

            for (let p = 0; p < 5; p++) {
                rx.values[0].owner.push(distributionToCellValue(valueRoundOffset, 36 + p));
            }

            rx.values[1].developer = distributionToCellValue(valueRoundOffset + 1, 35);

            for (let p = 0; p < 5; p++) {
                rx.values[1].owner.push(distributionToCellValue(valueRoundOffset + 1, 36 + p));
            }
        }

        for (let r = 0; r <= 5; r ++) {
            const roundOffset = sessionOffset + r * 9;
        
            //console.log(counter + `) Round ${s}.${r} offset: ` + roundOffset + ` (${numberToCell(roundOffset, 1)})`);
            //counter++;

            const rx = sx.rounds[r];

            //Signals
            rx.signals[0].developer = signalToCellValue(roundOffset + 2, developerOffset);

            //console.log(`Developer No Project: ${signalToCellValue(roundOffset + 2, developerOffset)}`)

            for (let p = 0; p < 5; p++) {
                rx.signals[0].owner.push(signalToCellValue(roundOffset + 2, ownerOffset + p));
            }

            for (let p = 0; p < 6; p++) {
                rx.signals[0].speculator.push(signalToCellValue(roundOffset + 2, sniperOffset + p));
            }

            rx.signals[1].developer = signalToCellValue(roundOffset + 3, developerOffset);

            for (let p = 0; p < 5; p++) {
                rx.signals[1].owner.push(signalToCellValue(roundOffset + 3, ownerOffset + p));
            }

            for (let p = 0; p < 6; p++) {
                rx.signals[1].speculator.push(signalToCellValue(roundOffset + 3, sniperOffset + p));
            }

            //sx.rounds.push(rx);
        }
    }

    console.log(sessions);
    console.log(sessions[0].rounds[0]);

    console.log(`Draws: ${draws}`);

    let data = JSON.stringify(sessions);
    fs.writeFileSync('resources/sessions.json', data);
}) ();
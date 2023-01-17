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
    const workbook = XLSX.readFile('resources/Distributions_23Jan13-ValuesOnly.xlsm');

    let session = 0;
    let round = 0;

    let draws = 0;

    const sessions = [];

    let sx = {
        "id": session + 1,
        "rounds": []
    }

    while (true) {
        let complete = false;

        const rx = {
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
        }

        for (let i = 1; i <= 4; i++) {
            for (let j = 6; j <= 17; j++) {
                const cellId = numberToCell(session * 36 + round * 6 + i, j);

                const cell = workbook.Sheets['Signals Latest '][cellId];

                if (j < 12 && (cell == null || cell.v == null || typeof cell.v != 'number')) {
                    complete = true;
                    break;
                }

                if (cell == null || cell.v == null || typeof cell.v != 'number') {
                    continue;
                }

                const value = cell.v;

                if (i === 1) {
                    if (j == 6) {
                        rx.values[0].developer = Math.round(value);
                    } else if (j > 6 && j <= 11) {
                        rx.values[0].owner.push(Math.round(value));
                    }
                } else if (i === 2) {
                    if (j == 6) {
                        rx.values[1].developer = Math.round(value);
                    } else if (j > 6 && j <= 11) {
                        rx.values[1].owner.push(Math.round(value));
                    }
                } else if (i === 3) {
                    if (j == 6) {
                        rx.signals[0].developer = Math.round(value * 1000);
                    } else if (j > 6 && j <= 11) {
                        rx.signals[0].owner.push(Math.round(value * 1000));
                    } else if (j > 11 && j <= 17) {
                        rx.signals[0].speculator.push(Math.round(value * 1000));
                    }
                } else if (i === 4) {
                    if (j == 6) {
                        rx.signals[1].developer = Math.round(value * 1000);
                    } else if (j > 6 && j <= 11) {
                        rx.signals[1].owner.push(Math.round(value * 1000));
                    } else if (j > 11 && j <= 17) {
                        rx.signals[1].speculator.push(Math.round(value * 1000));
                    }
                }
            }

            if (complete === true) {
                break;
            }
        }

        if (complete === true) {
            break;
        }

        sx.rounds.push(rx);

        round ++;
        draws++;

        if (round === 6) {
            round = 0;
            session ++;

            sessions.push(sx);

            sx = {
                "id": session + 1,
                "rounds": []
            }
        }
    }

    console.log(sessions[0].rounds);

    console.log(`Draws: ${draws}`);

    let data = JSON.stringify(sessions);
    fs.writeFileSync('resources/sessions.json', data);
}) ();
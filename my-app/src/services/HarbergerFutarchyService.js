import XLSX from 'xlsx';
import axios from "axios";
import * as UtilityService from './UtilityService';
/*import he from 'he';*/

const http = axios.create({
  baseURL: process.env.VUE_APP_API,
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

export async function downloadAll(id) {
    let data = await loadWideExcelData(id);
    await downloadWideExcel(data);

    data = await loadMarketLogData(id);
    await downloadMarketLog(data);

    data = await loadSurveyData(id);
    await downloadSurveys(data);
}

export async function downloadWideExcel(data) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    xls.push([
        'session', 'dataset', 'players.number', 'round', 'players.tag', 'players.role', 'ruleset', 'Value_noProject', 'Value_projectA',
        'Declaration1_noProject', 'Declaration1_projectA', 'Taxes1_noProject', 'Taxes1_projectA', 'Declaration1_acted', 'Project Realized', '',
        'Signal_PublicNP', 'sig_pubP', 'SigPrivateNP', 'SigPrivateP', '',
        'snipe1_TNP_owner1', 'snipe1_TNP_owner2', 'snipe1_TNP_owner3', 'snipe1_TNP_owner4', 'snipe1_TNP_owner5', 'snipe1_TNP_dev', '',
        'snipe1_TP_owner1', 'snipe1_TP_owner2', 'snipe1_TP_owner3', 'snipe1_TP_owner4', 'snipe1_TP_owner5', 'snipe1_TP_dev', '',
        'Dec1_Owner1_NP', 'Dec1_Owner2_NP', 'Dec1_Owner3_NP', 'Dec1_Owner4_NP', 'Dec1_Owner5_NP', 'Dec1_Dev_NP', '',
        'Dec1_Owner1_P', 'Dec1_Owner2_P', 'Dec1_Owner3_P', 'Dec1_Owner4_P', 'Dec1_Owner5_P', 'Dec1_Dev_P', '',
        'snipe1_TNP_owner1_result', 'snipe1_TNP_owner2_result', 'snipe1_TNP_owner3_result', 'snipe1_TNP_owner4_result', 'snipe1_TNP_owner5_result', 'snipe1_TNP_dev_result', '',
        'snipe1_TP_owner1_result', 'snipe1_TP_owner2_result', 'snipe1_TP_owner3_result', 'snipe1_TP_owner4_result', 'snipe1_TP_owner5_result', 'snipe1_TP_dev_result', '',
        'Declaration2_Outcome',	'Taxes2_Outcome', 'Declaration2_acted', '',
        'snipe2_TO_owner1', 'snipe2_TO_owner2',	'snipe2_TO_owner3', 'snipe2_TO_owner4', 'snipe2_TO_owner5', 'snipe2_TO_dev', '',
        'Dec2_Owner1_O', 'Dec2_Owner2_O', 'Dec2_Owner3_O', 'Dec2_Owner4_O', 'Dec2_Owner5_O', 'Dec2_Dev_O', '',
        'snipe2_TO_owner1_result', 'snipe2_TO_owner2_result', 'snipe2_TO_owner3_result', 'snipe2_TO_owner4_result', 'snipe2_TO_owner5_result', 'snipe2_TO_dev_result', '',
        'Num_Bids_NP', 'Num_Asks_NP', 'Num_Buys_NP', 'Num_Sells_NP', 'Ending_Cash_NP', 'Ending_Shares_NP', 'median_price_NP', 'realized_value_shares_NP', '',
        'Num_Bids_P', 'Num_Asks_P', 'Num_Buys_P', 'Num_Sells_P', 'Ending_Cash_P', 'Ending_Shares_P', 'median_price_P', 'realized_value_shares_P', '',
        'snipe1_end_result', 'Property Value_min_Tax1', 'Trading_Result', 'snipe2_end_results', 'Property Value_min_Tax2', 'Total Earnings',
        'reward_round', 'base_points', 'points', 'final_score', 'factor', 'exchange_rate', 'reward', 'Payment_Token',
        'Age', 'Gender', 'Year_of_Study', 'Faculty', 'Risk_Choice'
    ]);                

    const ownerNumbers = [null, null, null, null, null, null];

    data.players.forEach(p => {
        if (p.role === 1) {
            return;
        }

        if (p.role === 3) {
            const index = parseInt(p.tag.split(' ')[1]);

            ownerNumbers[index - 1] = p.number;
        } else if (p.role === 2) {
            ownerNumbers[5] = p.number;
        }
    });

    data.rounds.forEach(round => {
        try {
        const roundIdx = round.round;

        const winningCondition = data.winningCondition[roundIdx];

        data.players.forEach(player => {
            const xlsRow = [data.startTime,data.dataset,player.number,round.round, player.tag, player.role, data.ruleset];

            const firstDeclaration = data.firstDeclarations[roundIdx].find(d => d.player === player.number);
            
            data.conditions.forEach((c) => { //Values
                if (firstDeclaration == null) {
                    xlsRow.push(null);
                    return;
                }

                xlsRow.push(firstDeclaration.value[c.id]);
            });

            data.conditions.forEach((c) => { //First declarations
                if (firstDeclaration == null) {
                    xlsRow.push(null);
                    return;
                }

                xlsRow.push(firstDeclaration.declaration[c.id]);
            });

            data.conditions.forEach((c) => { //Taxes
                if (firstDeclaration == null) {
                    xlsRow.push(null);
                    return;
                }

                xlsRow.push(firstDeclaration.taxes[c.id]);
            });

            if (firstDeclaration != null) {
                xlsRow.push(firstDeclaration.declared === true ? 'Yes' : 'No'); //Pressed 'Declare' button
            } else {
                xlsRow.push(null);
            }

            //xlsRow.push(data.conditions[winningCondition].key); //outcome
            xlsRow.push(winningCondition === 1 ? "Yes" : "No"); //outcome

            xlsRow.push(null);

            data.conditions.forEach((c) => { //Public signals
                const publicSignals = data.signals[roundIdx].publicSignal;

                if (publicSignals == null) {
                    xlsRow.push(null);
                    return;
                }

                if (c.id === winningCondition || data.ruleset === 'Futarchy') {
                    xlsRow.push(publicSignals[c.id]);
                } else {
                    xlsRow.push(null);
                }
            });

            data.conditions.forEach((c) => { //Private signals
                const privateSignals = data.signals[roundIdx].privateSignals;

                if (privateSignals == null) {
                    xlsRow.push(null);
                    return;
                }

                xlsRow.push(privateSignals[player.number - 1][c.id]);
            });

            xlsRow.push(null);

            data.conditions.forEach((c) => {
                //First Sniping Attempts
                if (player.role != 1) {
                    xlsRow.push(null, null, null, null, null, null);
                } else {
                    ownerNumbers.forEach(on => {
                        if (on == null) {
                            xlsRow.push(null);
                            return;                                    
                        }

                        const snipe = data.rounds[roundIdx].phase[3].snipes.find(s => s.player === player.number)?.snipe[c.id];

                        if (snipe == null) {
                            xlsRow.push('N');
                            return;
                        }

                        xlsRow.push(!snipe.includes(on) ? 'N' : 'Y');
                    });
                }

                xlsRow.push(null);//End of First Sniping Attempts
            });

            data.conditions.forEach((c) => {
                //First Declarations
                if (player.role != 1) {
                    xlsRow.push(null, null, null, null, null, null);
                } else {
                    ownerNumbers.forEach(on => {
                        if (on == null) {
                            xlsRow.push(null);
                            return;
                        }

                        const decl = data.firstDeclarations[roundIdx].find(fd => fd.player === on);

                        if (decl == null) {
                            xlsRow.push(null);
                        } else {
                            xlsRow.push(decl.declaration[c.id]);
                        }
                    });
                }

                xlsRow.push(null);//End of First Declarations
            });

            data.conditions.forEach((c) => {
                //First Snipe Results
                if (player.role != 1) {
                    xlsRow.push(null, null, null, null, null, null);
                } else {
                    ownerNumbers.forEach(on => {
                        if (on == null) {
                            xlsRow.push(null);
                            return;
                        }

                        const result = data.firstSnipeResults[roundIdx].find(fd => fd.player.number === player.number && fd.target.number === on);

                        if (result == null) {
                            xlsRow.push(null);
                        } else {
                            if (c.id === winningCondition) {
                                xlsRow.push(result.profit);
                            } else {
                                xlsRow.push(null);
                            }
                        }
                    });
                }

                xlsRow.push(null);//End of First Snipe Results
            });

            //Second Declarations and Taxes
            const secondDeclaration = data.secondDeclarations[roundIdx].find(d => d.player === player.number);

            if (secondDeclaration == null) {
                xlsRow.push(null, null, null);
            } else {
                xlsRow.push(secondDeclaration.declaration[winningCondition]);
                xlsRow.push(secondDeclaration.taxes[winningCondition]);
                xlsRow.push(secondDeclaration.declared === true ? 'Yes' : 'No'); //Pressed 'Declare' buttons
            }//End pf Second Declarations and Taxes

            xlsRow.push(null);

            //Second Sniping Attempts
            if (player.role != 1) {
                xlsRow.push(null, null, null, null, null, null);
            } else {
                ownerNumbers.forEach(on => {
                    if (on == null) {
                        xlsRow.push(null);
                        return;                                    
                    }

                    const snipe = data.secondSnipes[roundIdx].find(fs => fs.player.number === player.number && fs.target.number === on);

                    if (snipe == null) {
                        xlsRow.push('N');
                        return;
                    }

                    xlsRow.push(snipe.snipes[winningCondition] == null || !snipe.snipes[winningCondition] ? 'N' : 'Y');
                });
            }

            xlsRow.push(null);//End of First Sniping Attempts

            //Second Declarations
            if (player.role != 1) {
                xlsRow.push(null, null, null, null, null, null);
            } else {
                ownerNumbers.forEach(on => {
                    if (on == null) {
                        xlsRow.push(null);
                        return;
                    }

                    const decl = data.secondDeclarations[roundIdx].find(fd => fd.player === on);

                    if (decl == null) {
                        xlsRow.push(null);
                    } else {
                        xlsRow.push(decl.declaration[winningCondition]);
                    }
                });
            }

            xlsRow.push(null);//End of Second Declarations

            //Second Snipe Results
            if (player.role != 1) {
                xlsRow.push(null, null, null, null, null, null);
            } else {
                ownerNumbers.forEach(on => {
                    if (on == null) {
                        xlsRow.push(null);
                        return;
                    }

                    const result = data.secondSnipeResults[roundIdx].find(fd => fd.player.number === player.number && fd.target.number === on);

                    if (result == null) {
                        xlsRow.push(null);
                    } else {
                        xlsRow.push(result.profit);
                    }
                });
            }

            xlsRow.push(null);//End of Second Snipe Results

            //Market Results
            data.conditions.forEach((c) => {
                const myActions = data.log[roundIdx][c.id]; //.filter(l => l.actor.number === player.number);

                xlsRow.push(myActions.filter(a => a.action === 'added Buy' && a.actor.number === player.number).length);
                xlsRow.push(myActions.filter(a => a.action === 'added Sell' && a.actor.number === player.number).length);
                xlsRow.push(myActions.filter(a => a.buyer != null && a.buyer.number === player.number).length);
                xlsRow.push(myActions.filter(a => a.seller != null && a.seller.number === player.number).length);
                xlsRow.push(data.wallets[roundIdx].find(w => w.number === player.number).wallet[c.id].balance);
                xlsRow.push(data.wallets[roundIdx].find(w => w.number === player.number).wallet[c.id].shares);

                if (c.id === winningCondition) {
                    xlsRow.push(data.rounds[roundIdx].phase[6].finalPrices[c.id]);
                    xlsRow.push(data.rounds[roundIdx].phase[8].finalPrice); //TODO: should be the final price per condition
                } else {
                    xlsRow.push(null);
                    xlsRow.push(null);
                }
                
                xlsRow.push(null);
            });

            let firstSnipeResult;
            let firstTaxes;
            let tradingResult;
            let secondSnipeResult;
            let secondTaxes;

            const finalPrice = data.finalPrice[roundIdx];

            tradingResult = (data.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].balance - player.balance) +
            (data.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].shares - player.shares) * finalPrice

            const tradingSum = data.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].balance +
            data.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].shares * finalPrice

            //Aggregate Results
            if (player.role === 1) {
                firstSnipeResult = data.firstSnipeResults[roundIdx].filter(sr => sr.player.number === player.number && sr.profit != null)
                    .map(sr => sr.profit).reduce((a, b) => a + b, 0);
                firstTaxes = null; //Always for snipers
                secondSnipeResult = data.secondSnipeResults[roundIdx].filter(sr => sr.player.number === player.number && sr.profit != null)
                    .map(sr => sr.profit).reduce((a, b) => a + b, 0);
                secondTaxes = null; //Always for snipers
            } else if (player.role === 2 || player.role === 3) {
                firstSnipeResult = data.firstSnipeResults[roundIdx].filter(sr => sr.target.number === player.number && sr.profit != null)
                    .map(sr => sr.profit).reduce((a, b) => a - b, 0);
                firstTaxes = data.firstDeclarations[roundIdx].find(d => d.player === player.number).taxes[winningCondition];
                secondSnipeResult = data.secondSnipeResults[roundIdx].filter(sr => sr.target.number === player.number && sr.profit != null)
                    .map(sr => sr.profit).reduce((a, b) => a - b, 0);
                secondTaxes = data.secondDeclarations[roundIdx].find(d => d.player === player.number).taxes[winningCondition];
            }

            xlsRow.push(firstSnipeResult);

            if (player.role === 1) {
                xlsRow.push(null);
            } else {
                xlsRow.push(
                    data.firstDeclarations[roundIdx].find(fd => fd.player === player.number).value[winningCondition]
                    - firstTaxes
                );
            }

            xlsRow.push(tradingResult);
            xlsRow.push(secondSnipeResult);

            if (player.role === 1) {
                xlsRow.push(null);
            } else {
                xlsRow.push(
                    data.secondDeclarations[roundIdx].find(fd => fd.player === player.number).value[winningCondition]
                    - secondTaxes
                );
            }

            let total = 0;

            if (player.role != 1) {
                const value = data.firstDeclarations[roundIdx].find(d => d.player === player.number).value[winningCondition];
                total = value - firstTaxes - secondTaxes + firstSnipeResult + secondSnipeResult + tradingSum;
            } else {
                total = firstSnipeResult + secondSnipeResult + tradingSum;
            }

            xlsRow.push(total);

            xlsRow.push(data.rewardRound);

            if (data.rewards != null) {
                const playerReward = data.rewards.find(r => r.number === player.number);

                xlsRow.push(playerReward.basePoints);
                xlsRow.push(total); //xlsRow.push(playerReward.profit);
                xlsRow.push(total + playerReward.basePoints); //xlsRow.push(playerReward.points);
                xlsRow.push(playerReward.factor);
                xlsRow.push(playerReward.exchange);
                /*const gameRecalculatedRewad = Math.round(100 * (total + playerReward.basePoints) / playerReward.factor) / 100;
                xlsRow.push(gameRecalculatedRewad + playerReward.showupFee);*/
                if (roundIdx === data.rewardRound) {
                    xlsRow.push(playerReward.reward);
                } else {
                    xlsRow.push('');
                }
                //xlsRow.push(playerReward.reward);
            } else {
                xlsRow.push('', '', '', '', '', '', '');
            }

            xlsRow.push(player.paymentToken);

            const survey = data.surveys.find(s => s.number === player.number);

            xlsRow.push(survey?.age, survey?.gender, survey?.yearOfStudy, survey?.faculty, survey?.risk);
            
            xls.push(xlsRow);
        });
        } catch(e) {
            console.log(`Could not load the round: ${e.message}`);
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(xls);
    XLSX.utils.book_append_sheet(wb, ws, `Session`);

    XLSX.writeFile(wb, `${data.id}.analysis.xlsx`);
}

export async function downloadMarketLog(data) {
    const wb = XLSX.utils.book_new();

    data.indexes.forEach(index => {
        const xls = [];

        const headers = [
            'Time',
            'Phase',
            'Actor',
            'Action',
            'Quantity',
            'Price',
            'Buyer',
            'Seller',
            'Best Bid',
            'Best Ask',
            'Book'
        ];

        if (data.ruleset === 'Harberger') {
            xls.push(headers);

            data.marketLogs[index][data.winningConditions[index]].forEach(r => {
                xls.push([
                    r.time,

                    r.phase,
                    getPlayer(data, r.actor.number, r.actor.role),
                    r.action,
                    r.quantity,
                    r.price,
                    r.buyer == null ? '' : getPlayer(data, r.buyer.number, r.buyer.role),
                    r.seller == null ? '' : getPlayer(data, r.seller.number, r.seller.role),
                    r.bestBid,
                    r.bestAsk,
                    r.book
                ]);
            });
        } else if (data.ruleset === 'Futarchy') {
            headers.push('Condition');

            xls.push(headers);

            data.marketLogs[index].forEach((m, i) => {
                if (i + 1 > data.conditions.length) {
                    return;
                }

                m.forEach(r => {
                    xls.push([
                        r.time,
                        r.phase,
                        getPlayer(data, r.actor.number, r.actor.role),
                        r.action,
                        r.quantity,
                        r.price,
                        r.buyer == null ? '' : getPlayer(data, r.buyer.number, r.buyer.role),
                        r.seller == null ? '' : getPlayer(data, r.seller.number, r.seller.role),
                        r.bestBid,
                        r.bestAsk,
                        r.book,
                        data.conditions[i].name
                    ]);
                });
            });
        }

        /* convert state to workbook */
        const ws = XLSX.utils.aoa_to_sheet(xls);
        XLSX.utils.book_append_sheet(wb, ws, `Round ${index}`);
    });

    /* generate file and send to client */
    XLSX.writeFile(wb, `${data.id}.market-log.xlsx`);
}

export async function downloadSurveys(data) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    xls.push([
        'Player',
        'Role',
        'Age',
        'Gender',
        'Year of Study',
        'Faculty',
        'Risk'
    ]);

    data.records.forEach(record => {
        xls.push([
            record.number,
            record.tag,
            record.age,
            record.gender,
            record.yearOfStudy,
            record.faculty,
            record.risk
        ]);
    });

    /* convert state to workbook */
    const ws = XLSX.utils.aoa_to_sheet(xls);
    XLSX.utils.book_append_sheet(wb, ws, `Surveys`);

    /* generate file and send to client */
    XLSX.writeFile(wb, `${data.id}.surveys.xlsx`);
}

export async function loadWideExcelData(id) {
    const data = {
        "id": id
    }

    const token = localStorage.getItem("token");

    const response = await http.get("/games/data", {
        params: {
            token,
            game_id: id
        }
    });

    const surveyResponse = await http.get("/games/surveys", {
        params: {
            token,
            game_id: id
        }
    });

    data.surveys = surveyResponse.data.data.records;

    data.dataset = response.data.data.dataset;
    data.rewardRound = response.data.data.rewardRound;
    data.rounds = response.data.data.results;
    data.ruleset = response.data.data.ruleset;
    data.players = response.data.data.players;
    data.conditions = response.data.data.conditions;
    data.startTime = response.data.data.startTime;
    data.rewards = response.data.data.rewards;

    data.firstDeclarations = UtilityService.extractProperty(data.rounds, 2, 'declarations');
    data.signals = UtilityService.extractProperty(data.rounds, 5, 'signals');
    data.secondDeclarations = UtilityService.extractProperty(data.rounds, 7, 'declarations');
    data.secondSnipes = UtilityService.extractProperty(data.rounds, 8, 'snipes');
    data.secondSnipeResults = UtilityService.extractProperty(data.rounds, 8, 'snipeOutcomes');
    data.log = UtilityService.extractProperty(data.rounds, 6, 'log');
    data.wallets = UtilityService.extractProperty(data.rounds, 6, 'wallets');
    data.finalPrices = UtilityService.extractProperty(data.rounds, 6, 'finalPrices');
    data.cashForSniping = UtilityService.extractProperty(data.rounds, 8, 'cashForSniping');
    data.finalPrice = UtilityService.extractProperty(data.rounds, 8, 'finalPrice');

    if (data.ruleset == 'Harberger') {
        data.winningCondition = UtilityService.extractProperty(data.rounds, 3, 'winningCondition');
        data.firstSnipes = UtilityService.extractProperty(data.rounds, 4, 'snipes');
        data.firstSnipeResults = UtilityService.extractProperty(data.rounds, 4, 'snipeOutcomes');
    } else {
        data.winningCondition = UtilityService.extractProperty(data.rounds, 6, 'winningCondition');
        data.firstSnipes = UtilityService.extractProperty(data.rounds, 6, 'snipes');
        data.firstSnipeResults = UtilityService.extractProperty(data.rounds, 6, 'snipeOutcomes');
    }

    if (data.winningCondition[0] != null) {
        data.indexes = data.rounds.map(r => r.round);    
    } else {
        data.indexes = data.rounds.filter(r => r.round > 0).map(r => r.round);
    }

    return data;
}

export async function loadMarketLogData(id) {
    const data = {
        "id": id
    }

    const token = localStorage.getItem("token");

    const response = await http.get("/games/market-log", {
        params: {
            token,
            game_id: id
        }
    });

    data.players = response.data.data.players;
    data.ruleset = response.data.data.ruleset;
    data.marketLogs = response.data.data.marketLogs;
    data.marketLogs.forEach(round => {
        round.forEach(condition => {
            condition.forEach((e, i) => {
                e.id = i;
            })
        });
    });
    data.indexes = data.marketLogs.map((e, i) => i);
    data.winningConditions = response.data.data.winningConditions;
    data.conditions = response.data.data.conditions;

    return data;
}

function getPlayer(data, number) {
    if (number == null) {
        return 'n/a';
    }

    return data.players.find(p => p.number === number).tag;
}

export async function loadSurveyData(id) {
    const token = localStorage.getItem("token");

    const response = await http.get("/games/surveys", {
        params: {
            token,
            game_id: id
        }
    });

    return {
        "id": id,
        "ruleset": response.data.data.ruleset,
        "records": response.data.data.records
    }
}
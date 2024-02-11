import XLSX from 'xlsx';
import axios from "axios";
import * as UtilityService from './UtilityService';
import he from 'he';

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

    data = await loadChatLogData(id);
    await downloadChatLog(data);

    data = await loadSurveyData(id);
    await downloadSurveys(data);
}

export async function downloadWideExcel(data) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    xls.push([
        'session', 'dataset' ,'players.number', 'round', 'players.tag', 'players.role', 'ruleset', 'Value_noProject', 'Value_projectA',
        '', 'Compensation_Req', 'Request_Submitted','Compensation_Offer', 'Offer_Submitted', 'Compens_Delta', 'Vote', 'Num_Votes_for project', 'Total Value',
        'Project Realized', 'Optimal_Outcome', 'Reward Round', 'Base Points', 'Points', 'Final Score', 'Factor', 'Exchange Rate', 'Reward', 'Payment_Token',
        'Age', 'Gender', 'Year_of_Study', 'Faculty', 'Risk_Choice'
    ]);                

    data.rounds.forEach(round => {
        try {
            const roundNr = round.round;
            const winningCondition = getWinningCondition(data.winningCondition, round.round);
            
            const conditionTotals = [];

            data.players.forEach(player => {
                data.conditions.forEach((c, i) => {
                    if (conditionTotals[i] == null) {
                        conditionTotals[i] = 0;
                    }

                    const values = getPlayerValues(data.playerValues, player.number, round.round);

                    console.log(values[i]);

                    conditionTotals[i] += values[i];
                });
            });

            let max = 0;
            let bestConditions = [];

            conditionTotals.forEach((ct, i) => {
                if (ct < max) {
                    return;
                } else if (ct === max) {
                    bestConditions.push(i);
                } else {
                    bestConditions = [i];
                    max = ct;
                }
            })

            console.log('Condition totals: ');
            console.log(conditionTotals);
            console.log('Best conditions: ');
            console.log(bestConditions);
            console.log('Value: ' + max);

            data.players.forEach(player => {
                const values = getPlayerValues(data.playerValues, player.number, round.round);
                let compensationReq = UtilityService.extractDataFromObject(data.compensationRequests[roundNr].find(cr => cr.number === player.number), 'compensationRequests', 1);

                let requestSubmitted = player.role === 3 ? 'Yes' : '';

                console.log(`Player ${player.number} (${player.role}): `);
                console.log(compensationReq);

                if (compensationReq == null && player.role === 3) {
                    compensationReq = 0;
                    requestSubmitted = 'No';
                }

                const compensationOffer = data.compensationOffers[roundNr][1];
                const compensationOfferNumber = isNaN(parseInt(compensationOffer)) ? 0 : parseInt(compensationOffer);

                //const requestSubmitted = player.role != 2 ? (isNaN(parseInt(compensationReq)) ? 'No' : 'Yes') : '';
                const compensationReqNumber = isNaN(parseInt(compensationReq)) ? 0 : parseInt(compensationReq);
                const compensationDelta = player.role != 2 ? (compensationOfferNumber - compensationReqNumber) : '';
                const offerSubmitted = player.role === 2 ? (isNaN(parseInt(compensationOffer)) ? 'No' : 'Yes') : '';

                let total = values[winningCondition];

                let compensationOfferWinningCondition = 0;

                if (
                        data.compensationOffers != null &&
                        data.compensationOffers[roundNr] != null &&
                        data.compensationOffers[roundNr][winningCondition] != null &&
                        !isNaN(parseInt(data.compensationOffers[roundNr][winningCondition]))
                ) {
                    compensationOfferWinningCondition = parseInt(data.compensationOffers[roundNr][winningCondition]);
                }

                if (player.role === 2) {
                    total -= data.players.filter(p => p.role === 3).length * compensationOfferWinningCondition;
                } else {
                    total += compensationOfferWinningCondition;
                }

                let playerReward;

                if (data.rewards != null) {
                    playerReward = data.rewards.find(r => r.number === player.number);
                }

                const survey = data.surveys.find(s => s.number === player.number);

                const value = data.rounds[round.round].phase[1].players
                    .find(p => p.number === player.number)
                    .values[data.rounds[round.round].phase[7].winningCondition];
                
                const points = value + (playerReward != null ? playerReward.basePoints : 0);

                xls.push([data.startTime,data.dataset,player.number,round.round, player.tag, player.role, data.ruleset, values[0], values[1],
                '',compensationReq, requestSubmitted, compensationOfferNumber, offerSubmitted, compensationDelta, getCompensationAccepted(data.players, data.compensationDecisions, round.round, player.number, 1),
                getStandingCounter(data.standings, round.round, 1), total, winningCondition === 1 ? 'Yes' : 'No', bestConditions.includes(winningCondition) ? 'Yes' : 'No', data.rewardRound,
                playerReward?.basePoints, value, points, playerReward?.factor, playerReward?.exchange, round.round === playerReward?.round ? playerReward?.reward : ''
                , player.paymentToken, survey?.age, survey?.gender, survey?.yearOfStudy, survey?.faculty, survey?.risk
                ]);
            });
        } catch (e) {
            console.log(`Couldn't process round: ${e.message}`);
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(xls);
    XLSX.utils.book_append_sheet(wb, ws, `Session`);

    XLSX.writeFile(wb, `${data.id}.analysis.xlsx`);
}

export async function downloadChatLog(data) {
    const wb = XLSX.utils.book_new();

    data.rounds.forEach(round => {
        const xls = [];

        xls.push([
            'People',
            'Message'
        ]);

        data.chatLog[round.round].forEach(message => {
            xls.push([
                [message.sender, ...message.to]
                    .sort((a,b,) => a - b)
                    .map(number => data.players.find(p => p.number === number).tag)
                    .join(','),
                    he.decode(message.text)
            ]);
        });

        /* convert state to workbook */
        const ws = XLSX.utils.aoa_to_sheet(xls);
        XLSX.utils.book_append_sheet(wb, ws, `Round ${round.round}`);
    });

    /* generate file and send to client */
    XLSX.writeFile(wb, `${data.id}.game-chat.xlsx`);
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
    const data = {};

    const token = localStorage.getItem("token");

    data.id = id;

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

    data.rewardRound = response.data.data.rewardRound;
    data.ruleset = response.data.data.ruleset;
    data.surveys = surveyResponse.data.data.records;

    data.ruleset = response.data.data.ruleset;
    data.dataset = response.data.data.dataset;
    data.conditions = response.data.data.conditions;
    data.players = response.data.data.players;
    data.rounds = response.data.data.results;
    data.startTime = response.data.data.startTime;
    data.rewards = response.data.data.rewards;
    
    data.playerValues = UtilityService.extractProperty(data.rounds, 1, 'players');
    data.compensationRequests = UtilityService.extractProperty(data.rounds, 3, 'compensationRequests');
    data.compensationOffers = UtilityService.extractProperty(data.rounds, 4, 'compensationOffers');
    data.compensationDecisions = UtilityService.extractProperty(data.rounds, 6, 'compensationDecisions');
    data.standings = UtilityService.extractProperty(data.rounds, 7, 'standings');
    data.winningCondition = UtilityService.extractProperty(data.rounds, 7, 'winningCondition');

    return data;
}

export async function loadChatLogData(id) {
    const token = localStorage.getItem("token");

    const response = await http.get("/games/chat-log", {
        params: {
            token,
            game_id: id
        }
    });

    const data = {
        "id": id
    };

    data.rounds = response.data.data.results;
    data.ruleset = response.data.data.ruleset;
    data.players = response.data.data.players;

    data.chatLog = extractChatLog(data.rounds);

    data.rounds.forEach(round => {
        if (round.phase == null || round.phase[2] == null) {
            return;
        }
        
        round.phase[2].chatLog.forEach(message => {
            const tags = [];

            data.players.forEach(p => {
                if (message.to.includes(p.number) || message.sender === p.number) {
                    tags.push(p.tag);
                }
            });

            message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
        });

        if (round.phase[5] == null) {
            return;
        }

        round.phase[5].chatLog.forEach(message => {
            const tags = [];

            data.players.forEach(p => {
                if (message.to.includes(p.number) || message.sender === p.number) {
                    tags.push(p.tag);
                }
            });

            message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
        });
    });

    return data;
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

function getPlayerValues(playerValues, playerNumber, roundNumber) {
    if (
        playerValues == null ||
        playerValues[roundNumber] == null
    ) {
        console.log(`WITH ROUND ${roundNumber} PLAYER ${playerNumber}`);
        return null;
    }

    return playerValues[roundNumber].find(p => p.number === playerNumber).values;
}

function getStandingCounter(standings, roundNumber, condition) {
    if (
        standings == null ||
        standings[roundNumber] == null ||
        standings[roundNumber][condition] == null
    ) {
        console.log(`WITH ROUND ${roundNumber} CONDITION ${condition}`);
        return null;
    }

    return standings[roundNumber][condition].counter;
}

function getWinningCondition(winningCondition, roundNumber) {
    return winningCondition[roundNumber];
}

function getCompensationAccepted(players, compensationDecisions, roundNumber, number, condition) {
    const player = players.find(p => p.number === number);

    if (player == null || player.role != 3) {
        return '';
    }

    const playerCompensationDecisions = compensationDecisions[roundNumber].find(acd => acd.number === number);

    if (playerCompensationDecisions == null || playerCompensationDecisions.compensationDecisions == null) {
        return 'Abs';
    }

    return playerCompensationDecisions.compensationDecisions.includes(condition) ? 'Yes' : 'No';
}

function extractChatLog (rounds) {
    const result = [];
    
    rounds.forEach(r => {
        const partial = [];

        [2,5].forEach((phase) => {
            if (r.phase[phase] == null) {
                return
            }

            partial.push(...r.phase[phase].chatLog);
        });

        result.push(partial);
    })
    

    return result;
}
import XLSX from 'xlsx';
import axios from "axios";
/*import * as UtilityService from './UtilityService';
import he from 'he';*/

const http = axios.create({
  baseURL: process.env.VUE_APP_API,
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

export async function downloadAll(id) {
    let data /*= await loadWideExcelData(id);
    await downloadWideExcel(data);

    data*/ = await loadMarketLogData(id);
    await downloadMarketLog(data);

    data = await loadSurveyData(id);
    await downloadSurveys(data);
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
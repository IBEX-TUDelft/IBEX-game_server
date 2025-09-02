import * as XLSX from 'xlsx';
import axios from "axios";
import dictionary from '../assets/market.json';

const http = axios.create({
    baseURL: process.env.VUE_APP_API,
    responseType: "json",
    headers: {
        Accept: "application/json"
    }
});

export async function downloadMarketLogByGameId(gameId) {
    const marketLog = await loadMarketLog(gameId);

    downloadMarketLog(gameId, marketLog);
}

export async function downloadMarketLog(gameId, marketLog) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    const headers = [
        'Time',
        'Round',
        'Actor',
        'Action',
        'Price',
        'Buyer',
        'Seller',
        'Best Bid',
        'Best Ask',
        'Book'
    ];

    xls.push(headers);

    marketLog.forEach(r => {
        xls.push([
            formatTimestamp(r.time),
            r.round,
            r.actor == null ? '' : r.actor.number,
            r.action,
            r.price,
            r.buyer == null ? '' : r.buyer.number,
            r.seller == null ? '' : r.seller.number,
            r.bestBid,
            r.bestAsk,
            r.book
        ]);
    });

    /* convert state to workbook */
    const ws = XLSX.utils.aoa_to_sheet(xls);
    XLSX.utils.book_append_sheet(wb, ws, `Round ${1}`);

    /* generate file and send to client */
    XLSX.writeFile(wb, `${gameId}.market-log.xlsx`);
}

export async function downloadResultsByGameId(gameId) {
    const response = await loadResults(gameId);

    console.log('Results:', response);
    
    return await downloadResults(gameId, response.results, response.players, response.realValue);
}

export async function downloadResults(gameId, results, players, realValue) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    const headers = [
        "ID",
        "Knows",
        "Private Signal",
        "Public Signal",
        "Real Value",
        "Cash",
        "Shares",
        "Total",
        "Profit"
    ];

    xls.push(headers);

    players.forEach(player => {
        xls.push([
            player.number,
            ["All (Admin)", "All", "Private", "Public", "Nothing"][player.role],
            player.signal,
            results.phase[0].publicSignal,
            realValue,
            player.wallet.balance,
            player.wallet.shares,
            (player.wallet.balance + player.wallet.shares * realValue).toFixed(2),
            results.phase[2].profits.find(p => p.number === player.number)?.profit
        ]);
    });

    /* convert state to workbook */
    const ws = XLSX.utils.aoa_to_sheet(xls);
    XLSX.utils.book_append_sheet(wb, ws, `Round ${1}`);

    /* generate file and send to client */
    XLSX.writeFile(wb, `${gameId}.results.xlsx`);
}

export async function downloadAll(gameId) {
    await downloadResultsByGameId(gameId);
    await downloadMarketLogByGameId(gameId);
}

export async function loadResults(gameId) {
    try {
        const token = localStorage.getItem("token");

        const gameData = await http.get("/games/data", {
            params: {
                token,
                game_id: gameId
            }
        });

        return {
            "players": gameData.data.data.players,
            "results": gameData.data.data.results[1],
            "realValue": gameData.data.data.realValue
        };
    } catch (error) {
        console.error("Error loading results:", error);
        throw error;
    }
}

export async function loadMarketLog(gameId) {
    try {
        const token = localStorage.getItem("token");

        const response = await http.get("games/market/market-log", {
            params: {
                token,
                game_id: gameId
            }
        });

        return response.data.data.marketLog;
    } catch (error) {
        console.error("Error loading market log:", error);
        throw error;
    }
}

export function formatTimestamp(timestamp) {
    if (timestamp == null || typeof timestamp != 'number') {
        return timestamp;
    }

    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }

    return new Date(timestamp).toLocaleString(dictionary.parameters.format, options);
}
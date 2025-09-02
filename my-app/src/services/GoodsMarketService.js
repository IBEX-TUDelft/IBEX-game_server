import * as XLSX from 'xlsx';
import axios from "axios";
import dictionary from '../assets/goods-market.json';

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
    const results = await loadResults(gameId);

    return await downloadResults(gameId, results);
}

export async function downloadResults(gameId, results) {
    const wb = XLSX.utils.book_new();

    const xls = [];

    const headers = [
        "Player",
        "High Quality Good Value per Unit",
        "Low Quality Good Value per Unit",
        "Initial Cash",
        "Initial High Quality Goods",
        "Initial Low Quality Goods",
        "Initial Total",
        "Final Cash",
        "Final High Quality Goods",
        "Final Low Quality Goods",
        "Final Total",
        "Profit"
    ];

    xls.push(headers);

    results.forEach(r => {
        xls.push([
            r.number,
            r.signals.highQualitySignal,
            r.signals.lowQualitySignal,
            r.initialWallet.cash,
            r.initialWallet.goods.filter(g => g.quality === 'good').length,
            r.initialWallet.goods.filter(g => g.quality === 'bad').length,
            getFinalWalletValue(r),
            r.finalWallet.cash,
            r.finalWallet.goods.filter(g => g.quality === 'good').length,
            r.finalWallet.goods.filter(g => g.quality === 'bad').length,
            getFinalWalletValue(r),
            getFinalWalletValue(r) - getInitialWalletValue(r)
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

export function getInitialWalletValue(result) {
    const wallet = result.initialWallet;

    let value = wallet.cash;

    value += wallet.goods.filter(g => g.quality === 'good').length * result.signals.highQualitySignal;
    value += wallet.goods.filter(g => g.quality === 'bad').length * result.signals.lowQualitySignal;

    return value.toFixed(2);
}

export function getFinalWalletValue(result) {
    const wallet = result.finalWallet;

    let value = wallet.cash;

    value += wallet.goods.filter(g => g.quality === 'good').length * result.signals.highQualitySignal;
    value += wallet.goods.filter(g => g.quality === 'bad').length * result.signals.lowQualitySignal;

    return value.toFixed(2);
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

        const players = gameData.data.data.players.filter(p => p.role != 0);

        const results = gameData.data.data.results[1].phase[2].profits.filter(profit => players.find(pl => pl.number === profit.number) != null);

        return results;
    } catch (error) {
        console.error("Error loading results:", error);
        throw error;
    }
}

export async function loadMarketLog(gameId) {
    try {
        const token = localStorage.getItem("token");

        const response = await http.get("games/goods-market/market-log", {
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
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

    data = await loadChatLogData(id);
    await downloadChatLog(data);

    data */= await loadSurveyData(id);
    await downloadSurveys(data);
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
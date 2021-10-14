import axios from "axios";

const http = axios.create({
    baseURL: process.env.VUE_APP_API,
    responseType: "json",
    headers: {
      Accept: "application/json"
    }
  });

export async function listGames() {
    const response = await http.get("/games/list");

    console.log('Response');
    console.log('--------');
    console.log(response.data.data);
    console.log('--------');

    return response.data.data;
}

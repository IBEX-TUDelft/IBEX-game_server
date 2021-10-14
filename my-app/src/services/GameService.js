import axios from "axios";

const http = axios.create({
    baseURL: process.env.VUE_APP_API,
    responseType: "json",
    headers: {
      Accept: "application/json"
    }
  });

export async function listGames() {
    const response = http.post("/games/list", this.login)
    //const response = await fetch('/api/v1/games/list');
    return await response.json();
}

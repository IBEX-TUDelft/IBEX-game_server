import axios from "axios";

const http = axios.create({
    baseURL: process.env.VUE_APP_API,
    responseType: "json",
    headers: {
      Accept: "application/json"
    }
  });

export async function listGames() {
    const token = localStorage.getItem("token");
    const response = await http.get("/games/list", {
        params: {
            token
        }
    });
    
    return response.data.data;
}

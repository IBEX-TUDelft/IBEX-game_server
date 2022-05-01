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

export async function createGame(gameParameters) {
  const token = localStorage.getItem("token");

  const parameters = {
    token,
    "gameParameters": gameParameters
  }

  const response = await http.post("/games/create", parameters);
  
  return response.data.data;
}

export async function getGameStatus(id, recovery) {
  const response = await http.get("/games/status", {
    params: {
        "id": id,
        "recovery": recovery
    }
  });

  return response.data.data;
}
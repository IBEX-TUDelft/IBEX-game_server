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

export async function saveTemplate(template) {
  const response = await http.post("/templates/push", template);

  return response.data.data;
}

export async function loadTemplateList(type) {
  const response = await http.get("/templates/list", {
    params: {
        "type": type
    }
  });

  return response.data.data;
}

export async function loadTemplate(id) {
  const response = await http.get("/templates/load", {
    params: {
        "id": id
    }
  });

  return response.data.data;
}

export async function sendSurvey(data) {
  const response = await http.post("/games/survey", data);

  return response.data.data;
}

export async function findSurveys(gameId) {
  const response = await http.get("/games/surveys", {
    params: {
        "id": gameId
    }
  });

  return response.data.data;
}

export async function joinMarketGame(gameId) {
  const token = localStorage.getItem("token");

  const response = await http.get("/games/market/join", {
    params: {
        "gameId": gameId,
        "token": token
    }
  });

  return response.data.data;
}
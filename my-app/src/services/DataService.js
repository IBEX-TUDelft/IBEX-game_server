import axios from "axios";

const http = axios.create({
  baseURL: process.env.VUE_APP_API,
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

export async function getSessions() {
    const token = localStorage.getItem("token");
    const response = await http.get("/resources/sessions", {
        params: {
            token
        }
    });
    
    return response.data.data;
}

export async function getSessionsCount() {
  const token = localStorage.getItem("token");
  const response = await http.get("/resources/session-count", {
      params: {
          token
      }
  });
  
  return response.data.data.count;
}
import axios from "axios";

const http = axios.create({
  baseURL: process.env.VUE_APP_API,
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

export async function listbackups() {
    const token = localStorage.getItem("token");

    const response = await http.get("/games/backups", {
        params: {
            token
        }
    });
    
    return response.data.data;
}

export async function restore(name) {
  const token = localStorage.getItem("token");

  const response = await http.get("/games/restore", {
    params: {
        token,
        "name": name
    }
  });

  return response.data.data;
}

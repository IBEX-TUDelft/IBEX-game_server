import axios from "axios";

const http = axios.create({
  baseURL: process.env.VUE_APP_API,
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

export async function listDatasets() {
    const token = localStorage.getItem("token");

    const response = await http.get("/simulation-datasets/list", {
        params: {
            token
        }
    });
    
    return response.data.data;
}

export async function play(name, title) {
  const token = localStorage.getItem("token");

  const response = await http.get("/simulation-datasets/play", {
    params: {
        token,
        "name": name,
        "title": title
    }
  });

  return response.data.data;
}

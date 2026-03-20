import axios from 'axios';
import endPoints from '../constants/endPoints';
import { store } from "../redux/store";

// setup base thing
const apiRequest = axios.create({
  baseURL: endPoints.baseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
    Connection: "keep-alive",
  },
  timeout: 10000,
});


apiRequest.interceptors.request.use(function (config) {
  // Do something before request is sent
  let headers = {
    ...store.getState().user.token
      ? {
        Authorization: 'Bearer ' + store.getState().user.token,
      }
      : {}
  }
  config.headers = headers;
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});

export default apiRequest;

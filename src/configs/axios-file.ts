/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const axiosFile = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // KHÔNG unwrap, luôn trả full response
  responseType: "blob",
  headers: { Accept: "*/*" },
  transformResponse: [(d) => d], // chặn mọi transform
});

// copy header Authorization/Refresh-Token/Device-Id từ localStorage nếu cần
axiosFile.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refresh_token");
  const deviceId = localStorage.getItem("device_id");
  if (token)        config.headers["Authorization"] = `Bearer ${token}`;
  if (refreshToken) config.headers["Refresh-Token"] = refreshToken;
  if (deviceId)     config.headers["Device-Id"] = deviceId;
  return config;
});

export default axiosFile;

import axios from "axios";

function normalizeBaseUrl(url) {
  if (!url) return url;
  // If url already starts with http(s) or protocol-relative //, return as-is
  if (/^https?:\/\//i.test(url) || /^\/\//.test(url)) return url;
  // Otherwise assume https and prefix it so axios treats it as absolute
  return `https://${url}`;
}

const rawUrl = import.meta.env.VITE_API_URL;
const baseURL = normalizeBaseUrl(rawUrl);

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

export default axiosInstance;
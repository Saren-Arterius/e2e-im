
import axios from 'axios';

let forceDev = false;
// Uncomment the line below to access the app locally
// forceDev = true; 
export const BASE_URL = forceDev || process.env.NODE_ENV !== 'production' ? 'http://localhost:31380' : 'https://e2e-im-api.wtako.net';

export const apiRequest = (path, postBody, auth, method, base = BASE_URL) => {
  return axios({
    method: method ? method : (postBody ? 'POST' : 'GET'),
    url: `${base}${path}`,
    headers: {"authorization": auth || ''},
    data: postBody
  });
};

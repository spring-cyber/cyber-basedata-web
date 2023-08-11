import { axios, API_URL, Axios } from 'cyber-web-ui';

export { API_URL };

// const axios = new Axios({
//   baseURL: API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

/**
 * @function 获取详情
 * @param {string} url 
 * @param {object} record 
 * @returns {object}
 */
export const queryDetail = (url, record) => {
  return new Promise(async (resolve) => {
    if(!record?.id) return resolve(record || {});
    try {
      let res = await axios.request({
        url: url,
        method: 'get',
        params: { id: record.id },
      });
      resolve(res.data);
    } catch(e) {
      console.log('e', e);
    }
  });
};

export default axios;

import { createVNode } from 'vue';
import { message, Input } from "ant-design-vue";
import { Modal, axios, API_URL } from 'cyber-web-ui';

export { API_URL };

// const axios = new Axios({
//   baseURL: API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

/**
 * @function 删除表格数据
 * @param {object} params 接口请求参数
 * @returns {promise}
 */
export const deleteAxios = ({ content = `确定要删除吗，删除后将无法恢复！` }, params) => {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: `系统提示`,
      icon: 'cyber-tishi',
      content: content,
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        return new Promise(async (resolve2, reject2) => {
          try {
            let res = await axios.request(params);
            message.success(res.message);
            resolve();
            resolve2();
          } catch(error) {
            console.log('error', error);
            reject2();
          }
        });
      },
      onCancel: () => {
        reject();
      }
    });
  });
};

/**
 * @function 删除表格数据
 * @param {object} params 接口请求参数
 * @returns {promise}
 */
export const batchOperateConfrim = (content = '确定要批量删除吗，删除后将无法恢复！', params) => {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: `系统提示`,
      icon: 'cyber-tishi',
      content: content,
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        return new Promise(async (resolve2, reject2) => {
          try {
            let res = await axios.request(params);
            message.success(res.message);
            resolve();
            resolve2();
          } catch(error) {
            console.log('error', error);
            reject2();
          }
        });
      },
      onCancel: () => {
        reject();
      }
    });
  });
};



/**
 * @function 删除表格确认
 * @param {<{ content: string, value: string }>} options content：提示内容，value: 应输入的内容
 * @param {object} params 接口请求参数
 * @returns {promise}
 */
export const deleteConfrim = ({ content = "确定要删除吗，输入“确定”进行删除，删除后将无法恢复！", value = "确定" }, params) => {
  return new Promise((resolve, reject) => {
    let currentValue = '';
    const inputRef = createVNode(Input, {
      onInput: ({ target }) => {
        currentValue = target.value;
      },
      class: 'warning-input',
    });
    Modal.confirm({
      title: `系统提示`,
      icon: 'cyber-tishi',
      content: createVNode('div', {}, [
        createVNode('div', {
          style: "margin-bottom: 12px"
        }, content),
        inputRef
      ]),
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        return new Promise(async (resolve2, reject2) => {
          if(currentValue == value) {
            try {
              let res = await axios.request(params);
              message.success(res.message);
              resolve();
              resolve2();
            } catch(error) {
              console.log('error', error);
              reject2();
            }
          } else {
            message.warning(`请输入正确的内容！`);
            reject2();
          }
        });
      },
      onCancel: () => {
        reject();
      }
    });
  });
};

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
      if(e) message.warning(e);
    }
  });
}

export default axios;

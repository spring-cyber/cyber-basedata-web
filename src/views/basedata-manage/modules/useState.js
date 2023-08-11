import { message } from 'ant-design-vue';
import axios from '@/api';
import { Modal } from 'cyber-web-ui';
import XLSX from 'xlsx-js-style';
import { maintainStore } from '@/store';

export function useColumns(tableState, formState, inputRef) {
  let { scroll = {}, columns = [] } = tableState;
  let lack = scroll.x <= 1324 ? (scroll.x - scroll.width) / columns.length : 0;
  return [
    {
      width: '70px',
      title: '',
      key: 'index',
      fixed: 'left',
      align: 'center',
      customCell: (record, rowIndex, column) => {
        return {
          class: ['cyber-table-cell-index'],
          onClick() {
            if(tableState.selector.seletctd && tableState.selector.index == rowIndex) {
              tableState.selector.seletctd = false;
            } else {
              tableState.selector.seletctd = true;
              tableState.selector.index = rowIndex;
              tableState.selector.record = rowIndex == tableState.editor.index ? JSON.parse(JSON.stringify(formState)) : record;
              inputRef.value.focus();
            }
          },
        }
      }
    },
    ...columns.map(item => {
      return {
        ...item,
        width: 220 + lack + 'px',
        title: item.name,
        key: item.code,
        ellipsis: true,
        selectKey: item.clTableCode && item.clColumnCode ? `${item.clTableCode}/${item.clColumnCode}` : undefined,
        sorter: true,
        sortOrder: tableState.sorted.columnKey === item.code && tableState.sorted.order,
      }
    }),
  ];
};

export function useTableState(props, tableRef, formState, formRef, inputRef) {
  const isModify = inject('isModify');
  const openModify = inject('openModify');
  const closeModify = inject('closeModify');
  const interceptAction = inject('interceptAction');

  const tableState = reactive({
    // 选中项
    selector: {
      seletctd: false,
      index: undefined,
      record: undefined,
    },
    // 编辑项
    editor: {
      type: undefined, // 0: 新增，1: 编辑
      index: undefined,
      record: undefined,
    },
    // 复制信息
    copy: undefined,
    dataSource: [],
    customRow(record, index) {
      return {
        class: [
          { 'cyber-table-row-selected': tableState.selector.seletctd && tableState.selector?.index === index },
        ],
        async ondblclick(e) {
          try {
            let flag = isModify.value;
            let { type: editorType, index: editorIndex } = tableState.editor;
            if(flag && index == editorIndex) return;
            await tableMethods.exitEditor();
            openModify();
            if(flag && editorType == '0' && editorIndex <= index) index -= 1;
            tableState.editor.type = '1';
            tableState.editor.index = index;
            tableState.editor.record = record;
            Object.keys(record).forEach(key => formState[key] = record[key]);
          } catch(error) {
            console.log('error', error);
          }
        },
        onContextmenu(e) {
          tableState.selector.seletctd = true;
          tableState.selector.index = index;
          tableState.selector.record = index == tableState.editor.index ? JSON.parse(JSON.stringify(formState)) : record;
          inputRef.value.focus();
          e.preventDefault();
          tableState.visible = true;
        },
      }
    },
    overlayMenu: [
      { label: '在上方插入行', value: 'insert_before' },
      { label: '在下方插入行', value: 'insert_after' },
      { label: '复制', value: 'copy' },
      { label: '粘贴', value: 'paste' },
      { label: '删除该行', value: 'delete' },
      { label: '提交变更', value: 'save', show: ({ index }) => index == tableState.editor.index },
    ],
    columns: [],
    options: {},
    // 滚动配置
    scroll: computed(() => {
      let length = (tableState.columns || []).length;
      if(!length) return { y: 412 };
      let width = length * 220 + 70;
      return {
        width: width,
        x: width < 1324 ? 1324 : width,
        y: 440,
      };
    }),
    primaryCode: computed(() => tableState.columns.find(item => item.primaryKey === 1)?.code),
    columnNames: computed(() => tableState.columns.map(item => item.code)),
    loading: false,
    visible: false,
    // 排序项
    sorted: {},
  });

  const tableMethods = {
    visibleChange(visible) {
      if(!visible) tableState.visible = visible;
    },
    async onAction(type, { record, index }) {
      tableState.visible = false;
      try {
        let flag = isModify.value;
        let { index: editorIndex, type: editorType } = tableState.editor;
        // 复制
        if(type == 'copy') {
          tableMethods.copy(inputRef.value, tableState.selector.record);
        }
        // 粘贴
        else if(type == 'paste') {
          if(!tableState.copyInfo) {
            message.warning('请先复制！');
            return;
          }
          if(flag && index != editorIndex) {
            await tableMethods.exitEditor();
          }
          openModify();
          tableState.editor.type = flag && index == editorIndex ? '0' : '1';
          tableState.editor.index = index;
          tableState.editor.record = record;
          Object.keys(tableState.copyInfo).forEach(key => formState[key] = tableState.copyInfo[key]);
          message.success('粘贴成功！');
        }
        // 删除
        else if(type == 'delete') {
          await tableMethods.exitEditor();
          if(editorType == '1' || !flag) tableMethods.delete(tableState.dataSource[index]);
        }
        // 在上方插入行
        else if(type == 'insert_before') {
          await tableMethods.exitEditor();
          openModify();
          if(flag && editorType == '0' && editorIndex && editorIndex < index) index -= 1;
          tableState.dataSource.splice(index, 0, {});
          tableState.editor.type = '0';
          tableState.editor.index = index;
          tableState.editor.record = {};
          Object.keys(formState).forEach(key => formState[key] = undefined);
        }
        // 在下方插入行
        else if(type == 'insert_after') {
          await tableMethods.exitEditor();
          openModify();
          if(flag && editorType == '0' && editorIndex <= index) index -= 1;
          tableState.dataSource.splice(index + 1, 0, {});
          tableState.editor.type = '0';
          tableState.editor.index = index + 1;
          tableState.editor.record = {};
          Object.keys(formState).forEach(key => formState[key] = undefined);
        }
        // 提交变更
        else if(type == 'save') {
          try {
            await unref(formRef).validate();
            tableMethods.onSubmit(editorType, tableState.dataSource[index]);
          } catch(error) {
            console.log("validate", error);
          }
        }
      } catch(error) {
        if(error) throw Error(error);
      }
    },
    copy(target, value) {
      if(!target) return;
      target.value = JSON.stringify(tableState.selector.record);
      target.select();
      tableState.copyInfo = value;
      if(document.execCommand('Copy')) message.success('复制成功！');
      else message.warning('复制失败！');
    },
    onBlur(e) {
      tableState.selector.seletctd = false;
      e.target.value = '';
    },
    onKeydown(e) {
      if(e.keyCode == '67' && tableState.selector.index >= 0) {
        tableMethods.copy(e.target, tableState.selector.record);
      }
    },
    onPaste(e) {
      let clipboardData = e.clipboardData;
      for (var i = 0, len = clipboardData.items.length; i < len; i++) {
        var item = clipboardData.items[i];
        if (item.kind === "string" && item.type == "text/plain") {//判断是否为text格式
          item.getAsString(async function (str) {
            try {
              let json = JSON.parse(str);
              let index = tableState.selector.index;
              if(isModify.value && index != tableState.editor.index) {
                await tableMethods.exitEditor();
              }
              openModify();
              tableState.editor.type = isModify.value && index == tableState.editor.index ? '0' : '1';
              tableState.editor.index = index;
              tableState.editor.record = tableState.dataSource[index];
              Object.keys(json).forEach(key => formState[key] = json[key]);
              message.success('粘贴成功！');
            } catch(error) {
              console.log('error', error);
              message.warning('粘贴失败！');
            }
          });
        } else if (item.kind === "file") {//file 一般是各种截图base64数据(比如QQ截图)
          var pasteFile = item.getAsFile(); // pasteFile就是获取到的文件
          var reader = new FileReader();
          reader.readAsDataURL(pasteFile);
          reader.onload = function () {
            console.log('reader', reader.result); // 输出base64格式的图片，可以放到img 的 src 属性中去
          };
        }
      }
    },
    async exitEditor(isIntercept = true) {
      try {
        let flag = isModify.value;
        if(isIntercept) {
          await interceptAction();
        }
        if(flag && tableState.editor.type == '0') {
          tableState.dataSource.splice(tableState.editor.index, 1);
        }
        tableState.editor.type = undefined;
        tableState.editor.index = undefined;
        tableState.editor.record = {};
        closeModify();
      } catch {
        return Promise.reject();
      }
    },
    async searchQuery(isIntercept = true) {
      try {
        if(!tableState.columns?.length) return;
        await tableMethods.exitEditor(isIntercept);
        let { sorted } = tableState;
        let params = { tableCode: props.node.code }
        if(sorted?.columnKey && sorted.order) {
          params.sortBy = sorted.columnKey;
          params.sortType = sorted.order == "ascend" ? 'asc' : 'desc';
        }
        let { data } = await unref(tableRef).searchQuery({
          url: '/basedata/basedata/table/data',
          method: 'get',
          params: params,
        });
        tableState.dataSource = data.map(item => {
          tableState.columns.forEach(({ code, type }) => {
            if(type == 'boolean' && /true|false/.test(item[code])) item[code] = item[code] ? '1' : '0';
          });
          return item;
        });
        tableState.loading = false;
      } catch {}
    },
    // 获取列
    async queryColumns() {
      tableState.columns = [];
      tableState.dataSource = [];
      try {
        let res = await axios.request({
          url: '/basedata/basedata/table/column',
          method: 'get',
          params: {
            tableCode: props.node.code,
            sortBy: 'order_num',
            sortType: 'asc',
          }
        });
        tableState.columns = (res.data || []).sort((a, b) => a.orderNum - b.orderNum);
        tableMethods.queryAssociatedColumns();
      } catch {}
    },
    async queryAssociatedColumns() {
      tableState.options = {};
      if(!tableState.columns?.length) return;
      let list = tableState.columns.filter(item => {
        if(!item.clTableCode || !item.clColumnCode) return false;
        if(tableState.options[`${item.clTableCode}/${item.clColumnCode}`]) return false;
        tableState.options[`${item.clTableCode}/${item.clColumnCode}`] = [];
        return true;
      }).map(item => `${item.clTableCode}/${item.clColumnCode}`);
      if(!list?.length) return;
      let result = await Promise.allSettled(list.map(key => axios.request({ url: `/basedata/basedata/table/${key}` })));
      result.forEach(({ status, value }, index) => {
        let key = list[index];
        if(status != 'fulfilled') return;
        tableState.options[key] = Array.from(new Set(value?.data || [])).map(citem => ({ label: citem, value: citem }));
      });
    },
    async onChange(pagination, filters, sorter, { currentDataSource }) {
      try {
        await tableMethods.exitEditor();
        tableState.sorted = sorter;
        tableMethods.searchQuery();
      } catch {}
    },
    /**
     * @function onSubmit 提交操作
     * @param {string} type 操作类型 0：新增 1：修改 2：删除
     * @param {object} record 操作项
     * @returns {promise} 
     */
    async onSubmit(type, record) {
      maintainStore().loading = true;
      try {
        tableState.loading = true;
        let params = {
          tableCode: props.node.code,
          columnNames: tableState.columnNames.join(','),
        };
        let list = tableState.columns.map(({ type: dataType, code }) => {
          let value = formState[code];
          let beforeData = record[code] || typeof record[code] == 'number' ? `'${record[code]}'` : 'null';
          if(dataType == 'boolean' && /^(true|false)$/i.test(value)) value = /^true$/i.test(value) ? `1` : `0`;
          value = value || typeof value == 'number' ? `'${value}'` : 'null';
          // 修改
          if(/1/.test(type)) {
            if(!params.updateBeforeDataList) {
              params.updateBeforeDataList = [];
              params.updatedDataList = [];
            }
            params.updateBeforeDataList.push({ value: beforeData, code: code });
            params.updatedDataList.push({ value: value, code: code });
          }
          // 删除
          else if(/2/.test(type)) {
            if(!params.removeDataList) params.removeDataList = [];
            params.removeDataList.push({ value: beforeData, code: code });
          }
          return value;
        });
        // 新增
        if(/0/.test(type)) {
          params.addDataList = [list.join(',')];
        }
        let res = await axios.request({
          url: '/basedata/basedata/table/data/change',
          method: 'put',
          data: params,
        });
        message.success(res.message);
        tableMethods.searchQuery(false);
        maintainStore().loading = false;
      } catch(error) {
        tableState.loading = false;
        maintainStore().loading = false;
        if(error) throw Error(error);
        return Promise.reject();
      }
    },
    delete(record) {
      Modal.confirm({
        width: '500px',
        content: `是否确认删除 ${tableState.primaryCode} 为“${record[tableState.primaryCode]}”的数据!`,
        onOk: async () => {
          try {
            await tableMethods.onSubmit('2', record);
            return Promise.resolve();
          } catch {
            return Promise.reject();
          }
        },
      });
    },
    // 导出 / 导出模板
    async onExport(isModel = false) {
      maintainStore().loading = true;
      try {
        let res = await axios.request({
          url: '/basedata/basedata/table/data',
          method: 'get',
          params: { tableCode: props.node.code, pageSize: 100000 },
        });
        const wb = XLSX.utils.book_new();
        let titleRow = {};
        tableState.columns.forEach(item => titleRow[item.code] = `${item.name}(${item.code})`);
        const ws = XLSX.utils.json_to_sheet([
          titleRow,
          ...(isModel ? [] : res.data?.data || []),
        ], {
          header: tableState.columnNames,
          skipHeader: true,
          origin: 'A1',
        });
        ws['!cols'] = tableState.columns.map((item, index) => {
          let cellCode = XLSX.utils.encode_cell({ c: index, r: 0 });
          ws[cellCode].s = {
            font: {
              sz: 12,
              bold: true,
              color: {
                rgb: 'FFFFFF', //白色
              },
            },
            alignment: {
              horizontal: 'center',
              vertical: 'center',
              wrapText: true,
            },
            fill: {
              fgColor: {
                rgb: '05c059',
              },
            },
          };
          return { wch: !item.length || item.length < 10 ? 21 : item.length * 2.5 };
        });
        XLSX.utils.book_append_sheet(wb, ws, "sheet1");
        XLSX.writeFile(wb, `${props.node.name}_${props.node.code}_${isModel ? '模板' : '主数据表'}.xlsx`, {
          type: "binary",
          bookType: "xlsx",
          bookSST: false,
        });
        message.success(isModel ? '下载模板成功！' : '导出成功！');
        maintainStore().loading = false;
      } catch(error) {
        message.error(isModel ? '下载模板失败！' : '导出失败！');
        maintainStore().loading = false;
        if(error) throw Error(error);
      }
    },
    // 导入
    async onImport() {
      try {
        await tableMethods.exitEditor();
      } catch {
        return;
      }
      let input = document.createElement('input');
      input.type = 'file';
      input.accept=".xls,.xlsx,.csv";
      input.addEventListener("change", e => {
        tableMethods.readExcel(e);
      });
      input.click();
    },
    // 上传数据
    readExcel(e) {
      //表格导入
      const files = e.target.files;
      //如果没有文件名，不往下执行
      if (files.length <= 0) return;
      // 上传文件格式不正确,非xls或者xlsx格式文件，不往下执行
      if (!/\.(xls|xlsx|csv)$/.test(files[0].name.toLowerCase())) return message.error('导入失败！只支持导入 xls 和 xlsx 格式的文件！');
      const fileReader = new FileReader();
      // readAsBinaryString将文件读取为二进制编码
      fileReader.readAsBinaryString(files[0]);
      // 读取完成
      fileReader.onload = async (ev) => {
        try {
          maintainStore().loading = true;
          // xlsx处理二进制数据
          const workbook = XLSX.read(ev.target.result, {
            type: "binary",
          });
          // 取第一张sheet表格
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          // 根据表格内容生成json数据
          const json = XLSX.utils.sheet_to_json(ws);
          if(!json?.length || !Object.keys(json[0])?.length) {
            message.error('导入表数据为空！');
            throw Error('');
          }
          let [start, end] = ws['!ref'].split(':');
          let { c: startCol, r } = XLSX.utils.decode_cell(start);
          let { c: endCol } = XLSX.utils.decode_cell(end);
          let excelColumns = [];
          for(let i = startCol; i <= endCol; i++) {
            let cellCode = XLSX.utils.encode_cell({ c: i, r: r });
            excelColumns.push(ws[cellCode]?.v);
          }
          let every = tableState.columns.every(({ name, code }) => excelColumns.some(item => item == `${name}(${code})`));
          if(!every) {
            message.error('导入表格不是最新模板，请下载最新模板再进入导入表格！');
            throw Error('');
          }
          // 转换数据格式
          let addDataList = json.map(item => {
            return tableState.columns.map(({ name, type, code }) => {
              let key = `${name}(${code})`
              if(type == 'boolean' && /^(true|false)$/i.test(item[key])) return /^true$/i.test(item[key]) ? `'1'` : `'0'`;
              return item[key] || typeof item[key] == 'number' ? `'${item[key]}'` : 'null';
            }).join(',');
          });
          let res = await axios.request({
            url: '/basedata/basedata/table/data/change',
            method: 'put',
            data: {
              tableCode: props.node.code,
              columnNames: tableState.columnNames.join(','),
              addDataList: addDataList,
            },
          });
          message.success(res.message);
          maintainStore().loading = false;
          tableMethods.searchQuery(false);
        } catch (error) {
          maintainStore().loading = false;
          if(error) throw Error(error);
        }
      }
    },
  }

  watchEffect(async () => {
    if(!props.node?.id || !unref(tableRef)) return;
    await tableMethods.queryColumns();
    nextTick(() => tableMethods.searchQuery());
  });

  return {
    tableState,
    tableMethods,
  }
};

export function useRules(columns) {
  return {
    validator: (rule, value) => {
      let column = columns.find((item) => item.code == rule.field);
      // 必填
      if(!value && typeof value != 'number' && (column.notNull === 1 || column.primaryKey === 1)) {
        message.error(`${column.name}不能为空！`);
        return Promise.reject('');
      }
      return Promise.resolve();
    },
    trigger: ['change'],
  };
};

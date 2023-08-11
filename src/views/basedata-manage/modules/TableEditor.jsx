import { defineComponent, reactive, watchEffect } from 'vue';
import { Table, PageWrapper, CollapseForm, Select, useDict, parseDict } from 'cyber-web-ui';
import { useColumns, useTableState, useRules } from './useState.js';
import {
  Input as AInput,
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AmenuItem,
  Form as AForm,
  FormItem as AFormItem,
  Button as AButton,
  Empty as AEmpty,
  DatePicker as ADatePicker,
  TimePicker as ATimePicker,
  InputNumber as AInputNumber,
} from 'ant-design-vue';
import './tableEditor.less';
import { maintainStore } from '@/store';

export default defineComponent({
  props: {
    node: {
      type: Object,
      default: () => {},
    },
    parentNode: {
      type: Object,
      default: () => {},
    },
  },
  setup(props, context) {
    const { attrs, slots, emit, expose } = context;
    const { BOOLEAN } = useDict({ BASEDATA: ['BOOLEAN'] });
    const { BOOLEAN_PARSE } = parseDict({ BASEDATA: ['BOOLEAN'] });
    const formRef = ref();
    const tableRef = ref();
    const inputRef = ref();
    const formState = reactive({});
    const isModify = inject('isModify');
    const { tableState, tableMethods } = useTableState(props, tableRef, formState, formRef, inputRef);
    // 校验规则
    const rules = computed(() => useRules(tableState.columns));
    // 表格列配置
    const columns = computed(() => useColumns(tableState, formState, inputRef));

    expose({
      searchQuery: async (params) => {
        return await unref(tableRef)?.searchQuery(params);
      },
    });
    return () => {
      const pageWrapperSlots = {
        header: () => (
          <CollapseForm onSearch={tableMethods.searchQuery} v-slots={{
            right: () => (
              <>
                <AButton
                  type="primary"
                  ghost
                  loading={maintainStore().loading}
                  disabled={tableState.loading}
                  onClick={tableMethods.onImport}
                >导入</AButton>
                <AButton
                  type="primary"
                  ghost
                  loading={maintainStore().loading}
                  disabled={tableState.loading}
                  onClick={() => tableMethods.onExport(false)}
                >导出</AButton>
                <AButton
                  type="primary"
                  ghost
                  disabled={tableState.loading}
                  onClick={() => tableMethods.onExport(true)}
                >下载模板</AButton>
                <AButton
                  type="primary"
                  disabled={!unref(isModify)}
                  onClick={() => tableMethods.onAction('save', {
                    index: tableState.editor.index,
                    record: tableState.dataSource[tableState.editor.index]
                  })}
                >保存</AButton>
                <input
                  class="cyber-table-input-block"
                  ref={inputRef}
                  onBlur={tableMethods.onBlur}
                  onkeydown={tableMethods.onKeydown}
                  onpaste={tableMethods.onPaste}
                ></input>
              </>
            )
          }}>
            <span class="text-[#2D3D48] font-600">{ props.parentNode?.name || '-' } / { props.node?.name || '-' }</span>
          </CollapseForm>
        ),
      };
      const overlaySlot = (options = tableState.selector) => {
        return (
          <AMenu class="w-150px">
            {
              tableState.overlayMenu.map(item => {
                if(item.show && !item.show(options)) return;
                return (
                  <AmenuItem onClick={() => tableMethods.onAction(item.value, options)}>{ item.label }</AmenuItem>
                )
              })
            }
          </AMenu>
        )
      };
      const inputSlot = ({ column, record, index, text, value }) => {
        if(column.selectKey) {
          return (
            <Select
              allowClear={column.notNull == '0'}
              v-model:value={formState[column.key]}
              options={tableState.options[column.selectKey]}
              getPopupContainer={() => document.body}
            ></Select>
          )
        }
        else if(/int/.test(column.type)) return <AInputNumber class="w-1/1" v-model:value={formState[column.key]} min={-2147483648} max={2147483647} precision={0} />;
        else if(/^time$/.test(column.type)) {
          return (
            <ATimePicker
              class="w-1/1"
              allowClear={column.notNull == '0'}
              v-model:value={formState[column.key]}
              format="HH:mm:ss"
              valueFormat="HH:mm:ss"
            ></ATimePicker>
          );
        }
        else if(/date|datetime|timestamp/.test(column.type)) {
          return (
            <ADatePicker
              class="w-1/1"
              v-model:value={formState[column.key]}
              allowClear={column.notNull == '0'}
              format={/^date$/.test(column.type) ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'}
              showTime={/datetime|timestamp/.test(column.type)}
              valueFormat={/^date$/.test(column.type) ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'}
            ></ADatePicker>
          );
        }
        else if(/boolean/.test(column.type)) {
          return (
            <Select
              allowClear={column.notNull == '0'}
              v-model:value={formState[column.key]}
              options={BOOLEAN.value}
              getPopupContainer={() => document.body}
            ></Select>
          )
        }
        return <AInput v-model:value={formState[column.key]} maxlength={column.length}></AInput>
      };
      const tableSlots = {
        bodyCell(options) {
          const { column, record, index, text, value } = options;
          if(column.key == 'index') return index + 1;
          if(tableState.editor.index == index) {
            return (
              <AFormItem name={column.key} rules={rules.value}>
                { inputSlot(options) }
              </AFormItem>
            )
          }
          if(!column.key) return;
          if(column.type == 'boolean') {
            // console.log("record??", record)
            return BOOLEAN_PARSE.value?.[record?.[column.key]]?.label || record?.[column.key] || '';
          }
          return record?.[column.key];
        },
        emptyText() {
          return (
            <AEmpty
              image={AEmpty.PRESENTED_IMAGE_SIMPLE}
              v-slots={{
                description: () => {
                  if(!tableState.columns?.length) return <span>暂无数据</span>
                  return <span>暂无数据，<a onClick={() => tableMethods.onAction('insert_before', { index: 0 })}>插入行</a></span>
                }
              }}
            ></AEmpty>
          )
        }
      };
      return (
        <PageWrapper v-slots={pageWrapperSlots}>
          <ADropdown
            trigger="contextmenu"
            visible={tableState.visible}
            onVisibleChange={tableMethods.visibleChange}
            v-slots={{ overlay: overlaySlot }}
          >
            <AForm
              ref={formRef}
              name="formName"
              class="table-editor-form"
              model={formState}
              autocomplete="off"
              layout="inline"
            >
              <Table
                ref={tableRef}
                rowKey={tableState.primaryCode}
                bordered
                { ...attrs }
                action={false}
                columns={columns.value}
                v-slots={tableSlots}
                scroll={tableState.scroll}
                customRow={tableState.customRow}
                v-model:dataSource={tableState.dataSource}
                v-model:loading={tableState.loading}
                beforePaginationChange={tableMethods.exitEditor}
                onPaginationChange={tableMethods.searchQuery}
                onChange={tableMethods.onChange}
              ></Table>
            </AForm>
          </ADropdown>
        </PageWrapper>
      );
    };
  }
});

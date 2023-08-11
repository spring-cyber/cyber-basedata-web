export default {
  // 状态
  status: [
    { label: '正常', value: '0', icon: 'cyber-zhengchang' },
    { label: '停用', value: '1', icon: 'cyber-yichang' },
  ],
  // 性别
  sex: [
    { label: '男', value: '0', icon: 'cyber-nan' },
    { label: '女', value: '1', icon: 'cyber-nv' },
    { label: '未知', value: '2' },
  ],
  // 在职状态
  userState: [
    { label: '在职', value: '0', icon: 'cyber-zhengchang' },
    { label: '离职', value: '1', icon: 'cyber-yichang' },
  ],
  // 应用类型
  productType: [
    { label: '系统', value: '0' },
    { label: '自定义', value: '1' },
  ],
  // 菜单显示状态
  menuVisualStatus: [
    { label: '显示', value: '0' },
    { label: '隐藏', value: '1' },
  ],
  // 菜单是否缓存
  menuCacheStatus: [
    { label: '缓存', value: '0' },
    { label: '不缓存', value: '1' },
  ],
  // 角色类型
  roleType: [
    { label: '系统角色', value: '0' },
    { label: '自定义角色', value: '1' },
  ],
  // 参数类型
  configType: [
    { label: '系统参数', value: '0' },
    { label: '应用参数', value: '1' },
  ],
  // 系统公告
  noticeStatus: [
    { label: '已发布', value: '0' },
    { label: '未发布', value: '1' },
    { label: '已撤销', value: '2' },
  ],
  // 操作结果状态
  operationResultStatus: [
    { label: '成功', value: '0', icon: 'cyber-zhengchang' },
    { label: '失败', value: '1', icon: 'cyber-yichang' },
  ],
  // 操作状态
  operationStatus: [
    { label: '正常', value: '0', icon: 'cyber-zhengchang' },
    { label: '异常', value: '1', icon: 'cyber-yichang' },
  ],
  // 请求类型
  requestMethod: [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
  ],
  // 访问控制类型
  accessControlType: [
    { label: '用户策略', value: '0' },
    { label: 'IP 策略', value: '1' },
  ],
  // 访问控制 - 策略类型
  strategyType: [
    { label: '允许访问', value: '0', icon: 'cyber-zhengchang' },
    { label: '禁止访问', value: '1', icon: 'cyber-jinyong' },
  ],
  // 允许策略原因
  enableStrategyReason: [
    { label: '授权申请', value: '0' },
    { label: '系统维护', value: '1' },
    { label: '其他原因', value: '2' },
  ],
  // 禁止策略原因
  disabledStrategyReason: [
    { label: '异地登录', value: '0' },
    { label: '密码攻击', value: '1' },
    { label: '违规使用', value: '2' },
    { label: '其他原因', value: '3' },
  ],
  // 字典启用状态
  dictStatus: [
    { label: '启用', value: '0', icon: 'cyber-zhengchang' },
    { label: '停用', value: '1', icon: 'cyber-yichang' },
  ],
}
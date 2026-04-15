# 预算管理系统需求规格文档

## 文档信息
- **项目名称**: 半导体研发企业预算管理系统
- **文档版本**: v1.1
- **创建日期**: 2025-01-18
- **最后更新**: 2025-01-18
- **文档状态**: 草稿
- **更新说明**: 补充Capex/Opex财务确认规则、PR-PO Gap、采购滞后性、数据Mapping流程等业务细节

## 1. 项目概述

### 1.1 项目背景
半导体研发企业研发部门预算管理员负责Capex（资本性支出）和Opex（运营性支出）年度预算编制和执行监控，每月分析预算执行差异。当前完全使用Excel手工处理，效率低下且易出错。采购系统不开放API，数据需通过导入方式集成。预算编号与采购订单、财务结算单据非一一对应，增加了数据关联的复杂性。

### 1.2 项目目标
构建一套完整的预算管理系统，实现：
- 自动化预算编制流程，提高编制效率
- 实时预算执行监控，及时预警超支风险
- 规范化预算调整流程，确保变更可追溯
- 智能化差异分析，提供决策支持
- 多维度数据可视化，提升管理透明度

### 1.3 系统范围
**包含范围**:
- Capex/Opex年度预算编制
- 预算执行过程监控
- 预算调整申请与审批
- PR/PO/财务结算数据导入与关联
- 预算执行差异分析
- 全年执行力预估
- 多维度报表与可视化
- IPD项目费用归集
- 组织架构多维度管理

**排除范围**:
- 采购系统直接集成（采购系统不开放API）
- 财务总账系统直接集成
- 人力资源管理系统集成
- 项目管理系统深度集成

### 1.4 术语定义
| 术语 | 定义 |
|------|------|
| Capex | 资本性支出（Capital Expenditure），如设备采购、厂房建设等，PO完成即计入财务完结金额 |
| Opex | 运营性支出（Operating Expenditure），如日常运营费用、人员成本等，验收后才计入财务完结金额 |
| PR | 采购申请单（Purchase Request），研发部门提起采购时的申请金额 |
| PO | 采购订单（Purchase Order），采购最终议价签约的金额 |
| PR-PO Gap | PR金额与PO金额的差异，由于公司保密制度，研发部门只知道PR金额，月底才能从财务获得PO金额 |
| 财务完结金额 | 财务确认的实际支出金额，Capex在PO完成时确认，Opex在验收后确认 |
| IPD | 集成产品开发（Integrated Product Development），研发项目管理模式 |
| 预算执行率 | 已执行金额/预算金额×100% |
| 预算执行力 | 预测全年实际执行金额/年度预算金额×100% |
| 采购滞后性 | 采购流程包含：需求提起→PR提起→PO完成→签约→供应商发货→验收，存在时间滞后 |
| 在途采购 | 已提起PR但未验收的采购，不计入财务完结金额 |

## 2. 利益相关者

### 2.1 用户角色
| 角色 | 描述 | 主要职责 |
|------|------|----------|
| 预算管理员 | 研发部门预算管理专员 | 预算编制、执行监控、差异分析、报表生成 |
| 部门负责人 | 二级部门负责人 | 预算申请提交、预算调整申请、执行情况查看 |
| 财务人员 | 财务部门相关人员 | 预算审批、财务数据导入、预算执行确认 |
| 系统管理员 | IT部门系统维护人员 | 系统配置、用户管理、数据维护 |
| 普通用户 | 需要查看预算信息的人员 | 查看权限范围内的预算信息 |

### 2.2 外部系统
| 系统名称 | 接口类型 | 数据交互 |
|----------|----------|----------|
| 采购系统 | 文件导入 | PR/PO数据导入 |
| 财务系统 | 文件导入 | 财务结算数据导入 |
| Excel工具 | 文件导入/导出 | 预算数据导入导出 |

## 3. 功能需求

### 3.1 预算编制管理

#### 3.1.1 预算模板管理
**需求ID**: REQ-BUDGET-TEMPLATE-001
**优先级**: P0
**需求描述**: The budget management system shall provide budget template management capabilities for Capex and Opex budget items.

**验收标准**:
- Given: 用户已登录且具有预算管理员权限
- When: 用户创建或编辑预算模板
- Then: 系统保存模板配置，包括预算科目、维度字段、计算规则

**业务规则**:
- Capex预算模板包含：资产类别、资产名称、规格型号、数量、单价、总价、供应商、采购周期、折旧年限等
- Opex预算模板包含：费用科目、费用项目、预算金额、费用周期、归集项目等
- 模板支持版本管理，保留历史版本

---

#### 3.1.2 年度预算创建
**需求ID**: REQ-BUDGET-CREATE-001
**优先级**: P0
**需求描述**: When a new fiscal year budget is initiated, the system shall create budget structure based on organization hierarchy and IPD project portfolio.

**验收标准**:
- Given: 当前年度预算尚未创建
- When: 预算管理员发起年度预算创建
- Then: 系统生成包含所有二级部门和IPD项目的预算框架

**业务规则**:
- 预算年度为自然年（1月1日-12月31日）
- 自动继承上年度预算结构（可选）
- 支持从Excel导入预算初稿
- 每个预算项生成唯一预算编号（CAP-YYYY-NNNN或OPE-YYYY-NNNN）

---

#### 3.1.3 预算数据录入
**需求ID**: REQ-BUDGET-INPUT-001
**优先级**: P0
**需求描述**: The budget management system shall support multiple budget data input methods including manual entry, Excel import, and template-based batch input.

**验收标准**:
- Given: 用户已打开预算编制界面
- When: 用户通过任一方式录入预算数据
- Then: 系统验证数据有效性并保存，同时记录操作日志

**业务规则**:
- 手工录入：逐项填写预算明细
- Excel导入：支持标准模板导入，自动校验数据格式
- 批量录入：基于模板快速录入同类预算项
- 数据校验：金额非负、日期有效、科目存在、部门存在
- 支持暂存和提交两种状态

---

#### 3.1.4 预算审批流程
**需求ID**: REQ-BUDGET-APPROVAL-001
**优先级**: P0
**需求描述**: When a budget is submitted for approval, the system shall initiate the approval workflow according to predefined approval rules.

**验收标准**:
- Given: 预算数据已填写完成
- When: 用户提交预算审批申请
- Then: 系统创建审批流程，通知审批人，并锁定预算数据

**业务规则**:
- 审批流程：部门负责人初审 → 财务审核 → 预算管理员终审
- 审批超时提醒（可配置超时时间）
- 支持审批驳回并说明原因
- 审批通过后预算状态变更为"已批准"
- 审批过程中预算数据不可修改

---

### 3.2 预算执行控制

#### 3.2.1 PR数据导入
**需求ID**: REQ-EXEC-PR-001
**优先级**: P0
**需求描述**: When PR data file is uploaded, the system shall parse and import PR records, and attempt to match with budget items.

**验收标准**:
- Given: 用户上传PR数据文件（Excel格式）
- When: 系统解析文件并验证数据格式
- Then: 导入成功的PR记录显示匹配结果，失败记录显示错误原因

**业务规则**:
- 支持的文件格式：.xlsx, .xls
- 必填字段：PR号、申请部门、申请日期、物料描述、数量、单价、总价
- 自动匹配规则：根据部门、费用科目、项目等维度匹配预算项
- 匹配结果：完全匹配、部分匹配、未匹配
- 记录导入日志，包括导入时间、导入人、成功/失败数量

---

#### 3.2.2 PO数据导入（月底财务提供）
**需求ID**: REQ-EXEC-PO-001
**优先级**: P0
**需求描述**: When PO data file is provided by finance at month-end, the system shall import PO records and calculate PR-PO gap.

**验收标准**:
- Given: 财务月底提供上月验收入账后的PO数据文件
- When: 系统解析并导入PO数据
- Then: PO记录与PR记录建立关联，计算PR-PO Gap，并更新预算执行金额

**业务规则**:
- **数据来源**：月底由财务统一提供上月验收入账后的PO价格
- **保密制度**：由于公司保密制度，研发部门只知道PR金额，无法知道最终议价签约的PO金额
- **PR-PO Gap**：系统自动计算PR金额与PO金额的差异
- PO与PR关联：通过PR号关联
- PO金额更新预算执行金额（承诺金额）
- 支持一个PR对应多个PO的情况
- 记录PO创建时间、审批时间、供应商信息

---

#### 3.2.3 财务结算数据导入（月度结算）
**需求ID**: REQ-EXEC-SETTLE-001
**优先级**: P0
**需求描述**: When monthly financial settlement data is imported, the system shall update budget execution status with actual expenditure based on Capex/Opex recognition rules.

**验收标准**:
- Given: 用户上传财务月度结算数据文件
- When: 系统导入并处理结算数据
- Then: 根据Capex/Opex不同的确认规则更新财务完结金额，执行率重新计算

**业务规则**:
- **Capex确认规则**：PO完成即计入财务完结金额
- **Opex确认规则**：验收后才计入财务完结金额
- **采购滞后性**：采购流程包含需求提起→PR提起→PO完成→签约→供应商发货→验收
- **在途采购**：已提起PR但未验收的Opex采购，不计入财务完结金额
- 结算数据字段：结算单号、PO号、结算日期、结算金额、发票号、验收状态
- 支持部分结算、多次结算
- 结算数据与PO数据关联

---

#### 3.2.4 预算执行监控
**需求ID**: REQ-EXEC-MONITOR-001
**优先级**: P0
**需求描述**: The budget management system shall provide real-time budget execution monitoring with multi-dimensional views.

**验收标准**:
- Given: 预算已批准且执行数据已导入
- When: 用户查看预算执行监控界面
- Then: 系统展示各维度预算执行情况，包括预算金额、执行金额、执行率、剩余预算

**业务规则**:
- 监控维度：按部门、按项目、按科目、按时间
- 执行金额 = PR申请金额 或 PO承诺金额 或 实际结算金额（可配置）
- 执行率 = 执行金额 / 预算金额 × 100%
- 剩余预算 = 预算金额 - 执行金额
- 支持钻取查看明细

---

#### 3.2.5 预算预警
**需求ID**: REQ-EXEC-ALERT-001
**优先级**: P1
**需求描述**: When budget execution rate exceeds predefined threshold, the system shall generate alert notification.

**验收标准**:
- Given: 预算执行率监控开启
- When: 某预算项执行率超过预警阈值（如80%、90%、100%）
- Then: 系统生成预警信息并通知相关人员

**业务规则**:
- 预警级别：黄色预警（80%）、橙色预警（90%）、红色预警（100%）
- 通知方式：系统内通知、邮件通知（可配置）
- 通知对象：预算管理员、部门负责人
- 预警记录可查询、可关闭
- 支持预警阈值自定义配置

---

### 3.3 预算调整管理

#### 3.3.1 预算调整申请
**需求ID**: REQ-ADJUST-APPLY-001
**优先级**: P0
**需求描述**: When a budget adjustment is needed, the system shall support submitting adjustment request with justification.

**验收标准**:
- Given: 预算已批准且需要调整
- When: 用户提交预算调整申请
- Then: 系统创建调整申请单，记录调整原因，并启动审批流程

**业务规则**:
- 调整类型：预算追加、预算调减、预算调剂、预算科目变更
- 必填信息：调整原因、调整金额、调整后预算、影响分析
- 支持批量调整申请
- 调整申请需关联原预算项
- 调整原因分类：业务变更、预算错误、项目变更、其他

---

#### 3.3.2 预算调整审批
**需求ID**: REQ-ADJUST-APPROVAL-001
**优先级**: P0
**需求描述**: When a budget adjustment request is submitted, the system shall initiate adjustment approval workflow.

**验收标准**:
- Given: 预算调整申请已提交
- When: 审批人处理调整申请
- Then: 系统记录审批意见，审批通过后更新预算金额

**业务规则**:
- 调整审批流程：部门负责人 → 财务审核 → 预算管理员 →（大额调整需更高级别审批）
- 大额调整标准：单次调整超过预算10%或超过50万元
- 审批通过后预算金额自动更新
- 保留调整历史记录，包括调整前后的预算金额
- 支持调整申请撤回（审批前）

---

#### 3.3.3 预算调整历史
**需求ID**: REQ-ADJUST-HISTORY-001
**优先级**: P1
**需求描述**: The budget management system shall maintain complete adjustment history for audit trail.

**验收标准**:
- Given: 预算项存在调整记录
- When: 用户查看预算调整历史
- Then: 系统展示所有调整记录，包括调整时间、调整人、调整原因、调整金额

**业务规则**:
- 调整历史不可删除、不可修改
- 支持按时间范围、部门、项目查询调整历史
- 提供调整历史导出功能
- 调整历史包括：调整申请信息、审批信息、调整结果

---

### 3.4 预算分析报告

#### 3.4.1 数据Mapping与关联
**需求ID**: REQ-ANALYSIS-MAPPING-001
**优先级**: P0
**需求描述**: The budget management system shall provide data mapping functionality to link PR records, financial settlement records, and budget items by PO number or budget number.

**验收标准**:
- Given: PR登记表、财务结算表、预算编制表已导入
- When: 系统执行数据Mapping
- Then: 按照PO单号/预算编号进行一一Mapping，生成关联关系

**业务规则**:
- **数据源Mapping**：
  - PR登记表（研发部门维护）
  - 财务结算表（财务月底提供上月数据）
  - 预算编制表（年度预算）
- **Mapping规则**：
  - 优先按PO单号匹配
  - 其次按预算编号匹配
  - 支持手工调整匹配关系
- **Mapping结果**：
  - 完全匹配：找到唯一对应关系
  - 部分匹配：需要人工确认
  - 未匹配：记录原因并提示
- **数据追溯**：保留Mapping历史，支持追溯

---

#### 3.4.2 组织级差异分析流程
**需求ID**: REQ-ANALYSIS-ORG-001
**优先级**: P0
**需求描述**: The budget management system shall support organization-level variance analysis workflow from department confirmation to organization report generation.

**验收标准**:
- Given: 数据Mapping已完成
- When: 预算管理员执行组织级差异分析流程
- Then: 生成组织Overall不同维度数据、部门Dashboard、预算执行详情

**业务规则**:
- **分析流程**：
  1. 数据Mapping：PR登记表 + 财务结算表 + 预算编制表
  2. 生成组织Overall数据（多维度）
  3. 生成每个部门的Dashboard及预算执行详情
  4. 与每个部门确认每一条预算编号的执行情况/差异原因
  5. 梳理整个组织会计科目/部门等维度的分析报告
- **差异分析内容**：
  - 截至上个月，财务完结金额与预算编制的差异
  - 差异原因分析（预算编制偏差、业务变更、执行进度差异、PR-PO Gap、在途采购等）
- **报告对象**：一级组织负责人
- **确认机制**：部门负责人确认本部门执行情况后，才能生成组织级报告

---

#### 3.4.3 预算执行差异分析
**需求ID**: REQ-ANALYSIS-VARIANCE-001
**优先级**: P0
**需求描述**: The budget management system shall provide budget execution variance analysis with multi-dimensional views, focusing on financial completion amount vs budget.

**验收标准**:
- Given: 预算执行数据已导入且数据Mapping已完成
- When: 用户执行差异分析
- Then: 系统计算并展示财务完结金额与预算编制的差异，包括差异金额、差异率、差异原因分析

**业务规则**:
- **核心指标**：财务完结金额 vs 预算编制金额
- 差异 = 预算金额 - 财务完结金额
- 差异率 = 差异 / 预算金额 × 100%
- **差异原因分类**：
  - 预算编制偏差
  - 业务变更
  - 执行进度差异
  - PR-PO Gap（议价差异）
  - 在途采购（已提PR未验收）
  - 其他
- 分析维度：按部门、按项目、按科目、按时间
- 支持月度、季度、年度差异分析
- 提供差异分析报告导出

---

#### 3.4.2 全年执行力预估
**需求ID**: REQ-ANALYSIS-FORECAST-001
**优先级**: P0
**需求描述**: The budget management system shall provide annual budget execution forecast based on historical data and current execution status.

**验收标准**:
- Given: 当前时间点已过且存在历史执行数据
- When: 用户查看全年执行力预估
- Then: 系统基于历史数据和当前执行情况，预测全年执行金额和执行力

**业务规则**:
- 预估方法：历史同期对比、执行趋势分析、项目进度分析
- 预估全年执行金额 = 已执行金额 + 预估剩余期间执行金额
- 预估执行力 = 预估全年执行金额 / 年度预算金额 × 100%
- 支持按部门、项目、科目分别预估
- 提供预估假设条件和风险提示
- 预估结果可导出

---

#### 3.4.3 多维度报表
**需求ID**: REQ-ANALYSIS-REPORT-001
**优先级**: P0
**需求描述**: The budget management system shall provide multi-dimensional budget reports with visualization.

**验收标准**:
- Given: 用户需要查看预算报表
- When: 用户选择报表类型和查询条件
- Then: 系统生成报表并以图表和数据表形式展示

**业务规则**:
- 报表类型：
  - 预算汇总表（按部门、项目、科目汇总）
  - 预算执行明细表
  - 预算差异分析表
  - 预算调整统计表
  - 预算执行趋势图
  - 预算执行率分布图
- 查询条件：时间范围、部门、项目、科目、预算类型
- 支持报表导出（Excel、PDF）
- 支持报表打印
- 支持自定义报表（高级功能）

---

#### 3.4.4 可视化仪表板
**需求ID**: REQ-ANALYSIS-DASHBOARD-001
**优先级**: P1
**需求描述**: The budget management system shall provide visual dashboard for budget overview and key metrics.

**验收标准**:
- Given: 用户登录系统
- When: 用户访问仪表板页面
- Then: 系统展示预算概览、关键指标、预警信息、执行趋势等可视化内容

**业务规则**:
- 仪表板内容：
  - 年度预算总览（总预算、已执行、剩余预算）
  - Capex/Opex预算分布
  - 部门预算执行率排名
  - 预警信息列表
  - 月度执行趋势图
  - 预算执行率分布图
- 支持仪表板个性化配置
- 支持数据实时刷新
- 支持图表交互（钻取、筛选）

---

### 3.5 基础数据管理

#### 3.5.1 组织架构管理
**需求ID**: REQ-MASTER-ORG-001
**优先级**: P0
**需求描述**: The budget management system shall maintain organization hierarchy including company level and department level.

**验收标准**:
- Given: 系统管理员登录系统
- When: 管理员维护组织架构信息
- Then: 系统保存组织架构，并支持预算按组织维度归集

**业务规则**:
- 组织层级：公司 → 一级部门 → 二级部门
- 当前系统支持12个二级部门
- 组织信息：组织编码、组织名称、上级组织、负责人、成本中心
- 支持组织架构导入导出
- 组织变更需记录历史

---

#### 3.5.2 IPD项目管理
**需求ID**: REQ-MASTER-IPD-001
**优先级**: P0
**需求描述**: The budget management system shall maintain IPD project information for cost collection.

**验收标准**:
- Given: 系统管理员或预算管理员登录
- When: 用户维护IPD项目信息
- Then: 系统保存项目信息，支持预算按项目维度归集

**业务规则**:
- 项目信息：项目编号、项目名称、项目类型、项目负责人、项目周期、项目预算
- 项目状态：规划中、进行中、已结项、已暂停
- 支持项目层级结构（项目 → 子项目）
- 费用必须挂在IPD项目上
- 支持项目信息导入导出

---

#### 3.5.3 预算科目管理
**需求ID**: REQ-MASTER-ACCOUNT-001
**优先级**: P0
**需求描述**: The budget management system shall maintain budget account hierarchy for Capex and Opex classification.

**验收标准**:
- Given: 系统管理员维护预算科目
- When: 用户创建或编辑预算科目
- Then: 系统保存科目信息，支持预算按科目维度统计

**业务规则**:
- 科目层级：一级科目 → 二级科目 → 三级科目
- Capex科目：设备、厂房、软件、其他资本性支出
- Opex科目：人员成本、材料成本、外包成本、差旅费、办公费、其他运营费用
- 科目属性：科目编码、科目名称、科目类型、上级科目、是否叶节点
- 支持科目预算控制规则配置

---

#### 3.5.4 数据导入模板管理
**需求ID**: REQ-MASTER-TEMPLATE-001
**优先级**: P1
**需求描述**: The budget management system shall provide configurable data import templates for different data types.

**验收标准**:
- Given: 系统管理员配置导入模板
- When: 用户使用模板导入数据
- Then: 系统按模板定义解析数据并验证

**业务规则**:
- 模板类型：预算数据模板、PR数据模板、PO数据模板、结算数据模板
- 模板配置：字段映射、数据校验规则、默认值
- 支持模板下载
- 支持模板版本管理
- 提供标准模板和自定义模板

---

### 3.6 系统管理

#### 3.6.1 用户权限管理
**需求ID**: REQ-SYS-AUTH-001
**优先级**: P0
**需求描述**: The budget management system shall provide role-based access control for different user types.

**验收标准**:
- Given: 系统管理员登录系统
- When: 管理员配置用户角色和权限
- Then: 系统按角色控制用户访问权限和操作权限

**业务规则**:
- 预设角色：系统管理员、预算管理员、部门负责人、财务人员、普通用户
- 权限类型：菜单权限、操作权限、数据权限
- 数据权限：按部门、按项目控制数据访问范围
- 支持角色自定义
- 支持权限继承

---

#### 3.6.2 系统配置管理
**需求ID**: REQ-SYS-CONFIG-001
**优先级**: P1
**需求描述**: The budget management system shall provide system configuration capabilities for business rules and parameters.

**验收标准**:
- Given: 系统管理员访问系统配置
- When: 管理员修改系统配置参数
- Then: 系统保存配置并按新配置运行

**业务规则**:
- 可配置项：
  - 预算年度设置
  - 预警阈值配置
  - 审批流程配置
  - 数据导入规则
  - 报表模板配置
- 配置变更需记录日志
- 敏感配置需审批

---

#### 3.6.3 操作日志管理
**需求ID**: REQ-SYS-LOG-001
**优先级**: P1
**需求描述**: The budget management system shall maintain comprehensive operation logs for audit trail.

**验收标准**:
- Given: 用户执行系统操作
- When: 操作完成
- Then: 系统记录操作日志，包括操作人、操作时间、操作类型、操作内容

**业务规则**:
- 记录的操作：登录、数据新增、数据修改、数据删除、数据导入导出、审批
- 日志内容：操作人、操作时间、操作类型、操作对象、操作前后数据、IP地址
- 日志保留期限：至少3年
- 支持日志查询和导出
- 日志不可删除、不可修改

---

## 4. 非功能需求

### 4.1 性能需求
**需求ID**: NFR-PERF-001
**需求描述**: The budget management system shall meet the following performance requirements.

**验收标准**:
- 页面响应时间：普通页面加载时间 < 2秒，复杂报表生成时间 < 5秒
- 数据导入性能：1000条记录导入时间 < 10秒
- 并发用户数：支持至少50个用户同时在线操作
- 数据处理能力：支持年度预算数据量 > 1000条，PR/PO数据量 > 5000条

### 4.2 安全需求
**需求ID**: NFR-SEC-001
**需求描述**: The budget management system shall ensure data security and access control.

**验收标准**:
- 用户认证：支持用户名密码认证，密码加密存储
- 会话管理：会话超时自动登出，支持单点登录（可选）
- 权限控制：基于角色的访问控制，数据权限隔离
- 数据传输：支持HTTPS加密传输
- 数据备份：支持数据定期备份和恢复
- 审计追溯：所有关键操作记录日志

### 4.3 可用性需求
**需求ID**: NFR-USA-001
**需求描述**: The budget management system shall provide good user experience and usability.

**验收标准**:
- 界面友好：界面清晰、操作直观、提示明确
- 响应式设计：支持不同屏幕尺寸访问
- 错误处理：友好的错误提示，支持错误恢复
- 帮助文档：提供用户操作手册和在线帮助
- 国际化：支持中文界面（可选支持英文）

### 4.4 可维护性需求
**需求ID**: NFR-MAINT-001
**需求描述**: The budget management system shall be easy to maintain and extend.

**验收标准**:
- 代码规范：遵循统一的编码规范
- 模块化设计：功能模块独立、接口清晰
- 配置化：业务规则可配置，减少代码修改
- 日志完善：提供详细的系统日志和错误日志
- 文档完整：提供系统设计文档、接口文档、部署文档

### 4.5 数据完整性需求
**需求ID**: NFR-DATA-001
**需求描述**: The budget management system shall ensure data integrity and consistency.

**验收标准**:
- 数据校验：所有输入数据经过有效性校验
- 事务管理：关键操作支持事务，保证数据一致性
- 数据备份：每日自动备份，支持手动备份
- 数据恢复：支持数据恢复到指定时间点
- 历史数据：关键数据变更保留历史记录

## 5. 数据需求

### 5.1 核心数据实体
| 实体名称 | 描述 | 数据量估算 |
|----------|------|------------|
| 预算主数据 | 年度预算基本信息 | 约900条/年（100 Capex + 800 Opex） |
| 预算明细 | 预算项明细数据 | 约2000条/年 |
| PR记录 | 采购申请单数据 | 约4000条/年 |
| PO记录 | 采购订单数据 | 约3500条/年 |
| 结算记录 | 财务结算数据 | 约3000条/年 |
| 预算调整 | 预算调整记录 | 约200条/年 |
| 组织架构 | 部门组织信息 | 约15条（12个二级部门） |
| IPD项目 | 研发项目信息 | 约50条 |
| 用户信息 | 系统用户信息 | 约100条 |

### 5.2 数据质量要求
- **数据完整性**: 关键字段不允许为空，外键关联完整
- **数据准确性**: 金额数据精确到分，日期数据格式统一
- **数据一致性**: 预算编号唯一，PR/PO/结算数据关联一致
- **数据时效性**: 执行数据及时导入，预算数据及时更新

### 5.3 数据保留策略
- 预算数据：永久保留，支持历史查询
- 执行数据：永久保留，支持历史分析
- 操作日志：保留至少3年
- 系统配置：保留所有版本，支持回溯

## 6. 约束条件

### 6.1 技术约束
- 前后端分离架构，RESTful API设计
- 数据库使用关系型数据库（PostgreSQL或MySQL）
- 支持Docker容器化部署
- 支持Windows/Linux操作系统

### 6.2 业务约束
- 采购系统不开放API，只能通过文件导入数据
- 预算编号与采购订单、财务结算单据非一一对应
- 费用必须挂在IPD项目上
- 预算调整需经过审批流程
- 预算数据需保留完整历史记录

### 6.3 资源约束
- 开发周期：建议3-4个月
- 开发团队：建议2-3人
- 用户培训：需要提供系统使用培训

## 7. 假设与依赖

### 7.1 假设
- 用户具备基本的计算机操作能力
- 采购系统和财务系统能够提供数据导出功能
- 用户愿意从Excel手工处理方式转变为系统化管理
- 组织架构和IPD项目信息相对稳定

### 7.2 依赖
- 采购系统提供PR/PO数据导出功能
- 财务系统提供结算数据导出功能
- IT部门提供系统部署环境支持
- 管理层支持预算管理流程规范化

## 8. 需求追溯矩阵

| 需求ID | 业务目标 | 利益相关者 | 优先级 | 状态 |
|--------|----------|------------|--------|------|
| REQ-BUDGET-TEMPLATE-001 | 预算编制规范化 | 预算管理员 | P0 | 待开发 |
| REQ-BUDGET-CREATE-001 | 年度预算编制 | 预算管理员 | P0 | 待开发 |
| REQ-BUDGET-INPUT-001 | 预算数据录入效率 | 预算管理员 | P0 | 待开发 |
| REQ-BUDGET-APPROVAL-001 | 预算审批流程化 | 预算管理员、部门负责人 | P0 | 待开发 |
| REQ-EXEC-PR-001 | PR数据集成 | 预算管理员 | P0 | 待开发 |
| REQ-EXEC-PO-001 | PO数据集成 | 预算管理员 | P0 | 待开发 |
| REQ-EXEC-SETTLE-001 | 结算数据集成 | 预算管理员、财务人员 | P0 | 待开发 |
| REQ-EXEC-MONITOR-001 | 预算执行监控 | 预算管理员、部门负责人 | P0 | 待开发 |
| REQ-EXEC-ALERT-001 | 预算超支预警 | 预算管理员、部门负责人 | P1 | 待开发 |
| REQ-ADJUST-APPLY-001 | 预算调整申请 | 部门负责人 | P0 | 待开发 |
| REQ-ADJUST-APPROVAL-001 | 预算调整审批 | 预算管理员、财务人员 | P0 | 待开发 |
| REQ-ADJUST-HISTORY-001 | 调整历史追溯 | 预算管理员 | P1 | 待开发 |
| REQ-ANALYSIS-VARIANCE-001 | 预算差异分析 | 预算管理员 | P0 | 待开发 |
| REQ-ANALYSIS-FORECAST-001 | 执行力预估 | 预算管理员 | P0 | 待开发 |
| REQ-ANALYSIS-REPORT-001 | 多维度报表 | 预算管理员、部门负责人 | P0 | 待开发 |
| REQ-ANALYSIS-DASHBOARD-001 | 可视化仪表板 | 预算管理员、部门负责人 | P1 | 待开发 |
| REQ-MASTER-ORG-001 | 组织架构管理 | 系统管理员 | P0 | 待开发 |
| REQ-MASTER-IPD-001 | IPD项目管理 | 预算管理员 | P0 | 待开发 |
| REQ-MASTER-ACCOUNT-001 | 预算科目管理 | 系统管理员 | P0 | 待开发 |
| REQ-MASTER-TEMPLATE-001 | 导入模板管理 | 系统管理员 | P1 | 待开发 |
| REQ-SYS-AUTH-001 | 用户权限管理 | 系统管理员 | P0 | 待开发 |
| REQ-SYS-CONFIG-001 | 系统配置管理 | 系统管理员 | P1 | 待开发 |
| REQ-SYS-LOG-001 | 操作日志管理 | 系统管理员 | P1 | 待开发 |

## 附录

### A. 参考文档
- 企业预算管理制度
- IPD项目管理规范
- 采购管理流程文档
- 财务管理制度

### B. 变更历史
| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2025-01-18 | 初始版本 | SDD Agent |

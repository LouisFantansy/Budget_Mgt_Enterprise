# 企业级预算管理系统 - 测试计划

## 1. 测试概述

### 1.1 项目信息
- **项目名称**: 企业级预算管理系统 (Budget Management Enterprise)
- **测试范围**: 后端模型、序列化器、API接口、数据质量
- **测试环境**: Django 4.2 + MySQL 8.0 + DRF 3.15
- **测试日期**: 2026-04-18

### 1.2 测试目标
1. 验证预算核心模型的业务逻辑正确性
2. 验证序列化器的数据转换正确性
3. 验证API接口的功能和权限控制
4. 验证生成的测试数据质量符合预期
5. 确保每个二级部门至少有100条预算记录

---

## 2. 测试范围

### 2.1 单元测试（模型层）
| 测试项 | 说明 | 优先级 |
|--------|------|--------|
| Budget 创建 | 验证预算对象创建和字符串表示 | P0 |
| 版本号递增 | 验证 increment_minor / increment_major | P0 |
| 唯一约束 | 验证 department+year+category+source+version 唯一性 | P0 |
| 动态字段 | 验证 BudgetItem field_data 读写 | P0 |
| 状态流转 | 验证 DRAFT -> PENDING -> APPROVED/REJECTED | P0 |
| 版本日志 | 验证 BudgetVersionLog 创建 | P1 |
| 采购历史 | 验证 PurchaseHistory 推荐单价计算 | P1 |
| 部门层级 | 验证 Department 一级/二级类型判断 | P1 |

### 2.2 序列化器测试
| 测试项 | 说明 | 优先级 |
|--------|------|--------|
| BudgetSerializer | 验证预算详情序列化 | P0 |
| BudgetListSerializer | 验证预算列表序列化 | P0 |
| BudgetItemSerializer | 验证条目序列化 | P0 |

### 2.3 API功能测试
| 测试项 | 说明 | 优先级 |
|--------|------|--------|
| 预算列表 | GET /api/budgets/ | P0 |
| 预算详情 | GET /api/budgets/{id}/ | P0 |
| 预算创建 | POST /api/budgets/ | P0 |
| 条目列表 | GET /api/budgets/{id}/items/ | P0 |
| 添加条目 | POST /api/budgets/{id}/add_item/ | P0 |
| 提交审批 | POST /api/budgets/{id}/submit/ | P0 |
| 审批通过 | POST /api/budgets/{id}/approve/ | P0 |
| 审批驳回 | POST /api/budgets/{id}/approve/ | P0 |
| 修订预算 | POST /api/budgets/{id}/revise/ | P0 |
| 修改留痕 | GET /api/budgets/{id}/change_logs/ | P1 |
| 版本日志 | GET /api/budgets/{id}/version_logs/ | P1 |
| 历史采购 | GET /api/purchase-history/ | P1 |
| 年份筛选 | GET /api/budgets/?year=2026 | P1 |
| 类别筛选 | GET /api/budgets/?category=OPEX | P1 |
| 权限控制 | 验证未认证/无权限访问返回401/403 | P0 |
| 二级部门过滤 | 验证二级用户只能看本部门数据 | P0 |

### 2.4 数据质量验证
| 测试项 | 说明 | 预期结果 |
|--------|------|----------|
| 二级部门数量 | 验证有9个二级部门 | = 9 |
| 每部门预算数 | 每个部门预算 >= 100 | >= 100 |
| 预算明细完整性 | 所有预算都有条目 | = 0 缺失 |
| 金额非负 | 所有预算金额 >= 0 | = 0 负数 |
| 状态合法性 | 所有状态在枚举范围内 | = 0 非法 |
| 年份范围 | 所有年份在 2023-2027 | = 0 超出 |
| 来源合法性 | 所有来源在枚举范围内 | = 0 非法 |
| 类别合法性 | 所有类别在枚举范围内 | = 0 非法 |
| 推荐单价 | suggested_price = historical * 1.2 | = 0 错误 |
| 角色完整性 | 8个系统角色全部存在 | = 8 |
| 用户角色 | 所有用户有角色 | = 0 缺失 |
| 模板存在 | 预算模板和字段已创建 | True |

---

## 3. 测试环境

### 3.1 硬件环境
- 本地开发机

### 3.2 软件环境
- Python 3.9
- Django 4.2.29
- Django REST Framework 3.15.2
- MySQL 8.0 (Docker)
- mysqlclient 2.2.0

### 3.3 测试数据库
- 数据库名: `budget_management`
- 用户名: `root`
- 密码: `root123456`
- 端口: `3306`

---

## 4. 测试执行计划

### 4.1 执行步骤
1. **环境准备**: 确保 MySQL 容器运行，数据库可连接
2. **数据生成**: 运行 `python manage.py generate_test_data`
3. **单元测试**: 运行 `python manage.py test apps.budget.tests`
4. **数据验证**: 运行 `python manage.py validate_test_data`
5. **结果分析**: 收集测试输出，分析失败原因

### 4.2 通过标准
- 所有单元测试和功能测试通过（0 失败）
- 数据质量验证全部通过（0 错误）
- 每个二级部门预算数量 >= 100

---

## 5. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据库连接失败 | 测试无法执行 | 确认 Docker MySQL 容器运行正常 |
| 迁移循环依赖 | 无法创建表结构 | 删除旧迁移重新生成 |
| 数据生成重复 | 唯一约束冲突 | 使用 get_or_create 或版本号递增 |

---

## 6. 交付物

- [x] 测试数据生成脚本 (`apps/budget/management/commands/generate_test_data.py`)
- [x] 数据验证脚本 (`apps/budget/management/commands/validate_test_data.py`)
- [x] 单元测试和功能测试代码 (`apps/budget/tests.py`)
- [x] 测试计划文档 (本文档)
- [x] 测试报告

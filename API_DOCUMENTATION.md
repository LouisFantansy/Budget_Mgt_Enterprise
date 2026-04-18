# API 接口文档

## 概述

本文档描述企业级预算管理系统的 RESTful API 接口。

### 基础信息

- **Base URL**: `http://localhost/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

### 认证

所有 API 请求（除登录/注册外）需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证模块

### 登录

```http
POST /auth/login/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "email": "admin@example.com",
      "avatar": null,
      "roles": ["ADMIN"],
      "permissions": ["*"]
    }
  }
}
```

### 刷新 Token

```http
POST /auth/refresh/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| refresh | string | 是 | 刷新令牌 |

### 获取当前用户信息

```http
GET /auth/me/
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": null,
    "department": {
      "id": 1,
      "name": "研发部",
      "code": "RD"
    },
    "roles": [
      {
        "id": 1,
        "name": "系统管理员",
        "code": "ADMIN"
      }
    ],
    "permissions": ["*"]
  }
}
```

### 修改密码

```http
POST /auth/change-password/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码（至少8位） |

### 上传头像

```http
POST /auth/avatar/
```

**请求参数**：

- Content-Type: `multipart/form-data`
- 字段名: `avatar`
- 文件类型: jpg, png, gif
- 文件大小: 最大 2MB

---

## 用户管理

### 获取用户列表

```http
GET /users/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码，默认 1 |
| pageSize | int | 每页数量，默认 20 |
| keyword | string | 搜索关键词（用户名/姓名） |
| departmentId | int | 部门 ID |
| status | string | 状态：ACTIVE, INACTIVE, LOCKED |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "realName": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": "ACTIVE",
        "department": { ... },
        "roles": [ ... ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 创建用户

```http
POST /users/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码 |
| realName | string | 是 | 真实姓名 |
| email | string | 是 | 邮箱 |
| phone | string | 否 | 手机号 |
| departmentId | int | 是 | 部门 ID |
| roleIds | array | 是 | 角色 ID 列表 |

### 更新用户

```http
PUT /users/{id}/
```

### 删除用户

```http
DELETE /users/{id}/
```

### 重置密码

```http
POST /users/{id}/reset-password/
```

---

## 部门管理

### 获取部门列表

```http
GET /departments/
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "研发部",
      "code": "RD",
      "level": 1,
      "parentId": null,
      "managerId": 1,
      "manager": { ... },
      "children": [
        {
          "id": 2,
          "name": "前端组",
          "code": "RD-FE",
          "level": 2,
          "parentId": 1
        }
      ]
    }
  ]
}
```

### 创建部门

```http
POST /departments/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | string | 是 | 部门名称 |
| code | string | 是 | 部门编码 |
| level | int | 是 | 层级：1, 2, 3 |
| parentId | int | 否 | 上级部门 ID |
| managerId | int | 否 | 负责人 ID |

### 更新部门

```http
PUT /departments/{id}/
```

### 删除部门

```http
DELETE /departments/{id}/
```

---

## 预算管理

### 获取预算列表

```http
GET /budgets/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |
| year | int | 预算年度 |
| departmentId | int | 部门 ID |
| category | string | 类别：OPEX, CAPEX |
| status | string | 状态：DRAFT, PENDING, APPROVED, REJECTED |
| keyword | string | 搜索关键词 |

### 创建预算

```http
POST /budgets/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| year | int | 是 | 预算年度 |
| departmentId | int | 是 | 部门 ID |
| category | string | 是 | OPEX 或 CAPEX |
| name | string | 是 | 预算名称 |
| totalAmount | decimal | 是 | 预算总额 |
| description | string | 否 | 预算说明 |
| items | array | 是 | 预算明细列表 |

**预算明细项**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | string | 是 | 项目名称 |
| specification | string | 否 | 规格型号 |
| quantity | int | 是 | 数量 |
| unitPrice | decimal | 是 | 单价 |
| month | int | 是 | 月份 1-12 |

### 获取预算详情

```http
GET /budgets/{id}/
```

### 更新预算

```http
PUT /budgets/{id}/
```

### 删除预算

```http
DELETE /budgets/{id}/
```

### 提交审批

```http
POST /budgets/{id}/submit/
```

### 审批预算

```http
POST /budgets/{id}/approve/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| action | string | 是 | APPROVE 或 REJECT |
| comment | string | 否 | 审批意见 |

### 获取预算汇总

```http
GET /analysis/budget-summary/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| year | int | 年度 |
| departmentId | int | 部门 ID |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalBudget": 1000000,
    "totalUsed": 500000,
    "totalOccupied": 200000,
    "totalAvailable": 300000,
    "usageRate": 50.0,
    "byDepartment": [...],
    "byCategory": [...]
  }
}
```

### 获取预算使用统计

```http
GET /analysis/budget-usage/
```

---

## 采购申请

### 获取采购申请列表

```http
GET /purchase-requests/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |
| status | string | 状态：DRAFT, PENDING, APPROVED, REJECTED |
| budgetId | int | 关联预算 ID |

### 创建采购申请

```http
POST /purchase-requests/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| budgetId | int | 是 | 关联预算 ID |
| title | string | 是 | 申请标题 |
| items | array | 是 | 采购明细 |
| reason | string | 否 | 申请理由 |

**采购明细项**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | string | 是 | 物品名称 |
| specification | string | 否 | 规格型号 |
| quantity | int | 是 | 数量 |
| unitPrice | decimal | 是 | 预估单价 |

### 获取采购申请详情

```http
GET /purchase-requests/{id}/
```

### 更新采购申请

```http
PUT /purchase-requests/{id}/
```

### 删除采购申请

```http
DELETE /purchase-requests/{id}/
```

### 提交审批

```http
POST /purchase-requests/{id}/submit/
```

### 审批采购申请

```http
POST /purchase-requests/{id}/approve/
```

---

## 审批工作流

### 获取待审批列表

```http
GET /approvals/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |
| status | string | PENDING, APPROVED, REJECTED |
| targetType | string | BUDGET 或 PURCHASE |

### 获取审批历史

```http
GET /approvals/history/
```

### 处理审批

```http
POST /approvals/{id}/process/
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| action | string | 是 | APPROVE 或 REJECT |
| comment | string | 否 | 审批意见 |

---

## 报表分析

### 获取仪表盘数据

```http
GET /analysis/dashboard/
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalBudget": 1000000,
    "usedBudget": 500000,
    "pendingApprovals": 10,
    "monthlyNew": 5
  }
}
```

### 获取月度趋势

```http
GET /analysis/monthly-trend/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| year | int | 年度 |

### 获取预算预警

```http
GET /analysis/budget-warnings/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| threshold | int | 预警阈值百分比，默认 80 |

---

## 审计日志

### 获取审计日志列表

```http
GET /audit-logs/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |
| userId | int | 用户 ID |
| action | string | 操作类型 |
| startDate | string | 开始日期 YYYY-MM-DD |
| endDate | string | 结束日期 YYYY-MM-DD |

### 获取操作详情

```http
GET /audit-logs/{id}/
```

---

## 通知消息

### 获取通知列表

```http
GET /notifications/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |
| isRead | bool | 是否已读 |

### 标记已读

```http
POST /notifications/{id}/read/
```

### 标记全部已读

```http
POST /notifications/read-all/
```

### 获取未读数量

```http
GET /notifications/unread-count/
```

---

## 数据导入导出

### 导入预算数据

```http
POST /import-export/budgets/import/
```

**请求参数**：

- Content-Type: `multipart/form-data`
- 字段名: `file`
- 文件类型: xlsx, xls

### 导出预算数据

```http
GET /import-export/budgets/export/
```

**查询参数**：

| 字段 | 类型 | 说明 |
|-----|------|------|
| year | int | 年度 |
| departmentId | int | 部门 ID |

### 下载导入模板

```http
GET /import-export/budgets/template/
```

---

## WebSocket 实时通知

### 连接地址

```
ws://localhost/ws/notifications/
```

### 认证

连接时需要在 query 参数中传递 token：

```
ws://localhost/ws/notifications/?token=<jwt-token>
```

### 消息格式

```json
{
  "type": "notification",
  "data": {
    "id": 1,
    "title": "新的审批任务",
    "content": "您有一个新的预算审批待处理",
    "type": "APPROVAL",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 消息类型

| 类型 | 说明 |
|-----|------|
| notification | 新通知 |
| approval | 审批提醒 |
| budget_warning | 预算预警 |

---

## 附录

### 错误码列表

| 错误码 | 说明 |
|-------|------|
| 1001 | 用户名或密码错误 |
| 1002 | Token 已过期 |
| 1003 | 无权限访问 |
| 2001 | 预算余额不足 |
| 2002 | 预算状态不允许操作 |
| 3001 | 部门不存在 |
| 3002 | 用户不存在 |
| 4001 | 参数验证失败 |
| 5001 | 服务器内部错误 |

### 枚举值定义

#### 预算类别

| 值 | 说明 |
|---|------|
| OPEX | 运营支出 |
| CAPEX | 资本支出 |

#### 预算状态

| 值 | 说明 |
|---|------|
| DRAFT | 草稿 |
| PENDING | 待审批 |
| APPROVED | 已批准 |
| REJECTED | 已拒绝 |

#### 用户状态

| 值 | 说明 |
|---|------|
| ACTIVE | 正常 |
| INACTIVE | 停用 |
| LOCKED | 锁定 |

#### 审批动作

| 值 | 说明 |
|---|------|
| APPROVE | 通过 |
| REJECT | 拒绝 |

---

**文档版本**: v3.0  
**更新日期**: 2024-04-18

# 数据库设计文档

## 概述

本文档描述企业级预算管理系统的数据库设计。

### 数据库信息

- **数据库**: MySQL 8.0+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **时区**: Asia/Shanghai

### ER 图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   departments   │     │     users       │     │     roles       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ department_id   │     │ id (PK)         │
│ name            │     │ id (PK)         │     │ name            │
│ code            │     │ username        │     │ code            │
│ level           │     │ password        │     │ permissions     │
│ parent_id       │────<│ real_name       │     └─────────────────┘
│ manager_id      │────<│ email           │              │
└─────────────────┘     │ phone           │              │
         │              │ avatar          │     ┌─────────────────┐
         │              │ status          │     │  user_roles     │
         │              │ last_login_at   │     ├─────────────────┤
         │              │ created_at      │     │ user_id (FK)    │
         │              └─────────────────┘     │ role_id (FK)    │
         │                      │               └─────────────────┘
         │                      │
         │              ┌─────────────────┐
         │              │  notifications  │
         │              ├─────────────────┤
         └─────────────<│ user_id (FK)    │
                        │ ...             │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    budgets      │     │  budget_items   │     │budget_adjustments│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │<────│ budget_id (FK)  │     │ id (PK)         │
│ code            │     │ id (PK)         │<────│ budget_id (FK)  │
│ year            │     │ name            │     │ ...             │
│ department_id   │>────┤ specification   │     └─────────────────┘
│ category        │     │ quantity        │
│ total_amount    │     │ unit_price      │
│ used_amount     │     │ month           │
│ occupied_amount │     └─────────────────┘
│ status          │
│ version         │
└─────────────────┘
         │
         │
         │              ┌─────────────────┐
         └─────────────<│ purchase_requests│
                        ├─────────────────┤
                        │ id (PK)         │
                        │ budget_id (FK)  │
                        │ ...             │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  approval_flows │     │ approval_records│
├─────────────────┤     ├─────────────────┤
│ id (PK)         │<────│ flow_id (FK)    │
│ target_type     │     │ id (PK)         │
│ target_id       │     │ approver_id     │>────┐
│ current_step    │     │ action          │     │
│ status          │     │ comment         │     │
└─────────────────┘     └─────────────────┘     │
                                                │
┌─────────────────┐     ┌─────────────────┐     │
│   audit_logs    │     │  workflow_nodes │     │
├─────────────────┤     ├─────────────────┤     │
│ id (PK)         │     │ id (PK)         │     │
│ user_id         │>────┤ approver_id     │>────┘
│ action          │     │ ...             │
│ ...             │     └─────────────────┘
└─────────────────┘
```

---

## 表结构

### 1. 部门表 (departments)

存储部门层级结构信息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | NOT NULL | 部门名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 部门编码 |
| level | INT | NOT NULL | 层级：1, 2, 3 |
| parent_id | BIGINT | FK → departments.id | 上级部门 ID |
| manager_id | BIGINT | FK → users.id | 负责人 ID |
| budget_manager_id | BIGINT | FK → users.id | 预算管理员 ID |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_parent_id`: parent_id
- `idx_level`: level
- `idx_code`: code (UNIQUE)

---

### 2. 用户表 (users)

存储系统用户信息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名 |
| password | VARCHAR(255) | NOT NULL | 加密密码 |
| real_name | VARCHAR(100) | NOT NULL | 真实姓名 |
| email | VARCHAR(100) | NOT NULL, UNIQUE | 邮箱 |
| phone | VARCHAR(20) | NULL | 手机号 |
| avatar | VARCHAR(500) | NULL | 头像 URL |
| department_id | BIGINT | FK → departments.id | 部门 ID |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | 状态 |
| last_login_at | DATETIME | NULL | 最后登录时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_username`: username (UNIQUE)
- `idx_email`: email (UNIQUE)
- `idx_department_id`: department_id
- `idx_status`: status

---

### 3. 角色表 (roles)

存储系统角色信息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | NOT NULL | 角色名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 角色编码 |
| description | VARCHAR(500) | NULL | 角色描述 |
| permissions | JSON | NOT NULL | 权限列表 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_code`: code (UNIQUE)

---

### 4. 用户角色关联表 (user_roles)

用户和角色的多对多关联。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| user_id | BIGINT | PK, FK → users.id | 用户 ID |
| role_id | BIGINT | PK, FK → roles.id | 角色 ID |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_user_id`: user_id
- `idx_role_id`: role_id

---

### 5. 预算表 (budgets)

存储预算主信息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 预算编号 |
| year | INT | NOT NULL | 预算年度 |
| department_id | BIGINT | FK → departments.id | 部门 ID |
| category | VARCHAR(20) | NOT NULL | 类别：OPEX/CAPEX |
| name | VARCHAR(200) | NOT NULL | 预算名称 |
| description | TEXT | NULL | 预算说明 |
| total_amount | DECIMAL(15,2) | NOT NULL | 预算总额 |
| used_amount | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | 已使用金额 |
| occupied_amount | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | 已占用金额 |
| available_amount | DECIMAL(15,2) | NOT NULL | 可用金额 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | 状态 |
| version | INT | NOT NULL, DEFAULT 1 | 版本号 |
| created_by | BIGINT | FK → users.id | 创建人 |
| approved_by | BIGINT | FK → users.id | 审批人 |
| approved_at | DATETIME | NULL | 审批时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_code`: code (UNIQUE)
- `idx_year`: year
- `idx_department_id`: department_id
- `idx_category`: category
- `idx_status`: status

---

### 6. 预算明细表 (budget_items)

存储预算明细项。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| budget_id | BIGINT | FK → budgets.id | 预算 ID |
| name | VARCHAR(200) | NOT NULL | 项目名称 |
| specification | VARCHAR(500) | NULL | 规格型号 |
| quantity | INT | NOT NULL | 数量 |
| unit_price | DECIMAL(15,2) | NOT NULL | 单价 |
| total_price | DECIMAL(15,2) | NOT NULL | 总价 |
| month | INT | NOT NULL | 月份 1-12 |
| project | VARCHAR(200) | NULL | 关联项目 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_budget_id`: budget_id
- `idx_month`: month

---

### 7. 预算调整表 (budget_adjustments)

存储预算调整记录。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| budget_id | BIGINT | FK → budgets.id | 预算 ID |
| type | VARCHAR(20) | NOT NULL | 调整类型：INCREASE/DECREASE |
| amount | DECIMAL(15,2) | NOT NULL | 调整金额 |
| reason | TEXT | NOT NULL | 调整原因 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | 状态 |
| created_by | BIGINT | FK → users.id | 创建人 |
| approved_by | BIGINT | FK → users.id | 审批人 |
| approved_at | DATETIME | NULL | 审批时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_budget_id`: budget_id
- `idx_status`: status

---

### 8. 采购申请表 (purchase_requests)

存储采购申请信息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 申请编号 |
| budget_id | BIGINT | FK → budgets.id | 关联预算 ID |
| title | VARCHAR(200) | NOT NULL | 申请标题 |
| reason | TEXT | NULL | 申请理由 |
| total_amount | DECIMAL(15,2) | NOT NULL | 申请总金额 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | 状态 |
| current_step | INT | NOT NULL, DEFAULT 0 | 当前审批步骤 |
| created_by | BIGINT | FK → users.id | 创建人 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| submitted_at | DATETIME | NULL | 提交时间 |
| completed_at | DATETIME | NULL | 完成时间 |

**索引**：
- `idx_code`: code (UNIQUE)
- `idx_budget_id`: budget_id
- `idx_status`: status
- `idx_created_by`: created_by

---

### 9. 采购申请明细表 (purchase_request_items)

存储采购申请明细。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| request_id | BIGINT | FK → purchase_requests.id | 申请 ID |
| name | VARCHAR(200) | NOT NULL | 物品名称 |
| specification | VARCHAR(500) | NULL | 规格型号 |
| quantity | INT | NOT NULL | 数量 |
| unit_price | DECIMAL(15,2) | NOT NULL | 预估单价 |
| total_price | DECIMAL(15,2) | NOT NULL | 总价 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_request_id`: request_id

---

### 10. 审批流程表 (approval_flows)

存储审批流程实例。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| target_type | VARCHAR(50) | NOT NULL | 目标类型：BUDGET/PURCHASE |
| target_id | BIGINT | NOT NULL | 目标 ID |
| current_step | INT | NOT NULL, DEFAULT 0 | 当前步骤 |
| total_steps | INT | NOT NULL | 总步骤数 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | 状态 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| completed_at | DATETIME | NULL | 完成时间 |

**索引**：
- `idx_target`: target_type, target_id (UNIQUE)
- `idx_status`: status

---

### 11. 审批记录表 (approval_records)

存储审批历史记录。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| flow_id | BIGINT | FK → approval_flows.id | 流程 ID |
| step | INT | NOT NULL | 步骤序号 |
| approver_id | BIGINT | FK → users.id | 审批人 ID |
| action | VARCHAR(20) | NOT NULL | 动作：APPROVE/REJECT |
| comment | TEXT | NULL | 审批意见 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_flow_id`: flow_id
- `idx_approver_id`: approver_id

---

### 12. 工作流节点表 (workflow_nodes)

存储审批工作流节点配置。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | NOT NULL | 节点名称 |
| step | INT | NOT NULL | 步骤序号 |
| approver_type | VARCHAR(20) | NOT NULL | 审批人类型：ROLE/USER/DEPARTMENT |
| approver_id | BIGINT | NULL | 审批人 ID |
| role_id | BIGINT | FK → roles.id | 角色 ID |
| department_id | BIGINT | FK → departments.id | 部门 ID |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**：
- `idx_step`: step

---

### 13. 审计日志表 (audit_logs)

存储系统操作审计日志。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| user_id | BIGINT | FK → users.id | 用户 ID |
| action | VARCHAR(50) | NOT NULL | 操作类型 |
| target_type | VARCHAR(50) | NOT NULL | 目标类型 |
| target_id | BIGINT | NULL | 目标 ID |
| old_values | JSON | NULL | 旧值 |
| new_values | JSON | NULL | 新值 |
| ip_address | VARCHAR(50) | NULL | IP 地址 |
| user_agent | VARCHAR(500) | NULL | 用户代理 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_user_id`: user_id
- `idx_action`: action
- `idx_target`: target_type, target_id
- `idx_created_at`: created_at

---

### 14. 通知表 (notifications)

存储用户通知消息。

| 字段 | 类型 | 约束 | 说明 |
|-----|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| user_id | BIGINT | FK → users.id | 接收用户 ID |
| type | VARCHAR(50) | NOT NULL | 通知类型 |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | TEXT | NOT NULL | 内容 |
| data | JSON | NULL | 附加数据 |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否已读 |
| read_at | DATETIME | NULL | 阅读时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_user_id`: user_id
- `idx_is_read`: is_read
- `idx_created_at`: created_at

---

## 数据库初始化

### 创建数据库

```sql
CREATE DATABASE budget_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### 创建用户

```sql
CREATE USER 'budget_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON budget_management.* TO 'budget_user'@'%';
FLUSH PRIVILEGES;
```

### Django 迁移

```bash
# 生成迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 导入初始数据
python manage.py seed_data
```

---

## 数据备份与恢复

### 备份

```bash
# 使用 mysqldump
mysqldump -u budget_user -p budget_management > backup_$(date +%Y%m%d).sql

# 使用 Django
docker-compose exec backend python manage.py dumpdata > backup.json
```

### 恢复

```bash
# 使用 mysql
mysql -u budget_user -p budget_management < backup_20240101.sql

# 使用 Django
docker-compose exec backend python manage.py loaddata backup.json
```

---

## 性能优化

### 索引优化

- 所有外键字段已建立索引
- 常用查询字段已建立索引
- 考虑为组合查询添加复合索引

### 分区建议

对于大数据量的表，建议按时间分区：

```sql
-- 审计日志表按年分区
ALTER TABLE audit_logs 
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 定期维护

```sql
-- 优化表
OPTIMIZE TABLE audit_logs;

-- 分析表
ANALYZE TABLE budgets;

-- 清理过期通知（保留90天）
DELETE FROM notifications 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

**文档版本**: v3.0  
**更新日期**: 2024-04-18

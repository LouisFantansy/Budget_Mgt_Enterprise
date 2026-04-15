# EARS格式规范

## 概述
EARS (Easy Approach to Requirements Syntax) 是一种简化的需求语法方法，用于编写清晰、可测试的需求。

## EARS模式类型

### 1. 普遍性需求 (Ubiquitous)
**格式**: `The <system> shall <action>`

**适用场景**: 系统必须始终执行的功能

**示例**:
- The budget management system shall validate all input data before processing
- The system shall maintain an audit log for all budget modifications

### 2. 事件驱动需求 (Event-driven)
**格式**: `When <trigger>, the <system> shall <action>`

**适用场景**: 由特定事件触发的功能

**示例**:
- When a budget adjustment request is submitted, the system shall send notification to the approver
- When the budget execution rate exceeds 80%, the system shall generate an alert

### 3. 状态驱动需求 (State-driven)
**格式**: `While <state>, the <system> shall <action>`

**适用场景**: 在特定状态下持续执行的功能

**示例**:
- While a budget is in "under review" status, the system shall restrict modification operations
- While the system is in month-end closing state, it shall allow only read operations

### 4. 可选功能需求 (Optional feature)
**格式**: `Where <feature> is included, the <system> shall <action>`

**适用场景**: 可选功能模块的需求

**示例**:
- Where the advanced analytics module is included, the system shall provide trend forecasting capabilities
- Where the multi-currency feature is enabled, the system shall support currency conversion

### 5. 异常处理需求 (Unwanted behavior)
**格式**: `The <system> shall <action> in order to <purpose>`

**适用场景**: 防止或处理异常情况

**示例**:
- The system shall validate user permissions in order to prevent unauthorized budget modifications
- The system shall maintain data backup in order to prevent data loss

## 验收标准编写规则

### 结构化验收标准
每个需求应包含明确的验收标准，格式如下：

```markdown
**验收标准**:
- Given: [前置条件]
- When: [触发动作]
- Then: [预期结果]
```

### 示例
```markdown
**需求**: When a new budget item is created, the system shall automatically generate a unique budget ID

**验收标准**:
- Given: 用户已登录且具有预算创建权限
- When: 用户提交新的预算项创建请求
- Then: 系统生成唯一预算ID，格式为"CAP-YYYY-NNNN"或"OPE-YYYY-NNNN"
```

## 需求优先级定义

### P0 - 核心功能
- 系统必须具备的核心功能
- 缺少将导致系统无法运行

### P1 - 重要功能
- 显著影响用户体验的功能
- 应在首个版本中实现

### P2 - 增强功能
- 提升系统价值的增强功能
- 可在后续版本中实现

### P3 - 可选功能
- 锦上添花的可选功能
- 根据资源情况决定是否实现

## 需求编写最佳实践

1. **原子性**: 每个需求应描述单一功能点
2. **可测试性**: 需求应可通过测试验证
3. **无歧义性**: 使用明确、具体的术语
4. **完整性**: 包含所有必要的前置条件和约束
5. **可追溯性**: 每个需求应有唯一标识符

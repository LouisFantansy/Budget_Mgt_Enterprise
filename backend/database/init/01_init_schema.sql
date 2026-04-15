-- 预算管理系统数据库初始化脚本
-- 版本: 1.0
-- 日期: 2025-01-18

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. 组织架构表
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES organizations(id),
    org_level INTEGER NOT NULL CHECK (org_level IN (1, 2, 3)),
    cost_center VARCHAR(50),
    manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

COMMENT ON TABLE organizations IS '组织架构表';
COMMENT ON COLUMN organizations.org_level IS '组织层级: 1-公司, 2-一级部门, 3-二级部门';

-- ============================================
-- 2. IPD项目表
-- ============================================
CREATE TABLE ipd_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES ipd_projects(id),
    manager_id UUID,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'ongoing', 'completed', 'paused')),
    budget_amount DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ipd_projects IS 'IPD项目表';

-- ============================================
-- 3. 预算科目表
-- ============================================
CREATE TABLE budget_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CAPEX', 'OPEX')),
    parent_id UUID REFERENCES budget_accounts(id),
    account_level INTEGER NOT NULL,
    is_leaf BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE budget_accounts IS '预算科目表';

-- ============================================
-- 4. 用户表
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department_id UUID REFERENCES organizations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS '用户表';

-- 更新组织架构表的manager_id外键
ALTER TABLE organizations ADD CONSTRAINT fk_org_manager FOREIGN KEY (manager_id) REFERENCES users(id);

-- ============================================
-- 5. 角色表
-- ============================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS '角色表';

-- ============================================
-- 6. 用户角色关联表
-- ============================================
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS '用户角色关联表';

-- ============================================
-- 7. 预算主表
-- ============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_no VARCHAR(50) UNIQUE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('CAPEX', 'OPEX')),
    department_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID REFERENCES ipd_projects(id),
    total_amount DECIMAL(15,2) NOT NULL,
    executed_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    execution_rate DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP
);

COMMENT ON TABLE budgets IS '预算主表';

-- ============================================
-- 8. 预算明细表
-- ============================================
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES budget_accounts(id),
    item_name VARCHAR(200) NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    executed_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    remark TEXT,
    line_no INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE budget_items IS '预算明细表';

-- ============================================
-- 9. PR记录表
-- ============================================
CREATE TABLE pr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pr_no VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES ipd_projects(id),
    request_date DATE NOT NULL,
    material_desc VARCHAR(500),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    budget_id UUID REFERENCES budgets(id),
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('CAPEX', 'OPEX')),
    match_status VARCHAR(20) CHECK (match_status IN ('matched', 'partial', 'unmatched')),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_by UUID REFERENCES users(id)
);

COMMENT ON TABLE pr_records IS 'PR记录表';
COMMENT ON COLUMN pr_records.total_amount IS 'PR总金额（研发部门提起采购时知道的金额）';

-- ============================================
-- 10. PO记录表
-- ============================================
CREATE TABLE po_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_no VARCHAR(50) UNIQUE NOT NULL,
    pr_no VARCHAR(50),
    vendor_name VARCHAR(200),
    order_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    pr_amount DECIMAL(15,2),
    pr_po_gap DECIMAL(15,2),
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('CAPEX', 'OPEX')),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_by UUID REFERENCES users(id)
);

COMMENT ON TABLE po_records IS 'PO记录表';
COMMENT ON COLUMN po_records.total_amount IS 'PO总金额（采购议价后的最终金额，月底财务提供）';
COMMENT ON COLUMN po_records.pr_po_gap IS 'PR-PO Gap（PR金额 - PO金额）';

-- ============================================
-- 11. 结算记录表
-- ============================================
CREATE TABLE settlement_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_no VARCHAR(50) UNIQUE NOT NULL,
    po_no VARCHAR(50),
    settlement_date DATE NOT NULL,
    settlement_amount DECIMAL(15,2) NOT NULL,
    invoice_no VARCHAR(50),
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('CAPEX', 'OPEX')),
    acceptance_status VARCHAR(20) CHECK (acceptance_status IN ('pending', 'completed')),
    acceptance_date DATE,
    is_in_transit BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_by UUID REFERENCES users(id)
);

COMMENT ON TABLE settlement_records IS '结算记录表';
COMMENT ON COLUMN settlement_records.settlement_amount IS '结算金额（财务完结金额）';
COMMENT ON COLUMN settlement_records.is_in_transit IS '是否在途采购（已提PR未验收的OPEX）';

-- ============================================
-- 12. 数据Mapping记录表
-- ============================================
CREATE TABLE data_mapping_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapping_date DATE NOT NULL,
    pr_id UUID REFERENCES pr_records(id),
    po_id UUID REFERENCES po_records(id),
    settlement_id UUID REFERENCES settlement_records(id),
    budget_id UUID REFERENCES budgets(id),
    mapping_type VARCHAR(20) NOT NULL CHECK (mapping_type IN ('PO_NO', 'BUDGET_NO', 'MANUAL')),
    match_status VARCHAR(20) NOT NULL CHECK (match_status IN ('full', 'partial', 'none')),
    match_confidence DECIMAL(5,2),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    variance_reason VARCHAR(50),
    variance_desc TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE data_mapping_records IS '数据Mapping记录表';

-- ============================================
-- 13. 预算调整表
-- ============================================
CREATE TABLE budget_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_no VARCHAR(50) UNIQUE NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id),
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('ADD', 'REDUCE', 'TRANSFER', 'CHANGE_ACCOUNT')),
    original_amount DECIMAL(15,2) NOT NULL,
    adjustment_amount DECIMAL(15,2) NOT NULL,
    new_amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    reason_category VARCHAR(50),
    impact_analysis TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP
);

COMMENT ON TABLE budget_adjustments IS '预算调整表';

-- ============================================
-- 14. 操作日志表
-- ============================================
CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    username VARCHAR(50) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    operation_desc VARCHAR(200),
    resource_type VARCHAR(50),
    resource_id UUID,
    request_method VARCHAR(10),
    request_url VARCHAR(500),
    request_params TEXT,
    response_status INTEGER,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    execution_time INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE operation_logs IS '操作日志表';

-- ============================================
-- 创建索引
-- ============================================

-- 预算表索引
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_department ON budgets(department_id);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_type_year ON budgets(budget_type, fiscal_year);

-- 预算明细表索引
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_budget_items_account ON budget_items(account_id);

-- PR记录索引
CREATE INDEX idx_pr_records_date ON pr_records(request_date);
CREATE INDEX idx_pr_records_department ON pr_records(department_id);
CREATE INDEX idx_pr_records_budget ON pr_records(budget_id);

-- PO记录索引
CREATE INDEX idx_po_records_pr ON po_records(pr_no);
CREATE INDEX idx_po_records_date ON po_records(order_date);

-- 结算记录索引
CREATE INDEX idx_settlement_po ON settlement_records(po_no);
CREATE INDEX idx_settlement_date ON settlement_records(settlement_date);

-- 调整记录索引
CREATE INDEX idx_adjustments_budget ON budget_adjustments(budget_id);
CREATE INDEX idx_adjustments_status ON budget_adjustments(status);
CREATE INDEX idx_adjustments_date ON budget_adjustments(created_at);

-- 操作日志索引
CREATE INDEX idx_logs_user ON operation_logs(user_id);
CREATE INDEX idx_logs_type ON operation_logs(operation_type);
CREATE INDEX idx_logs_date ON operation_logs(created_at);

-- ============================================
-- 插入初始数据
-- ============================================

-- 插入默认角色
INSERT INTO roles (role_code, role_name, description, is_system) VALUES
('ADMIN', '系统管理员', '系统管理员，拥有所有权限', TRUE),
('BUDGET_ADMIN', '预算管理员', '预算管理员，负责预算编制和执行监控', TRUE),
('DEPT_HEAD', '部门负责人', '部门负责人，负责本部门预算管理', TRUE),
('FINANCE', '财务人员', '财务人员，负责财务数据导入和审批', TRUE),
('USER', '普通用户', '普通用户，只能查看权限范围内的数据', TRUE);

-- 插入默认管理员用户 (密码: admin123，使用bcrypt加密)
INSERT INTO users (username, password, real_name, email, status) VALUES
('admin', '$2b$10$YourHashedPasswordHere', '系统管理员', 'admin@example.com', 'active');

-- 关联管理员角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'admin' AND r.role_code = 'ADMIN';

-- 插入默认组织架构
INSERT INTO organizations (code, name, org_level, status) VALUES
('ORG001', '研发部门', 1, 'active');

-- 插入默认预算科目
INSERT INTO budget_accounts (account_code, account_name, account_type, account_level, is_leaf) VALUES
('CAP001', '设备采购', 'CAPEX', 1, FALSE),
('CAP001-01', '生产设备', 'CAPEX', 2, TRUE),
('CAP001-02', '测试设备', 'CAPEX', 2, TRUE),
('OPE001', '人员成本', 'OPEX', 1, TRUE),
('OPE002', '材料成本', 'OPEX', 1, TRUE),
('OPE003', '外包成本', 'OPEX', 1, TRUE),
('OPE004', '差旅费', 'OPEX', 1, TRUE),
('OPE005', '办公费', 'OPEX', 1, TRUE);

-- ============================================
-- 创建更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ipd_projects_updated_at BEFORE UPDATE ON ipd_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_accounts_updated_at BEFORE UPDATE ON budget_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_adjustments_updated_at BEFORE UPDATE ON budget_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建表: 14张';
    RAISE NOTICE '已创建索引: 15个';
    RAISE NOTICE '已插入初始数据';
    RAISE NOTICE '========================================';
END $$;

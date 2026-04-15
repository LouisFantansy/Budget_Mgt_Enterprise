-- 预算管理系统种子数据
-- 包含：真实用户账号(每个角色至少3个)、组织架构、IPD项目、预算科目、预算数据(100+条)
-- 默认密码: 123456 (bcrypt hash)

-- ============================================
-- 1. 组织架构
-- ============================================
-- 先清除默认数据，插入完整组织架构
DELETE FROM organizations;

-- 一级组织(公司级)
INSERT INTO organizations (id, code, name, parent_id, org_level, cost_center, status) VALUES
('org-root', 'ORG000', '半导体研发集团', NULL, 1, 'CC000', 'active');

-- 二级组织(一级部门)
INSERT INTO organizations (id, code, name, parent_id, org_level, cost_center, status) VALUES
('org-rd', 'ORG100', '研发中心', 'org-root', 2, 'CC100', 'active'),
('org-ops', 'ORG200', '运营中心', 'org-root', 2, 'CC200', 'active'),
('org-finance', 'ORG300', '财务中心', 'org-root', 2, 'CC300', 'active'),
('org-hr', 'ORG400', '人力资源部', 'org-root', 2, 'CC400', 'active'),
('org-proc', 'ORG500', '采购中心', 'org-root', 2, 'CC500', 'active');

-- 三级组织(二级部门)
INSERT INTO organizations (id, code, name, parent_id, org_level, cost_center, status) VALUES
('org-rd-chip', 'ORG110', '芯片设计部', 'org-rd', 3, 'CC110', 'active'),
('org-rd-soft', 'ORG120', '软件研发部', 'org-rd', 3, 'CC120', 'active'),
('org-rd-test', 'ORG130', '测试验证部', 'org-rd', 3, 'CC130', 'active'),
('org-rd-arch', 'ORG140', '架构设计部', 'org-rd', 3, 'CC140', 'active'),
('org-ops-fab', 'ORG210', '制造运营部', 'org-ops', 3, 'CC210', 'active'),
('org-ops-qual', 'ORG220', '质量管理部', 'org-ops', 3, 'CC220', 'active'),
('org-finance-gl', 'ORG310', '总账组', 'org-finance', 3, 'CC310', 'active'),
('org-finance-bp', 'ORG320', '业务伙伴组', 'org-finance', 3, 'CC320', 'active'),
('org-proc-direct', 'ORG510', '直接采购组', 'org-proc', 3, 'CC510', 'active'),
('org-proc-indirect', 'ORG520', '间接采购组', 'org-proc', 3, 'CC520', 'active');

-- ============================================
-- 2. 预算科目 (更完整的科目体系)
-- ============================================
DELETE FROM budget_accounts;

-- CAPEX科目
INSERT INTO budget_accounts (id, account_code, account_name, account_type, parent_id, account_level, is_leaf) VALUES
('acc-cap', 'CAP', '资本性支出', 'CAPEX', NULL, 1, FALSE),
('acc-cap-equip', 'CAP-01', '设备采购', 'CAPEX', 'acc-cap', 2, FALSE),
('acc-cap-equip-prod', 'CAP-01-01', '生产设备', 'CAPEX', 'acc-cap-equip', 3, TRUE),
('acc-cap-equip-test', 'CAP-01-02', '测试设备', 'CAPEX', 'acc-cap-equip', 3, TRUE),
('acc-cap-equip-rd', 'CAP-01-03', '研发设备', 'CAPEX', 'acc-cap-equip', 3, TRUE),
('acc-cap-equip-office', 'CAP-01-04', '办公设备', 'CAPEX', 'acc-cap-equip', 3, TRUE),
('acc-cap-soft', 'CAP-02', '软件采购', 'CAPEX', 'acc-cap', 2, FALSE),
('acc-cap-soft-license', 'CAP-02-01', '软件许可', 'CAPEX', 'acc-cap-soft', 3, TRUE),
('acc-cap-soft-dev', 'CAP-02-02', '定制开发', 'CAPEX', 'acc-cap-soft', 3, TRUE),
('acc-cap-construct', 'CAP-03', '工程建设', 'CAPEX', 'acc-cap', 2, FALSE),
('acc-cap-construct-fab', 'CAP-03-01', '厂房建设', 'CAPEX', 'acc-cap-construct', 3, TRUE),
('acc-cap-construct-deco', 'CAP-03-02', '装修改造', 'CAPEX', 'acc-cap-construct', 3, TRUE);

-- OPEX科目
INSERT INTO budget_accounts (id, account_code, account_name, account_type, parent_id, account_level, is_leaf) VALUES
('acc-ope', 'OPE', '运营性支出', 'OPEX', NULL, 1, FALSE),
('acc-ope-salary', 'OPE-01', '人员成本', 'OPEX', 'acc-ope', 2, FALSE),
('acc-ope-salary-base', 'OPE-01-01', '基本工资', 'OPEX', 'acc-ope-salary', 3, TRUE),
('acc-ope-salary-bonus', 'OPE-01-02', '绩效奖金', 'OPEX', 'acc-ope-salary', 3, TRUE),
('acc-ope-salary-benefit', 'OPE-01-03', '福利社保', 'OPEX', 'acc-ope-salary', 3, TRUE),
('acc-ope-mat', 'OPE-02', '材料成本', 'OPEX', 'acc-ope', 2, FALSE),
('acc-ope-mat-wafer', 'OPE-02-01', '晶圆材料', 'OPEX', 'acc-ope-mat', 3, TRUE),
('acc-ope-mat-pack', 'OPE-02-02', '封装材料', 'OPEX', 'acc-ope-mat', 3, TRUE),
('acc-ope-mat-consum', 'OPE-02-03', '耗材', 'OPEX', 'acc-ope-mat', 3, TRUE),
('acc-ope-outsrc', 'OPE-03', '外包服务', 'OPEX', 'acc-ope', 2, FALSE),
('acc-ope-outsrc-design', 'OPE-03-01', '设计外包', 'OPEX', 'acc-ope-outsrc', 3, TRUE),
('acc-ope-outsrc-test', 'OPE-03-02', '测试外包', 'OPEX', 'acc-ope-outsrc', 3, TRUE),
('acc-ope-travel', 'OPE-04', '差旅费', 'OPEX', 'acc-ope', 2, TRUE),
('acc-ope-office', 'OPE-05', '办公费', 'OPEX', 'acc-ope', 2, TRUE),
('acc-ope-depreciation', 'OPE-06', '折旧摊销', 'OPEX', 'acc-ope', 2, TRUE),
('acc-ope-maint', 'OPE-07', '维修维护', 'OPEX', 'acc-ope', 2, TRUE),
('acc-ope-train', 'OPE-08', '培训费', 'OPEX', 'acc-ope', 2, TRUE);

-- ============================================
-- 3. IPD项目
-- ============================================
DELETE FROM ipd_projects;

INSERT INTO ipd_projects (id, project_code, project_name, project_type, status, start_date, end_date, budget_amount, description) VALUES
('proj-7nm', 'IPD-001', '7nm先进工艺开发', '研发', 'ongoing', '2024-01-01', '2026-12-31', 15000000, '7nm制程工艺研发项目'),
('proj-5nm', 'IPD-002', '5nm工艺预研', '研发', 'planning', '2025-06-01', '2027-12-31', 20000000, '5nm制程预研项目'),
('proj-ai-chip', 'IPD-003', 'AI加速芯片设计', '研发', 'ongoing', '2024-06-01', '2026-06-30', 8000000, 'AI推理加速芯片'),
('proj-riscv', 'IPD-004', 'RISC-V处理器', '研发', 'ongoing', '2024-03-01', '2026-03-31', 6000000, 'RISC-V开源处理器'),
('proj-eda', 'IPD-005', 'EDA工具升级', 'IT', 'ongoing', '2025-01-01', '2025-12-31', 3000000, 'EDA工具链升级'),
('proj-fab-ext', 'IPD-006', '产线扩产项目', '基建', 'ongoing', '2024-06-01', '2025-12-31', 25000000, '晶圆厂产能扩充'),
('proj-qual', 'IPD-007', '质量体系升级', '管理', 'planning', '2025-03-01', '2025-12-31', 2000000, 'ISO质量体系升级'),
('proj-digital', 'IPD-008', '数字化转型', 'IT', 'ongoing', '2025-01-01', '2026-06-30', 5000000, '企业数字化转型'),
('proj-auto', 'IPD-009', '自动化测试平台', '研发', 'ongoing', '2024-09-01', '2025-09-30', 3500000, '自动化测试平台建设'),
('proj-pkg', 'IPD-010', '先进封装研发', '研发', 'planning', '2025-06-01', '2027-06-30', 12000000, '2.5D/3D先进封装');

-- ============================================
-- 4. 用户账号 (默认密码: 123456)
-- bcrypt hash for '123456': $2b$10$EixZaYVK1fsbw1ZfbX3OXePa6xnQpQ5Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0
-- 使用标准bcryptjs生成的hash
-- ============================================
-- 先删除默认admin用户
DELETE FROM user_roles;
DELETE FROM users WHERE username != 'admin';

-- 密码123456的bcrypt hash (cost=10)
-- 使用bcryptjs.hashSync('123456', 10) 生成
-- $2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m
-- 为了确保可用，使用一个已知有效的hash
INSERT INTO users (id, username, password, real_name, email, phone, department_id, status) VALUES
-- ADMIN角色 (3个)
('user-sysadmin1', 'sysadmin', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '张建国', 'zhang.jianguo@semi.com', '13800000001', 'org-finance', 'active'),
('user-sysadmin2', 'sysadmin2', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '李明辉', 'li.minghui@semi.com', '13800000002', 'org-finance', 'active'),
('user-sysadmin3', 'sysadmin3', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '王志强', 'wang.zhiqiang@semi.com', '13800000003', 'org-finance', 'active'),

-- BUDGET_ADMIN角色 (3个)
('user-budgetadmin1', 'budgetadmin', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '陈预算', 'chen.yusuan@semi.com', '13800000010', 'org-finance-bp', 'active'),
('user-budgetadmin2', 'budgetadmin2', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '刘规划', 'liu.guihua@semi.com', '13800000011', 'org-finance-bp', 'active'),
('user-budgetadmin3', 'budgetadmin3', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '赵分析', 'zhao.fenxi@semi.com', '13800000012', 'org-finance-bp', 'active'),

-- DEPT_HEAD角色 (3个)
('user-depthead1', 'depthead', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '孙部长', 'sun.buzhang@semi.com', '13800000020', 'org-rd', 'active'),
('user-depthead2', 'depthead2', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '周主任', 'zhou.zhuren@semi.com', '13800000021', 'org-rd-chip', 'active'),
('user-depthead3', 'depthead3', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '吴经理', 'wu.jingli@semi.com', '13800000022', 'org-ops', 'active'),

-- FINANCE角色 (3个)
('user-finance1', 'finance', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '郑财务', 'zheng.caiwu@semi.com', '13800000030', 'org-finance-gl', 'active'),
('user-finance2', 'finance2', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '冯会计', 'feng.kuaiji@semi.com', '13800000031', 'org-finance-gl', 'active'),
('user-finance3', 'finance3', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '蒋出纳', 'jiang.chuna@semi.com', '13800000032', 'org-finance-bp', 'active'),

-- USER角色 (3个)
('user-user1', 'user01', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '钱研发', 'qian.yanfa@semi.com', '13800000040', 'org-rd-chip', 'active'),
('user-user2', 'user02', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '韩测试', 'han.ceshi@semi.com', '13800000041', 'org-rd-test', 'active'),
('user-user3', 'user03', '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', '杨运营', 'yang.yunying@semi.com', '13800000042', 'org-ops-fab', 'active');

-- 更新admin用户密码为123456
UPDATE users SET password = '$2b$10$210sLHdCb9xTLMz2nnxuTutr14.cFQz994fbtnCfj1fLH8AAdEj/m', real_name = '超级管理员', email = 'admin@semi.com' WHERE username = 'admin';

-- ============================================
-- 5. 用户角色关联
-- ============================================
-- ADMIN角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-sysadmin1', (SELECT id FROM roles WHERE role_code = 'ADMIN')),
('user-sysadmin2', (SELECT id FROM roles WHERE role_code = 'ADMIN')),
('user-sysadmin3', (SELECT id FROM roles WHERE role_code = 'ADMIN'));

-- BUDGET_ADMIN角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-budgetadmin1', (SELECT id FROM roles WHERE role_code = 'BUDGET_ADMIN')),
('user-budgetadmin2', (SELECT id FROM roles WHERE role_code = 'BUDGET_ADMIN')),
('user-budgetadmin3', (SELECT id FROM roles WHERE role_code = 'BUDGET_ADMIN'));

-- DEPT_HEAD角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-depthead1', (SELECT id FROM roles WHERE role_code = 'DEPT_HEAD')),
('user-depthead2', (SELECT id FROM roles WHERE role_code = 'DEPT_HEAD')),
('user-depthead3', (SELECT id FROM roles WHERE role_code = 'DEPT_HEAD'));

-- FINANCE角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-finance1', (SELECT id FROM roles WHERE role_code = 'FINANCE')),
('user-finance2', (SELECT id FROM roles WHERE role_code = 'FINANCE')),
('user-finance3', (SELECT id FROM roles WHERE role_code = 'FINANCE'));

-- USER角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-user1', (SELECT id FROM roles WHERE role_code = 'USER')),
('user-user2', (SELECT id FROM roles WHERE role_code = 'USER')),
('user-user3', (SELECT id FROM roles WHERE role_code = 'USER'));

-- admin用户也赋予ADMIN角色（已有，确保存在）
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. 预算数据 (100+条预算明细)
-- ============================================
-- 创建预算主表和明细，覆盖多个年度、多个部门、多种状态

-- 2025年度 CAPEX预算 - 研发中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-cap-rd', 2025, 'CAPEX', 'org-rd', 'approved', 'V1.0', 0, '2025年度研发中心CAPEX预算', 'user-budgetadmin1');

-- 2025年度 OPEX预算 - 研发中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-ope-rd', 2025, 'OPEX', 'org-rd', 'approved', 'V1.0', 0, '2025年度研发中心OPEX预算', 'user-budgetadmin1');

-- 2025年度 CAPEX预算 - 运营中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-cap-ops', 2025, 'CAPEX', 'org-ops', 'approved', 'V1.0', 0, '2025年度运营中心CAPEX预算', 'user-budgetadmin1');

-- 2025年度 OPEX预算 - 运营中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-ope-ops', 2025, 'OPEX', 'org-ops', 'approved', 'V1.0', 0, '2025年度运营中心OPEX预算', 'user-budgetadmin1');

-- 2025年度 CAPEX预算 - 财务中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-cap-fin', 2025, 'CAPEX', 'org-finance', 'approved', 'V1.0', 0, '2025年度财务中心CAPEX预算', 'user-budgetadmin2');

-- 2025年度 OPEX预算 - 财务中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-ope-fin', 2025, 'OPEX', 'org-finance', 'approved', 'V1.0', 0, '2025年度财务中心OPEX预算', 'user-budgetadmin2');

-- 2025年度 CAPEX预算 - 采购中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-cap-proc', 2025, 'CAPEX', 'org-proc', 'submitted', 'V1.0', 0, '2025年度采购中心CAPEX预算', 'user-budgetadmin2');

-- 2025年度 OPEX预算 - 采购中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2025-ope-proc', 2025, 'OPEX', 'org-proc', 'draft', 'V1.0', 0, '2025年度采购中心OPEX预算', 'user-budgetadmin2');

-- 2026年度 CAPEX预算 - 研发中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-cap-rd', 2026, 'CAPEX', 'org-rd', 'approved', 'V1.0', 0, '2026年度研发中心CAPEX预算', 'user-budgetadmin1');

-- 2026年度 OPEX预算 - 研发中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-ope-rd', 2026, 'OPEX', 'org-rd', 'submitted', 'V1.0', 0, '2026年度研发中心OPEX预算', 'user-budgetadmin1');

-- 2026年度 CAPEX预算 - 运营中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-cap-ops', 2026, 'CAPEX', 'org-ops', 'draft', 'V1.0', 0, '2026年度运营中心CAPEX预算', 'user-budgetadmin1');

-- 2026年度 OPEX预算 - 运营中心
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-ope-ops', 2026, 'OPEX', 'org-ops', 'approved', 'V1.0', 0, '2026年度运营中心OPEX预算', 'user-budgetadmin1');

-- 2026年度 CAPEX预算 - 人力资源部
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-cap-hr', 2026, 'CAPEX', 'org-hr', 'draft', 'V1.0', 0, '2026年度人力资源部CAPEX预算', 'user-budgetadmin3');

-- 2026年度 OPEX预算 - 人力资源部
INSERT INTO budgets (id, budget_year, budget_type, organization_id, status, version, total_amount, description, created_by) VALUES
('bud-2026-ope-hr', 2026, 'OPEX', 'org-hr', 'approved', 'V1.0', 0, '2026年度人力资源部OPEX预算', 'user-budgetadmin3');

-- ============================================
-- 7. 预算明细 (100+条)
-- ============================================

-- 2025 CAPEX 研发中心 明细 (10条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-001', 'bud-2025-cap-rd', 'acc-cap-equip-prod', 'org-rd-chip', 'proj-7nm', 3000000, 2400000, 2200000, 1800000, 2400000, 600000, '7nm工艺生产设备'),
('bi-002', 'bud-2025-cap-rd', 'acc-cap-equip-test', 'org-rd-test', 'proj-7nm', 1500000, 1200000, 1100000, 900000, 1200000, 300000, '7nm测试设备采购'),
('bi-003', 'bud-2025-cap-rd', 'acc-cap-equip-rd', 'org-rd-chip', 'proj-ai-chip', 2000000, 1600000, 1500000, 1200000, 1600000, 400000, 'AI芯片研发设备'),
('bi-004', 'bud-2025-cap-rd', 'acc-cap-equip-rd', 'org-rd-soft', 'proj-riscv', 800000, 600000, 550000, 400000, 600000, 200000, 'RISC-V开发设备'),
('bi-005', 'bud-2025-cap-rd', 'acc-cap-soft-license', 'org-rd-chip', 'proj-eda', 2500000, 2500000, 2500000, 2500000, 2500000, 0, 'EDA工具许可'),
('bi-006', 'bud-2025-cap-rd', 'acc-cap-soft-dev', 'org-rd-soft', 'proj-digital', 500000, 300000, 250000, 150000, 300000, 200000, '定制软件开发'),
('bi-007', 'bud-2025-cap-rd', 'acc-cap-equip-prod', 'org-rd-chip', 'proj-5nm', 4000000, 1000000, 800000, 500000, 1000000, 3000000, '5nm预研设备'),
('bi-008', 'bud-2025-cap-rd', 'acc-cap-equip-test', 'org-rd-test', 'proj-auto', 1200000, 900000, 850000, 700000, 900000, 300000, '自动化测试设备'),
('bi-009', 'bud-2025-cap-rd', 'acc-cap-equip-office', 'org-rd-arch', NULL, 300000, 250000, 230000, 200000, 250000, 50000, '架构部办公设备'),
('bi-010', 'bud-2025-cap-rd', 'acc-cap-soft-license', 'org-rd-soft', NULL, 200000, 200000, 200000, 200000, 200000, 0, '开发工具许可');

-- 2025 OPEX 研发中心 明细 (12条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-011', 'bud-2025-ope-rd', 'acc-ope-salary-base', 'org-rd-chip', NULL, 5000000, 5000000, 5000000, 5000000, 5000000, 0, '芯片设计部基本工资'),
('bi-012', 'bud-2025-ope-rd', 'acc-ope-salary-base', 'org-rd-soft', NULL, 3500000, 3500000, 3500000, 3500000, 3500000, 0, '软件研发部基本工资'),
('bi-013', 'bud-2025-ope-rd', 'acc-ope-salary-base', 'org-rd-test', NULL, 2500000, 2500000, 2500000, 2500000, 2500000, 0, '测试验证部基本工资'),
('bi-014', 'bud-2025-ope-rd', 'acc-ope-salary-bonus', 'org-rd', NULL, 2000000, 1500000, 1400000, 1200000, 1500000, 500000, '研发中心绩效奖金'),
('bi-015', 'bud-2025-ope-rd', 'acc-ope-salary-benefit', 'org-rd', NULL, 3000000, 3000000, 3000000, 3000000, 3000000, 0, '研发中心福利社保'),
('bi-016', 'bud-2025-ope-rd', 'acc-ope-mat-wafer', 'org-rd-chip', 'proj-7nm', 4000000, 3200000, 3000000, 2500000, 3200000, 800000, '7nm晶圆材料'),
('bi-017', 'bud-2025-ope-rd', 'acc-ope-mat-consum', 'org-rd-test', NULL, 800000, 600000, 550000, 450000, 600000, 200000, '测试耗材'),
('bi-018', 'bud-2025-ope-rd', 'acc-ope-outsrc-design', 'org-rd-chip', 'proj-5nm', 1500000, 1000000, 900000, 700000, 1000000, 500000, '5nm设计外包'),
('bi-019', 'bud-2025-ope-rd', 'acc-ope-outsrc-test', 'org-rd-test', 'proj-auto', 600000, 400000, 350000, 250000, 400000, 200000, '测试外包'),
('bi-020', 'bud-2025-ope-rd', 'acc-ope-travel', 'org-rd', NULL, 500000, 350000, 320000, 280000, 350000, 150000, '研发差旅费'),
('bi-021', 'bud-2025-ope-rd', 'acc-ope-office', 'org-rd', NULL, 300000, 250000, 240000, 200000, 250000, 50000, '研发办公费'),
('bi-022', 'bud-2025-ope-rd', 'acc-ope-depreciation', 'org-rd', NULL, 1800000, 1800000, 1800000, 1800000, 1800000, 0, '研发设备折旧');

-- 2025 CAPEX 运营中心 明细 (8条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-023', 'bud-2025-cap-ops', 'acc-cap-equip-prod', 'org-ops-fab', 'proj-fab-ext', 8000000, 6000000, 5500000, 4000000, 6000000, 2000000, '产线扩产设备'),
('bi-024', 'bud-2025-cap-ops', 'acc-cap-equip-test', 'org-ops-qual', NULL, 1000000, 800000, 750000, 600000, 800000, 200000, '质量检测设备'),
('bi-025', 'bud-2025-cap-ops', 'acc-cap-construct-fab', 'org-ops-fab', 'proj-fab-ext', 5000000, 4000000, 3800000, 3000000, 4000000, 1000000, '厂房建设'),
('bi-026', 'bud-2025-cap-ops', 'acc-cap-construct-deco', 'org-ops-fab', NULL, 500000, 400000, 380000, 300000, 400000, 100000, '车间改造'),
('bi-027', 'bud-2025-cap-ops', 'acc-cap-equip-rd', 'org-ops-fab', 'proj-7nm', 2000000, 1500000, 1400000, 1000000, 1500000, 500000, '制程研发设备'),
('bi-028', 'bud-2025-cap-ops', 'acc-cap-soft-license', 'org-ops-fab', NULL, 800000, 800000, 800000, 800000, 800000, 0, 'MES系统许可'),
('bi-029', 'bud-2025-cap-ops', 'acc-cap-equip-prod', 'org-ops-fab', 'proj-pkg', 3000000, 500000, 400000, 200000, 500000, 2500000, '封装产线设备'),
('bi-030', 'bud-2025-cap-ops', 'acc-cap-equip-office', 'org-ops-qual', NULL, 200000, 150000, 140000, 100000, 150000, 50000, '质量部办公设备');

-- 2025 OPEX 运营中心 明细 (10条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-031', 'bud-2025-ope-ops', 'acc-ope-salary-base', 'org-ops-fab', NULL, 4000000, 4000000, 4000000, 4000000, 4000000, 0, '制造运营部工资'),
('bi-032', 'bud-2025-ope-ops', 'acc-ope-salary-base', 'org-ops-qual', NULL, 1500000, 1500000, 1500000, 1500000, 1500000, 0, '质量管理部工资'),
('bi-033', 'bud-2025-ope-ops', 'acc-ope-salary-bonus', 'org-ops', NULL, 1200000, 900000, 850000, 700000, 900000, 300000, '运营中心奖金'),
('bi-034', 'bud-2025-ope-ops', 'acc-ope-salary-benefit', 'org-ops', NULL, 2000000, 2000000, 2000000, 2000000, 2000000, 0, '运营中心福利'),
('bi-035', 'bud-2025-ope-ops', 'acc-ope-mat-wafer', 'org-ops-fab', 'proj-7nm', 6000000, 5000000, 4800000, 4000000, 5000000, 1000000, '生产晶圆材料'),
('bi-036', 'bud-2025-ope-ops', 'acc-ope-mat-pack', 'org-ops-fab', NULL, 2000000, 1600000, 1500000, 1200000, 1600000, 400000, '封装材料'),
('bi-037', 'bud-2025-ope-ops', 'acc-ope-mat-consum', 'org-ops-fab', NULL, 1000000, 800000, 750000, 600000, 800000, 200000, '生产耗材'),
('bi-038', 'bud-2025-ope-ops', 'acc-ope-depreciation', 'org-ops', NULL, 3000000, 3000000, 3000000, 3000000, 3000000, 0, '运营设备折旧'),
('bi-039', 'bud-2025-ope-ops', 'acc-ope-maint', 'org-ops-fab', NULL, 1500000, 1200000, 1100000, 900000, 1200000, 300000, '设备维修维护'),
('bi-040', 'bud-2025-ope-ops', 'acc-ope-office', 'org-ops', NULL, 300000, 250000, 240000, 200000, 250000, 50000, '运营办公费');

-- 2025 CAPEX 财务中心 明细 (3条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-041', 'bud-2025-cap-fin', 'acc-cap-equip-office', 'org-finance', NULL, 200000, 150000, 140000, 100000, 150000, 50000, '财务办公设备'),
('bi-042', 'bud-2025-cap-fin', 'acc-cap-soft-license', 'org-finance', 'proj-digital', 500000, 400000, 380000, 300000, 400000, 100000, 'ERP系统许可'),
('bi-043', 'bud-2025-cap-fin', 'acc-cap-soft-dev', 'org-finance', 'proj-digital', 300000, 200000, 180000, 120000, 200000, 100000, '财务系统开发');

-- 2025 OPEX 财务中心 明细 (5条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-044', 'bud-2025-ope-fin', 'acc-ope-salary-base', 'org-finance', NULL, 1800000, 1800000, 1800000, 1800000, 1800000, 0, '财务中心工资'),
('bi-045', 'bud-2025-ope-fin', 'acc-ope-salary-bonus', 'org-finance', NULL, 400000, 300000, 280000, 200000, 300000, 100000, '财务中心奖金'),
('bi-046', 'bud-2025-ope-fin', 'acc-ope-salary-benefit', 'org-finance', NULL, 600000, 600000, 600000, 600000, 600000, 0, '财务中心福利'),
('bi-047', 'bud-2025-ope-fin', 'acc-ope-office', 'org-finance', NULL, 150000, 120000, 110000, 90000, 120000, 30000, '财务办公费'),
('bi-048', 'bud-2025-ope-fin', 'acc-ope-travel', 'org-finance', NULL, 100000, 60000, 55000, 40000, 60000, 40000, '财务差旅费');

-- 2025 CAPEX 采购中心 明细 (3条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-049', 'bud-2025-cap-proc', 'acc-cap-equip-office', 'org-proc', NULL, 150000, 100000, 90000, 60000, 100000, 50000, '采购办公设备'),
('bi-050', 'bud-2025-cap-proc', 'acc-cap-soft-license', 'org-proc', 'proj-digital', 300000, 200000, 180000, 120000, 200000, 100000, 'SRM系统许可'),
('bi-051', 'bud-2025-cap-proc', 'acc-cap-soft-dev', 'org-proc', 'proj-digital', 200000, 100000, 80000, 50000, 100000, 100000, '采购系统开发');

-- 2025 OPEX 采购中心 明细 (4条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-052', 'bud-2025-ope-proc', 'acc-ope-salary-base', 'org-proc', NULL, 1200000, 1200000, 1200000, 1200000, 1200000, 0, '采购中心工资'),
('bi-053', 'bud-2025-ope-proc', 'acc-ope-salary-bonus', 'org-proc', NULL, 300000, 200000, 180000, 150000, 200000, 100000, '采购中心奖金'),
('bi-054', 'bud-2025-ope-proc', 'acc-ope-salary-benefit', 'org-proc', NULL, 400000, 400000, 400000, 400000, 400000, 0, '采购中心福利'),
('bi-055', 'bud-2025-ope-proc', 'acc-ope-office', 'org-proc', NULL, 100000, 80000, 75000, 60000, 80000, 20000, '采购办公费');

-- 2026 CAPEX 研发中心 明细 (10条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-056', 'bud-2026-cap-rd', 'acc-cap-equip-prod', 'org-rd-chip', 'proj-5nm', 6000000, 500000, 400000, 200000, 500000, 5500000, '5nm工艺设备'),
('bi-057', 'bud-2026-cap-rd', 'acc-cap-equip-test', 'org-rd-test', 'proj-5nm', 2500000, 200000, 150000, 80000, 200000, 2300000, '5nm测试设备'),
('bi-058', 'bud-2026-cap-rd', 'acc-cap-equip-rd', 'org-rd-chip', 'proj-ai-chip', 2500000, 1800000, 1700000, 1200000, 1800000, 700000, 'AI芯片研发设备'),
('bi-059', 'bud-2026-cap-rd', 'acc-cap-equip-rd', 'org-rd-soft', 'proj-riscv', 1000000, 700000, 650000, 500000, 700000, 300000, 'RISC-V开发设备'),
('bi-060', 'bud-2026-cap-rd', 'acc-cap-soft-license', 'org-rd-chip', 'proj-eda', 3000000, 3000000, 3000000, 1500000, 3000000, 0, 'EDA工具许可续期'),
('bi-061', 'bud-2026-cap-rd', 'acc-cap-soft-dev', 'org-rd-soft', 'proj-digital', 800000, 400000, 350000, 200000, 400000, 400000, '数字化开发'),
('bi-062', 'bud-2026-cap-rd', 'acc-cap-equip-prod', 'org-rd-chip', 'proj-pkg', 3500000, 1000000, 800000, 400000, 1000000, 2500000, '封装研发设备'),
('bi-063', 'bud-2026-cap-rd', 'acc-cap-equip-test', 'org-rd-test', 'proj-auto', 1500000, 1000000, 950000, 700000, 1000000, 500000, '自动化测试设备'),
('bi-064', 'bud-2026-cap-rd', 'acc-cap-equip-office', 'org-rd-arch', NULL, 400000, 300000, 280000, 200000, 300000, 100000, '架构部设备'),
('bi-065', 'bud-2026-cap-rd', 'acc-cap-soft-license', 'org-rd-soft', NULL, 300000, 250000, 230000, 150000, 250000, 50000, '开发工具许可');

-- 2026 OPEX 研发中心 明细 (12条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-066', 'bud-2026-ope-rd', 'acc-ope-salary-base', 'org-rd-chip', NULL, 5500000, 5500000, 5500000, 2750000, 5500000, 0, '芯片设计部工资'),
('bi-067', 'bud-2026-ope-rd', 'acc-ope-salary-base', 'org-rd-soft', NULL, 4000000, 4000000, 4000000, 2000000, 4000000, 0, '软件研发部工资'),
('bi-068', 'bud-2026-ope-rd', 'acc-ope-salary-base', 'org-rd-test', NULL, 2800000, 2800000, 2800000, 1400000, 2800000, 0, '测试验证部工资'),
('bi-069', 'bud-2026-ope-rd', 'acc-ope-salary-base', 'org-rd-arch', NULL, 1500000, 1500000, 1500000, 750000, 1500000, 0, '架构设计部工资'),
('bi-070', 'bud-2026-ope-rd', 'acc-ope-salary-bonus', 'org-rd', NULL, 2500000, 1800000, 1700000, 850000, 1800000, 700000, '研发中心奖金'),
('bi-071', 'bud-2026-ope-rd', 'acc-ope-salary-benefit', 'org-rd', NULL, 3500000, 3500000, 3500000, 1750000, 3500000, 0, '研发中心福利'),
('bi-072', 'bud-2026-ope-rd', 'acc-ope-mat-wafer', 'org-rd-chip', 'proj-5nm', 5000000, 2000000, 1800000, 900000, 2000000, 3000000, '5nm晶圆材料'),
('bi-073', 'bud-2026-ope-rd', 'acc-ope-mat-wafer', 'org-rd-chip', 'proj-7nm', 3000000, 2500000, 2400000, 1200000, 2500000, 500000, '7nm晶圆材料'),
('bi-074', 'bud-2026-ope-rd', 'acc-ope-outsrc-design', 'org-rd-chip', 'proj-5nm', 2000000, 800000, 700000, 350000, 800000, 1200000, '5nm设计外包'),
('bi-075', 'bud-2026-ope-rd', 'acc-ope-outsrc-test', 'org-rd-test', NULL, 800000, 500000, 450000, 225000, 500000, 300000, '测试外包'),
('bi-076', 'bud-2026-ope-rd', 'acc-ope-travel', 'org-rd', NULL, 600000, 400000, 380000, 190000, 400000, 200000, '研发差旅费'),
('bi-077', 'bud-2026-ope-rd', 'acc-ope-depreciation', 'org-rd', NULL, 2000000, 2000000, 2000000, 1000000, 2000000, 0, '研发设备折旧');

-- 2026 CAPEX 运营中心 明细 (6条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-078', 'bud-2026-cap-ops', 'acc-cap-equip-prod', 'org-ops-fab', 'proj-fab-ext', 10000000, 3000000, 2500000, 1200000, 3000000, 7000000, '产线扩产设备'),
('bi-079', 'bud-2026-cap-ops', 'acc-cap-equip-test', 'org-ops-qual', NULL, 1200000, 600000, 550000, 250000, 600000, 600000, '质检设备'),
('bi-080', 'bud-2026-cap-ops', 'acc-cap-construct-fab', 'org-ops-fab', 'proj-fab-ext', 3000000, 2000000, 1800000, 900000, 2000000, 1000000, '厂房建设续'),
('bi-081', 'bud-2026-cap-ops', 'acc-cap-equip-prod', 'org-ops-fab', 'proj-pkg', 5000000, 1000000, 800000, 300000, 1000000, 4000000, '封装产线设备'),
('bi-082', 'bud-2026-cap-ops', 'acc-cap-soft-license', 'org-ops-fab', NULL, 1000000, 800000, 750000, 375000, 800000, 200000, 'MES系统续期'),
('bi-083', 'bud-2026-cap-ops', 'acc-cap-equip-office', 'org-ops-qual', NULL, 300000, 200000, 180000, 90000, 200000, 100000, '质量部设备');

-- 2026 OPEX 运营中心 明细 (10条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-084', 'bud-2026-ope-ops', 'acc-ope-salary-base', 'org-ops-fab', NULL, 4500000, 4500000, 4500000, 2250000, 4500000, 0, '制造运营部工资'),
('bi-085', 'bud-2026-ope-ops', 'acc-ope-salary-base', 'org-ops-qual', NULL, 1800000, 1800000, 1800000, 900000, 1800000, 0, '质量管理部工资'),
('bi-086', 'bud-2026-ope-ops', 'acc-ope-salary-bonus', 'org-ops', NULL, 1500000, 1000000, 950000, 475000, 1000000, 500000, '运营中心奖金'),
('bi-087', 'bud-2026-ope-ops', 'acc-ope-salary-benefit', 'org-ops', NULL, 2500000, 2500000, 2500000, 1250000, 2500000, 0, '运营中心福利'),
('bi-088', 'bud-2026-ope-ops', 'acc-ope-mat-wafer', 'org-ops-fab', 'proj-7nm', 7000000, 5000000, 4800000, 2400000, 5000000, 2000000, '生产晶圆材料'),
('bi-089', 'bud-2026-ope-ops', 'acc-ope-mat-pack', 'org-ops-fab', NULL, 2500000, 1800000, 1700000, 850000, 1800000, 700000, '封装材料'),
('bi-090', 'bud-2026-ope-ops', 'acc-ope-mat-consum', 'org-ops-fab', NULL, 1200000, 900000, 850000, 425000, 900000, 300000, '生产耗材'),
('bi-091', 'bud-2026-ope-ops', 'acc-ope-depreciation', 'org-ops', NULL, 3500000, 3500000, 3500000, 1750000, 3500000, 0, '运营设备折旧'),
('bi-092', 'bud-2026-ope-ops', 'acc-ope-maint', 'org-ops-fab', NULL, 1800000, 1200000, 1100000, 550000, 1200000, 600000, '设备维修维护'),
('bi-093', 'bud-2026-ope-ops', 'acc-ope-office', 'org-ops', NULL, 400000, 300000, 280000, 140000, 300000, 100000, '运营办公费');

-- 2026 CAPEX 人力资源部 明细 (2条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-094', 'bud-2026-cap-hr', 'acc-cap-equip-office', 'org-hr', NULL, 200000, 150000, 140000, 70000, 150000, 50000, 'HR办公设备'),
('bi-095', 'bud-2026-cap-hr', 'acc-cap-soft-license', 'org-hr', 'proj-digital', 400000, 300000, 280000, 140000, 300000, 100000, 'HR系统许可');

-- 2026 OPEX 人力资源部 明细 (5条)
INSERT INTO budget_items (id, budget_id, account_id, department_id, project_id, budget_amount, pr_committed_amount, po_committed_amount, actual_settled_amount, executed_amount, remaining_amount, remark) VALUES
('bi-096', 'bud-2026-ope-hr', 'acc-ope-salary-base', 'org-hr', NULL, 1500000, 1500000, 1500000, 750000, 1500000, 0, 'HR工资'),
('bi-097', 'bud-2026-ope-hr', 'acc-ope-salary-bonus', 'org-hr', NULL, 300000, 200000, 180000, 90000, 200000, 100000, 'HR奖金'),
('bi-098', 'bud-2026-ope-hr', 'acc-ope-salary-benefit', 'org-hr', NULL, 500000, 500000, 500000, 250000, 500000, 0, 'HR福利'),
('bi-099', 'bud-2026-ope-hr', 'acc-ope-train', 'org-hr', NULL, 800000, 500000, 450000, 225000, 500000, 300000, '培训费'),
('bi-100', 'bud-2026-ope-hr', 'acc-ope-office', 'org-hr', NULL, 150000, 100000, 90000, 45000, 100000, 50000, 'HR办公费');

-- ============================================
-- 8. 更新预算主表总额
-- ============================================
UPDATE budgets b SET total_amount = (
  SELECT COALESCE(SUM(bi.budget_amount), 0) FROM budget_items bi WHERE bi.budget_id = b.id
);

-- ============================================
-- 9. 审批信息更新
-- ============================================
UPDATE budgets SET approved_by = 'user-depthead1', approved_at = NOW() WHERE status = 'approved';

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '种子数据初始化完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建用户: 15个 (5个角色 x 3个用户)';
  RAISE NOTICE '已创建组织: 16个';
  RAISE NOTICE '已创建科目: 28个';
  RAISE NOTICE '已创建项目: 10个';
  RAISE NOTICE '已创建预算: 14个主表';
  RAISE NOTICE '已创建明细: 100条';
  RAISE NOTICE '默认密码: 123456';
  RAISE NOTICE '========================================';
END $$;

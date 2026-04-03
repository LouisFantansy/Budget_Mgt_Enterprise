import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('Budget Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let departmentId: string;
  let budgetId: string;
  let purchaseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);

    // 清理测试数据
    await prisma.approvalStep.deleteMany();
    await prisma.approvalFlow.deleteMany();
    await prisma.purchaseRequestItem.deleteMany();
    await prisma.purchaseRequest.deleteMany();
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.department.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('认证模块', () => {
    describe('/api/auth/register (POST)', () => {
      it('应该成功注册用户', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            password: 'password123',
            name: 'Test User',
            email: 'test@example.com',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.username).toBe('testuser');
          });
      });
    });

    describe('/api/auth/login (POST)', () => {
      it('应该成功登录', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'admin123',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            adminToken = res.body.token;
          });
      });
    });
  });

  describe('部门模块', () => {
    it('应该成功创建部门', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '测试部门',
          code: 'TEST-DEPT',
          description: '测试部门描述',
        })
        .expect(201);

      departmentId = response.body.id;
      expect(response.body.name).toBe('测试部门');
    });
  });

  describe('预算模块', () => {
    describe('POST /api/budgets - 创建预算', () => {
      it('应该成功创建预算', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/budgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '2024年测试预算',
            year: 2024,
            totalAmount: '500000',
            departmentId: departmentId,
            description: '测试预算描述',
            items: [
              {
                name: '办公用品',
                unitPrice: '1000',
                quantity: 10,
                specification: 'A4纸、笔等',
              },
              {
                name: '设备采购',
                unitPrice: '50000',
                quantity: 2,
                specification: '电脑设备',
              },
            ],
          })
          .expect(201);

        budgetId = response.body.id;
        expect(response.body.name).toBe('2024年测试预算');
        expect(response.body.budgetNo).toMatch(/^BG-/);
        expect(response.body.status).toBe('DRAFT');
      });

      it('未登录创建预算应该返回 401', async () => {
        return request(app.getHttpServer())
          .post('/api/budgets')
          .send({
            name: '未授权预算',
            year: 2024,
            totalAmount: '100000',
          })
          .expect(401);
      });
    });

    describe('GET /api/budgets - 获取预算列表', () => {
      it('应该返回预算列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/budgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total');
        expect(response.body.items.length).toBeGreaterThan(0);
      });

      it('应该支持按年份过滤', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/budgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ year: 2024 })
          .expect(200);

        response.body.items.forEach((item: any) => {
          expect(item.year).toBe(2024);
        });
      });

      it('应该支持按状态过滤', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/budgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ status: 'DRAFT' })
          .expect(200);

        response.body.items.forEach((item: any) => {
          expect(item.status).toBe('DRAFT');
        });
      });
    });

    describe('GET /api/budgets/:id - 获取预算详情', () => {
      it('应该返回预算详情', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(budgetId);
        expect(response.body.items).toBeDefined();
        expect(response.body.department).toBeDefined();
      });

      it('不存在的预算应该返回 404', async () => {
        return request(app.getHttpServer())
          .get('/api/budgets/nonexistent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PATCH /api/budgets/:id - 更新预算', () => {
      it('应该成功更新预算', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '更新后的预算名称',
            description: '更新后的描述',
          })
          .expect(200);

        expect(response.body.name).toBe('更新后的预算名称');
      });
    });

    describe('POST /api/budgets/:id/submit - 提交审批', () => {
      it('DRAFT 状态应该可以提交审批', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/budgets/${budgetId}/submit`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe('PENDING');
      });

      it('非 DRAFT 状态提交审批应该返回错误', async () => {
        return request(app.getHttpServer())
          .post(`/api/budgets/${budgetId}/submit`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  describe('采购申请模块', () => {
    let purchaseBudgetId: string;

    beforeAll(async () => {
      // 创建一个用于采购申请的预算
      const response = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '采购测试预算',
          year: 2024,
          totalAmount: '1000000',
          departmentId: departmentId,
          description: '用于测试采购申请',
        });
      purchaseBudgetId = response.body.id;

      // 提交并审批通过预算
      await request(app.getHttpServer())
        .post(`/api/budgets/${purchaseBudgetId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    describe('POST /api/purchase-requests - 创建采购申请', () => {
      it('应该成功创建采购申请', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/purchase-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            purpose: '测试采购申请',
            budgetId: purchaseBudgetId,
            items: [
              {
                name: '办公电脑',
                unitPrice: '8000',
                quantity: 5,
                specification: 'Dell i7',
              },
              {
                name: '显示器',
                unitPrice: '2000',
                quantity: 5,
                specification: '27寸 4K',
              },
            ],
          })
          .expect(201);

        purchaseId = response.body.id;
        expect(response.body.requestNo).toMatch(/^PR-/);
        expect(response.body.status).toBe('DRAFT');
      });

      it('预算不存在应该返回 404', async () => {
        return request(app.getHttpServer())
          .post('/api/purchase-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            purpose: '无效预算采购',
            budgetId: 'nonexistent-budget-id',
            items: [],
          })
          .expect(404);
      });
    });

    describe('GET /api/purchase-requests - 获取采购申请列表', () => {
      it('应该返回采购申请列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/purchase-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total');
      });

      it('应该支持按预算 ID 过滤', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/purchase-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ budgetId: purchaseBudgetId })
          .expect(200);

        response.body.items.forEach((item: any) => {
          expect(item.budgetId).toBe(purchaseBudgetId);
        });
      });
    });

    describe('GET /api/purchase-requests/:id - 获取采购申请详情', () => {
      it('应该返回采购申请详情', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/purchase-requests/${purchaseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(purchaseId);
        expect(response.body.items).toBeDefined();
        expect(response.body.budget).toBeDefined();
      });

      it('不存在的采购申请应该返回 404', async () => {
        return request(app.getHttpServer())
          .get('/api/purchase-requests/nonexistent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('DELETE /api/purchase-requests/:id - 删除采购申请', () => {
      it('应该成功删除 DRAFT 状态的采购申请', async () => {
        // 创建一个新的 DRAFT 状态采购申请
        const createResponse = await request(app.getHttpServer())
          .post('/api/purchase-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            purpose: '待删除的采购申请',
            budgetId: purchaseBudgetId,
            items: [{ name: '测试物品', unitPrice: '100', quantity: 1 }],
          });

        const deletePurchaseId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/api/purchase-requests/${deletePurchaseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  describe('审批流程模块', () => {
    let approvalBudgetId: string;

    beforeAll(async () => {
      // 创建用于审批流程测试的预算
      const response = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '审批测试预算',
          year: 2024,
          totalAmount: '30000',
          departmentId: departmentId,
          description: '用于测试审批流程',
        });
      approvalBudgetId = response.body.id;
    });

    describe('审批流程全链路测试', () => {
      it('创建预算 → 提交审批 → 获取审批状态', async () => {
        // 1. 提交审批
        const submitResponse = await request(app.getHttpServer())
          .post(`/api/budgets/${approvalBudgetId}/submit`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(submitResponse.body.status).toBe('PENDING');
      });

      it('应该能获取待审批列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/approvals/pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('应该能获取我发起的审批列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/approvals/my')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('budgetApprovals');
        expect(response.body).toHaveProperty('purchaseApprovals');
      });
    });
  });

  describe('数据隔离测试', () => {
    let normalUserToken: string;
    let normalUserId: string;
    let otherDeptBudgetId: string;
    let otherDeptId: string;

    beforeAll(async () => {
      // 创建另一个部门
      const deptResponse = await request(app.getHttpServer())
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '其他部门',
          code: 'OTHER-DEPT',
          description: '用于测试数据隔离',
        });
      otherDeptId = deptResponse.body.id;

      // 创建普通用户
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'normaluser',
          password: 'password123',
          name: 'Normal User',
          email: 'normal@example.com',
          departmentId: departmentId,
        });
      normalUserId = userResponse.body.id;

      // 登录获取 token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'normaluser',
          password: 'password123',
        });
      normalUserToken = loginResponse.body.token;

      // 在其他部门创建预算
      const budgetResponse = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '其他部门预算',
          year: 2024,
          totalAmount: '100000',
          departmentId: otherDeptId,
        });
      otherDeptBudgetId = budgetResponse.body.id;
    });

    it('普通用户应该能看到本部门预算', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/budgets')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      // 只能看到本部门的预算
      response.body.items.forEach((item: any) => {
        expect(item.departmentId).toBe(departmentId);
      });
    });

    it('普通用户应该不能查看其他部门预算详情', async () => {
      return request(app.getHttpServer())
        .get(`/api/budgets/${otherDeptBudgetId}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });

    it('普通用户应该不能查看其他部门的采购申请', async () => {
      // 在其他部门创建采购申请
      const purchaseResponse = await request(app.getHttpServer())
        .post('/api/purchase-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purpose: '其他部门采购',
          budgetId: otherDeptBudgetId,
          items: [{ name: '物品', unitPrice: '100', quantity: 1 }],
        });

      return request(app.getHttpServer())
        .get(`/api/purchase-requests/${purchaseResponse.body.id}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });
  });

  describe('权限测试', () => {
    it('未认证用户应该无法访问受保护资源', async () => {
      return request(app.getHttpServer())
        .get('/api/budgets')
        .expect(401);
    });

    it('无效 token 应该返回 401', async () => {
      return request(app.getHttpServer())
        .get('/api/budgets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('健康检查', () => {
    it('/api/health 应该返回服务状态', async () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });
  });
});

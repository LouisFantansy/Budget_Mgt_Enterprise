import { of } from 'rxjs';
import { FieldMaskInterceptor } from './field-mask.interceptor';

function mockContext(roleCodes: string[]) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { roles: roleCodes } }),
    }),
  } as any;
}

describe('FieldMaskInterceptor', () => {
  it('should remove PO-sensitive keys for non-PO roles', (done) => {
    const interceptor = new FieldMaskInterceptor();
    const ctx = mockContext(['RD_BUDGET_ADMIN']);

    interceptor
      .intercept(ctx, {
        handle: () =>
          of({
            poAmount: 100,
            settlementAmount: 50,
            poCommittedAmount: 80,
            actualSettledAmount: 40,
            prCommittedAmount: 30,
            nested: { poNumber: 'PO-1', supplier: 'S', ok: true },
          }),
      } as any)
      .subscribe((res) => {
        expect(res.poAmount).toBeUndefined();
        expect(res.settlementAmount).toBeUndefined();
        expect(res.poCommittedAmount).toBeUndefined();
        expect(res.actualSettledAmount).toBeUndefined();
        expect(res.prCommittedAmount).toBe(30);
        expect(res.nested.poNumber).toBeUndefined();
        expect(res.nested.supplier).toBeUndefined();
        expect(res.nested.ok).toBe(true);
        done();
      });
  });

  it('should keep PO-sensitive keys for PO roles', (done) => {
    const interceptor = new FieldMaskInterceptor();
    const ctx = mockContext(['FINANCE']);

    interceptor
      .intercept(ctx, {
        handle: () => of({ poAmount: 100, settlementAmount: 50 }),
      } as any)
      .subscribe((res) => {
        expect(res.poAmount).toBe(100);
        expect(res.settlementAmount).toBe(50);
        done();
      });
  });
});


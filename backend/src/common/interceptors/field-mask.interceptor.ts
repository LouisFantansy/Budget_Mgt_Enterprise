import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { canViewPoPrice } from '../constants/roles.constants';

const PO_SENSITIVE_KEYS = new Set([
  // amounts
  'poAmount',
  'settlementAmount',
  'poCommittedAmount',
  'actualSettledAmount',
  // identifiers / details that usually imply PO visibility
  'poNumber',
  'settlementNumber',
  'supplier',
]);

function maskDeep(value: any, shouldMaskPo: boolean): any {
  if (!shouldMaskPo) return value;
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((v) => maskDeep(v, shouldMaskPo));
  }

  if (typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (PO_SENSITIVE_KEYS.has(k)) {
        continue;
      }
      out[k] = maskDeep(v, shouldMaskPo);
    }
    return out;
  }

  return value;
}

@Injectable()
export class FieldMaskInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const roleCodes: string[] = request?.user?.roles || [];
    const shouldMaskPo = !canViewPoPrice(roleCodes);

    return next.handle().pipe(map((data) => maskDeep(data, shouldMaskPo)));
  }
}


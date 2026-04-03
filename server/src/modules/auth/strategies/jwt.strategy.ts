import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'default-secret'),
    });
  }

  async validate(payload: any) {
    // payload 包含我们在 sign 时传入的信息
    return { 
      userId: payload.sub,
      username: payload.username,
      departmentId: payload.departmentId,
      roles: payload.roles,
    };
  }
}

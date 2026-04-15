import { ApiProperty } from '@nestjs/swagger';

class RoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  realName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];
}

export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ type: UserDto, description: '用户信息' })
  user: UserDto;
}

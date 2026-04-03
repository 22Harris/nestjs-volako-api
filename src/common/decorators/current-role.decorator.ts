import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';

export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Role => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.role as Role;
  },
);

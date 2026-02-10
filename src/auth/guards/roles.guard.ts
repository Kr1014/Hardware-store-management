import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('--- SEGURIDAD DEBUG ---');
        console.log('Roles Requeridos:', requiredRoles);

        if (!requiredRoles) {
            return true; // No roles required, allow access
        }

        const { user } = context.switchToHttp().getRequest();
        console.log('Usuario en Request:', user);

        if (!user) {
            return false; // No user in request, deny access
        }

        const hasRole = requiredRoles.some((role) => user.role === role);
        console.log('Usuario tiene el rol requerido:', hasRole);

        return hasRole;
    }
}

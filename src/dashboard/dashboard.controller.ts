import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    getDashboard() {
        return this.dashboardService.getDashboardData();
    }
}

import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    UsePipes,
    ValidationPipe,
    Query
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "src/auth/guards";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserRole } from "src/auth/enums/user-role.enum";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UsePipes(new ValidationPipe({ transform: true })) // ← FIX 22P02: Transforma strings a números
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Post()
    create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoicesService.create(createInvoiceDto);
    }

    @Get()
    findAll(@Query('status') status?: string) {
        return this.invoicesService.findAll(status);
    }

    @Get('overdue')
    getOverdue() {
        return this.invoicesService.getOverdueInvoices();
    }
}

import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    UsePipes,
    ValidationPipe
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "src/auth/guards";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Controller('invoices')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true })) // ← FIX 22P02: Transforma strings a números
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Post()
    create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoicesService.create(createInvoiceDto);
    }

    @Get()
    findAll() {
        return this.invoicesService.findAll();
    }

    @Get('overdue')
    getOverdue() {
        return this.invoicesService.getOverdueInvoices();
    }
}

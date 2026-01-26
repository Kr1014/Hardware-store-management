import { Controller, Get, Post, Body, Param, Patch, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationStatus } from './entities/quotation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
    constructor(private readonly quotationsService: QuotationsService) { }

    @Post()
    create(@Body() createQuotationDto: CreateQuotationDto) {
        return this.quotationsService.create(createQuotationDto);
    }

    @Get()
    findAll() {
        return this.quotationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.quotationsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: QuotationStatus,
    ) {
        return this.quotationsService.updateStatus(id, status);
    }

    @Post(':id/convert-to-invoice')
    convertToInvoice(@Param('id', ParseUUIDPipe) id: string) {
        return this.quotationsService.convertToInvoice(id);
    }
}

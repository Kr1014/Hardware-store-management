import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Post()
    create(@Body() dto: CreateSupplierDto) {
        return this.suppliersService.create(dto);
    }

    @Get()
    findAll(@Query('isActive') isActive?: string) {
        const flag = isActive === undefined ? undefined : isActive === 'true';
        return this.suppliersService.findAll(flag);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.suppliersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplierDto) {
        return this.suppliersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.suppliersService.remove(id);
    }

    @Patch(':id/debt')
    updateDebt(@Param('id', ParseUUIDPipe) id: string, @Body('amount') amount: number) {
        return this.suppliersService.updateDebt(id, amount);
    }
}

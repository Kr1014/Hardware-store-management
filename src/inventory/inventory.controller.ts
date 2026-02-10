import { Controller, Get, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('inventory')
@Roles(UserRole.ADMIN)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post()
    create(@Body() createInventoryDto: CreateInventoryDto) {
        return this.inventoryService.create(createInventoryDto);
    }

    @Get()
    findAll() {
        return this.inventoryService.findAll();
    }
}

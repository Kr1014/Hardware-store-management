import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(createClientDto);
    }

    @Get()
    findAll() {
        return this.clientsService.findAll();
    }

    @Get('dashboard')
    getDashboardStats() {
        return this.clientsService.getDashboardStats();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClientDto: Partial<CreateClientDto>) {
        return this.clientsService.update(id, updateClientDto);
    }

    @Get(':id/detail')
    async getClientDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.clientsService.getClientDetail(id);
    }
}

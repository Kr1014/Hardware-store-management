import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
    ) { }

    async create(createClientDto: CreateClientDto): Promise<Client> {
        const client = this.clientRepository.create(createClientDto);
        return this.clientRepository.save(client);
    }

    async getDashboardStats() {
        const [total, highDebt, inactive] = await Promise.all([
            this.clientRepository.count({ where: { isActive: true } }),
            this.clientRepository.count({
                where: {
                    pendingDebt: MoreThan(1000),  // ← MoreThan necesita import correcto
                    isActive: true
                }
            }),
            this.clientRepository.count({ where: { isActive: false } })
        ]);

        return { totalClients: total, highDebt, inactive };
    }

    private calculateCreditRating(pendingDebt: number): string {
        // FASE 1: Provisional hasta facturas
        if (pendingDebt === 0) return 'A';           // Sin deuda = Dentro plazo
        if (pendingDebt <= 500) return 'B';           // Deuda baja = 0-5 días
        if (pendingDebt <= 1500) return 'C';          // Deuda media = 6-10 días
        return 'D';                                   // Deuda alta = +10 días
    }

    async findAll() {
        const clients = await this.clientRepository.find({
            where: { isActive: true },
            order: { code: 'ASC' }
        });

        return clients.map(client => ({
            ...client,
            creditRating: this.calculateCreditRating(client.pendingDebt)
        }));
    }


    async update(id: string, updateClientDto: Partial<CreateClientDto>): Promise<Client> {
        const client = await this.clientRepository.findOne({ where: { id } });
        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        Object.assign(client, updateClientDto);
        return this.clientRepository.save(client);
    }
}

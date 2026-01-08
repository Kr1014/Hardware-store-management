import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        private clientsService: ClientsService,
    ) { }

    async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
        const { pendingAmount, creditDays, issueDate } = createInvoiceDto;

        // Manejo de fechas simplificado
        const dateIssued = new Date(issueDate);
        const dateDue = new Date(dateIssued);
        dateDue.setDate(dateIssued.getDate() + creditDays);

        // Actualizar deuda del cliente directamente con el valor del DTO
        await this.clientsService.updateDebt(createInvoiceDto.clientId, pendingAmount);

        // Crear la factura usando desestructuración para que sea más limpio
        const invoice = this.invoiceRepository.create({
            ...createInvoiceDto,
            issueDate: dateIssued,
            dueDate: dateDue,
            status: 'PENDING'
        });

        return await this.invoiceRepository.save(invoice);
    }

    async findAll() {
        return this.invoiceRepository.find({
            relations: ['client'],
            order: { issueDate: 'DESC' }
        });
    }

    async getOverdueInvoices() {
        const now = new Date();
        return this.invoiceRepository.find({
            where: {
                dueDate: LessThan(now),
                status: 'PENDING'
            },
            relations: ['client'],
            order: { dueDate: 'ASC' }
        });
    }
}

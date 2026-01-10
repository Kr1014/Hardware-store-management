import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ClientsService } from '../clients/clients.service';
import { InvoiceItem } from './entities/invoice-item.entity';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,

        @InjectRepository(InvoiceItem)
        private invoiceItemRepository: Repository<InvoiceItem>,

        @Inject(forwardRef(() => ClientsService)) // <--- ESTO ES LO QUE FALTA
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

    async updateInvoice(invoice: Invoice): Promise<Invoice> {
        return this.invoiceRepository.save(invoice);
    }

    async findOne(id: string): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findOne({
            where: { id },
            relations: ['client']
        });
        if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
        return invoice;
    }

    async addInvoiceItem(invoiceId: string, productData: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }) {
        const item = this.invoiceItemRepository.create({
            invoiceId,
            ...productData,
            total: productData.quantity * productData.unitPrice
        });
        return this.invoiceItemRepository.save(item);
    }

}

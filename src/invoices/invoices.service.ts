import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ClientsService } from '../clients/clients.service';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,

        @InjectRepository(InvoiceItem)
        private invoiceItemRepository: Repository<InvoiceItem>,

        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,

        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @Inject(forwardRef(() => ClientsService))
        private clientsService: ClientsService,
    ) { }

    async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
        const { creditDays, issueDate, items, clientId, ...rest } = createInvoiceDto;

        // 1. Calcular Totales automáticamente de los items
        let calculatedTotal = 0;
        if (items && items.length > 0) {
            calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        }

        // 2. Manejo de fechas de vencimiento automático
        const dateIssued = new Date(issueDate);
        const dateDue = new Date(dateIssued);
        dateDue.setDate(dateIssued.getDate() + (creditDays || 0));

        // 3. Crear y guardar la cabecera de la factura
        const invoice = this.invoiceRepository.create({
            ...rest,
            clientId,
            issueDate: dateIssued,
            dueDate: dateDue,
            totalAmount: calculatedTotal,
            pendingAmount: calculatedTotal,
            creditDays: creditDays || 0,
            status: 'PENDING'
        });

        const savedInvoice = await this.invoiceRepository.save(invoice);

        // 3. Procesar ítems, guardar detalle y DESCONTAR STOCK
        if (items && items.length > 0) {
            for (const item of items) {
                // A. Buscar existencia en inventario
                const inventory = await this.inventoryRepository.findOneBy({
                    productId: item.productId
                });

                // Validar si hay suficiente stock
                if (!inventory || Number(inventory.quantity) < item.quantity) {
                    throw new BadRequestException(
                        `Stock insuficiente para el producto: ${item.productName}. Disponible: ${inventory?.quantity || 0}`
                    );
                }

                // B. Restar del inventario
                inventory.quantity = Number(inventory.quantity) - Number(item.quantity);
                await this.inventoryRepository.save(inventory);

                // C. Sincronizar columna stock en tabla Product
                await this.productRepository.update(item.productId, {
                    stock: inventory.quantity
                });

                // D. Crear el registro del ítem en la factura
                const invoiceItem = this.invoiceItemRepository.create({
                    ...item,
                    invoiceId: savedInvoice.id,
                    total: item.quantity * item.unitPrice
                });
                await this.invoiceItemRepository.save(invoiceItem);
            }
        }

        // 4. Actualizar deuda del cliente (Usando tu lógica de ClientsService)
        await this.clientsService.updateDebt(clientId, savedInvoice.pendingAmount);

        return savedInvoice;
    }

    async findAll(status?: string) {
        const query = this.invoiceRepository.createQueryBuilder('invoice')
            .leftJoin('invoice.client', 'client')
            .addSelect(['client.id', 'client.name'])
            .leftJoinAndSelect('invoice.items', 'items')
            .orderBy('invoice.issueDate', 'DESC');

        if (status) {
            // Normalize to uppercase and validate
            const statusEnum = status.toUpperCase();
            const validStatuses = ['PENDING', 'PAID', 'OVERDUE'];

            if (validStatuses.includes(statusEnum)) {
                query.andWhere('invoice.status = :status', { status: statusEnum });
            }
            // If invalid status, ignore the filter to prevent database errors
        }

        return query.getMany();
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

    async findOne(id: string): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findOne({
            where: { id },
            relations: ['client', 'items']
        });
        if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
        return invoice;
    }

    // Nota: El método addInvoiceItem individual también debería descontar stock 
    // si lo usas por separado del create.
    async addInvoiceItem(invoiceId: string, productData: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }) {
        const inventory = await this.inventoryRepository.findOneBy({ productId: productData.productId });

        if (!inventory || Number(inventory.quantity) < productData.quantity) {
            throw new BadRequestException('Stock insuficiente');
        }

        inventory.quantity -= productData.quantity;
        await this.inventoryRepository.save(inventory);
        await this.productRepository.update(productData.productId, { stock: inventory.quantity });

        const item = this.invoiceItemRepository.create({
            invoiceId,
            ...productData,
            total: productData.quantity * productData.unitPrice
        });
        return this.invoiceItemRepository.save(item);
    }

    async updateInvoice(invoice: Invoice): Promise<Invoice> {
        return this.invoiceRepository.save(invoice);
    }
}
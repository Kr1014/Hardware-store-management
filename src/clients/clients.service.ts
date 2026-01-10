import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common'; // Agregamos forwardRef e Inject
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Invoice } from '../invoices/entities/invoice.entity'; // Asegura la ruta correcta
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,

        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,

        @Inject(forwardRef(() => PaymentsService)) // <--- Uso de forwardRef
        private paymentsService: PaymentsService
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
                    pendingDebt: MoreThan(1000),
                    isActive: true
                }
            }),
            this.clientRepository.count({ where: { isActive: false } })
        ]);

        return { totalClients: total, highDebt, inactive };
    }

    private calculateCreditRating(pendingDebt: number): string {
        if (pendingDebt === 0) return 'A';
        if (pendingDebt <= 500) return 'B';
        if (pendingDebt <= 1500) return 'C';
        return 'D';
    }

    async findAll(): Promise<(Client & { creditRating: string })[]> {
        const clients = await this.clientRepository.find({
            where: { isActive: true },
            order: { code: 'ASC' }
        });

        return clients.map(client => ({
            ...client,
            creditRating: this.calculateCreditRating(client.pendingDebt)
        })) as (Client & { creditRating: string })[];
    }

    async findOne(id: string): Promise<Client & { creditRating: string }> {
        const client = await this.clientRepository.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client ${id} not found`);
        return {
            ...client,
            creditRating: this.calculateCreditRating(client.pendingDebt)
        } as Client & { creditRating: string };
    }

    async updateDebt(clientId: string, amount: number): Promise<Client & { creditRating: string }> {
        const client = await this.clientRepository.findOne({ where: { id: clientId } });
        if (!client) throw new NotFoundException('Client not found');

        client.pendingDebt = Number(client.pendingDebt) + Number(amount);
        await this.clientRepository.save(client);

        return {
            ...client,
            creditRating: this.calculateCreditRating(client.pendingDebt)
        } as Client & { creditRating: string };
    }

    async update(id: string, updateClientDto: UpdateClientDto): Promise<Client & { creditRating: string }> {
        const client = await this.clientRepository.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client ${id} not found`);

        Object.assign(client, updateClientDto);
        await this.clientRepository.save(client);

        return {
            ...client,
            creditRating: this.calculateCreditRating(client.pendingDebt)
        } as Client & { creditRating: string };
    }

    async getClientDetail(clientId: string) {
        // 1. Obtener datos básicos
        const clientData = await this.findOne(clientId);
        const invoices = await this.invoiceRepository.find({
            where: { clientId },
            order: { issueDate: 'DESC' }
        });
        const payments = await this.paymentsService.getPaymentsByClient(clientId);

        // 2. Cálculos globales
        // Sumamos lo que realmente se debe (la suma de los pendingAmount de las facturas)
        const totalPendingInvoices = invoices.reduce((sum, inv) => sum + Number(inv.pendingAmount), 0);
        const totalPaidAmount = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

        return {
            client: {
                ...clientData,
                debtStatus: clientData.pendingDebt === 0 ? 'Sin deuda' : 'Con deuda',
                formattedDebt: Number(clientData.pendingDebt).toLocaleString('es-VE', {
                    style: 'currency', currency: 'USD', minimumFractionDigits: 2
                })
            },
            summary: {
                totalInvoices: invoices.length,
                totalDebt: Number(totalPendingInvoices).toFixed(2),
                totalPaid: Number(totalPaidAmount).toFixed(2),
                balance: Number(clientData.pendingDebt).toFixed(2)
            },
            invoices: invoices.map(inv => {
                // Cálculo de abonos para esta factura específica
                const abonos = payments
                    .filter(p => p.invoiceId === inv.id)
                    .reduce((sum, p) => sum + Number(p.amount), 0);

                // Determinar estado visual (si hay abonos pero no está PAID, es PARTIAL para el cliente)
                let displayStatus = inv.status;
                if (inv.status === 'PENDING' && abonos > 0) {
                    displayStatus = 'PARTIAL';
                }

                return {
                    id: inv.id,
                    number: inv.invoiceNumber,
                    date: new Date(inv.issueDate).toLocaleDateString('es-VE'),
                    totalAmount: (Number(inv.pendingAmount) + abonos).toFixed(2),
                    paidAmount: abonos.toFixed(2),
                    pendingAmount: Number(inv.pendingAmount).toFixed(2),
                    status: displayStatus, // Estado "inteligente" para el frontend
                    overdue: new Date(inv.dueDate) < new Date() && inv.status !== 'PAID'
                };
            }),
            payments: payments.map(p => ({
                id: p.id,
                date: new Date(p.paymentDate).toLocaleDateString('es-VE'),
                amount: Number(p.amount).toFixed(2),
                invoiceNumber: p.invoice?.invoiceNumber || 'N/A'
            }))
        };
    }
}
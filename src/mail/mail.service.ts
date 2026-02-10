import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private adminEmail!: string;

  constructor() {
    if (!process.env.ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL no está definido en el .env');
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está definido en el .env');
    }

    this.adminEmail = process.env.ADMIN_EMAIL;
    this.resend = new Resend(process.env.RESEND_API_KEY);

  }

  /* =======================
     EMAIL AL CLIENTE
  ======================= */
  async sendClientOrderEmail(
    cartItems: any[],
    total: number,
  ) {
    const html = this.generateClientHtml(cartItems, total);

    try {
      return await this.resend.emails.send({
        from: 'Ferretería <onboarding@resend.dev>',
        to: this.adminEmail,
        subject: 'Confirmación de tu pedido 🧾',
        html,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error enviando correo al cliente',
      );
    }
  }

  /* =======================
     EMAIL AL ADMIN
  ======================= */
  async sendAdminOrderEmail(
    clientEmail: string,
    cartItems: any[],
    total: number,
  ) {
    if (!this.adminEmail) return;

    const html = this.generateAdminHtml(clientEmail, cartItems, total);

    try {
      return await this.resend.emails.send({
        from: 'Sistema de Ventas <onboarding@resend.dev>',
        to: [this.adminEmail],
        subject: '🛒 Nuevo pedido recibido',
        html,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error enviando correo al admin',
      );
    }
  }

  /* =======================
     HTML CLIENTE
  ======================= */
  private generateClientHtml(items: any[], total: number): string {
    const rows = items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0;">
                <span style="display: block; font-weight: bold; color: #333;">${item.product.name}</span>
                <span style="font-size: 12px; color: #777;">Unitario: $${Number(item.product.salePrice1).toFixed(2)}</span>
            </td>
            <td style="padding: 12px 0; text-align: center; color: #555;">${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #2c3e50;">
                $${(Number(item.product.salePrice1) * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join('');

    return `
    <div style="background-color: #f9f9f9; padding: 40px 10px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">¡Pedido Confirmado!</h1>
                <p style="color: #bdc3c7; margin-top: 10px;">Gracias por confiar en nuestra ferretería.</p>
            </div>

            <div style="padding: 30px;">
                <p style="color: #34495e; font-size: 16px;">Hola,</p>
                <p style="color: #7f8c8d; line-height: 1.6;">Hemos recibido tu solicitud. A continuación encontrarás el detalle de tu compra:</p>
                
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #edeff2;">
                            <th align="left" style="padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #95a5a6;">Producto</th>
                            <th align="center" style="padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #95a5a6;">Cant.</th>
                            <th align="right" style="padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #95a5a6;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div style="margin-top: 20px; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #7f8c8d;">Total a pagar</p>
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #2c3e50;">$${total.toFixed(2)}</p>
                </div>

                <div style="margin-top: 40px; padding: 20px; background-color: #fcf8e3; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #8a6d3b; font-size: 14px;">
                        <strong>Próximo paso:</strong> Nos comunicaremos contigo en las próximas 24 horas para coordinar el pago y la entrega.
                    </p>
                </div>
            </div>

            <div style="background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 12px; color: #95a5a6;">
                <p style="margin: 5px 0;">Ferretería Central &copy; 2026</p>
                <p style="margin: 5px 0;">Este es un mensaje automático, no es necesario responder.</p>
            </div>
        </div>
    </div>
    `;
  }

  /* =======================
     HTML ADMIN
  ======================= */
  /* =======================
   HTML ADMIN (Moderno & Sobrio)
======================= */
  private generateAdminHtml(
    clientEmail: string,
    items: any[],
    total: number,
  ): string {
    const rows = items
      .map(
        item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-size: 14px; color: #1e293b;">${item.product.name}</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; color: #64748b;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right; font-size: 14px; color: #1e293b; font-weight: 500;">
            $${Number(item.product.salePrice1).toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join('');

    return `
    <div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            
            <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-weight: 600;">Notificación de Venta</h2>
                    <span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">ID de Pedido: #${Math.floor(Math.random() * 10000)}</span>
                </div>
            </div>

            <div style="padding: 24px; background-color: #fbfcfd;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Datos del Cliente</p>
                <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Email:</strong> ${clientEmail}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;"><strong>Recibido:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>

            <div style="padding: 24px;">
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th align="left" style="padding: 12px; font-size: 12px; color: #94a3b8; border-bottom: 2px solid #f1f5f9; text-transform: uppercase;">Producto</th>
                            <th align="center" style="padding: 12px; font-size: 12px; color: #94a3b8; border-bottom: 2px solid #f1f5f9; text-transform: uppercase;">Cant.</th>
                            <th align="right" style="padding: 12px; font-size: 12px; color: #94a3b8; border-bottom: 2px solid #f1f5f9; text-transform: uppercase;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <table width="100%">
                        <tr>
                            <td align="right" style="font-size: 14px; color: #64748b;">Subtotal:</td>
                            <td align="right" width="100" style="font-size: 14px; color: #1e293b; padding-left: 20px;">$${total.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td align="right" style="font-size: 16px; font-weight: 600; color: #0f172a; padding-top: 8px;">Total del Pedido:</td>
                            <td align="right" style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-top: 8px;">$${total.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistema de Gestión de Inventario Interno</p>
            </div>
        </div>
    </div>
    `;
  }
}

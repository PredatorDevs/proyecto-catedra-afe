import PaymentMethod from '#models/payment_method'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const methods = [
      {
        code: 'CASH',
        name: 'Efectivo',
        requiresReference: false,
        requiresProof: false,
        isCash: true,
        isOnline: false,
        isActive: true,
      },
      {
        code: 'BANK_TRANSFER',
        name: 'Transferencia bancaria',
        requiresReference: true,
        requiresProof: true,
        isCash: false,
        isOnline: true,
        isActive: true,
      },
      {
        code: 'CARD_MANUAL',
        name: 'Tarjeta (registro manual)',
        requiresReference: true,
        requiresProof: false,
        isCash: false,
        isOnline: true,
        isActive: true,
      },
    ]

    for (const method of methods) {
      await PaymentMethod.updateOrCreate({ code: method.code }, method)
    }
  }
}

import env from '#start/env'
import { Resend } from 'resend'

type SendFiscalDocumentInput = {
  toEmail: string
  subject: string
  html: string
  pdfBuffer: Buffer
  filename: string
}

export default class ResendMailerService {
  private getFromAddress() {
    const fromEmail = env.get('RESEND_FROM_EMAIL')
    const fromName = env.get('RESEND_FROM_NAME') || 'Hotel AFE'

    if (!fromEmail) {
      return null
    }

    return `${fromName} <${fromEmail}>`
  }

  private ensureEnabled() {
    const enabled = env.get('RESEND_ENABLED')
    const apiKey = env.get('RESEND_API_KEY')
    const fromAddress = this.getFromAddress()

    if (!enabled) {
      throw new Error('La integracion de correo esta deshabilitada. Configura RESEND_ENABLED=true para activarla.')
    }

    if (!apiKey) {
      throw new Error('Falta RESEND_API_KEY en entorno para enviar correos.')
    }

    if (!fromAddress) {
      throw new Error('Falta RESEND_FROM_EMAIL en entorno para enviar correos.')
    }

    return { apiKey, fromAddress }
  }

  async sendFiscalDocument(input: SendFiscalDocumentInput) {
    const { apiKey, fromAddress } = this.ensureEnabled()
    const resend = new Resend(apiKey)

    return resend.emails.send({
      from: fromAddress,
      to: [input.toEmail],
      subject: input.subject,
      html: input.html,
      attachments: [
        {
          filename: input.filename,
          content: input.pdfBuffer,
        },
      ],
    })
  }
}

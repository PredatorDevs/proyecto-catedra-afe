import FiscalDocument from '#models/fiscal_document'
import FiscalDocumentItem from '#models/fiscal_document_item'
import FiscalDocumentPayment from '#models/fiscal_document_payment'
import PDFDocument from 'pdfkit'

type BuildFiscalPdfInput = {
  document: FiscalDocument
  items: FiscalDocumentItem[]
  payments: FiscalDocumentPayment[]
  reservationNumber: string
}

function asMoney(value: number | null | undefined) {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return safeValue.toFixed(2)
}

function asLabel(value: string | null | undefined, fallback = '-') {
  const text = String(value || '').trim()
  return text.length > 0 ? text : fallback
}

export default class FiscalDocumentPdfService {
  async buildPdfBuffer(input: BuildFiscalPdfInput): Promise<Buffer> {
    const { document, items, payments, reservationNumber } = input

    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      pdf.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      pdf.on('end', () => resolve(Buffer.concat(chunks)))
      pdf.on('error', reject)

      const marginLeft = 50
      const contentWidth = pdf.page.width - marginLeft * 2
      let cursorY = 50

      const addPageIfNeeded = (spaceNeeded: number) => {
        const bottomLimit = pdf.page.height - 60
        if (cursorY + spaceNeeded <= bottomLimit) return
        pdf.addPage()
        cursorY = 50
      }

      const drawHeader = () => {
        pdf.roundedRect(marginLeft, cursorY, contentWidth, 86, 10).fill('#0f4c81')

        pdf
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('HOTEL AFE', marginLeft + 18, cursorY + 14)

        pdf
          .font('Helvetica-Bold')
          .fontSize(21)
          .text('Documento Fiscal', marginLeft + 18, cursorY + 30)

        pdf
          .font('Helvetica')
          .fontSize(10)
          .text('Comprobante tributario generado por el modulo administrativo', marginLeft + 18, cursorY + 58)

        cursorY += 102
      }

      const drawKeyValueRow = (label: string, value: string, y: number, right = false) => {
        const x = right ? marginLeft + contentWidth / 2 + 8 : marginLeft + 12
        const width = contentWidth / 2 - 20

        pdf.font('Helvetica-Bold').fontSize(9).fillColor('#4b5f77').text(label, x, y, { width })
        pdf
          .font('Helvetica')
          .fontSize(11)
          .fillColor('#0f172a')
          .text(value, x, y + 13, { width })
      }

      const drawDocumentMeta = () => {
        addPageIfNeeded(110)
        pdf.roundedRect(marginLeft, cursorY, contentWidth, 96, 8).fill('#f8fbff').stroke('#d6e4f5')

        drawKeyValueRow('Numero de documento', asLabel(document.documentNumber), cursorY + 12)
        drawKeyValueRow('Tipo', asLabel(document.documentType), cursorY + 44)
        drawKeyValueRow('Estado', asLabel(document.status), cursorY + 76)

        drawKeyValueRow('Reservacion', asLabel(reservationNumber), cursorY + 12, true)
        drawKeyValueRow('Cliente', asLabel(document.customerNameSnapshot), cursorY + 44, true)
        drawKeyValueRow('Emitido en', asLabel(document.issuedAt?.toFormat('yyyy-LL-dd HH:mm')), cursorY + 76, true)

        cursorY += 114
      }

      const drawSectionTitle = (title: string) => {
        addPageIfNeeded(28)
        pdf.font('Helvetica-Bold').fontSize(13).fillColor('#0f2f4a').text(title, marginLeft, cursorY)
        cursorY += 20
      }

      const drawItemsTable = () => {
        drawSectionTitle('Detalle de items')
        addPageIfNeeded(28)

        const columns = [
          { key: 'desc', label: 'Descripcion', width: 220 },
          { key: 'qty', label: 'Cant', width: 44 },
          { key: 'unit', label: 'Unitario', width: 75 },
          { key: 'sub', label: 'Subtotal', width: 75 },
          { key: 'iva', label: 'IVA', width: 65 },
          { key: 'total', label: 'Total', width: 71 },
        ]

        let x = marginLeft
        pdf.rect(marginLeft, cursorY, contentWidth, 20).fill('#eef5ff')
        pdf.fillColor('#0b2239').font('Helvetica-Bold').fontSize(9)
        columns.forEach((column) => {
          pdf.text(column.label, x + 6, cursorY + 6, { width: column.width - 10 })
          x += column.width
        })
        cursorY += 20

        if (items.length === 0) {
          pdf.rect(marginLeft, cursorY, contentWidth, 22).stroke('#d9e2ef')
          pdf
            .fillColor('#4b5563')
            .font('Helvetica')
            .fontSize(10)
            .text('Sin items registrados para este documento.', marginLeft + 10, cursorY + 6)
          cursorY += 28
          return
        }

        items.forEach((item, index) => {
          addPageIfNeeded(24)
          if (index % 2 === 0) {
            pdf.rect(marginLeft, cursorY, contentWidth, 22).fill('#fbfdff')
          }
          pdf.rect(marginLeft, cursorY, contentWidth, 22).stroke('#d9e2ef')

          const values = [
            asLabel(item.description),
            String(item.quantity),
            asMoney(item.unitPrice),
            asMoney(item.subtotal),
            asMoney(item.ivaTotal),
            asMoney(item.totalAmount),
          ]

          x = marginLeft
          pdf.fillColor('#111827').font('Helvetica').fontSize(9)
          values.forEach((value, valueIndex) => {
            const width = columns[valueIndex].width
            const align = valueIndex === 0 ? 'left' : 'right'
            pdf.text(value, x + 6, cursorY + 6, { width: width - 10, align })
            x += width
          })

          cursorY += 22
        })

        cursorY += 8
      }

      const drawPayments = () => {
        drawSectionTitle('Pagos aplicados')

        if (payments.length === 0) {
          addPageIfNeeded(20)
          pdf
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#4b5563')
            .text('Sin pagos vinculados.', marginLeft, cursorY)
          cursorY += 18
          return
        }

        payments.forEach((payment, index) => {
          addPageIfNeeded(20)
          pdf
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#111827')
            .text(
              `${index + 1}. Pago #${payment.paymentId} - Monto aplicado: ${asMoney(payment.amount)} ${document.currencyCode}`,
              marginLeft,
              cursorY
            )
          cursorY += 16
        })

        cursorY += 8
      }

      const drawTotals = () => {
        addPageIfNeeded(104)
        const boxX = marginLeft + contentWidth - 220
        const boxW = 220
        const lineH = 18

        pdf.roundedRect(boxX, cursorY, boxW, 94, 8).fill('#f6f9fe').stroke('#d6e4f5')

        const lines = [
          ['Subtotal', asMoney(document.subtotal)],
          ['IVA', asMoney(document.ivaTotal)],
          ['Impuesto turismo', asMoney(document.tourismTaxTotal)],
        ]

        let y = cursorY + 12
        lines.forEach(([label, value]) => {
          pdf.font('Helvetica').fontSize(10).fillColor('#334155').text(label, boxX + 12, y)
          pdf
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#0f172a')
            .text(`${value} ${document.currencyCode}`, boxX + 90, y, { width: boxW - 102, align: 'right' })
          y += lineH
        })

        pdf.moveTo(boxX + 12, y + 2).lineTo(boxX + boxW - 12, y + 2).strokeColor('#b9cbe3').stroke()
        y += 10

        pdf.font('Helvetica-Bold').fontSize(12).fillColor('#0b2239').text('TOTAL', boxX + 12, y)
        pdf
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#0b2239')
          .text(`${asMoney(document.totalAmount)} ${document.currencyCode}`, boxX + 90, y, {
            width: boxW - 102,
            align: 'right',
          })

        cursorY += 110
      }

      const drawFooter = () => {
        const footerY = pdf.page.height - 44
        const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
        pdf.font('Helvetica').fontSize(8).fillColor('#64748b').text(
          `Generado por Hotel AFE · ${generatedAt}`,
          marginLeft,
          footerY,
          { width: contentWidth, align: 'center' }
        )
      }

      drawHeader()
      drawDocumentMeta()
      drawItemsTable()
      drawPayments()
      drawTotals()
      drawFooter()

      pdf.end()
    })
  }
}

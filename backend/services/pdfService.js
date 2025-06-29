const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  static generateContractPDF(contract) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Create a buffer to store the PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Add header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('DIGITAL CONTRACT', { align: 'center' })
           .moveDown(2);

        // Add contract details
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Contract Details', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Contract ID: ${contract.id}`)
           .text(`Title: ${contract.title}`)
           .text(`Description: ${contract.description}`)
           .text(`Amount: $${contract.amount}`)
           .text(`Created Date: ${new Date(contract.createdAt).toLocaleDateString()}`)
           .text(`Due Date: ${new Date(contract.dueDate).toLocaleDateString()}`)
           .text(`Status: ${contract.status}`)
           .moveDown(1);

        // Add parties section
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Parties Involved', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`First Party (Creator):`)
           .text(`  Name: ${contract.firstPartyName}`)
           .text(`  Email: ${contract.firstPartyEmail}`)
           .text(`  Wallet: ${contract.firstPartyWallet}`)
           .moveDown(0.5);

        doc.text(`Second Party:`)
           .text(`  Name: ${contract.secondPartyName}`)
           .text(`  Email: ${contract.secondPartyEmail}`)
           .text(`  Wallet: ${contract.secondPartyWallet || 'Not provided'}`)
           .moveDown(1);

        // Add terms and conditions
        if (contract.terms && contract.terms.length > 0) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Terms and Conditions', { underline: true })
             .moveDown(0.5);

          doc.fontSize(12)
             .font('Helvetica');

          contract.terms.forEach((term, index) => {
            doc.text(`${index + 1}. ${term}`)
               .moveDown(0.3);
          });
          doc.moveDown(1);
        }

        // Add signatures section
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Digital Signatures', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica');

        if (contract.firstPartySignature) {
          doc.text(`First Party Signature: ✓ Signed`)
             .text(`Signed Date: ${new Date(contract.firstPartySignedAt).toLocaleDateString()}`)
             .moveDown(0.5);
        } else {
          doc.text(`First Party Signature: ⏳ Pending`)
             .moveDown(0.5);
        }

        if (contract.secondPartySignature) {
          doc.text(`Second Party Signature: ✓ Signed`)
             .text(`Signed Date: ${new Date(contract.secondPartySignedAt).toLocaleDateString()}`)
             .moveDown(0.5);
        } else {
          doc.text(`Second Party Signature: ⏳ Pending`)
             .moveDown(0.5);
        }

        // Add blockchain information if available
        if (contract.blockchainTxHash) {
          doc.moveDown(1)
             .fontSize(14)
             .font('Helvetica-Bold')
             .text('Blockchain Information', { underline: true })
             .moveDown(0.5);

          doc.fontSize(12)
             .font('Helvetica')
             .text(`Transaction Hash: ${contract.blockchainTxHash}`)
             .text(`Network: Solana Devnet`)
             .moveDown(1);
        }

        // Add footer
        doc.fontSize(10)
           .font('Helvetica')
           .text('This is a digitally generated contract document.', 
                 50, doc.page.height - 100, { align: 'center' })
           .text(`Generated on: ${new Date().toLocaleString()}`, 
                 50, doc.page.height - 85, { align: 'center' });

        // Finalize the PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  static async saveContractPDF(contract, outputPath) {
    try {
      const pdfBuffer = await this.generateContractPDF(contract);
      
      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the PDF to file
      fs.writeFileSync(outputPath, pdfBuffer);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to save PDF: ${error.message}`);
    }
  }

  static getContractFileName(contractId) {
    return `contract_${contractId}_${Date.now()}.pdf`;
  }
}

module.exports = PDFService;

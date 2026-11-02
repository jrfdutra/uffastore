import fs from 'fs';
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, Packer } from 'docx';

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch (2.54 cm)
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "TERMO DE PRESTAÇÃO DE SERVIÇOS",
              bold: true,
              size: 28, // 14pt
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "DESENVOLVIMENTO, INTEGRAÇÃO E MANUTENÇÃO DE PLATAFORMA DIGITAL (UFFASTORE.PT)",
              bold: true,
              size: 20, // 10pt
              color: "4A5568",
              font: "Arial",
            }),
          ],
        }),

        // Section 1: Parties
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "1. IDENTIFICAÇÃO DAS PARTES",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Pelo presente instrumento particular, as partes abaixo qualificadas:\n\n",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "CONTRATANTE: ",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "UFFA STORE, neste ato representada legalmente por ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "Hugo Brandão",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: ", doravante designada simplesmente por ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "CONTRATANTE",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "; e\n\n",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "PRESTADOR DE SERVIÇOS: ",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "[Nome do Profissional / Prestador], doravante designado simplesmente por ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "PRESTADOR",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: ", celebram o presente Termo de Prestação de Serviços, que se regerá pelas cláusulas e condições seguintes.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Section 2: Object
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "2. OBJETO DO CONTRATO",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "O presente contrato tem por objeto a prestação de serviços de desenvolvimento tecnológico, web design, integração de sistemas e suporte contínuo para o projeto ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "uffastore.pt",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: ", compreendendo especificamente:\n\n" +
                "a) Registo, configuração e gestão técnica do domínio uffastore.pt;\n" +
                "b) Instalação, configuração, estruturação e customização da plataforma WordPress (com sistema de comércio eletrónico / WooCommerce);\n" +
                "c) Configuração e integração de gateways de pagamento bancário (métodos de pagamento digitais em Portugal);\n" +
                "d) Prestação de serviços contínuos de manutenção técnica da plataforma e atualização periódica de catálogo de produtos conforme orientações da CONTRATANTE.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Section 3: Pricing & Payment
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "3. CONDIÇÕES FINANCEIRAS E FORMA DE PAGAMENTO",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "3.1. Pela construção, configuração inicial, integração bancária e entrega operacional do site uffastore.pt, a CONTRATANTE pagará ao PRESTADOR o valor global fixo de ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "300,00 € (trezentos euros)",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: ", a ser liquidado conforme acordo entre as partes (ex: 50% no início e 50% na entrega e colocação em produção).\n\n" +
                "3.2. Para os serviços de manutenção contínua, atualizações extraordinárias de catálogo de produtos, melhorias adicionais ou suporte técnico prestados após a conclusão do projeto base, será cobrada a tarifa horária de ",
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: "12,00 € (doze euros) por hora trabalhada",
              bold: true,
              size: 22,
              font: "Arial",
            }),
            new TextRun({
              text: ".\n\n" +
                "3.3. As horas trabalhadas em regime de manutenção e atualização de catálogo serão registadas e reportadas mensalmente pelo PRESTADOR para efeitos de faturação e regularização.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Section 4: Responsibilities
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "4. OBRIGAÇÕES E RESPONSABILIDADES",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "4.1. Compete ao PRESTADOR:\n" +
                "a) Executar os serviços descritos na Cláusula 2 com zelo, qualidade e dentro dos padrões técnicos recomendados;\n" +
                "b) Respeitar os prazos acordados para a entrega das etapas de desenvolvimento;\n" +
                "c) Garantir a confidencialidade de todas as informações comerciais, estratégicas e credenciais de acesso fornecidas pela Uffa Store.\n\n" +
                "4.2. Compete à CONTRATANTE (Uffa Store, rep. Hugo Brandão):\n" +
                "a) Fornecer atempadamente todos os logótipos, imagens, textos, dados de produtos, acessos e informações necessárias para o desenvolvimento da plataforma;\n" +
                "b) Efetuar os pagamentos nos prazos estipulados na Cláusula 3;\n" +
                "c) Validar e aprovar as etapas do projeto apresentadas pelo PRESTADOR.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Section 5: Deadlines & Term
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "5. PRAZOS E VIGÊNCIA",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "O presente contrato entra em vigor na data da sua assinatura e da confirmação do pagamento inicial, tendo o projeto de construção do site uffastore.pt um prazo estimado de desenvolvimento a definir entre as partes. A assistência técnica e a manutenção de catálogo vigorarão por prazo indeterminado, podendo ser rescindidas por qualquer das partes mediante aviso prévio por escrito de 30 (trinta) dias.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Section 6: General Provisions
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "6. DISPOSIÇÕES GERAIS E FORO",
              bold: true,
              size: 24,
              color: "1A365D",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "Qualquer alteração ou adenda a este termo apenas será válida se efetuada por escrito e assinada por ambas as partes. Para dirimir quaisquer litígios decorrentes do presente contrato, fica eleito o foro da comarca aplicável, com renúncia expressa a qualquer outro.\n\n" +
                "E por estarem justos e contratados, assinam o presente instrumento em duas vias de igual teor.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Signatures spacing
        new Paragraph({
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: "Local e Data: ________________________, ____ de ________________ de 2026.",
              size: 22,
              font: "Arial",
            }),
          ],
        }),

        // Signatures table
        new Paragraph({
          spacing: { before: 600, after: 100 },
          children: [
            new TextRun({
              text: "\n\n___________________________________________________\n" +
                "CONTRATANTE: Uffa Store\n" +
                "Representante: Hugo Brandão\n\n\n\n" +
                "___________________________________________________\n" +
                "PRESTADOR DE SERVIÇOS: [Nome do Prestador]",
              size: 22,
              font: "Arial",
            }),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('docs/termo_prestacao_servicos_uffa_store.docx', buffer);
console.log('Termo gerado com sucesso: docs/termo_prestacao_servicos_uffa_store.docx');

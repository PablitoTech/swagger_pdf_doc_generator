import * as fs from 'fs';
import * as path from 'path';
import { ControllerInfo, EndpointInfo, DTOInfo } from '../parser/types';

// We need to import pdfmake properly in Node
const PdfPrinter = require('pdfmake');

export class PDFGenerator {
    private printer: any;

    constructor(extensionPath: string) {
        // Define fonts
        // For portability, we can use standard fonts if we configure them, 
        // but pdfmake expects file paths usually. 
        // We will try to use the ones included in pdfmake/examples/fonts if we had them, 
        // or system fonts.
        // For this MVP, we will try to use a relative path to a fonts folder we should create,
        // or just use 'Helvetica' (standard PDF font) which might require a specific setup in pdfmake 2.x

        // Strategy: Use standard fonts map to avoid shipping font files for now if possible,
        // or assume a 'fonts' folder exists in the extension root.

        // Let's create a 'fonts' folder in the root later and put Roboto there if needed.
        // Or better: use the default font handling if PdfPrinter allows.

        const fonts = {
            Roboto: {
                normal: path.join(extensionPath, 'fonts', 'Roboto-Regular.ttf'),
                bold: path.join(extensionPath, 'fonts', 'Roboto-Medium.ttf'),
                italics: path.join(extensionPath, 'fonts', 'Roboto-Italic.ttf'),
                bolditalics: path.join(extensionPath, 'fonts', 'Roboto-MediumItalic.ttf')
            }
        };

        this.printer = new PdfPrinter(fonts);
    }

    public generateControllerPDF(controller: ControllerInfo, outputPath: string) {
        const docDefinition = {
            content: [
                this.getHeader(controller.name, controller.basePath),
                this.getSummaryTable(controller),
                { text: 'Detalle de Endpoints', style: 'header', margin: [0, 20, 0, 10] },
                ...controller.endpoints.map(ep => this.getEndpointSection(ep)),
                { text: 'Modelos y DTOs', style: 'header', margin: [0, 20, 0, 10], pageBreak: 'before' },
                // We need to pass collected DTOs here. For now, empty or we need to pass the parsing context.
                { text: 'Listado de Modelos (TODO)', style: 'body' }
            ],
            styles: this.getStyles()
        };

        this.createPdf(docDefinition, outputPath);
    }

    public generateEndpointPDF(endpoint: EndpointInfo, outputPath: string) {
        const docDefinition = {
            content: [
                { text: `Endpoint: ${endpoint.methodName}`, style: 'title', margin: [0, 0, 0, 20] },
                this.getEndpointSection(endpoint)
            ],
            styles: this.getStyles()
        };
        this.createPdf(docDefinition, outputPath);
    }

    private createPdf(docDefinition: any, outputPath: string) {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(outputPath));
        pdfDoc.end();
    }

    private getHeader(title: string, subtitle: string) {
        return {
            stack: [
                { text: 'Documentación de API', style: 'topHeader' },
                { text: title, style: 'title' },
                { text: `Base Path: ${subtitle}`, style: 'subtitle' },
                { text: `Fecha: ${new Date().toLocaleDateString()}`, style: 'small', alignment: 'right' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2 }] },
                { text: ' ', margin: [0, 10] }
            ]
        };
    }

    private getSummaryTable(controller: ControllerInfo) {
        const body = [
            [{ text: 'Método', style: 'tableHeader' }, { text: 'Ruta', style: 'tableHeader' }, { text: 'Resumen', style: 'tableHeader' }]
        ];

        controller.endpoints.forEach(ep => {
            body.push([
                { text: ep.httpMethod, style: 'method' },
                { text: ep.path, style: 'body' },
                { text: ep.summary || '', style: 'body' }
            ]);
        });

        return {
            table: {
                headerRows: 1,
                widths: ['auto', '*', '*'],
                body: body
            },
            layout: 'lightHorizontalLines'
        };
    }

    private getEndpointSection(ep: EndpointInfo) {
        return {
            stack: [
                { text: `${ep.httpMethod} ${ep.path}`, style: 'endpointHeader', margin: [0, 15, 0, 5] },
                { text: ep.summary || 'Sin resumen', style: 'summary' },
                { text: ep.description || '', style: 'body', margin: [0, 5, 0, 10] },

                // Request Parameters
                this.getParametersTable(ep.parameters),

                // Response
                { text: 'Respuestas', style: 'subheader', margin: [0, 10, 0, 5] },
                this.getMakeResponsesTable(ep.responses)
            ],
            unbreakable: true // try to keep endpoint info together
        };
    }

    private getParametersTable(params: any[]) {
        if (!params || params.length === 0) return { text: 'No hay parámetros requeridos.', style: 'small' };

        const body = [
            [{ text: 'Nombre', style: 'tableHeader' }, { text: 'Ubicación', style: 'tableHeader' }, { text: 'Tipo', style: 'tableHeader' }, { text: 'Requerido', style: 'tableHeader' }]
        ];

        params.forEach(p => {
            body.push([
                p.name,
                p.in,
                p.type,
                p.required ? 'Sí' : 'No'
            ]);
        });

        return {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto'],
                body: body
            }
        };
    }

    private getMakeResponsesTable(responses: any[]) {
        if (!responses || responses.length === 0) return { text: 'No especificado', style: 'small' };

        const body = [
            [{ text: 'Código', style: 'tableHeader' }, { text: 'Descripción', style: 'tableHeader' }]
        ];

        responses.forEach(r => {
            body.push([
                { text: r.responseCode, style: 'bold' },
                r.description
            ]);
        });

        return {
            table: {
                headerRows: 1,
                widths: ['auto', '*'],
                body: body
            }
        };
    }

    private getStyles() {
        return {
            topHeader: { fontSize: 10, color: 'gray', italics: true },
            title: { fontSize: 18, bold: true, color: '#2c3e50', margin: [0, 5, 0, 5] },
            subtitle: { fontSize: 14, color: '#34495e', margin: [0, 0, 0, 10] },
            header: { fontSize: 16, bold: true, margin: [0, 10, 0, 10] },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
            endpointHeader: { fontSize: 14, bold: true, color: '#2980b9' },
            tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#ecf0f1' },
            method: { bold: true, fontSize: 10 },
            body: { fontSize: 11 },
            small: { fontSize: 10, color: 'gray' },
            summary: { fontSize: 12, italics: true, color: '#555' }
        };
    }
}

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JavaParser } from './parser/JavaParser';
import { AIService } from './services/AIService';
import { PDFGenerator } from './services/PDFGenerator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "swagger-pdf-generator" is now active!');

    const parser = new JavaParser();
    const aiService = new AIService();
    const pdfGenerator = new PDFGenerator(context.extensionPath);

    let disposableController = vscode.commands.registerCommand('swagger-pdf.generateControllerDoc', async (uri: vscode.Uri) => {
        await handleGeneration(uri, 'controller', parser, aiService, pdfGenerator);
    });

    let disposableEndpoint = vscode.commands.registerCommand('swagger-pdf.generateEndpointDoc', async (uri: vscode.Uri) => {
        await handleGeneration(uri, 'endpoint', parser, aiService, pdfGenerator);
    });

    let disposableConfig = vscode.commands.registerCommand('swagger-pdf.configureAI', async () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'swagger-pdf-generator.ai');
    });

    context.subscriptions.push(disposableController);
    context.subscriptions.push(disposableEndpoint);
    context.subscriptions.push(disposableConfig);
}

async function handleGeneration(
    uri: vscode.Uri,
    mode: 'controller' | 'endpoint',
    parser: JavaParser,
    aiService: AIService,
    pdfGenerator: PDFGenerator
) {
    if (!uri && vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
    }
    if (!uri) {
        vscode.window.showErrorMessage('No file selected.');
        return;
    }

    // Progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Generating ${mode} documentation...`,
        cancellable: false
    }, async (progress) => {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const code = document.getText();

            progress.report({ increment: 10, message: 'Parsing Java code...' });
            const controllerInfo = parser.parseController(code);

            if (!controllerInfo) {
                vscode.window.showErrorMessage('Could not parse Controller. Is it annotated with @RestController?');
                return;
            }

            // Output Config
            const config = vscode.workspace.getConfiguration('swagger-pdf-generator');
            let outputDir = config.get<string>('outputDirectory') || './docs/api/';

            // Resolve relative path against workspace folder
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (workspaceFolder) {
                outputDir = path.resolve(workspaceFolder.uri.fsPath, outputDir);
            } else {
                outputDir = path.resolve(path.dirname(uri.fsPath), 'docs/api/');
            }

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            if (mode === 'controller') {
                progress.report({ increment: 30, message: 'Enhancing with AI...' });
                const enhancedController = await aiService.enhanceControllerDocumentation(controllerInfo);

                progress.report({ increment: 30, message: 'Generating PDF...' });
                const fileName = `${controllerInfo.name}_api_docs.pdf`;
                const outputPath = path.join(outputDir, fileName);

                pdfGenerator.generateControllerPDF(enhancedController, outputPath);
                vscode.window.showInformationMessage(`PDF Generated: ${outputPath}`);
            } else {
                // Endpoint Mode
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('Open the file to select an endpoint.');
                    return;
                }

                const endpoints = controllerInfo.endpoints.map(e => e.methodName);
                const selected = await vscode.window.showQuickPick(endpoints, { title: 'Select Endpoint to Document' });

                if (!selected) return;

                const endpoint = controllerInfo.endpoints.find(e => e.methodName === selected);
                if (endpoint) {
                    progress.report({ increment: 30, message: 'Enhancing with AI...' });
                    const enhancedEndpoint = await aiService.enhanceEndpointDocumentation(endpoint);

                    progress.report({ increment: 30, message: 'Generating PDF...' });
                    const fileName = `${controllerInfo.name}_${endpoint.methodName}_api_docs.pdf`;
                    const outputPath = path.join(outputDir, fileName);

                    pdfGenerator.generateEndpointPDF(enhancedEndpoint, outputPath);
                    vscode.window.showInformationMessage(`PDF Generated: ${outputPath}`);
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error generating documentation: ${error.message}`);
            console.error(error);
        }
    });
}

export function deactivate() { }

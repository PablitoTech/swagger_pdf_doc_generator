import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { ControllerInfo, EndpointInfo } from '../parser/types';

export interface AIProvider {
    generateDocumentation(context: any, mode: 'controller' | 'endpoint'): Promise<any>;
}

export class AIService {
    private provider: AIProvider | null = null;

    constructor() {
        this.initializeProvider();
    }

    private initializeProvider() {
        // 1. Try to find workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let envConfig: any = {};

        if (workspaceFolders && workspaceFolders.length > 0) {
            const rootPath = workspaceFolders[0].uri.fsPath;
            const envPath = path.join(rootPath, '.env');
            const result = dotenv.config({ path: envPath });
            if (result.parsed) {
                envConfig = result.parsed;
            }
        }

        // 2. Read from env or fallback (maybe? User said it MUST be in .env, so we prioritize that)
        const providerType = envConfig['SWAGGER_PDF_AI_PROVIDER'] || 'openai';
        const apiKey = envConfig['SWAGGER_PDF_AI_API_KEY'];
        const model = envConfig['SWAGGER_PDF_AI_MODEL'] || 'gpt-4-turbo';
        const baseUrl = envConfig['SWAGGER_PDF_AI_BASE_URL'];

        if (!apiKey && providerType !== 'custom_http') {
            // Check VS Code Config as absolute fallback or just warn?
            // "deben estar en un archivo .env" implies strong preference.
            // But let's check one last time in legacy config to be safe, or just log.
            console.warn('No SWAGGER_PDF_AI_API_KEY found in .env');
            return;
        }

        if (providerType === 'openai') {
            this.provider = new OpenAIProvider(apiKey!, model!);
        }
    }

    public async enhanceControllerDocumentation(controller: ControllerInfo): Promise<ControllerInfo> {
        if (!this.provider) return controller; // Fallback to raw data

        try {
            const enhancedJson = await this.provider.generateDocumentation(controller, 'controller');
            // Merge enhanced data back to controller
            // For safety, we only update descriptions/summaries
            return { ...controller, ...enhancedJson };
        } catch (error) {
            console.error('AI Enhancement failed:', error);
            return controller;
        }
    }

    public async enhanceEndpointDocumentation(endpoint: EndpointInfo): Promise<EndpointInfo> {
        if (!this.provider) return endpoint;

        try {
            const enhancedJson = await this.provider.generateDocumentation(endpoint, 'endpoint');
            return { ...endpoint, ...enhancedJson };
        } catch (error) {
            console.error('AI Enhancement failed:', error);
            return endpoint;
        }
    }
}

class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true }); // dangerous in VSCode? node context is fine.
        this.model = model || 'gpt-4-turbo';
    }

    async generateDocumentation(context: any, mode: 'controller' | 'endpoint'): Promise<any> {
        const systemPrompt = `
ROL: Eres un redactor técnico experto en documentación de APIs RESTful.
OBJETIVO: Mejorar y completar la documentación técnica basada en el JSON proporcionado.
REGLAS:
1. NO inventes endpoints o campos que no existan en el JSON.
2. Si un campo no tiene descripción, genera una técnica y clara basada en su nombre.
3. Devuelve SOLO el JSON modificado con la misma estructura.
4. El idioma debe ser ESPAÑOL formal y técnico.
5. NO incluyas bloques de código markdown, solo el RAW JSON.
`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(context) }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        return JSON.parse(content);
    }
}

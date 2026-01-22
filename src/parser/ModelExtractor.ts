import * as vscode from 'vscode';
import { DTOInfo, DTOField } from './types';

export class ModelExtractor {

    /**
     * Finds and parses a DTO class by name.
     * @param className The simple name of the class (e.g. "NominationDetailsResponseDTO")
     */
    public async extractModel(className: string): Promise<DTOInfo | null> {
        // 1. Find file in workspace
        const files = await vscode.workspace.findFiles(`**/${className}.java`, '**/node_modules/**', 1);
        if (files.length === 0) {
            console.warn(`DTO Class not found: ${className}`);
            return null;
        }

        const fileUri = files[0];
        const document = await vscode.workspace.openTextDocument(fileUri);
        const code = document.getText();

        return this.parseDTO(code, className);
    }

    private parseDTO(code: string, className: string): DTOInfo {
        const packageName = this.extractPackage(code);
        const description = this.extractDescription(code);
        const fields = this.extractFields(code);

        return {
            name: className,
            packageName,
            description,
            fields
        };
    }

    private extractPackage(code: string): string {
        const match = code.match(/package\s+([\w.]+);/);
        return match ? match[1] : '';
    }

    private extractDescription(code: string): string {
        // Look for @Schema(description = "...")
        const match = code.match(/@Schema\s*\([^)]*description\s*=\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    private extractFields(code: string): DTOField[] {
        const fields: DTOField[] = [];
        // Regex for fields: private Type name;
        // private List<String> names;
        // Also capture @Schema on the field

        // We iterate lines to be safer (simplistic approach)
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('private') && line.endsWith(';')) {
                // Parse field
                // private type name;
                const fieldRegex = /private\s+([\w<>?[\],\s]+)\s+(\w+);/;
                const match = line.match(fieldRegex);
                if (match) {
                    const type = match[1];
                    const name = match[2];

                    // Look for @Schema on previous lines
                    let description = '';
                    let example = '';
                    let required = false;

                    // Simple lookback 1-2 lines
                    for (let j = 1; j <= 5; j++) {
                        if (i - j < 0) break;
                        const prev = lines[i - j].trim();
                        if (prev.includes('@Schema')) {
                            const descMatch = prev.match(/description\s*=\s*"([^"]+)"/);
                            if (descMatch) description = descMatch[1];
                            const exMatch = prev.match(/example\s*=\s*"([^"]+)"/);
                            if (exMatch) example = exMatch[1];
                            // break after finding schema
                            break;
                        }
                    }

                    fields.push({
                        name,
                        type,
                        description,
                        example,
                        required
                    });
                }
            }
        }
        return fields;
    }
}

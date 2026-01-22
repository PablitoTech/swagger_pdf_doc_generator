import { ControllerInfo, EndpointInfo, ParameterInfo, ApiResponseInfo, SecurityRequirement, MediaTypeInfo } from './types';

export class JavaParser {

    /**
     * Parses the Java source code of a Spring Boot Controller.
     * @param code The Java source code.
     * @returns A ControllerInfo object or null if not a controller.
     */
    public parseController(code: string): ControllerInfo | null {
        // Basic check for @RestController
        if (!code.includes('@RestController')) {
            return null;
        }

        const packageName = this.extractPackage(code);
        const className = this.extractClassName(code);
        const basePath = this.extractClassRequestMapping(code);
        const description = this.extractClassDescription(code);
        const security = this.extractSecurityRequirements(code); // Class level

        const endpoints = this.extractEndpoints(code);

        return {
            name: className,
            packageName: packageName,
            basePath: basePath,
            description: description,
            securityRequirements: security,
            endpoints: endpoints
        };
    }

    private extractPackage(code: string): string {
        const match = code.match(/package\s+([\w.]+);/);
        return match ? match[1] : '';
    }

    private extractClassName(code: string): string {
        const match = code.match(/public\s+class\s+(\w+)/);
        return match ? match[1] : 'UnknownController';
    }

    private extractClassRequestMapping(code: string): string {
        // @RequestMapping("/api/v1/nominations") or @RequestMapping(value = "/api/v1/nominations")
        // We need to capture the annotation block for the class
        const classBlock = code.split('public class')[0];
        const match = classBlock.match(/@RequestMapping\s*\((?:value\s*=\s*)?"([^"]+)"/);
        return match ? match[1] : '/';
    }

    private extractClassDescription(code: string): string {
        // Look for Javadoc or @Tag description
        // Simplified: check for topmost Javadoc
        return ''; // TODO: Implement Javadoc extraction
    }

    private extractSecurityRequirements(codeOrBlock: string): SecurityRequirement[] {
        const requirements: SecurityRequirement[] = [];
        const regex = /@SecurityRequirement\s*\(\s*name\s*=\s*"([^"]+)"/g;
        let match;
        while ((match = regex.exec(codeOrBlock)) !== null) {
            requirements.push({ name: match[1], scopes: [] });
        }
        return requirements;
    }

    /**
     * EXTRACT ENDPOINTS
     * Strategy: Split code by methods or iterate finding @Mapping annotations
     */
    private extractEndpoints(code: string): EndpointInfo[] {
        const endpoints: EndpointInfo[] = [];

        // Regex to find methods annotated with @Get/Post/Put/Delete/PatchMapping or @RequestMapping
        // (?:public|protected|private)\s+(?:[\w<>?[\],\s]+)\s+(\w+)\s*\(([^)]*)\)
        // We iterate through the file finding method definitions, then look backwards for annotations.

        // 1. Identify method blocks. This is hard with regex. 
        // Better strategy: Find the Annotation, then consume until the method signature.

        const mappingRegex = /@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(([^)]*)\)/g;
        let match;

        // We need to be careful not to match class level annotation again. 
        // The class level one usually comes before "public class".
        const classDefIndex = code.indexOf('public class');
        let methodArea = code.substring(classDefIndex);

        while ((match = mappingRegex.exec(methodArea)) !== null) {
            const annotationType = match[1]; // Get, Post, etc.
            const annotationContent = match[2];
            const startIndex = match.index;

            // Extract HTTP Method
            let httpMethod = annotationType.toUpperCase();
            if (httpMethod === 'REQUEST') httpMethod = 'ALL'; // Default or need parsing

            // Extract Path from annotation content e.g. "/nom-detail" or value="..."
            let path = '';
            const pathMatch = annotationContent.match(/"([^"]+)"/);
            if (pathMatch) path = pathMatch[1];

            // Now look specificially for the method signature following this annotation
            // We search forward from the annotation end
            const afterAnnotation = methodArea.substring(startIndex + match[0].length);
            const methodSigRegex = /public\s+(?:[\w<>\[\]]+\s+)*(\w+)\s*\(/; // generic return type handling is tricky
            // Simpler: public [Response/Type] methodName(
            const methodMatch = afterAnnotation.match(/public\s+([^{]+)\s+(\w+)\s*\(/);

            if (methodMatch) {
                // Ensure the method is relatively close (ignoring other annotations)
                // If there are 500 chars of other stuff it might be a false positive, but usually java has stacked annotations

                const returnString = methodMatch[1].trim();
                const methodName = methodMatch[2];

                // Extract arguments
                // Find the closing ) of the parameters
                const openParenIndex = afterAnnotation.indexOf('(', methodMatch.index!) + 1;
                let balance = 1;
                let closeParenIndex = openParenIndex;
                while (balance > 0 && closeParenIndex < afterAnnotation.length) {
                    if (afterAnnotation[closeParenIndex] === '(') balance++;
                    if (afterAnnotation[closeParenIndex] === ')') balance--;
                    closeParenIndex++;
                }
                const paramsStr = afterAnnotation.substring(openParenIndex, closeParenIndex - 1);
                const parameters = this.parseParameters(paramsStr);

                // Extract Operation/Responses
                // The annotation block is between the previous method end (or class start) and this method start
                // We approximated the start by the mapping annotation.
                // NOTE: We need to capture the Full Annotation Block for this method.
                // We can search backwards from method definition to definitions of @Operation, etc.

                const fullBlock = methodArea.substring(0, startIndex + match[0].length + methodMatch.index!);
                // We need to limit lookback to avoid previous methods. 
                // A heuristic is looking for the last '}' or ';'.
                const lastBrace = fullBlock.lastIndexOf('}');
                const methodAnnotationsBlock = fullBlock.substring(lastBrace + 1);

                const { summary, description } = this.extractOperationInfo(methodAnnotationsBlock);
                const responses = this.extractApiResponses(methodAnnotationsBlock);

                // Request Body
                const requestBody = this.extractRequestBody(paramsStr); // Simplified, usually in params

                endpoints.push({
                    methodName,
                    httpMethod,
                    path,
                    summary,
                    description,
                    parameters,
                    returnType: returnString,
                    responses,
                    requestBody,
                    securityRequirements: this.extractSecurityRequirements(methodAnnotationsBlock)
                });
            }
        }

        return endpoints;
    }

    private parseParameters(paramsStr: string): ParameterInfo[] {
        if (!paramsStr.trim()) return [];
        const params: ParameterInfo[] = [];
        // Split by comma, but be careful of generics <A,B>
        // naive split for now
        const rawParams = paramsStr.split(',');

        for (const raw of rawParams) {
            // @PathVariable("id") Long id
            // @RequestBody Dto dto
            const parts = raw.trim().split(/\s+/);
            // This is very naive, need robust parsing for "@Annotation Type name"
            // TODO: Improve Param Parsing

            let name = parts[parts.length - 1]; // last is usually name
            let type = parts.length > 1 ? parts[parts.length - 2] : 'string';
            let inType: ParameterInfo['in'] = 'query'; // default

            if (raw.includes('@PathVariable')) inType = 'path';
            if (raw.includes('@RequestBody')) continue; // Handled separately

            params.push({
                name,
                type,
                in: inType,
                required: !raw.includes('required = false')
            });
        }
        return params;
    }

    private extractRequestBody(paramsStr: string): any { // returns RequestBodyInfo | undefined
        // check for @RequestBody
        if (paramsStr.includes('@RequestBody')) {
            // Find type
            // @RequestBody MyDto request
            const match = paramsStr.match(/@RequestBody\s+([\w<>]+)\s+(\w+)/);
            if (match) {
                return {
                    type: match[1],
                    required: true,
                    content: [{ mediaType: 'application/json' }]
                };
            }
        }
        return undefined;
    }

    private extractOperationInfo(block: string): { summary: string, description: string } {
        // @Operation(summary = "...", description = "...")
        const match = block.match(/@Operation\s*\(([^)]*)\)/);
        if (!match) return { summary: '', description: '' };

        const content = match[1];
        const summaryMatch = content.match(/summary\s*=\s*"([^"]+)"/);
        const descMatch = content.match(/description\s*=\s*"([^"]+)"/);

        return {
            summary: summaryMatch ? summaryMatch[1] : '',
            description: descMatch ? descMatch[1] : ''
        };
    }

    private extractApiResponses(block: string): ApiResponseInfo[] {
        const responses: ApiResponseInfo[] = [];
        // @ApiResponse(responseCode = "200", description = "...")
        // This fails if multiple @ApiResponse are inside @ApiResponses({...})
        // Regex for single @ApiResponse
        const regex = /@ApiResponse\s*\(([^)]*)\)/g;
        let match;
        while ((match = regex.exec(block)) !== null) {
            const content = match[1];
            const codeMatch = content.match(/responseCode\s*=\s*"([^"]+)"/);
            const descMatch = content.match(/description\s*=\s*"([^"]+)"/);

            if (codeMatch) {
                responses.push({
                    responseCode: codeMatch[1],
                    description: descMatch ? descMatch[1] : ''
                });
            }
        }
        return responses;
    }

}

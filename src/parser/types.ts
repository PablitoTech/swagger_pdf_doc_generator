export interface ControllerInfo {
    name: string;
    packageName: string;
    basePath: string;
    description?: string;
    endpoints: EndpointInfo[];
    securityRequirements?: SecurityRequirement[];
}

export interface EndpointInfo {
    methodName: string;
    httpMethod: string; // GET, POST, PUT, DELETE, etc.
    path: string;
    summary?: string;
    description?: string;
    operationId?: string;
    parameters: ParameterInfo[];
    requestBody?: RequestBodyInfo;
    responses: ApiResponseInfo[];
    returnType: string;
    securityRequirements?: SecurityRequirement[];
}

export interface ParameterInfo {
    name: string;
    type: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    description?: string;
}

export interface RequestBodyInfo {
    description?: string;
    content: MediaTypeInfo[];
    required: boolean;
    type: string; // The DTO class name
}

export interface MediaTypeInfo {
    mediaType: string;
    schemaType?: string;
}

export interface ApiResponseInfo {
    responseCode: string;
    description: string;
    content?: MediaTypeInfo[];
}

export interface SecurityRequirement {
    name: string;
    scopes?: string[];
}

export interface DTOInfo {
    name: string;
    packageName: string;
    description?: string;
    fields: DTOField[];
}

export interface DTOField {
    name: string;
    type: string;
    description?: string;
    example?: string;
    required?: boolean;
}

export interface ParsingContext {
    controllers: ControllerInfo[];
    dtos: Map<string, DTOInfo>; // Map ClassName -> DTOInfo
}

# Swagger PDF Generator for VS Code

Genera documentación técnica profesional en PDF a partir de Controllers de Spring Boot anotados con Swagger/OpenAPI.

## Características

- **Generación por Controller**: Crea un PDF completo con todos los endpoints de una clase `@RestController`.
- **Generación por Endpoint**: Crea una ficha técnica específica para un solo método seleccionado.
- **Integración con IA**: Utiliza Inteligencia Artificial (OpenAI, etc.) para mejorar la redacción técnica y generar descripciones claras.
- **Parsing Nativo**: Analiza el código fuente Java sin necesidad de compilar.
- **Soporte de DTOs**: Detecta y documenta las clases de Request y Response.

## Requisitos

- VS Code 1.96.0 o superior.
- Una clave de API de OpenAI (opcional, para mejoras con IA).

## Configuración

Se recomienda usar un archivo `.env` en la raíz de tu proyecto para configurar la conexión con el proveedor de IA.

1. Crea un archivo `.env` en la raíz de tu proyecto.
2. Copia el contenido de `.env.example`:

```env
SWAGGER_PDF_AI_PROVIDER=openai
SWAGGER_PDF_AI_API_KEY=tu_api_key_aqui
SWAGGER_PDF_AI_MODEL=gpt-4-turbo
SWAGGER_PDF_AI_BASE_URL=
SWAGGER_PDF_OUTPUT_DIR=./docs/api/
```

- **SWAGGER_PDF_AI_BASE_URL**: URL base si usas un proxy o proveedor compatible con OpenAI (opcional).
- **SWAGGER_PDF_OUTPUT_DIR**: Carpeta donde se guardarán los PDFs generados (relativa al proyecto).

La configuración de VS Code queda como respaldo si no existe el `.env`.

## Uso

1. Abre un archivo Java (`.java`) que contenga un `@RestController`.
2. **Click Derecho** en el editor.
3. Selecciona:
   - `Swagger PDF: Generate Controller Documentation` para todo el archivo.
   - `Swagger PDF: Generate Endpoint Documentation` si tienes el cursor sobre un método.

## Empaquetado e Instalación (Producción)

### Prerrequisitos
Asegúrate de tener **Node.js** instalado en tu sistema.

### 1. Compilación y Empaquetado

#### Windows (PowerShell / CMD)
1. Abre tu terminal en la carpeta del proyecto.
2. Instala las dependencias (si no lo has hecho):
   ```powershell
   npm install
   ```
3. Ejecuta el empaquetado (el archivo se guardará en `dist/`):
   ```powershell
   npx vsce package --out dist/
   ```
   *Si te pregunta por falta de repositorio, responde "Yes" (y).*

#### Mac / Linux (Bash / Zsh)
1. Abre tu terminal en la carpeta del proyecto.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el empaquetado:
   ```bash
   npx vsce package --out dist/
   ```

### 2. Resultado
Al finalizar, se generará el archivo en la carpeta `dist/` (ej: `dist/swagger-pdf-generator-0.0.1.vsix`).

### 3. Instalación (CLI)

Puedes instalarlo desde la terminal usando el comando `code` de VS Code:

#### Windows
```powershell
code --install-extension "dist/swagger-pdf-generator-0.0.1.vsix" --force
```

#### Mac / Linux
```bash
code --install-extension "dist/swagger-pdf-generator-0.0.1.vsix" --force
```

*(Asegúrate de estar en la carpeta donde se generó el archivo .vsix)*

## Ejemplo

Ver la carpeta `example_project` para un controlador de muestra `NominationRestController.java`.

---
Made with ❤️ by PablitoTech

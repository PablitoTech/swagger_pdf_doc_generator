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

## Configuración de la IA (Importante)

Para que la extensión mejore la documentación usando Inteligencia Artificial, necesitas configurar tu API Key. Tienes **dos opciones**:

### Opción A: Configuración Visual (Recomendada)
1. En VS Code, ve a **File > Preferences > Settings** (o presiona `Ctrl+,`).
2. Busca **"Swagger PDF"** en la barra de búsqueda.
3. Ingresa tu **Api Key**, **Model** (ej: `gpt-4-turbo`) y **Provider**.

### Opción B: Archivo `.env` (Para proyectos específicos)
Crea un archivo llamado `.env` en la raíz de tu proyecto y agrega las variables:

```env
SWAGGER_PDF_AI_PROVIDER=openai
SWAGGER_PDF_AI_API_KEY=sk-proj-tu-api-key-aqui...
SWAGGER_PDF_AI_MODEL=gpt-4-turbo
SWAGGER_PDF_AI_BASE_URL=https://api.openai.com/v1
SWAGGER_PDF_OUTPUT_DIR=docs/api
```

> **Nota:** La configuración visual tiene prioridad si ambos existen.
> **Seguridad:** Nunca subas tu archivo `.env` o tus API Keys a repositorios públicos.

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

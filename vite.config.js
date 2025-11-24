import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Middleware to handle saving index.yaml
const yamlWriterPlugin = {
    name: 'yaml-writer-middleware',
    configureServer(server) {
        server.middlewares.use('/api/update-index-yaml', (req, res, next) => {
            if (req.method !== 'POST') {
                return next();
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    // The file is located at the root of the project.
                    const filePath = path.resolve(process.cwd(), 'index.yaml');
                    fs.writeFileSync(filePath, body, 'utf8');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('index.yaml updated successfully.');
                } catch (error) {
                    console.error('Error writing to index.yaml:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Failed to update index.yaml.');
                }
            });
        });
    }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), yamlWriterPlugin],
});

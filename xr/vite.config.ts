import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        https: {
            key: '/Users/siggis/certificates/ai01_key.pem',
            cert: '/Users/siggis/certificates/ai01_cert.pem',
        }
    },
    optimizeDeps: {
        exclude: ['@babylonjs/havok'],
    }
})

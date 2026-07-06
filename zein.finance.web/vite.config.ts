import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_FINANCE_API_URL ? env.VITE_FINANCE_API_URL.trim() : undefined;
  console.log('--- DEBUG: BUILD MODE ---', mode);
  console.log('--- DEBUG: API URL FOUND ---', env.VITE_FINANCE_API_URL ? 'YES' : 'NO');
  return {
    define: {
      // This "injects" the variable into your client-side code
      'process.env.VITE_FINANCE_API_URL': JSON.stringify(env.VITE_FINANCE_API_URL),
    },
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});

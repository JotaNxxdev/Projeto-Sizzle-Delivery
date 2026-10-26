import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Serviço Node separado, com seu próprio tsconfig/lint/testes — não é
    // uma app Next.js, então as regras de React Hooks daqui (que disparam
    // falso-positivo em funções como "useMultiFileAuthState" do Baileys)
    // não se aplicam a ele.
    "whatsapp-bot/**",
    "whatsapp-test-local/**",
  ]),
]);

export default eslintConfig;

import pkgVitals from 'eslint-config-next/core-web-vitals';
import pkgTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...pkgVitals,
  ...pkgTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  },
  {
    ignores: [".next/*", "node_modules/*"]
  }
];

export default eslintConfig;

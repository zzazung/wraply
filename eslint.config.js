// wraply/eslint.config.js

import js from "@eslint/js";

export default [

  js.configs.recommended,

  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "artifacts"
    ]
  },

  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs"
    },

    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn"],
      "no-console": "off",
      "no-undef": "error",
      "no-extra-semi": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"]
    }

  }

];
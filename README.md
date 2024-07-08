# vite-plugin-json-schema-generator

Vite plugin to generate a JSON schema from a TypeScript type definition

# Installation

```bash
npm i -D vite-plugin-json-schema-generator
```

# Usage

```javascript
// Your vite.config.ts file
import jsonSchemaGenerator from 'vite-plugin-json-schema-generator';

export default defineConfig({
  plugins: [
    jsonSchemaGenerator({
      sourceTypesPath: resolve(__dirname, 'src/types.ts'),
      targetSchemaPath: resolve(__dirname, 'schema.json'),
      schemaOverrides: {
        '$ref': '#/definitions/RootType'
      },
    }),
  ],
});
```

# Thanks to

This is a tiny wrapper around (ts-json-schema-generator)[https://www.npmjs.com/package/ts-json-schema-generator] which does all the heavy lifting.

# Caveats

There is one significant caveat that I haven't bothered to resolve since this works fine for me. If there is interest, then I'll look to address it.

Due to downstream caching this Vite plugin makes a copy of the source file in a temp folder and runs the JSON schema generator against this copy. The end result is that the type definition must be a single standalone file. It cannot reference any other files.

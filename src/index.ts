import colors from 'picocolors';
import fs from 'node:fs/promises';
import { JSONSchema7 } from 'json-schema';
import path from 'node:path';
import os from 'node:os';
import { PluginContext } from 'rollup';
import { Config, createGenerator } from 'ts-json-schema-generator';
import { Plugin, createLogger } from 'vite';

export interface GenerateJsonSchemaProps extends Omit<Config, 'path'> {
  schemaOverrides?: JSONSchema7;
  sourceTypesPath: string;
  targetSchemaPath: string;
}

export default function generateJsonSchema(
  {
    schemaOverrides,
    sourceTypesPath,
    targetSchemaPath,
    ...passthroughProps
  }: GenerateJsonSchemaProps
) {
  const logger = createLogger('info');
  const tempDir = path.join(os.tmpdir(), 'vite-plugin-json-schema-generator');

  return {
    name: 'json-schema-generator',
    buildStart(this: PluginContext) {
      this.addWatchFile(sourceTypesPath);
      return generateJsonSchemaForImpl();
    },
    handleHotUpdate({ file }) {
      if (file === sourceTypesPath) {
        return generateJsonSchemaForImpl();
      }
    }
  } as Plugin;

  async function generateJsonSchemaForImpl() {
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `${ path.basename(sourceTypesPath) }.${ Date.now().toString(32) }-${ Math.round(Math.random() * 100).toString(36) }.ts`);
    try {
      const typesContent = await fs.readFile(sourceTypesPath, 'utf-8');
      await fs.writeFile(tempPath, typesContent);
      const schemaGenerator = createGenerator({
        path: tempPath,
        ...passthroughProps,
      });
      const schema = schemaGenerator.createSchema();
      const overriddenSchema = schemaOverrides
        ? Object.assign(schema, schemaOverrides)
        : schema;
      const schemaText = JSON.stringify(overriddenSchema, undefined, 2);
      const oldSchemaText = await fs.readFile(targetSchemaPath, 'utf-8');
      if (schemaText !== oldSchemaText) {
        logger.info(`${ colors.gray(currentTime()) } ${ colors.cyan(colors.bold('[json-schema-gen]')) } Writing ${ path.basename(targetSchemaPath) }`);
        await fs.writeFile(targetSchemaPath, schemaText);
      }
    } catch (error) {
      logger.error((error as Error).stack ?? String(error));
    } finally {
      try {
        await fs.rm(tempPath);
      } catch {
        // ignore
      }
    }
  }
}

function currentTime() {
  const t = new Date();
  return `${ twoDigits(periodHours(t)) }:${ twoDigits(t.getMinutes()) }:${ twoDigits(t.getSeconds()) } ${ period(t) }`;
}

function periodHours(time: Date) {
  const hours = time.getHours();
  return hours > 12
    ? hours - 12
    : hours;
}

function period(time: Date) {
  return time.getHours() > 11 ? 'PM' : 'AM';
}

function twoDigits(num: number) {
  return num < 10
    ? `0${ num }`
    : num.toString();
}

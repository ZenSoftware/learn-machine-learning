import { exec } from 'child_process';
import * as fs from 'fs';
import { appendFile, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import { Generator as PalGenerator } from '@paljs/generator';
import { Config as PalConfig } from '@paljs/types';

import {
  ClientFieldsTemplate,
  ClientQueriesTemplate,
  NestCaslTemplate,
  NestResolversABACTemplate,
  NestResolversIndexTemplate,
  NestResolversRBACTemplate,
} from './templates';

const execAsync = promisify(exec);

export type ZenGeneratorConfig = {
  palConfig: PalConfig;
  apiOutPath: string;
  caslOutFile?: string;
  authScheme?: 'ABAC' | 'RBAC';
  frontend?: {
    outPath: string;
    /** Defaults to 'fields' */
    fieldsFolderName?: string;
    /** Defaults to 'prisma' */
    queriesFolderName?: string;
  };
};

export class ZenGenerator {
  constructor(public config: ZenGeneratorConfig) {}

  async run() {
    const palConfig = this.config.palConfig as any;
    const PAL_OUT_PATH = palConfig.backend.output;
    const RESOLVERS_PATH = `${this.config.apiOutPath}/resolvers`;

    console.log(`------------------------ @paljs/generator ------------------------`);
    if (fs.existsSync(PAL_OUT_PATH)) {
      await rm(PAL_OUT_PATH, { recursive: true });
      await mkdir(PAL_OUT_PATH);
    }

    const pal = new PalGenerator(
      { name: palConfig.backend.generator, schemaPath: palConfig.schema },
      palConfig.backend
    );
    await pal.run();

    /**
     * Insert `doNotUseFieldUpdateOperationsInput: true` into generated PalJS `typeDefs.ts` file
     * Refer to: [PalJS GraphQL SDL inputs](https://paljs.com/plugins/sdl-inputs/)
     */
    if (palConfig.backend.doNotUseFieldUpdateOperationsInput) {
      const palTypeDefsFilePath = path.join(PAL_OUT_PATH, 'typeDefs.ts');
      const palTypeDefsFile = await readFile(palTypeDefsFilePath);
      const palTypeDefsFileUpdated = palTypeDefsFile
        .toString()
        .replace('sdlInputs()', 'sdlInputs({ doNotUseFieldUpdateOperationsInput: true })');
      await writeFile(palTypeDefsFilePath, palTypeDefsFileUpdated);
    }

    console.log(`- Wrote: ${this.config.palConfig.backend?.output}`);

    console.log(`---------------- Nest GraphQL resolvers generated ----------------`);
    if (!fs.existsSync(RESOLVERS_PATH)) {
      await mkdir(RESOLVERS_PATH);
    }

    // Get Prisma type names via the directory names under the 'prisma' folder;
    const dirents = await readdir(PAL_OUT_PATH, { withFileTypes: true });
    let prismaNames = dirents.filter(d => d.isDirectory()).map(d => d.name);
    prismaNames = prismaNames.sort();

    let wroteCount = 0;
    if (!this.config.authScheme || this.config.authScheme === 'ABAC') {
      if (this.config.caslOutFile) {
        await writeFile(this.config.caslOutFile, NestCaslTemplate(prismaNames));
        console.log(`- Wrote: ${this.config.caslOutFile}`);
      }

      wroteCount = await this.nestAbacResolvers(prismaNames);
    } else if (this.config.authScheme === 'RBAC') {
      wroteCount = await this.nestRbacResolvers(prismaNames);
    }

    console.log(`* Total resolver files wrote: ${wroteCount}`);

    // Get the data type names via the filename of the "resolvers" directory
    let dataTypeNames = (await readdir(RESOLVERS_PATH))
      .filter(f => path.basename(f) !== 'index.ts')
      .map(f => path.basename(f, '.ts')); // Remove ".ts" extension from all names

    const indexPath = `${RESOLVERS_PATH}/index.ts`;
    await writeFile(indexPath, NestResolversIndexTemplate(dataTypeNames));
    console.log(`- Wrote: ${indexPath}`);

    await this.execLocal(`prettier --loglevel warn --write "${this.config.apiOutPath}/**/*.ts"\n`);

    await this.generateFrontend(prismaNames);
  }

  async generateFrontend(prismaNames: string[]) {
    if (this.config.frontend) {
      console.log(`----------------------- Front end generated ----------------------`);
      const fieldsPath = this.config.frontend.fieldsFolderName
        ? path.join(this.config.frontend.outPath, this.config.frontend.fieldsFolderName)
        : path.join(this.config.frontend.outPath, 'fields');

      const queriesPath = this.config.frontend.queriesFolderName
        ? path.join(this.config.frontend.outPath, this.config.frontend.queriesFolderName)
        : path.join(this.config.frontend.outPath, 'prisma');

      if (!fs.existsSync(fieldsPath)) await mkdir(fieldsPath);
      if (!fs.existsSync(queriesPath)) await mkdir(queriesPath);

      const fieldsIndexPath = path.join(fieldsPath, `index.ts`);

      if (!fs.existsSync(fieldsIndexPath)) {
        await writeFile(fieldsIndexPath, '');
        console.log(`- Wrote: ${fieldsIndexPath}`);
      }

      let fieldsIndexSource = (await readFile(fieldsIndexPath)).toString();

      for (const prismaName of prismaNames) {
        const fieldsOutPath = path.join(fieldsPath, `${prismaName}.gql.ts`);
        const queriesOutPath = path.join(queriesPath, `${prismaName}.gql.ts`);

        if (!fs.existsSync(fieldsOutPath)) {
          await writeFile(fieldsOutPath, ClientFieldsTemplate(prismaName));
          console.log(`- Wrote: ${fieldsOutPath}`);
        }

        const exportScript = `export * from './${prismaName}.gql';`;
        if (!fieldsIndexSource.includes(exportScript)) {
          await appendFile(fieldsIndexPath, exportScript + '\n');
          fieldsIndexSource += exportScript + '\n';
        }

        const fieldsFolderName = this.config.frontend.fieldsFolderName
          ? this.config.frontend.fieldsFolderName
          : 'fields';
        await writeFile(queriesOutPath, ClientQueriesTemplate(prismaName, fieldsFolderName));
        console.log(`- Wrote: ${queriesOutPath}`);
      }
    }
  }

  async nestAbacResolvers(prismaNames: string[]) {
    let wroteCount = 0;
    for (const prismaName of prismaNames) {
      const outPath = path.join(this.config.apiOutPath, 'resolvers', `${prismaName}.ts`);

      if (!fs.existsSync(outPath)) {
        await writeFile(outPath, NestResolversABACTemplate(prismaName));
        console.log(`- Wrote: ${outPath}`);
        wroteCount++;
      }
    }

    return wroteCount;
  }

  async nestRbacResolvers(prismaNames: string[]) {
    let wroteCount = 0;
    for (const prismaName of prismaNames) {
      const outPath = path.join(this.config.apiOutPath, 'resolvers', `${prismaName}.ts`);

      if (!fs.existsSync(outPath)) {
        await writeFile(outPath, NestResolversRBACTemplate(prismaName));
        console.log(`- Wrote: ${outPath}`);
        wroteCount++;
      }
    }

    return wroteCount;
  }

  private execLocal(command: string) {
    console.log(command);
    return execAsync('npx --no-install ' + command).then(({ stdout, stderr }) => {
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);
    });
  }
}

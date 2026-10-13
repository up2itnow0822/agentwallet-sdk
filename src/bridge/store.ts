import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { BridgeRecord, BridgeStore } from "./types.js";
const ID = /^[a-f0-9-]{36}$/;
export class FileBridgeStore implements BridgeStore {
    private readonly directory: string;
    constructor(directory: string) {
        if (!directory) {
            throw new Error("Bridge recovery directory is required");
        }
        this.directory = resolve(directory);
    }
    private path(id: string) {
        if (!ID.test(id)) {
            throw new Error("Invalid bridge recovery id");
        }
        return join(this.directory, `${id}.json`);
    }
    async save(record: BridgeRecord) {
        const path = this.path(record.id);
        await mkdir(this.directory, { recursive: true, mode: 448 });
        const temp = `${path}.${randomUUID()}.tmp`;
        const handle = await open(temp, "wx", 384);
        try {
            await handle.writeFile(JSON.stringify(record));
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        await rename(temp, path);
        const directory = await open(this.directory, "r");
        try {
            await directory.sync();
        }
        finally {
            await directory.close();
        }
    }
    async load(id: string): Promise<BridgeRecord | undefined> {
        try {
            return JSON.parse(await readFile(this.path(id), "utf8")) as BridgeRecord;
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return undefined;
            }
            throw error;
        }
    }
    async withLock<T>(id: string, run: () => Promise<T>): Promise<T> {
        this.path(id);
        await mkdir(this.directory, { recursive: true, mode: 448 });
        const lock = join(this.directory, `${id}.lock`);
        let handle;
        try {
            handle = await open(lock, "wx", 384);
        }
        catch {
            throw new Error("Bridge recovery is locked; reconcile the previous process before retrying");
        }
        try {
            return await run();
        }
        finally {
            await handle.close();
            await unlink(lock);
        }
    }
}

const { app, BrowserWindow, ipcMain } = require("electron");
const { promises: fs } = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const getStatsPath = () => path.join(app.getPath("userData"), "dactylo", "stat_dactylo.json");
const getQuestStatsPath = () =>
    path.join(app.getPath("userData"), "quest", "stat_quest.json");
const getQuestDestinationPath = () => path.join(app.getPath("userData"), "quest");
const getQuestSourcePath = () => path.join(app.getAppPath(), "quest");
const normaliserChemin = (chemin = "") => chemin.replace(/\\/g, "/").replace(/^\/+/, "");

const copyDirectory = async (sourceDir, destinationDir) => {
    await fs.mkdir(destinationDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const destinationPath = path.join(destinationDir, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, destinationPath);
        } else if (entry.isFile()) {
            await fs.copyFile(sourcePath, destinationPath);
        }
    }
};

const ensureQuestSeeded = async () => {
    try {
        await fs.access(getQuestDestinationPath());
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
        await copyDirectory(getQuestSourcePath(), getQuestDestinationPath());
    }
};

const listQuestFiles = async () => {
    const questDir = getQuestDestinationPath();
    await fs.mkdir(questDir, { recursive: true });

    const walk = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await walk(fullPath));
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
                files.push(fullPath);
            }
        }
        return files;
    };

    const files = await walk(questDir);
    return files.map((filePath) => path.relative(questDir, filePath));
};


const deleteQuestFile = async (fileName) => {
    if (!fileName || typeof fileName !== "string") {
        throw new Error("Invalid quest file name");
    }
    if (path.isAbsolute(fileName)) {
        throw new Error("Invalid quest file path");
    }
    const questDir = getQuestDestinationPath();
    const normalizedPath = path.normalize(fileName);
    const questPath = path.resolve(questDir, normalizedPath);
    const questDirResolved = path.resolve(questDir);
    if (questPath !== questDirResolved && !questPath.startsWith(`${questDirResolved}${path.sep}`)) {
        throw new Error("Invalid quest file path");
    }
    const cheminRelatif = normaliserChemin(path.relative(questDirResolved, questPath));
    if (!cheminRelatif.startsWith("questionnaire/")) {
        throw new Error("Invalid quest file path");
    }
    if (!questPath.toLowerCase().endsWith(".json")) {
        throw new Error("Invalid quest file extension");
    }
    await fs.unlink(questPath);
    return { ok: true };
};

const readQuestFile = async (fileName) => {
    if (!fileName || typeof fileName !== "string") {
        throw new Error("Invalid quest file name");
    }
    if (path.isAbsolute(fileName)) {
        throw new Error("Invalid quest file path");
    }
    const questDir = getQuestDestinationPath();
    const normalizedPath = path.normalize(fileName);
    const questPath = path.resolve(questDir, normalizedPath);
    const questDirResolved = path.resolve(questDir);
    if (questPath !== questDirResolved && !questPath.startsWith(`${questDirResolved}${path.sep}`)) {
        throw new Error("Invalid quest file path");
    }
    if (!questPath.toLowerCase().endsWith(".json")) {
        throw new Error("Invalid quest file extension");
    }
    const contenu = await fs.readFile(questPath, "utf-8");
    return JSON.parse(contenu);
};

const resolveQuestAsset = async (assetPath) => {
    if (!assetPath || typeof assetPath !== "string") {
        throw new Error("Invalid quest asset path");
    }
    const questDir = getQuestDestinationPath();
    const cleanedPath = assetPath.replace(/^\/+/, "").replace(/^quest[\\/]/i, "");
    if (path.isAbsolute(cleanedPath)) {
        throw new Error("Invalid quest asset path");
    }
    const normalizedPath = path.normalize(cleanedPath);
    const questPath = path.resolve(questDir, normalizedPath);
    const questDirResolved = path.resolve(questDir);
    if (questPath !== questDirResolved && !questPath.startsWith(`${questDirResolved}${path.sep}`)) {
        throw new Error("Invalid quest asset path");
    }
    await fs.access(questPath);
    return pathToFileURL(questPath).toString();
};
const ensureStatsDir = async () => {
    const dir = path.dirname(getStatsPath());
    await fs.mkdir(dir, { recursive: true });
};

const ensureQuestStatsDir = async () => {
    const dir = path.dirname(getQuestStatsPath());
    await fs.mkdir(dir, { recursive: true });
};

const readStatsFile = async () => {
    try {
        const contenu = await fs.readFile(getStatsPath(), "utf-8");
        return JSON.parse(contenu);
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
};

const writeStatsFile = async (stats) => {
    await ensureStatsDir();
    await fs.writeFile(getStatsPath(), JSON.stringify(stats, null, 4), "utf-8");
};

const readQuestStatsFile = async () => {
    try {
        const contenu = await fs.readFile(getQuestStatsPath(), "utf-8");
        return JSON.parse(contenu);
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
};

const writeQuestStatsFile = async (stats) => {
    await ensureQuestStatsDir();
    await fs.writeFile(getQuestStatsPath(), JSON.stringify(stats, null, 4), "utf-8");
};

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    win.loadFile('index.html');
}

app.whenReady().then(async () => {
    await ensureQuestSeeded();
    createWindow();

    ipcMain.handle("dactylo:load-stats", async () => readStatsFile());
    ipcMain.handle("dactylo:save-stats", async (_event, stats) => {
        if (!stats || typeof stats !== "object") {
            throw new Error("Invalid stats payload");
        }
        await writeStatsFile(stats);
        return { ok: true };
    });
    ipcMain.handle("quest:load-stats", async () => readQuestStatsFile());
    ipcMain.handle("quest:save-stats", async (_event, stats) => {
        if (!stats || typeof stats !== "object") {
            throw new Error("Invalid stats payload");
        }
        await writeQuestStatsFile(stats);
        return { ok: true };
    });

    ipcMain.handle("quest:list", async () => listQuestFiles());
    ipcMain.handle("quest:load", async (_event, fileName) => readQuestFile(fileName));
    ipcMain.handle("quest:delete", async (_event, fileName) => deleteQuestFile(fileName));
    ipcMain.handle("quest:resolve-asset", async (_event, assetPath) => resolveQuestAsset(assetPath));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

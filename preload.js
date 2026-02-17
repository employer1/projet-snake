const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    loadDactyloStats: () => ipcRenderer.invoke("dactylo:load-stats"),
    saveDactyloStats: (stats) => ipcRenderer.invoke("dactylo:save-stats", stats),
    loadQuestStats: () => ipcRenderer.invoke("quest:load-stats"),
    saveQuestStats: (stats) => ipcRenderer.invoke("quest:save-stats", stats),
    listQuestnaires: () => ipcRenderer.invoke("quest:list"),
    loadQuestnaire: (fileName) => ipcRenderer.invoke("quest:load", fileName),
    deleteQuestnaire: (fileName) => ipcRenderer.invoke("quest:delete", fileName),
    resolveQuestAsset: (assetPath) => ipcRenderer.invoke("quest:resolve-asset", assetPath),
});

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ["chrome", "node", "electron"]) {
        replaceText(`${type}-version`, process.version[type]);
    }
});

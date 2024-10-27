const { contextBridge, shell } = require('electron')
const electron = require('electron')
const path = require("path")
const fs = require("fs")
const klaw = require("klaw-sync")
const Store = require("electron-store")
//const chokidar = require("chokidar")

const myStore = new Store()

//let watcher = chokidar.watch(sourcePath, {persistent: true})



window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

})

contextBridge.exposeInMainWorld('myAPI', {
//    addSourceFilesChangedListener: (func) => {
//        watcher
//            .on('add', func)
//            .on('unlink', func);
//    },

    applicationConfiguration: myStore,

    listSourceFiles: () => {
        if (!fs.existsSync(myStore.get("sourcePath"))) return [];
        let files = fs.readdirSync(myStore.get("sourcePath"), { withFileTypes: true })
        files = files.filter((value, index) => value.isFile() && value.name.endsWith(".pdf"))
        files.forEach((value) => value.fullpath = path.join(myStore.get("sourcePath"), value.name))
        return files;
    },

    listDirectories: () => {
        if (!fs.existsSync(myStore.get("targetPath"))) return [];
        let directories = klaw(myStore.get("targetPath"), {nofile: true})
        directories.forEach((value) => value.relativePath = path.relative(myStore.get("targetPath"), value.path))
        return directories
    },

    listTargetFiles: (targetPath) => {
        let files = fs.readdirSync(targetPath, { withFileTypes: true })
        files = files.filter((value, index) => value.isFile() && value.name.endsWith(".pdf"))
        files.forEach((value) => value.fullpath = path.join(targetPath, value.name))
        files.forEach((value) => value.relativePath = path.relative(myStore.get("targetPath"), value.fullpath))
        files = files.sort((a, b) => {
            if (b.name === a.name) return 0;
            if (b.name < a.name) return -1;
            return 1;
        })
        return files;
    },

    openPath: (openPath) => {
        if (typeof(openPath) === "string") {
            openPath = openPath.trim()
            openPath = path.join(myStore.get("targetPath"), openPath)
            if (!fs.existsSync(openPath)) {
                fs.mkdirSync(openPath)
            }
        } else {
            openPath = openPath.path
        }
        shell.openPath(openPath).then()
    },

    moveFile: (file, destPath, dateString, name) => {
        dateString = dateString.trim()
        name = name.trim()
        if (typeof(destPath) === "string") {
            destPath = destPath.trim()
            destPath = path.join(myStore.get("targetPath"), destPath)
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath)
            }
        } else {
            destPath = destPath.path
        }

        let targetFilename = dateString + (name !== "" ? " " + name : "") + ".pdf"
        console.log(targetFilename);
        let targetPath = path.join(destPath, targetFilename)
        console.log(targetPath);
        if (fs.existsSync(targetPath))
            throw "Target file already exists!"
        try {
            fs.copyFileSync(file.fullpath, targetPath)
        } catch (ex) {
            throw "Error during file copy: " + ex.message
        }
        try {
            fs.unlinkSync(file.fullpath)
        } catch (e) {
            throw "Error during file delete: " + ex.message
        }
    },

    deleteFile: (file) => {
        // does not really delete, only renames to .tobedeleted
        let targetFilename = file.fullpath + ".tobedeleted"
        fs.renameSync(file.fullpath, targetFilename)
    },

    getConfig: () => {
        return myStore.store
    },

    setConfig: (key, value) => {
        myStore.set(key, value)
    }
})

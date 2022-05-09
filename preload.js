const { contextBridge } = require('electron')
const path = require("path")
const fs = require("fs")
const klaw = require("klaw-sync")
//const chokidar = require("chokidar")

let applicationConfiguration = {
    sourcePath: "Z:/",
    targetPath: "C:\\Users\\Oliver\\Seafile\\My Library\\Dokumente"
}

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

    applicationConfiguration: applicationConfiguration,

    listSourceFiles: () => {
        //const files = await fs.readdir("Z:/")
        let files = fs.readdirSync(applicationConfiguration.sourcePath, { withFileTypes: true })
        files = files.filter((value, index) => value.isFile() && value.name.endsWith(".pdf"))
        files.forEach((value) => value.fullpath = path.join(applicationConfiguration.sourcePath, value.name))
        return files;
    },

    listDirectories: () => {
        let directories = klaw(applicationConfiguration.targetPath, {nofile: true})
        directories.forEach((value) => value.relativePath = path.relative(applicationConfiguration.targetPath, value.path))
        return directories
    },

    listTargetFiles: (path) => {
        let files = fs.readdirSync(path, { withFileTypes: true })
        files = files.filter((value, index) => value.isFile() && value.name.endsWith(".pdf"))
        files = files.sort((a, b) => {
            if (b.name === a.name) return 0;
            if (b.name < a.name) return -1;
            return 1;
        })
        return files;
    },

    moveFile: (file, destPath, dateString, name) => {
        if (typeof(destPath) === "string") {
            destPath = path.join(applicationConfiguration.targetPath, destPath)
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
        return applicationConfiguration
    },

    setConfig: (config) => {
        applicationConfiguration = config
    }
})

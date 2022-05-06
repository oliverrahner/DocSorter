const { contextBridge } = require('electron')
const path = require("path")
const fs = require("fs")
const klaw = require("klaw-sync")

const sourcePath = "Z:/"
const targetPath = "C:\\Users\\Oliver\\Seafile\\My Library\\Dokumente"

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
    listFiles: () => {
        //const files = await fs.readdir("Z:/")
        let files = fs.readdirSync(sourcePath, { withFileTypes: true })
        files = files.filter((value, index) => value.isFile() && value.name.endsWith(".pdf"))
        files.forEach((value) => value.fullpath = path.join(sourcePath, value.name))
        return files;
    },

    listDirectories: () => {
        let directories = klaw(targetPath, {nofile: true})
        directories.forEach((value) => value.relativePath = path.relative(targetPath, value.path))
        return directories
    }
})

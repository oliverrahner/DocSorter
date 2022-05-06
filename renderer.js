window.addEventListener("DOMContentLoaded", () => {
    reloadFileList()
    reloadDirectoryList()
    document.getElementById("target-path").addEventListener("input", targetFolderChanged)
})

let files = []
let fileIndex = -1
let directories = []

const targetFolderChanged = (event) => {
    let searchValue = event.target.value
    let tokens = searchValue.split(" ")

    let filteredDirs = directories.filter(value => {
        value.matches = []
        let relPath = value.relativePath.toUpperCase()
        let lastIndex = 0;
        for (let token of tokens) {
            let currentIndex = relPath.indexOf(token.toUpperCase(), lastIndex)
            if (currentIndex == -1) {
                return false;
            }
            value.matches.unshift({startIdx: currentIndex, length: token.length})
            lastIndex = currentIndex + token.length
        }
        return true;
    })

    document.getElementById("folderlist").innerHTML = filteredDirs.map(x => {
        let highlightedEntry = x.relativePath
        for (let match of x.matches) {
            highlightedEntry =
                highlightedEntry.substr(0, match.startIdx) +
                "<span class='search-match'>" +
                highlightedEntry.substr(match.startIdx, match.length) +
                "</span>" +
                highlightedEntry.substr(match.startIdx + match.length)
        }
        return highlightedEntry
    }).join("<br/>");
    document.getElementById("folderlist-count").innerHTML = filteredDirs.length + ' / ' + directories.length
}

const reloadDirectoryList = () => {
    directories = window.myAPI.listDirectories()
}

const reloadFileList = () => {
    const currentFilename = files[fileIndex]?.name
    files = window.myAPI.listFiles()

    if (fileIndex == -1) {
        fileIndex = 0
    } else {
        // make sure to keep the same file on display when the list has changed
        const newIndex = files.find(x => x.name === currentFilename).index
        // if the file has gone, show the next one (meaning index doesn't change)
        if (newIndex === -1) {
            fileIndex--
        } else {
            fileIndex = newIndex
        }
    }
    showFile()
}

const showFile = () => {
    if (files.length == 0) {
        clearFileView()
        return
    }
    fileIndex = fileIndex % files.length;
    if (fileIndex < 0) fileIndex = files.length - 1;
    document.getElementById("pdfviewer").setAttribute("src", files[fileIndex].fullpath)
}

const clearFileView = () => {
    // TODO
}

const showPreviousFile = () => {
    fileIndex--
    showFile()
}

const showNextFile = () => {
    fileIndex++
    showFile()
}

const handleKeyPress = (event) => {
    switch (event.key) {
        case 'ArrowLeft': if (event.ctrlKey) showPreviousFile(); break;
        case 'ArrowRight': if (event.ctrlKey) showNextFile(); break;
    }
}

window.addEventListener('keyup', handleKeyPress, true);


window.addEventListener("DOMContentLoaded", () => {
    reloadFileList()
    reloadDirectoryList()

    let config = window.myAPI.getConfig()
    if (!(config["sourcePath"] && config["targetPath"])) {
        showModal('settings')
    }

    document.getElementById("target-path").addEventListener("change", targetFolderChanged)
    document.getElementById("submit").addEventListener("click", submit)
    document.getElementById("delete-button").addEventListener("click", markForDeletion)
    document.getElementById("button-refresh").addEventListener("click", reloadFileList)
    document.getElementById("button-prev").addEventListener("click", showPreviousFile)
    document.getElementById("button-next").addEventListener("click", showNextFile)
//    window.myAPI.addSourceFilesChangedListener(reloadFileList);


    // update settings dialog fields when opening
    document.querySelectorAll(`[data-popup-trigger="settings"]`).forEach(trigger => {
        trigger.addEventListener('click', () => {
            settings.settingsToFields()
        })
    })
    document.querySelector("#save-settings").addEventListener('click', () => {
        settings.fieldsToSettings()
        reloadFileList()
        reloadDirectoryList()
    })


    const modalTriggers = document.querySelectorAll('.popup-trigger')
    const modalCloseTrigger = document.querySelector('.popup-modal__close')
    const bodyBlackout = document.querySelector('.body-blackout')
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const { popupTrigger } = trigger.dataset
            showModal(popupTrigger)
        })
    })

})

let files = []
let fileIndex = -1
let directories = []
let selectedDirectory = {}
let directoryName = ""

let targetFolderClickHandler

const showModal = (name) => {
    const bodyBlackout = document.querySelector('.body-blackout')
    const popupModal = document.querySelector(`[data-popup-modal="${name}"]`)
    popupModal.classList.add('is--visible')
    bodyBlackout.classList.add('is-blacked-out')

    popupModal.querySelectorAll('.popup-modal__close').forEach(trigger => trigger.addEventListener('click', () => {
        closeModal(name)
    }))
}

const closeModal = (name) => {
    const bodyBlackout = document.querySelector('.body-blackout')
    const popupModal = document.querySelector(`[data-popup-modal="${name}"]`)
    popupModal.classList.remove('is--visible')
    bodyBlackout.classList.remove('is-blacked-out')
}

const targetFolderChanged = (event) => {
    let selectedDirElement = document.querySelector('#target-path')
    let opendirElement = document.querySelector('.open-link')
    let selectedDir = selectedDirElement.value
    selectedDirectory = directories.filter(x => x.relativePath === selectedDir)[0]
    if (selectedDirectory === undefined) {
        directoryName = selectedDir
        opendirElement.removeEventListener("click", openPath)
        opendirElement.classList.add("inactive")
    } else {
        targetFolderClickHandler = opendirElement.addEventListener("click", openPath)
        opendirElement.classList.remove("inactive")
    }
    updateExistingFiles()
}

const openPath = () => {
    window.myAPI.openPath(selectedDirectory)
}

const openFile = (event) => {
    window.myAPI.openPath(event.currentTarget.relativePath)
}

const updateExistingFiles = () => {
    let fileList = document.getElementById("existing-documents")
    fileList.innerHTML = ''
    if (selectedDirectory === undefined) return;
    let files = window.myAPI.listTargetFiles(selectedDirectory.path)
    for (let file of files) {
        let child = fileList.appendChild(document.createElement("div"))
        child.innerHTML = file.name
        child.classList.add("file")
        child.classList.add("pdf")
        child.title = "Open this file by double-clicking"
        child.relativePath = file.relativePath
        child.addEventListener("dblclick", openFile, false)
    }
}

const targetFolderChangedOld = (event) => {
    return
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
    let datalist = document.getElementById("folderlist")
    datalist.innerHTML = ''
    for (let dir of directories) {
        let option = datalist.appendChild(document.createElement("option"))
        option.innerHTML = dir.relativePath
    }
}

const reloadFileList = () => {
    const currentFilename = files[fileIndex]?.name
    files = window.myAPI.listSourceFiles()

    if (fileIndex == -1) {
        fileIndex = 0
    } else {
        // make sure to keep the same file on display when the list has changed
        const newIndex = files.findIndex(x => x.name === currentFilename)
        // if the file has gone, show the next one (meaning index doesn't change)
        if (newIndex === undefined || newIndex === -1) {
            //fileIndex = fileIndex
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
    document.getElementById("pdfviewer").setAttribute("src", "./nofiles.html")
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
        case 'ArrowLeft': if (event.altKey) showPreviousFile(); break;
        case 'ArrowRight': if (event.altKey) showNextFile(); break;
    }
}

const submit = () => {
    try {
        let result = window.myAPI.moveFile(
            files[fileIndex],
            selectedDirectory !== undefined ? selectedDirectory : directoryName,
            document.getElementById('document-date').value,
            document.getElementById('document-name').value
        )
        showMessage("File moved successfully.")
    } catch (ex) {
            showError("Error: " + ex.message)
    }
    reloadFileList()
    resetFields()
}

const resetFields = () => {
    document.getElementById("target-path").focus()
    document.getElementById("target-path").value = ''
    selectedDirectory = undefined
    document.getElementById("document-date").value = ''
    document.getElementById("document-name").value = ''

    updateExistingFiles()
}

const markForDeletion = () => {
    try {
        let result = window.myAPI.deleteFile(
            files[fileIndex]
        )
        showMessage("File renamed.")
    } catch (ex) {
        showError("Error: " + ex.message)
    }
    reloadFileList()
    document.getElementById("target-path").focus()
}

const showError = (message) => {
    showMessage(message, "error")
}

const showMessage = (message, type = "message") => {
    let messagebox = document.createElement("div")
    messagebox.classList.add("messagebox")
    messagebox.classList.add(type)
    messagebox.innerText = message
    document.body.appendChild(messagebox)
    window.setTimeout(() => messagebox.style.opacity = "0", 3000)
    messagebox.addEventListener("transitionend", () => messagebox.remove())
}

const settings = {
    fieldsToSettings: () => {
        let settingsFields = document.querySelectorAll(".setting")
        settingsFields.forEach(field => {
            const { applicationSetting } = field.dataset
            window.myAPI.setConfig(applicationSetting, field.value)
        })
    },
    settingsToFields: () => {
        let currentSettings = window.myAPI.getConfig()
        for (const setting in currentSettings) {
            let targetField = document.querySelector(`[data-application-setting="${setting}"]`)
            if (targetField !== undefined) {
                targetField.value = currentSettings[setting]
            }
        }
    }
}



window.addEventListener('keyup', handleKeyPress, true);

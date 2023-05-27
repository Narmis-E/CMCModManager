const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require("path");
// const fs = require("fs");
const fs = require("fs-extra");
const childProcess = require("child_process");
var win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 810,
        height: 600,
        minWidth: 810,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    /*if (process.platform !== 'darwin') */
    app.quit();
});

// Allow fs functions to be called from the app
ipcMain.on("fs", (event, args) => {
    win.webContents.send("fromFs", {
        call: args.call,
        callArgs: args.callArgs,
        result: fs[args.method.toString()].apply(null, args.arguments)
    });
});

// ipcMain.on("showOpenDialog", (event, args) => {
//     dialog.showOpenDialog(win, {
//         properties: [args.properties]
//     }).then(dir => {
//         win.webContents.send("fromShowOpenDialog", {
//             call: args.call,
//             callArgs: args.callArgs,
//             result: dir
//         });
//     });
// });

ipcMain.on("getGameSource", async (event, args) => {
    dialog.showOpenDialog(win, {
        properties: ["openDirectory"]
    }).then(dir => {
        if (dir.canceled === true) {
            return;//TODO: add alerts
        }
        if (!fs.existsSync(dir.filePaths[0] + "/CMC+ v7.exe")) {
            return;//TODO: add alerts
        }
        //The new version has horrible permissions so give everything xwr
        getAllFiles(dir.filePaths[0]).forEach((file) => {
            fs.chmodSync(file, 0777);
        });
        // fs.emptyDirSync(__dirname + "/basegame/");
        // fs.rmSync(__dirname + "/basegame", {recursive: true});
        fs.copySync(dir.filePaths[0], __dirname + "/basegame/", { overwrite: true });
        fs.copyFileSync(__dirname + "/basegame/controls.ini", __dirname + "/profiles/controls/_default.ini");

        var cmcFightersTxt = fs.readFileSync(__dirname + "/basegame/data/fighters.txt", 'utf-8').split(/\r?\n/);
        var cmcFighters = [];
        for (let fighter = 0; fighter in cmcFightersTxt; fighter++) {
            if (fighter != 0) {
                let fighterData = {
                    name: cmcFightersTxt[fighter],
                    displayName: fs.readFileSync(__dirname + "/basegame/data/dats/" + cmcFightersTxt[fighter] + ".dat", 'utf-8')
                        .split(/\r?\n/)[1]
                }
                cmcFighters.push(fighterData);
            }
        }

        fs.writeFileSync(
            __dirname + "/characters/default.json",
            JSON.stringify({
                ssbc: require(__dirname + "/characters/default.json").ssbc,
                cmc: cmcFighters
            }, null, 4),
            "utf-8"
        );

        win.webContents.send("fromGetGameSource", {
            call: "gameSourceInstalled",
            result: true
        });
    });
});

ipcMain.on("mergeInstalledMods", async (event, args) => {
    if (!fs.existsSync(__dirname + "/basegame/CMC+ v7.exe")) {
        return;//TODO: add alerts
    }
    if (fs.existsSync(__dirname + "/merged/controls.ini")) {
        fs.copyFileSync(__dirname + "/merged/controls.ini", __dirname + "/profiles/controls/_inUse.ini");
    }
    fs.copySync(__dirname + "/basegame/", __dirname + "/merged/", { overwrite: true });
    //TODO: for each stage
    //TODO: for each character
    if (fs.existsSync(__dirname + "/profiles/controls/_inUse.ini")) {
        fs.copyFileSync(__dirname + "/profiles/controls/_inUse.ini", __dirname + "/merged/controls.ini");
    }
    //TODO: generate fighters.txt and stage.txt
    //TODO: load profile css.txt and sss.txt
    win.webContents.send("fromMergeInstalledMods", {
        call: "modsMergeFinished",
        result: true
    });
});

const getAllFiles = function (dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            // arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })

    return arrayOfFiles
}

ipcMain.on("runCMC", async (event, args) => {
    dir = args.path;
    //Additionally the exe doesn't have execute perms on linux
    //sudo chmod a+x ./* -R
    childProcess.execFile(__dirname + dir + "/CMC+ v7.exe", {
        cwd: __dirname + dir,
        windowsHide: true
    });
    //TODO: Catch fails e.g. merged empty
    app.quit();
});
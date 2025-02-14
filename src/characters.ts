import { BrowserWindow, OpenDialogReturnValue, dialog } from "electron";
import fs from "fs-extra";
import path from "path";
import ini from "ini";
import {
    Alt, AppData, Character, CharacterDat, CharacterList, CharacterPalette, CssData,
    CssPage, Download
} from "./interfaces";

declare const global: {
    win: BrowserWindow,
    gameDir: string,
    log: string,
    appData: AppData,
    downloads: Download[]
};

import * as general from "./general";

const CHARACTER_FILES: string[] = [
    "arcade/routes/<fighter>.txt",
    "arcade/routes/<series>_series.txt",
    "data/dats/<fighter>.dat",
    "fighter/<fighter>.bin",
    "fighter/<fighter>/<any>",
    "gfx/abust/<fighter>.png",
    "gfx/bust/<fighter>.png",
    "gfx/bust/<fighter>_<palette>.png",
    "gfx/cbust/<fighter>.png",
    "gfx/mbust/<fighter>.png",
    "gfx/tbust/<fighter>__<any>.png",
    "gfx/mugs/<fighter>.png",
    "gfx/hudicon/<series>.png",
    "gfx/name/<fighter>.png",
    "gfx/portrait/<fighter>.png",
    "gfx/portrait/<fighter>_<palette>.png",
    "gfx/seriesicon/<series>.png",
    "gfx/stock/<fighter>.png",
    "palettes/<fighter>/<any>",
    "music/versus/<fighter>_<any>.<audio>",
    "music/victory/<series>.<audio>",
    "music/victory/individual/<fighter>.<audio>",
    "sfx/announcer/fighter/<fighter>.<audio>",
    "sticker/common/<fighter>.png",
    "sticker/common/desc/<fighter>.txt",
    "sticker/rare/<fighter>.png",
    "sticker/rare/desc/<fighter>.txt",
    "sticker/super/<fighter>.png",
    "sticker/super/desc/<fighter>.txt",
    "sticker/ultra/<fighter>.png",
    "sticker/ultra/desc/<fighter>.txt",
];

const EXTRA_CHARACTER_FILES: string[] = [...CHARACTER_FILES];
EXTRA_CHARACTER_FILES.push(...[
    "data/<fighter>.dat",
    "gfx/portrait_new/<fighter>.png",
    "gfx/portrait_new/<fighter>_<palette>.png",
]);

const BLANK_CSS_PAGE_DATA: string = "\
0000 0000 0000 0000 0000 0000 0000\r\n\
0000 0000 0000 0000 0000 0000 0000\r\n\
0000 0000 0000 0000 0000 0000 0000\r\n\
0000 0000 0000 9999 0000 0000 0000 ";

export function readCharacters(dir: string = global.gameDir): Character[] {
    return readCharacterList(dir).getAllCharacters();
}

export function readCharacterList(dir: string = global.gameDir): CharacterList {
    // general.log("Read Character List - Start:", dir);
    const alts: Alt[] = readAlts(dir);
    const characterList: CharacterList = new CharacterList();
    const charactersTxt: string[] = fs.readFileSync(
        path.join(dir, "data", "fighters.txt"),
        "ascii"
    ).split(/\r?\n/);
    charactersTxt.shift(); // Drop the number
    charactersTxt.forEach((character: string, index: number) => {
        if (fs.existsSync(path.join(dir, "data", "dats", character + ".dat"))) {
            const characterDat: CharacterDat = readCharacterDat(character, dir);
            characterList.addCharacter({
                name: character,
                menuName: characterDat.menuName,
                series: characterDat.series,
                randomSelection: true, // Assume true and then iterate through false list
                number: index + 1,
                alts: alts.filter((alt: Alt) => alt.base == character),
                mug: path.join(dir, "gfx", "mugs", character + ".png")
            });
        }
    });
    const lockedTxt: string[] = fs.readFileSync(
        path.join(dir, "data", "fighter_lock.txt"),
        "ascii"
    ).split(/\r?\n/);
    lockedTxt.shift();
    lockedTxt.forEach((locked: string) => {
        if (locked == "") return;
        characterList.updateCharacterByName(locked, { randomSelection: false });
    });
    // general.log("Read Character List - Return:", characters);
    return characterList;
}

export async function writeCharacters(
    characters: Character[],
    dir: string = global.gameDir
): Promise<void> {
    general.log("Write Characters - Start:", characters, dir);
    characters.sort((a: Character, b: Character) =>
        (a.number > b.number ? 1 : -1)
    );
    const output: string = [
        characters.length,
        characters.map((character: Character) => character.name).join("\r\n")
    ].join("\r\n");
    fs.writeFileSync(
        path.join(dir, "data", "fighters.txt"),
        output,
        { encoding: "ascii" }
    );
    general.log("Write Characters - Return");
    return;
}

export async function writeCharacterRandom(
    character: string,
    randomSelection: boolean,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Write Character Random - Start:", character, randomSelection, dir);
    let lockedTxt: string[] = fs.readFileSync(
        path.join(dir, "data", "fighter_lock.txt"),
        "ascii"
    ).split(/\r?\n/);
    lockedTxt.shift();
    if (randomSelection) {
        lockedTxt = lockedTxt.filter((locked: string) => locked != character);
    } else {
        lockedTxt.push(character);
    }
    let output: string = lockedTxt.length + "\r\n";
    output += lockedTxt.join("\r\n");
    fs.writeFileSync(
        path.join(dir, "data", "fighter_lock.txt"),
        output,
        { encoding: "ascii" }
    );
    general.log("Write Character Random - Return");
    return;
}

export function readAlts(dir: string = global.gameDir): Alt[] {
    general.log("Read Alts - Start:", dir);
    const altsTxt: string[] = fs.readFileSync(
        path.join(dir, "data", "alts.txt"),
        "ascii"
    ).split(/\r?\n/);
    altsTxt.shift(); // Drop the number
    const alts: Alt[] = [];
    for (let alt: number = 0; alt < Math.floor(altsTxt.length / 5); alt++) {
        alts.push({
            base: altsTxt[(alt * 5) + 0],
            alt: altsTxt[(alt * 5) + 2],
            number: parseInt(altsTxt[(alt * 5) + 1]),
            menuName: altsTxt[(alt * 5) + 3],
            battleName: altsTxt[(alt * 5) + 4],
            mug: path.join(dir, "gfx", "mugs", altsTxt[(alt * 5) + 2] + ".png")
        });
    }
    general.log("Read Alts - Return:", alts);
    return alts;
}

export async function writeAlts(alts: Alt[], dir: string = global.gameDir): Promise<void> {
    general.log("Write Alts - Start:", alts, dir);
    //TODO: verify alt numbers
    const output: string = [
        alts.length,
        alts.map((alt: Alt) =>
            [
                alt.base,
                alt.number,
                alt.alt,
                alt.menuName,
                alt.battleName
            ].join("\r\n")
        ).join("\r\n")
    ].join("\r\n");
    fs.writeFileSync(
        path.join(dir, "data", "alts.txt"),
        output,
        { encoding: "ascii" }
    );
    general.log("Write Alts - Return");
    return;
}

export async function addAlt(
    base: Character,
    newAlt: Character,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Add Alt - Start:", base, newAlt, dir);
    const toResolve: Promise<void>[] = [];
    const alts: Alt[] = readAlts(dir);
    let altNumber: number = 1;
    alts.filter((alt: Alt) => alt.base == base.name).forEach((alt: Alt) => {
        if (alt.number > altNumber) altNumber = alt.number;
    });
    const newAltDat: CharacterDat = readCharacterDat(newAlt.name, dir);
    alts.push({
        base: base.name,
        alt: newAlt.name,
        number: altNumber + 1,
        menuName: newAlt.menuName,
        battleName: newAltDat.battleName,
        mug: newAlt.mug
    });
    await writeAlts(alts, dir);
    if (global.appData.config.altsAsCharacters) {
        general.log("Add Alt - Return: Alt Remains A Character");
        return;
    }
    const characterList: CharacterList = readCharacterList(dir);
    characterList.removeCharacterByName(newAlt.name);
    toResolve.push(writeCharacters(characterList.getAllCharacters(), dir));
    toResolve.push(writeCharacterRandom(newAlt.name, true, dir));
    await Promise.allSettled(toResolve);
    general.log("Add Alt - Return: Alt Is No Longer A Character");
    return;
}

export async function removeAlt(
    alt: Alt,
    ensureAccessible: boolean = true,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Remove Alt - Start:", alt, ensureAccessible, dir);
    const alts: Alt[] = readAlts(dir).filter((i: Alt) => !(
        i.base == alt.base &&
        i.alt == alt.alt &&
        i.number == alt.number
    )).map((i: Alt) => {
        if (i.base == alt.base && i.number > alt.number) {
            i.number--;
        }
        return i;
    });
    await writeAlts(alts, dir);
    if (ensureAccessible) {
        await ensureAltIsCharacter(alt, dir);
    }
    general.log("Remove Alt - Return");
    return;
}

export async function ensureAltIsCharacter(alt: Alt, dir: string = global.gameDir): Promise<void> {
    general.log("Ensure Alt Is Character - Start:", alt, dir);
    const characterList: CharacterList = readCharacterList(dir);
    if (characterList.getCharacterByName(alt.alt) != undefined) {
        general.log("Ensure Alt Is Character - Exit: Character Already Exists");
        return;
    }

    const characterDat: CharacterDat = readCharacterDat(alt.alt, dir);
    const baseCharacter: Character = characterList.getCharacterByName(alt.base);
    characterList.addCharacter({
        name: alt.alt,
        menuName: characterDat == null ? alt.menuName : characterDat.menuName,
        series: characterDat == null ? baseCharacter.series : characterDat.series,
        randomSelection: true,
        number: characterList.getNextNumber(),
        alts: [],
        mug: path.join(dir, "gfx", "mugs", alt.alt + ".png")
    });

    await writeCharacters(characterList.getAllCharacters(), dir);
    general.log("Ensure Alt Is Character - Return");
    return;
}

export async function ensureAltIsntCharacter(
    alt: Alt,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Ensure Alt Isn't Character - Start:", alt, dir);
    const toResolve: Promise<void>[] = [];
    const characterList: CharacterList = readCharacterList(dir);
    if (characterList.getCharacterByName(alt.alt) == undefined) {
        general.log("Ensure Alt Isn't Character - Exit: No Character Found");
        return;
    }
    characterList.removeCharacterByName(alt.alt);
    toResolve.push(writeCharacters(characterList.getAllCharacters(), dir));
    toResolve.push(writeCharacterRandom(alt.alt, true, dir));
    await Promise.allSettled(toResolve);
    general.log("Ensure Alt Isn't Character - Return");
    return;
}

export async function ensureAllAltsAreCharacters(
    areCharacters: boolean,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Ensure All Alts Are? Characters - Start:", dir);
    const alts: Alt[] = readAlts(dir);
    for (const alt of alts) {
        console.log(alt);
        if (areCharacters) {
            await ensureAltIsCharacter(alt, dir);
        } else {
            await ensureAltIsntCharacter(alt, dir);
        }
    }
    general.log("Ensure All Alts Are? Characters - Return");
    return;
}

export async function removeAllAlts(
    character: Character,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Remove All Alts - Start:", character, dir);
    // remove each of character's alts
    while (character.alts.length > 0) {
        await removeAlt(character.alts[0], true, dir);
        // all remaining alts experience a decrease in number within the files, so to ensure a match
        // this needs to be reflected in this functions array of alts.
        character.alts.shift();
        character.alts = character.alts.map((alt: Alt) => {
            alt.number--;
            return alt;
        });
    }
    // remove character from other's alts
    for (const alt of readAlts(dir).filter(
        (alt: Alt) => alt.alt == character.name
    )) {
        await removeAlt(alt, false, dir);
    }
    general.log("Remove All Alts - Return");
    return;
}

export function readCharacterDat(character: string, dir: string = global.gameDir): CharacterDat {
    return readCharacterDatPath(path.join(dir, "data", "dats", character + ".dat"), character);
}

export function readCharacterDatPath(
    datPath: string,
    character: string = path.parse(datPath).name
): CharacterDat | null {
    // general.log("Read Character Dat Path - Start:", datPath, character);
    if (!fs.existsSync(datPath)) return null;
    const characterDatTxt: string[] = fs.readFileSync(
        datPath,
        "ascii"
    ).split(/\r?\n/);
    // TODO: handle empty v7 names for builtin characters
    const isVanilla: boolean = general.isNumber(characterDatTxt[3]);
    const isV7: boolean = isVanilla || general.isNumber(characterDatTxt[4]);

    let displayName: string;
    let menuName: string;
    let battleName: string;
    let series: string;
    // TODO: get input for 
    if (isVanilla) {
        displayName = "TODO";
        menuName = "TODO";
        battleName = "TODO";
        series = "TODO";
    } else {
        displayName = characterDatTxt[0];
        menuName = characterDatTxt[1];
        battleName = characterDatTxt[2];
        series = characterDatTxt[3].toLowerCase();
    }

    const homeStages: string[] = [];
    const randomDatas: string[] = [];
    const palettes: CharacterPalette[] = [];
    if (isV7) {
        homeStages.push("battlefield");
        randomDatas.push("Updated to v8 dat format by CMC Mod Manager");
        const paletteCount: number =
            parseInt(characterDatTxt[isVanilla ? 1 : 5]);
        for (let palette: number = 1; palette <= paletteCount * 6; palette += 6) {
            const paletteLocation: number = isVanilla ? 1 : 5 + palette;
            palettes.push({
                name: characterDatTxt[paletteLocation + 0],
                0: parseInt(characterDatTxt[paletteLocation + 1]),
                1: parseInt(characterDatTxt[paletteLocation + 2]),
                2: parseInt(characterDatTxt[paletteLocation + 3]),
                3: parseInt(characterDatTxt[paletteLocation + 4]),
                4: parseInt(characterDatTxt[paletteLocation + 5])
            });
        }
    } else {
        const homeStageCount: number = parseInt(characterDatTxt[5]);
        for (let stage: number = 1; stage <= homeStageCount; stage++) {
            homeStages.push(characterDatTxt[5 + stage]);
        }

        const randomDataCount: number = parseInt(characterDatTxt[7 + homeStageCount]);
        for (let data: number = 1; data <= randomDataCount; data++) {
            randomDatas.push(characterDatTxt[7 + homeStageCount + data]);
        }

        const paletteCount: number =
            parseInt(characterDatTxt[9 + homeStageCount + randomDataCount]);
        for (let palette: number = 1; palette <= paletteCount * 6; palette += 6) {
            const paletteLocation: number = 10 + homeStageCount + randomDataCount + palette;
            palettes.push({
                name: characterDatTxt[paletteLocation + 0],
                0: parseInt(characterDatTxt[paletteLocation + 1]),
                1: parseInt(characterDatTxt[paletteLocation + 2]),
                2: parseInt(characterDatTxt[paletteLocation + 3]),
                3: parseInt(characterDatTxt[paletteLocation + 4]),
                4: parseInt(characterDatTxt[paletteLocation + 5])
            });
        }
    }
    const characterDat: CharacterDat = {
        name: character,
        displayName: displayName,
        menuName: menuName,
        battleName: battleName,
        series: series,
        homeStages: homeStages,
        randomDatas: randomDatas,
        palettes: palettes
    };
    // general.log("Read Character Dat Path - Return:", characterDat);
    return characterDat;
}

export async function writeCharacterDat(dat: CharacterDat, destination: string): Promise<void> {
    general.log("Write Character Dat - Start:", dat, destination);
    let output: string = [
        dat.displayName,
        dat.menuName,
        dat.battleName,
        dat.series,
        "---Classic Home Stages Below---",
        dat.homeStages.length,
        dat.homeStages.join("\r\n"),
        "---Random Datas---",
        dat.randomDatas.length,
        dat.randomDatas.join("\r\n"),
        "---Palettes Number---",
        dat.palettes.length,
        "---From Here is Individual Palettes data---"
    ].join("\r\n");
    dat.palettes.forEach((palette: CharacterPalette) => {
        output += [
            "",
            palette.name,
            palette[0],
            palette[1],
            palette[2],
            palette[3],
            palette[4]
        ].join("\r\n");
    });
    fs.ensureFileSync(path.join(destination, dat.name + ".dat"));
    fs.writeFileSync(path.join(destination, dat.name + ".dat"), output, { encoding: "ascii" });
    general.log("Write Character Dat - Return");
    return;
}

export async function installCharacterDir(
    filterInstallation: boolean,
    updateCharacters: boolean,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Install Character Dir - Start:", filterInstallation, updateCharacters, dir);
    const selected: OpenDialogReturnValue = await dialog.showOpenDialog(global.win, {
        properties: ["openDirectory"]
    });
    if (selected.canceled == true) {
        general.log("Install Character Dir - Exit: Selection Cancelled");
        return null;
    }
    await installCharacter(selected.filePaths[0], filterInstallation, updateCharacters, dir);
    general.log("Install Character Dir - Return");
    return;
}

export async function installCharacterArchive(
    filterInstallation: boolean,
    updateCharacters: boolean,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Install Character Archive - Start:", filterInstallation, updateCharacters, dir);
    const selected: OpenDialogReturnValue = await dialog.showOpenDialog(global.win, {
        properties: ["openFile"]
    });
    if (selected.canceled == true) {
        general.log("Install Character Archive - Exit: Selection Cancelled");
        return null;
    }
    fs.ensureDirSync(path.join(dir, "_temp"));
    fs.emptyDirSync(path.join(dir, "_temp"));
    const output: string = await general.extractArchive(
        selected.filePaths[0],
        path.join(dir, "_temp")
    );
    general.log(output, filterInstallation);
    await installCharacter(output, filterInstallation, updateCharacters, dir);
    general.log("Install Character Archive - Return");
    return;
}

export async function installCharacter(
    characterDir: string,
    filterInstallation: boolean = true,
    updateCharacters: boolean = false,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Install Character - Start:",
        characterDir, filterInstallation, updateCharacters, dir);
    const toResolve: Promise<void>[] = [];
    let correctedDir: string = characterDir;
    const modFiles: string[] = general.getAllFiles(correctedDir)
        .map((file: string) => file.replace(correctedDir, ""));
    for (let file of modFiles) {
        file = path.posix.join(file);
        const fileDir: string = path.posix.parse(file).dir + "/";
        if (fileDir.includes("/fighter/") && !file.includes("/announcer/")) {
            let topDir: string = file.split("/").shift();
            while (topDir != "fighter") {
                correctedDir = path.join(correctedDir, topDir);
                file = file.replace(topDir + "/", "");
                topDir = file.split("/").shift();
            }
            break;
        }
    }
    if (!fs.readdirSync(correctedDir).includes("fighter")) {
        //TODO: inform user
        general.log("Install Character - Exit: No Fighter Directory");
        return;
    }
    general.log(correctedDir);

    const character: string = fs.readdirSync(path.join(correctedDir, "fighter"))
        .filter((file: string) => {
            return file.endsWith(".bin") || !file.includes(".");
        })[0].split(".")[0];
    general.log(character);

    let characterDat: CharacterDat;
    if (fs.existsSync(path.join(correctedDir, "data", "dats", character + ".dat"))) {
        characterDat = readCharacterDatPath(
            path.join(correctedDir, "data", "dats", character + ".dat"),
            character
        );
    } else if (fs.existsSync(path.join(correctedDir, "data", character + ".dat"))) {
        characterDat = readCharacterDatPath(
            path.join(correctedDir, "data", character + ".dat"),
            character
        );
    } else {
        //TODO: inform user
        general.log("Install Character - Exit: No Dat File");
        return;
    }
    general.log(characterDat);

    const characters: CharacterList = readCharacterList(dir);
    if (!updateCharacters && characters.getCharacterByName(character) != undefined) {
        //TODO: inform user
        general.log("Install Character - Exit: Character Already Installed");
        return;
    }

    if (filterInstallation) {
        getCharacterFiles(characterDat, false, false, correctedDir).forEach((file: string) => {
            const filePath: string = path.join(correctedDir, file);
            const targetPath: string = path.join(dir, file);
            fs.ensureDirSync(path.parse(targetPath).dir);
            if (!updateCharacters && fs.existsSync(targetPath)) return;
            general.log("Copying: " + filePath);
            toResolve.push(
                fs.copy(
                    filePath,
                    targetPath,
                    { overwrite: !file.startsWith("gfx/seriesicon/") }
                )
            );
        });
    } else {
        general.log("Copying: All Files");
        toResolve.push(fs.copy(correctedDir, dir, { overwrite: true }));
    }

    toResolve.push(writeCharacterDat(
        characterDat,
        path.join(dir, "data", "dats")
    ));

    if (characters.getCharacterByName(character) != undefined) {
        general.log("Install Character - Return: Character Already In List");
        return;
    }
    characters.addCharacter({
        name: character,
        menuName: characterDat.menuName,
        series: characterDat.series,
        randomSelection: true,
        number: characters.getNextNumber(),
        alts: [],
        mug: path.join(dir, "gfx", "mugs", character + ".png")
    });
    toResolve.push(writeCharacters(characters.getAllCharacters(), dir));
    await Promise.allSettled(toResolve);
    general.log("Install Character - Return");
    return;
}

export async function extractCharacter(
    extract: string,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Extract Character - Start:", extract, dir);
    const toResolve: Promise<void>[] = [];
    const characters: Character[] = readCharacters(dir);
    const similarNames: string[] = [];
    const characterDat: CharacterDat = readCharacterDat(extract, dir);
    const extractDir: string = path.join(dir, "0extracted", extract);
    characters.forEach((character: Character) => {
        if (character.name.includes(extract) && character.name != extract) {
            similarNames.push(character.name);
        }
    });
    
    console.log(new Date().getTime());
    getCharacterFiles(characterDat, true, false, dir, similarNames).forEach((file: string) => {
        const filePath: string = path.join(dir, file);
        const targetPath: string = path.join(extractDir, file);
        fs.ensureDirSync(path.parse(targetPath).dir);
        general.log("Extracting: " + filePath);
        toResolve.push(
            fs.copy(
                filePath,
                targetPath,
                { overwrite: true }
            )
        );
    });
    console.log(new Date().getTime());

    toResolve.push(writeCharacterDat(
        characterDat,
        path.join(extractDir, "data", "dats")
    ));
    await Promise.allSettled(toResolve);
    general.log("Extract Character - Return");
    return;
}

export async function removeCharacter(remove: string, dir: string = global.gameDir): Promise<void> {
    general.log("Remove Character - Start:", remove, dir);
    const toResolve: Promise<void>[] = [];
    const character: Character = readCharacterList(dir).getCharacterByName(remove);
    await removeAllAlts(character, dir);
    const characters: CharacterList = readCharacterList(dir);
    const characterDat: CharacterDat = readCharacterDat(remove, dir);

    const similarNames: string[] = [];
    characters.getAllCharacters().forEach((character: Character) => {
        if (character.name.startsWith(remove) && character.name != remove) {
            similarNames.push(character.name);
        }
    });

    console.log(new Date().getTime());
    getCharacterFiles(characterDat, true, true, dir, similarNames).forEach((file: string) => {
        const filePath: string = path.join(dir, file);
        general.log("Removing: " + filePath);
        toResolve.push(
            fs.remove(filePath)
        );
    });
    console.log(new Date().getTime());
    
    characters.removeCharacterByName(remove);
    toResolve.push(writeCharacters(characters.getAllCharacters(), dir));
    toResolve.push(removeCharacterCss(character, dir));
    toResolve.push(writeCharacterRandom(character.name, true, dir));
    await Promise.allSettled(toResolve);
    general.log("Remove Character - Return");
    return;    
}

export function getCharacterRegExps(
    characterDat: CharacterDat,
    includeExtraFiles: boolean,
    ignoreSeries: boolean = false
): RegExp[] {
    general.log("Get Character RegExps - Start:", characterDat, includeExtraFiles, ignoreSeries);
    const files: RegExp[] = [];
    (includeExtraFiles ? EXTRA_CHARACTER_FILES : CHARACTER_FILES).forEach((file: string) => {
        let wipString: string = file.replaceAll("<fighter>", characterDat.name);
        if (!ignoreSeries) wipString = wipString.replaceAll("<series>", characterDat.series);
        wipString = general.escapeRegex(wipString);
        wipString += "$";
        wipString = wipString.replaceAll("<audio>", "(mp3|wav|ogg)");
        wipString = wipString.replaceAll("<palette>", "\\d+");
        wipString = wipString.replaceAll("<any>", "[^\\/\\\\]+");
        files.push(new RegExp(wipString, "gm"));
    });
    general.log("Get Character RegExps - Return:", files);
    return files;
}

export function getCharacterFiles(
    characterDat: CharacterDat,
    includeExtraFiles: boolean,
    ignoreSeries: boolean,
    dir: string = global.gameDir,
    similarNames: string[] = []
): string[] {
    general.log("Get Character Files - Start:",
        dir, characterDat, includeExtraFiles, ignoreSeries, similarNames);
    const characterFiles: string[] = general.getAllFiles(dir)
        .map((file: string) => path.posix.relative(dir, file));
    let characterFilesString: string = characterFiles.join("\n");
    const validFiles: string[] = [];
    getCharacterRegExps(characterDat, includeExtraFiles, ignoreSeries).forEach((exp: RegExp) => {
        // console.log(exp);
        for (const match of characterFilesString.matchAll(exp)) {
            // console.log(match);
            validFiles.push(match[0]);
            characterFiles.splice(characterFiles.indexOf(match[0]), 1);
        }
        characterFilesString = characterFiles.join("\n");
    });
    similarNames.forEach((name: string) => {
        const validFilesString: string = validFiles.join("\n");
        getCharacterRegExps(readCharacterDat(name, dir), includeExtraFiles, ignoreSeries)
            .forEach((exp: RegExp) => {
                for (const match of validFilesString.matchAll(exp)) {
                    validFiles.splice(validFiles.indexOf(match[0]), 1);
                }
            });
    });
    general.log("Get Character Files - Return:", validFiles);
    return validFiles;
}

export function readCssPages(dir: string = global.gameDir): CssPage[] {
    general.log("Read CSS Pages - Start:", dir);
    const pages: CssPage[] = [];
    const gameSettings: any = ini.parse(fs.readFileSync(
        path.join(dir, "data", "GAME_SETTINGS.txt"),
        "ascii"
    ));
    if (gameSettings["global.css_customs"] == 0) {
        pages.push({
            name: "Default",
            path: path.join(global.gameDir, "data", "css.txt")
        });
        general.log("Read CSS Pages - Return: CSS Customs Disabled", pages);
    }
    for (
        let number: number = 1;
        number <= parseInt(gameSettings["global.css_custom_number"]);
        number++
    ) {
        pages.push({
            name: gameSettings["global.css_custom_name[" + number + "]"].replaceAll("\"", ""),
            path: path.join(
                global.gameDir,
                "data",
                gameSettings["global.css_custom[" + number + "]"].replaceAll("\"", "")
            )
        });
    }
    general.log("Read CSS Pages - Return:", pages);
    return pages;
}

export async function writeCssPages(pages: CssPage[], dir: string = global.gameDir): Promise<void> {
    general.log("Write CSS Pages - Start:", pages, dir);
    let gameSettings: string[] = fs.readFileSync(
        path.join(dir, "data", "GAME_SETTINGS.txt"),
        "ascii"
    ).split(/\r?\n/);
    if (ini.parse(gameSettings.join("\r\n"))["global.css_customs"] == 0) {
        //TODO: throw error
        general.log("Write CSS Pages - Exit: CSS Customs Disabled");
        return;
    }
    gameSettings = gameSettings.map((line: string) => {
        if (line.startsWith("global.css_custom_number")) {
            return ("global.css_custom_number = " + pages.length + ";");
        } else if (
            line.startsWith("global.css_custom[") ||
            line.startsWith("global.css_custom_name[")
        ) {
            return "\n";
        } else {
            return line;
        }
    }).filter((line: string) => line != "\n");

    pages.forEach((page: CssPage, index: number) => {
        gameSettings.push("global.css_custom[" + (index + 1) + "] = \"" +
            path.relative(path.join(dir, "data"), page.path)
            + "\";"
        );
        gameSettings.push("global.css_custom_name[" + (index + 1) + "] = \"" + page.name + "\";");
    });
    fs.writeFileSync(
        path.join(dir, "data", "GAME_SETTINGS.txt"),
        gameSettings.join("\r\n"),
        { encoding: "ascii" }
    );
    general.log("Write CSS Pages - Return");
    return;
}

export async function removeCssPage(page: CssPage, dir: string = global.gameDir): Promise<void> {
    general.log("Remove CSS Page - Start:", page, dir);
    const pages: CssPage[] = readCssPages(dir).filter((i: CssPage) => i.path != page.path);
    fs.remove(page.path);
    await writeCssPages(pages, dir);
    general.log("Remove CSS Page - Return");
    return;
}

export async function addCssPage(pageName: string, dir: string = global.gameDir): Promise<void> {
    general.log("Add CSS Page - Start:", pageName, dir);
    pageName = pageName.replace(/'|"/g, "");
    const pagePath: string = path.join(
        dir, "data", "css",
        pageName.replace(/[\\/:*?|. ]/g, "-") + ".txt"
    );
    const pages: CssPage[] = readCssPages(dir);
    pages.push({ name: pageName, path: pagePath });
    writeCssPages(pages, dir);
    fs.ensureFileSync(pagePath);
    fs.writeFileSync(
        pagePath,
        BLANK_CSS_PAGE_DATA,
        { encoding: "ascii" }
    );
    general.log("Add CSS Page - Return");
    return;
}

export function readCssData(page: CssPage): CssData {
    general.log("Read CSS Data - Start:", page);
    const cssFile: string[] = fs.readFileSync(page.path, "ascii").split(/\r?\n/);
    const css: CssData = cssFile.map((line: string) => line.split(" "));
    css[css.length - 1].pop();
    general.log("Read CSS Data - Return:", css);
    return css;
}

export async function writeCssData(page: CssPage, data: CssData): Promise<void> {
    general.log("Write CSS Data - Start:", page, data);
    const output: string = data.map((row: string[]) => row.join(" ")).join("\r\n") + " ";
    fs.writeFileSync(
        page.path,
        output,
        { encoding: "ascii" }
    );
    general.log("Write CSS Data - Return");
    return;
}

export async function removeCharacterCss(
    character: Character,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Remove Character CSS - Start:", character, dir);
    const toResolve: Promise<void>[] = [];
    const cssPages: CssPage[] = readCssPages(dir);
    cssPages.forEach((page: CssPage) => {
        const cssData: CssData = readCssData(page);
        toResolve.push(writeCssData(page, cssData.map((row: string[]) => {
            return row.map((cell: string) => {
                if (parseInt(cell) == character.number) {
                    return "0000";
                } else if (parseInt(cell) > character.number && cell != "9999") {
                    return ("0000" + (parseInt(cell) - 1)).slice(-4);
                } else {
                    return cell;
                }
            });
        })));
    });
    await Promise.allSettled(toResolve);
    general.log("Remove Character CSS - Return");
    return;
}

export async function removeSeriesCharacters(
    series: string,
    dir: string = global.gameDir
): Promise<void> {
    general.log("Remove Series Characters - Start:", series, dir);
    const charactersToRemove: Character[] = readCharacters(dir)
        .filter((character: Character) => character.series == series);
    const altsToRemove: Alt[] = [];
    charactersToRemove.forEach((character: Character) => {
        character.alts.forEach((alt: Alt) => {
            if (alt.alt != alt.base) altsToRemove.push(alt);
        });
    });
    console.log(new Date().getTime());
    for (const character of charactersToRemove) {
        console.log(character);
        await removeCharacter(character.name, dir);
    }
    for (const alt of altsToRemove) {
        console.log(alt);
        await removeCharacter(alt.alt, dir);
    }
    console.log(new Date().getTime());
    general.log("Remove Series Characters - Return");
    return;
}
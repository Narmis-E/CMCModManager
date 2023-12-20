import { Dispatch, SetStateAction, useState } from "react";
import "./characters.css";
import ToggleIconButton from "../global/icon-button/toggle-icon-button";
import IconButton from "../global/icon-button/icon-button";

export default function TabCharacters(): JSX.Element {
    const [filterInstallation, setFilterInstallation]:
    [boolean, Dispatch<SetStateAction<boolean>>]
    = useState(true);
    const [updateCharacters, setUpdateCharacters]:
    [boolean, Dispatch<SetStateAction<boolean>>]
    = useState(false);
    return (
        <>
            <section>
                <CharacterList/>
                <hr/>
                <div id={"button-div"}>
                    <div className={"center"}>
                        <IconButton
                            icon={"folder_shared"}
                            iconSize={"50px"}
                            tooltip={"Install Character From Directory"}
                            onClick={() => {console.log("a")}}
                        />
                        <IconButton
                            icon={"contact_page"}
                            iconSize={"50px"}
                            tooltip={"Install Character From Archive"}
                            onClick={() => {console.log("a")}}
                        />
                        <IconButton
                            icon={"source"}
                            iconSize={"50px"}
                            tooltip={"Open Extraction Directory"}
                            onClick={() => {console.log("a")}}
                        />
                        <IconButton
                            icon={"delete_sweep"}
                            iconSize={"50px"}
                            tooltip={"Remove All Characters"}
                            onClick={() => {console.log("a")}}
                        />
                        {/* <vr/> */}
                        <ToggleIconButton
                            checked={filterInstallation}
                            trueIcon={"filter_alt"}
                            trueTooltip={"Installation: Only Necessary Files"}
                            falseIcon={"filter_alt_off"}
                            falseTooltip={"Installation: All Files"}
                            iconSize={"50px"}
                            setter={setFilterInstallation}
                        />
                        <ToggleIconButton
                            checked={updateCharacters}
                            trueIcon={"sync"}
                            trueTooltip={"Existing Characters: Update"}
                            falseIcon={"sync_disabled"}
                            falseTooltip={"Existing Characters: Abort"}
                            iconSize={"50px"}
                            setter={setUpdateCharacters}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

function CharacterList(): JSX.Element {
    const [searchValue, setSearchValue]:
    [string, Dispatch<SetStateAction<string>>]
    = useState("");
    const [sortType, setSortType]:
    [string, Dispatch<SetStateAction<string>>]
    = useState("number");
    const [reverseSort, setReverseSort]:
    [boolean, Dispatch<SetStateAction<boolean>>]
    = useState(false);
    return (
        <>
            <div id={"sort-div"}>
                <div className={"center"}>
                    <div className={"tooltip-wrapper inline-sort-options"}>
                        <input
                            type={"text"}
                            placeholder={"Search"}
                            // id={"characterSearch"}
                            onInput={(event: any) => {
                                setSearchValue(event.target.value);
                                console.log(searchValue, sortType, reverseSort);
                            }}
                        />
                        <div className={"tooltip"}>
                            <span>Search For Characters</span>
                        </div>
                    </div>
                    <div className={"tooltip-wrapper inline-sort-options"}>
                        <select
                            id="sort-type-select"
                            onChange={(event: any) => {
                                setSortType(event.target.value);
                            }}
                        >
                            <option value="number">Internal Number</option>
                            <option value="series">Franchise</option>
                            <option value="displayName">Alphabetical</option>
                        </select>
                        <div className={"tooltip"}>
                            <span>Sorting Method</span>
                        </div>
                    </div>
                    <div className={"inline-sort-options"}>
                        <ToggleIconButton
                            // defaultState={false}
                            checked={reverseSort}
                            trueIcon={"north"}
                            trueTooltip={"Sorted Direction: Backwards"}
                            falseIcon={"south"}
                            falseTooltip={"Sorted Direction: Forwards"}
                            iconSize={"30px"}
                            setter={setReverseSort}
                            // onClick={(state: boolean) => {
                            //     setReverseSort(state);
                            // }}
                        />
                    </div>
                </div>
            </div>
            <div id={"character-div"}>
                <div className={"center"}>
                </div>        
            </div>
        </>
    );
}
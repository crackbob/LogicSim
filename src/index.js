import presets from "./presets.json"
import mathUtils from "./utils/mathUtils";
import stringUtils from "./utils/stringUtils";
import Workspace from "./Workspace";

window.mathUtils = mathUtils;
window.stringUtils = stringUtils;

let workspace = new Workspace(document.getElementById("root"));

window.workspace = workspace;
window.compiler = workspace.compiler;

const toolbar = document.getElementById("toolbar");
const addButton = (label, onClick) => {
    const button = document.createElement("button");
    button.innerText = label;
    button.addEventListener("click", onClick);
    toolbar.appendChild(button);
};

addButton("INPUT", () => workspace.createIo("input"));
addButton("INPUTDIGIT4", () => workspace.createIo("inputDigit4"));
addButton("OUTPUT", () => workspace.createIo("output"));

workspace.getAvailableComponentNames().forEach(name => {
    if (name === "input" || name === "output" || name === "inputDigit4") return;
    addButton(`${name.toUpperCase()}`, () => workspace.create(name));
});

import presets from "./presets.json"
import mathUtils from "./utils/mathUtils";
import Workspace from "./Workspace";

window.mathUtils = mathUtils;

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
addButton("OUTPUT", () => workspace.createIo("output"));

workspace.getAvailableComponentNames().forEach(name => {
    if (name === "input" || name === "output") return;
    addButton(`${name.toUpperCase()}`, () => workspace.create(name));
});

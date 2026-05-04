import Compiler from "./Compiler/Compiler";
import presets from "./presets.json"
import NodeElement from "./ui/NodeElement";
import mathUtils from "./utils/mathUtils";
import Workspace from "./Workspace";

window.mathUtils = mathUtils;

let workspace = new Workspace(document.getElementById("root"));

window.workspace = workspace;
window.compiler = workspace.compiler;

workspace.create("and")
import Compiler from "./Compiler/Compiler";
import presets from "./presets.json"
import mathUtils from "./utils/mathUtils";

let library = {
    "not": {
        "inputs": 1,
        "outputs": 1,
        "execute": (i) => [Number(!i)]
    },

    "and": {
        "inputs": 2,
        "outputs": 1,
        "execute": (a, b) => [a && Number(a == b)]
    },
}

let test = new Compiler(library);

Object.keys(presets).forEach(presetName => {
    library[presetName] = test.toComponent(presets[presetName])
})

window.test = test;
window.mathUtils = mathUtils;
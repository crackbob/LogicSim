import Compiler from "./Compiler/Compiler";
import NodeElement from "./ui/NodeElement";
import presets from "./presets.json"

export default class Workspace {
    constructor (root) {
        this.root = root;
        this.nodes = [];

        this.compiler = new Compiler({
            "not": {
                "name": "not",
                "inputs": 1,
                "outputs": 1,
                "execute": (i) => [Number(!i)]
            },

            "and": {
                "name": "and",
                "inputs": 2,
                "outputs": 1,
                "execute": (a, b) => [a && Number(a == b)]
            },
        });

        this.loadPresets();
    }

    loadPresets () {
        Object.keys(presets).forEach(presetName => {
            this.compiler.library[presetName] = this.compiler.toComponent(presetName, presets[presetName]);
        })
    }

    getNodesByType (name) {
        return this.nodes.filter(node => node.name == name);
    }

    createIo(type, internalState) {
        const nextId = this.getNodesByType(type).length;
        const instance = new NodeElement(this, `${type}_${nextId}`, { "name": type }, internalState);

        this.nodes.push(instance);
        return instance;
    }

    create (name, internalState) {
        const nextId = this.getNodesByType(name).length;
        const instance = new NodeElement(this, `${name}_${nextId}`, this.compiler.library[name], internalState);

        this.nodes.push(instance);
        return instance;
    }

    export () {
        return Object.fromEntries(Object.values(this.nodes).map(node => [node.id, node.internalState]));
    }
}
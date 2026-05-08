import Compiler from "./Compiler/Compiler";
import NodeElement from "./ui/NodeElement";
import InputNodeElement from "./ui/InputNodeElement";
import ContextMenuElement from "./ui/ContextMenuElement";
import presets from "./presets.json"
import InputDigit4NodeElement from "./ui/InputDigit4NodeElement";
import stringUtils from "./utils/stringUtils";
import OutputDigit4NodeElement from "./ui/OutputDigit4NodeElement";
import ConnectionCanvas from "./ui/ConnectionCanvas";

export default class Workspace {
    constructor (root) {
        this.root = root;
        this.nodes = [];

        this.currentComponentName = "test";

        this.extendedComponents = {
            "inputDigit4": InputDigit4NodeElement,
            "input": InputNodeElement,
            "outputDigit4": OutputDigit4NodeElement
        }

        this.compiler = new Compiler({
            "input": {
                "name": "input",
                "inputs": 0,
                "outputs": 1
            },

            "output": {
                "name": "output",
                "inputs": 1,
                "outputs": 0
            },

            "inputDigit4": {
                "name": "inputDigit4",
                "inputs": 0,
                "outputs": 4
            },

            "outputDigit4": {
                "name": "outputDigit4",
                "inputs": 4,
                "outputs": 0
            },

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
            
            "tribuf": {
                "name": "tribuf",
                "inputs": 2,
                "outputs": 1,
                "execute": (input, enable) => {
                    return [enable ? Number(!!input) : 0];
                }
            }
        });

        this.loadPresets();

        this.connections = [];
        this.connectingFrom = null;
        this.connectionBendPoints = [];
        this.dirty = false;

        this.connectionCanvas = new ConnectionCanvas(root, this);
    }

    loadPresets () {
        Object.keys(presets).forEach(presetName => {
            this.compiler.library[presetName] = this.compiler.toComponent(presetName, presets[presetName]);
        })
    }

    getNodesByType (name) {
        return this.nodes.filter(node => node.name == name);
    }

    getAllInputIds () {
        const nodeIds = workspace.nodes.map(node => node.id);
        const lib = this.compiler.library;
        return nodeIds.filter(compId => {
            let parsed = stringUtils.parseComponentKey(compId);
            return !lib[parsed.type].inputs && lib[parsed.type].outputs
        })
    }

    getAllOutputIds () {
        const nodeIds = workspace.nodes.map(node => node.id);
        const lib = this.compiler.library;
        return nodeIds.filter(compId => {
            let parsed = stringUtils.parseComponentKey(compId);
            return lib[parsed.type].inputs && !lib[parsed.type].outputs
        })
    }

    getNodeDefinition (name) {
        return this.compiler.library[name];
    }

    getAvailableComponentNames () {
        return [
            ...Object.keys(this.compiler.library)
        ];
    }

    createIo(type, internalState) {
        const nextId = this.getNodesByType(type).length;
        const definition = this.compiler.library[type];

        const NodeClass = this.extendedComponents[type] || NodeElement;

        const instance = new NodeClass(this, `${type}_${nextId}`, definition, internalState);
        instance.position.x = 100 + (nextId * 160);
        instance.dom.element.style.left = instance.position.x + "px";
        instance.dom.element.style.top = instance.position.y + "px";

        this.nodes.push(instance);
        return instance;
    }

    create (name, internalState) {
        const nextId = this.getNodesByType(name).length;
        const definition = this.compiler.library[name];

        const instance = new NodeElement(this, `${name}_${nextId}`, definition, internalState);
        instance.position.x = 100 + (nextId * 160);
        instance.dom.element.style.left = instance.position.x + "px";
        instance.dom.element.style.top = instance.position.y + "px";

        this.nodes.push(instance);
        this.dirty = true;
        this.simulate();

        return instance;
    }

    onOutputPortClick(node, outputIndex) {
        this.connectingFrom = { node, outputIndex };
        this.connectionBendPoints = [];
        this.connectionCanvas.createTempConnection();
    }

    onInputPortClick(node, inputIndex) {
        if (this.connectingFrom) {
            this.connections.push({
                from: { node: this.connectingFrom.node.id, output: this.connectingFrom.outputIndex },
                to: { node: node.id, input: inputIndex },
                bends: [...this.connectionBendPoints]
            });
            this.connectionCanvas.clearTemporaryConnection();
            this.connectingFrom = null;
        }

        this.dirty = true;
        this.simulate();
    }

    cancelTemporaryConnection() {
        this.connectingFrom = null;
        this.connectionCanvas.clearTemporaryConnection();
    }

    updateConnections() {
        this.connectionCanvas.updateConnections();
    }

    deleteNode(nodeId) {
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;

        const node = this.nodes[nodeIndex];
        node.dom.element.remove();
        this.nodes.splice(nodeIndex, 1);
        this.connections = this.connections.filter(conn => conn.from.node !== nodeId && conn.to.node !== nodeId);
        this.connectionCanvas.updateConnections();
        this.dirty = true;
        this.simulate();
    }

    getConnectionByElement(element) {
        return this.connectionCanvas.getConnectionByElement(element);
    }

    deleteConnection(index) {
        if (index < 0 || index >= this.connections.length) return;
        this.connections.splice(index, 1);
        this.connectionCanvas.updateConnections();
        this.dirty = true;
        this.simulate();
    }

    export () {
        const components = {};

        this.nodes.forEach(node => {
            if (node.name === "input") {
                components[node.id] = { 
                    inputs: [],
                    outputs: []
                };
            } else if (node.name.startsWith("output")) {
                components[node.id] = { 
                    outputs: new Array(node.definition.inputs).fill(0)
                };
            } else {
                components[node.id] = { 
                    inputs: new Array(node.definition.inputs).fill(0)
                };
            }

            components[node.id].position = node.position;
        });

        this.connections.forEach(conn => {
            const toNode = conn.to.node || 0;
            const fromNode = conn.from.node || 0;
            let indexStr = `_${conn.from.output}`;

            if (fromNode.startsWith("output")) {
                indexStr = "";
            }

            if (toNode.startsWith("output")) {
                components[toNode].outputs[conn.to.input] = `${fromNode}${indexStr}`;
            } else {
                components[toNode].inputs[conn.to.input] = `${fromNode}${indexStr}`;
            }
        });

        return components;
    }

    // im so sorry, ill rewrite you soon (maybe)
    editComponent(name) {
        const comp = this.compiler.library[name];

        this.currentComponentName = name;

        this.nodes.forEach(n => n.dom.element.remove());
        this.nodes = [];
        this.connections = [];
        this.connectionCanvas.updateConnections();

        const def = comp.components;

        Object.entries(def).forEach(([id, data]) => {
            const parsed = stringUtils.parseComponentKey(id);
            const type = parsed.type;

            const definition = this.compiler.library[type];
            if (!definition) return;

            const NodeClass = this.extendedComponents[type] || NodeElement;

            if (!def.outputs) {
                const node = new NodeClass(this, parsed.componentId, definition);

                node.position = data.position || { x: 100, y: 100 };
                node.dom.element.style.left = node.position.x + "px";
                node.dom.element.style.top = node.position.y + "px";

                this.nodes.push(node);
                return;
            }

            if (def.outputs) {
                def.outputs.forEach((_, i) => {
                    const nodeId = `${id}`;
                    console.log(definition)

                    const node = new NodeClass(this, nodeId, definition);

                    node.position = {
                        x: (data.position?.x || 100),
                        y: (data.position?.y || 100) + (i * 60)
                    };

                    node.dom.element.style.left = node.position.x + "px";
                    node.dom.element.style.top = node.position.y + "px";

                    this.nodes.push(node);
                });
            }
        });

        Object.entries(def).forEach(([toId, data]) => {
            if (data.inputs) {
                data.inputs.forEach((input, inputIndex) => {
                    if (!input) return;

                    let parsed = stringUtils.parseComponentKey(input);
                    let parsedOutput = stringUtils.parseComponentKey(toId);

                    this.connections.push({
                        from: { node: parsed.componentId, output: parsed.valueIndex },
                        to: { node: toId, input: inputIndex },
                        bends: []
                    });
                });
            }

            if (data.outputs) {
                data.outputs.forEach((output, outputIndex) => {
                    if (!output) return;

                    let parsed = stringUtils.parseComponentKey(output);
                    let parsedOutput = stringUtils.parseComponentKey(toId);
                    
                    this.connections.push({
                        from: { node: parsed.componentId, output: parsed.valueIndex },
                        to: { node: toId, input: outputIndex },
                        bends: []
                    });
                });
            }
        });

        this.connectionCanvas.updateConnections();

        this.dirty = false;
        this.simulate();
    }

    compile () {
        return this.compiler.toComponent(this.currentComponentName, this.export());
    }

    getNodeById (id) {
        return this.nodes.find(node => node.id == id);
    }

    getInputsToValues () {
        let outputIds = this.getAllInputIds();

        return Object.fromEntries(outputIds.map(id => {
            let node = this.getNodeById(id);
            return [node.id, node.internalState.outputs];
        }))
    }

    buildOutputMap() {
        const outputNodes = this.getAllOutputIds().map(id => this.getNodeById(id));

        const map = [];
        let flatIndex = 0;

        for (const node of outputNodes) {
            const inputCount = node.definition.inputs;

            for (let i = 0; i < inputCount; i++) {
                map[flatIndex++] = { node, portIndex: i };
            }
        }

        return map;
    }

    simulate () {
        const library = this.compiler.library
        let inputIds = this.getAllInputIds();
        let outputs = this.getAllOutputIds().map(id => this.getNodeById(id));
        let inputValues = inputIds.map(id => this.getNodeById(id).internalState.outputs).flat();

        if (this.dirty || !library?.[this.currentComponentName]) {
            library[this.currentComponentName] = this.compile();
            this.dirty = false;
        }

        let outputValues = library[this.currentComponentName].execute(...inputValues);

        const outputMap = this.buildOutputMap();

        outputValues.forEach((value, flatIndex) => {
            const entry = outputMap[flatIndex];
            if (!entry) return;

            entry.node.internalState.inputs[entry.portIndex] = value;
            entry.node.internalState.outputs[entry.portIndex] = value;
            entry.node.updateVisuals();
        });

        this.nodes.forEach(node => {
            let state = this.compiler.library[this.currentComponentName].scope.componentState[node.id];

            if (state) {
                node.internalState.inputs = state.inputs;
                node.internalState.outputs = state.outputs;
            }

            node.updateVisuals();
        })

        this.connectionCanvas.updateConnections();

        console.log(inputValues, outputValues);
    }
}
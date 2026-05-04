import Compiler from "./Compiler/Compiler";
import NodeElement from "./ui/NodeElement";
import InputNodeElement from "./ui/InputNodeElement";
import ContextMenuElement from "./ui/ContextMenuElement";
import presets from "./presets.json"
import InputDigit4NodeElement from "./ui/InputDigit4NodeElement";
import stringUtils from "./utils/stringUtils";
import OutputDigit4NodeElement from "./ui/OutputDigit4NodeElement";

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
                name: "input",
                inputs: 0,
                outputs: 1
            },
            "output": {
                name: "output",
                inputs: 1,
                outputs: 0
            },
            "inputDigit4": {
                name: "inputDigit4",
                inputs: 0,
                outputs: 4
            },
            "outputDigit4": {
                name: "outputDigit4",
                inputs: 4,
                outputs: 0
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
            }
        });

        this.loadPresets();

        this.connections = [];
        this.connectingFrom = null;
        this.dirty = false;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "connections");
        this.root.appendChild(svg);
        this.svg = svg;

        this.contextMenu = new ContextMenuElement();

        this.root.addEventListener('contextmenu', (event) => event.preventDefault());
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

        return instance;
    }

    onOutputPortClick(node, outputIndex) {
        this.connectingFrom = { node, outputIndex };
    }

    onInputPortClick(node, inputIndex) {
        if (this.connectingFrom) {
            this.connections.push({
                from: { node: this.connectingFrom.node.id, output: this.connectingFrom.outputIndex },
                to: { node: node.id, input: inputIndex }
            });
            this.drawConnection(this.connectingFrom, { node, inputIndex });
            this.connectingFrom = null;
        }

        this.dirty = true;
    }

    drawConnection(from, to, connectionIndex = 0) {
        const fromPort = from.node.outputs[from.outputIndex];
        const toPort = to.node.inputs[to.inputIndex];
        const fromRect = fromPort.getBoundingClientRect();
        const toRect = toPort.getBoundingClientRect();
        const rootRect = this.root.getBoundingClientRect();
        const x1 = fromRect.left + fromRect.width / 2 - rootRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - rootRect.top;
        const x2 = toRect.left + toRect.width / 2 - rootRect.left;
        const y2 = toRect.top + toRect.height / 2 - rootRect.top;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("class", "connection-line");

        const isPowered = from.node.internalState.outputs[from.outputIndex];
        line.classList.toggle("powered", isPowered);

        line.addEventListener('contextmenu', this.onRightClickLine.bind(this))
        this.svg.appendChild(line);
    }

    onRightClickLine (event) {
        event.preventDefault();

        let connectionIndex = this.getConnectionByElement(event.target);
        const connection = this.connections[connectionIndex];
        
        this.contextMenu.show([{
            label: `Delete connection from ${connection.from.node} to ${connection.to.node}`,
            onClick: () => this.deleteConnection(connectionIndex)
        }], event.clientX, event.clientY);
    }

    updateConnections() {
        this.svg.innerHTML = '';
        this.lines = [];
        this.connections.forEach((conn, index) => {
            const fromNode = this.nodes.find(n => n.id === conn.from.node);
            const toNode = this.nodes.find(n => n.id === conn.to.node);
            this.drawConnection({ node: fromNode, outputIndex: conn.from.output }, { node: toNode, inputIndex: conn.to.input }, index);
        });
    }

    deleteNode(nodeId) {
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;

        const node = this.nodes[nodeIndex];
        node.dom.element.remove();
        this.nodes.splice(nodeIndex, 1);
        this.connections = this.connections.filter(conn => conn.from.node !== nodeId && conn.to.node !== nodeId);
        this.updateConnections();
        this.dirty = true;
    }

    getConnectionByElement (element) {
        return Object.values(this.svg.children).findIndex(svg => svg == element);
    }

    deleteConnection(index) {
        if (index < 0 || index >= this.connections.length) return;
        this.connections.splice(index, 1);
        this.updateConnections();
        this.dirty = true;
    }

    export () {
        const components = {};

        this.nodes.forEach(node => {
            if (node.name === "input") {
                components[node.id] = { inputs: [], outputs: [] };
            } else if (node.name.startsWith("output")) {
                components[node.id] = { outputs: new Array(node.definition.inputs).fill(0) };
            } else {
                components[node.id] = { inputs: new Array(node.definition.inputs).fill(0) };
            }
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
            let state = this.compiler.library.test.scope.componentState[node.id];

            if (state) {
                node.internalState.inputs = state.inputs;
                node.internalState.outputs = state.outputs;
            }

            node.updateVisuals();
        })

        this.updateConnections();

        console.log(inputValues, outputValues);
    }
}
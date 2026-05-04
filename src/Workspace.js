import Compiler from "./Compiler/Compiler";
import NodeElement from "./ui/NodeElement";
import InputNodeElement from "./ui/InputNodeElement";
import ContextMenuElement from "./ui/ContextMenuElement";
import presets from "./presets.json"

export default class Workspace {
    constructor (root) {
        this.root = root;
        this.nodes = [];

        this.currentComponentName = "test";

        this.ioDefinitions = {
            input: {
                name: "input",
                inputs: 0,
                outputs: 1
            },
            output: {
                name: "output",
                inputs: 1,
                outputs: 0
            }
        };

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

    getNodeDefinition (name) {
        return this.ioDefinitions[name] || this.compiler.library[name];
    }

    getAvailableComponentNames () {
        return [
            ...Object.keys(this.ioDefinitions),
            ...Object.keys(this.compiler.library)
        ];
    }

    createIo(type, internalState) {
        const nextId = this.getNodesByType(type).length;
        const definition = this.ioDefinitions[type];

        const NodeClass = type === "input" ? InputNodeElement : NodeElement;
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
                components[node.id] = { inputs: [] };
            } else if (node.name === "output") {
                components[node.id] = { outputs: new Array(node.definition.inputs).fill(0) };
            } else {
                components[node.id] = { inputs: new Array(node.definition.inputs).fill(0) };
            }
        });

        this.connections.forEach(conn => {
            const toNode = conn.to.node || 0;
            const fromNode = conn.from.node || 0;
            let indexStr = `_${conn.from.output}`;

            if (fromNode.startsWith("input") || fromNode.startsWith("output")) {
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
        return this.compiler.compile(this.export());
    }

    simulate () {
        const library = this.compiler.library
        let inputs = workspace.getNodesByType("input");
        let outputs = workspace.getNodesByType("output");
        let inputValues = inputs.map(n => n.internalState.outputs[0]);

        if (this.dirty || !library?.[this.currentComponentName]) {
            library[this.currentComponentName] = this.compile();
            this.dirty = false;
        }

        let outputValues = library[this.currentComponentName](...inputValues);

        outputValues.forEach((output, index) => {
            outputs[index].setPowered(output);
        })

        console.log(inputValues, outputValues);
    }
}
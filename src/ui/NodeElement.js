export default class NodeElement {
    constructor(workspace, id, definition, internalState) {
        this.workspace = workspace;
        this.dom = {};

        this.definition = definition;
        this.name = definition.name;
        this.id = id;

        if (internalState) {
            this.internalState = internalState;
        } else {
            this.internalState = { 
                outputs: Array(definition.outputs).fill(0),
            };
        }

        this.position = { x: 100, y: 100 };
        this.dragging = false;
        this.offset = { x: 0, y: 0 };

        this.createElement();
        this.createLabel(definition.name);
        this.makeDraggable();
    }

    createElement () {
        const element = document.createElement("div");
        element.className = `component ${this.definition.name}`;

        element.style.left = `${this.position.x}px`;
        element.style.top = `${this.position.y}px`;

        element._node = this;

        this.workspace.root.appendChild(element);
        
        this.dom.element = element;

        this.dom.element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.workspace.contextMenu.show([
                {
                    label: `Delete ${this.definition.name.toUpperCase()}`,
                    onClick: () => this.workspace.deleteNode(this.id)
                }
            ], event.clientX, event.clientY);
        });

        this.inputs = [];
        this.outputs = [];

        for (let i = 0; i < this.definition.inputs; i++) {
            const port = document.createElement("div");
            port.className = "input-port";
            port.dataset.index = i;
            port.style.top = `${((i + 1) / (this.definition.inputs + 1)) * 100}%`;
            port.addEventListener("mouseup", () => this.workspace.onInputPortClick(this, i));
            this.dom.element.appendChild(port);
            this.inputs.push(port);
        }

        for (let i = 0; i < this.definition.outputs; i++) {
            const port = document.createElement("div");
            port.className = "output-port";
            port.dataset.index = i;
            port.style.top = `${((i + 1) / (this.definition.outputs + 1)) * 100}%`;
            port.addEventListener("mousedown", () => this.workspace.onOutputPortClick(this, i));
            this.dom.element.appendChild(port);
            this.outputs.push(port);
        }

        return element;
    }

    createLabel (text) {
        const label = document.createElement("div");
        label.className = "component-label";
        this.dom.element.appendChild(label);

        label.innerText = text;

        this.dom.label = label;
        return label;
    }

    makeDraggable() {
        const el = this.dom.element;

        el.addEventListener("mousedown", (e) => {
            this.dragging = true;

            this.offset.x = e.clientX - this.position.x;
            this.offset.y = e.clientY - this.position.y;
        });

        document.addEventListener("mousemove", (e) => {
            if (!this.dragging) return;

            this.position.x = e.clientX - this.offset.x;
            this.position.y = e.clientY - this.offset.y;

            el.style.left = this.position.x + "px";
            el.style.top = this.position.y + "px";

            this.workspace.updateConnections();
        });

        document.addEventListener("mouseup", () => {
            this.dragging = false;
        });
    }

    setPowered(state) {
        this.dom.element.classList.toggle("powered", state);
    }
}
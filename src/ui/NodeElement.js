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
                inputs: Array(definition.inputs).fill(0),
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

        const inputContainer = document.createElement("div");
        inputContainer.className = "ports left";
        this.dom.element.appendChild(inputContainer);

        const contentContainer = document.createElement("div");
        contentContainer.className = "component-content";
        this.dom.element.appendChild(contentContainer);
        this.dom.content = contentContainer;

        const outputContainer = document.createElement("div");
        outputContainer.className = "ports right";
        this.dom.element.appendChild(outputContainer);

        for (let i = 0; i < this.definition.inputs; i++) {
            const port = document.createElement("div");
            port.className = "port left";
            port.dataset.index = i;
            port.addEventListener("mouseup", () => this.workspace.onInputPortClick(this, i));
            inputContainer.appendChild(port);
            this.inputs.push(port);
        }

        for (let i = 0; i < this.definition.outputs; i++) {
            const port = document.createElement("div");
            port.className = "port right";
            port.dataset.index = i;
            port.addEventListener("mousedown", () => this.workspace.onOutputPortClick(this, i));
            outputContainer.appendChild(port);
            this.outputs.push(port);
        }

        return element;
    }

    createLabel (text) {
        const label = document.createElement("div");
        label.className = "component-label";
        this.dom.content.appendChild(label);

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

    updateVisuals () {
        this.outputs.forEach((output, i) => {
            output.classList.toggle("powered", this.internalState?.outputs[i]);
        })

        this.inputs.forEach((input, i) => {
            input.classList.toggle("powered", this.internalState?.inputs?.[i]);
        })

        this.dom.element.classList.toggle("powered", this.internalState.outputs.every(v => v == 1));
    }
}
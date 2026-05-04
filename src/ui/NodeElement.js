export default class NodeElement {
    constructor(workspace, id, definition, internalState = { inputs: {} }) {
        this.workspace = workspace;
        this.dom = {};

        this.definition = definition;
        this.name = definition.name;
        this.id = id;
        
        this.internalState = internalState;

        this.position = { x: 100, y: 100 };
        this.dragging = false;
        this.offset = { x: 0, y: 0 };

        this.createElement();
        this.createLabel(definition.name);
        this.makeDraggable();
    }

    createElement () {
        const element = document.createElement("div");
        element.className = "component";

        element.style.left = `${this.position.x}px`;
        element.style.top = `${this.position.y}px`;

        element._node = this;

        this.workspace.root.appendChild(element);
        
        this.dom.element = element;
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
        });

        document.addEventListener("mouseup", () => {
            this.dragging = false;
        });
    }
}
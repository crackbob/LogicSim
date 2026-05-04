import mathUtils from "../utils/mathUtils";
import NodeElement from "./NodeElement";

export default class InputDigit4NodeElement extends NodeElement {
    constructor(workspace, id, definition, internalState) {
        super(workspace, id, definition, internalState);
    }

    createElement() {
        const element = super.createElement();
        element.classList.add("input-node");
        return element;
    }

    createLabel (text) {
        const label = document.createElement("div");
        label.className = "component-label input";
        this.dom.content.appendChild(label);

        label.innerText = 0;
        label.contentEditable = "true";

        label.addEventListener("input", () => {
            const text = label.innerText.trim();

            if (!/^\d*$/.test(text)) {
                label.innerText = text.replace(/\D/g, "");
                return;
            }

            const parsed = parseInt(text || "0");
            const output = mathUtils.decimalToBinaryArray(parsed);

            this.internalState.outputs = mathUtils.padArr(output, 4);

            this.workspace.simulate();
        });

        this.dom.label = label;
        return label;
    }
}

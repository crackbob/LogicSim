import mathUtils from "../utils/mathUtils";
import NodeElement from "./NodeElement";

export default class OutputDigit4NodeElement extends NodeElement {
    constructor(workspace, id, definition, internalState) {
        super(workspace, id, definition, internalState);
    }

    createElement() {
        const element = super.createElement();
        element.classList.add("output-node");
        return element;
    }

    createLabel (text) {
        let label = super.createLabel(text);
        this.dom.label.className = "component-label digit"
        this.dom.label.innerText = 0;
        return label;
    }

    updateVisuals () {
        super.updateVisuals();

        this.dom.label.innerText = mathUtils.binaryArrayToDecimal(this.internalState.outputs);
    }
}

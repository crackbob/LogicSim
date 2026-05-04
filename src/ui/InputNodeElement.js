import NodeElement from "./NodeElement";

export default class InputNodeElement extends NodeElement {
    constructor(workspace, id, definition, internalState) {
        super(workspace, id, definition, internalState);
    }

    createElement() {
        const element = super.createElement();
        element.classList.add("input-node");
        this.createSwitch();
        return element;
    }

    createSwitch() {
        const switchWrapper = document.createElement("div");
        switchWrapper.className = "input-switch";
        switchWrapper.addEventListener("click", (event) => {
            event.stopPropagation();
            this.internalState.outputs[0] = Number(!this.internalState.outputs[0]);
            switchWrapper.classList.toggle("on", this.internalState.outputs[0]);
            this.workspace.simulate();
        });

        const switchTrack = document.createElement("div");
        switchTrack.className = "switch-track";

        const switchKnob = document.createElement("div");
        switchKnob.className = "switch-knob";

        const switchLabel = document.createElement("div");
        switchLabel.className = "switch-label";
        this.dom.switchLabel = switchLabel;

        switchTrack.appendChild(switchKnob);
        switchWrapper.appendChild(switchTrack);
        switchWrapper.appendChild(switchLabel);

        this.dom.element.appendChild(switchWrapper);
        this.dom.switch = switchWrapper;
    }

    createLabel() {}
}

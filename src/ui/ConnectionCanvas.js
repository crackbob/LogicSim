import ContextMenuElement from "./ContextMenuElement";

export default class ConnectionCanvas {
    constructor(root, workspace) {
        this.root = root;
        this.workspace = workspace;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("class", "connections");
        this.root.appendChild(this.svg);

        this.tempConnection = null;
        this.tempPointer = null;
        this.draggingBend = null;

        this.root.addEventListener('mousemove', this.onWorkspaceMouseMove.bind(this));
        this.root.addEventListener('mouseup', this.onWorkspacePointerUp.bind(this));
        this.root.addEventListener('contextmenu', (event) => {
            if (this.workspace.connectingFrom) {
                event.preventDefault();
                this.workspace.cancelTemporaryConnection();
            }
            event.preventDefault();
        });

        this.contextMenu = new ContextMenuElement();
    }

    drawConnection(from, to, connectionIndex = 0) {
        const points = this.getConnectionPoints(from, to);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        line.setAttribute("points", points.map(point => `${point.x},${point.y}`).join(" "));
        line.setAttribute("fill", "none");
        line.setAttribute("class", "connection-line");

        const isPowered = from.node.internalState.outputs[from.outputIndex];
        line.classList.toggle("powered", isPowered);

        line.addEventListener('contextmenu', this.onRightClickLine.bind(this));
        this.svg.appendChild(line);
        
        if (to?.bends) {
            to.bends.forEach((bend, bendIndex) => {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", bend.x);
                circle.setAttribute("cy", bend.y);
                circle.setAttribute("r", 4);
                circle.setAttribute("class", "bend-point");
                circle.addEventListener('mousedown', (event) => {
                    event.stopPropagation();
                    this.draggingBend = { connectionIndex, bendIndex };
                });
                this.svg.appendChild(circle);
            });
        }
    }

    getConnectionPoints(from, to) {
        const rootRect = this.root.getBoundingClientRect();
        const fromPort = from.node.outputs[from.outputIndex];
        const fromRect = fromPort.getBoundingClientRect();
        const points = [{
            x: fromRect.left + fromRect.width / 2 - rootRect.left,
            y: fromRect.top + fromRect.height / 2 - rootRect.top
        },
        ...(to?.bends || this.workspace.connectionBendPoints)];

        if (to?.node && typeof to.inputIndex === 'number') {
            const toPort = to.node.inputs[to.inputIndex];
            const toRect = toPort.getBoundingClientRect();
            points.push({
                x: toRect.left + toRect.width / 2 - rootRect.left,
                y: toRect.top + toRect.height / 2 - rootRect.top
            });
        } else if (to && typeof to.x === 'number' && typeof to.y === 'number') {
            points.push(to);
        }

        return points;
    }

    createTempConnection() {
        this.clearTemporaryConnection();
        const temp = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        temp.setAttribute("class", "connection-line temp");
        temp.setAttribute("fill", "none");
        this.svg.appendChild(temp);
        this.tempConnection = temp;
    }

    updateTempConnection() {
        if (!this.tempConnection || !this.workspace.connectingFrom) return;
        const target = this.tempPointer || this.workspace.connectionBendPoints[this.workspace.connectionBendPoints.length - 1] || {};
        const points = this.getConnectionPoints(this.workspace.connectingFrom, target);
        this.tempConnection.setAttribute("points", points.map(point => `${point.x},${point.y}`).join(" "));
    }

    clearTemporaryConnection() {
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
        this.workspace.connectionBendPoints = [];
        this.tempPointer = null;
    }

    onWorkspaceMouseMove(event) {
        if (this.draggingBend) {
            const point = this.getRelativePoint(event);
            this.workspace.connections[this.draggingBend.connectionIndex].bends[this.draggingBend.bendIndex] = point;
            this.updateConnections();
            return;
        }
        if (!this.workspace.connectingFrom) return;
        this.tempPointer = this.getRelativePoint(event);
        if (!this.tempConnection) {
            this.createTempConnection();
        }
        this.updateTempConnection();
    }

    onWorkspacePointerUp(event) {
        if (this.draggingBend) {
            this.draggingBend = null;
            return;
        }
        if (!this.workspace.connectingFrom) return;
        if (event.target.closest('.port') || event.target.closest('.component') || event.target.closest('.connection-line:not(.temp)')) return;

        this.workspace.connectionBendPoints.push(this.getRelativePoint(event));
        this.updateTempConnection();
    }

    getRelativePoint(event) {
        const rootRect = this.root.getBoundingClientRect();
        return {
            x: event.clientX - rootRect.left,
            y: event.clientY - rootRect.top
        };
    }

    onRightClickLine(event) {
        event.preventDefault();

        let connectionIndex = this.getConnectionByElement(event.target);
        const connection = this.workspace.connections[connectionIndex];

        this.contextMenu.show([{
            label: `Delete connection from ${connection.from.node} to ${connection.to.node}`,
            onClick: () => this.workspace.deleteConnection(connectionIndex)
        }], event.clientX, event.clientY);
    }

    updateConnections() {
        const temp = this.tempConnection;
        this.svg.innerHTML = '';
        if (temp) {
            this.svg.appendChild(temp);
        }
        this.workspace.connections.forEach((conn, index) => {
            const fromNode = this.workspace.nodes.find(n => n.id === conn.from.node);
            const toNode = this.workspace.nodes.find(n => n.id === conn.to.node);
            this.drawConnection(
                { node: fromNode, outputIndex: conn.from.output },
                { node: toNode, inputIndex: conn.to.input, bends: conn.bends },
                index
            );
        });
        if (temp) {
            this.updateTempConnection();
        }
    }

    getConnectionByElement(element) {
        return Object.values(this.svg.children).filter(e => e.tagName !== "circle").findIndex(svg => svg == element);
    }
}
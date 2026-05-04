export default class ContextMenuElement {
    constructor () {
        this.dom = document.createElement('div');
        this.dom.className = 'context-menu';
        this.dom.style.display = 'none';
        document.body.appendChild(this.dom);

        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', (event) => {
            if (!event.target.closest('.context-menu') && !event.target.closest('.component') && !event.target.closest('.connection-line')) {
                this.hide();
            }
        });
    }

    show (items, x, y) {
        this.dom.innerHTML = '';

        items.forEach(item => {
            const button = document.createElement('button');
            button.innerText = item.label;
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                item.onClick();
                this.hide();
            });
            this.dom.appendChild(button);
        });

        this.dom.style.display = 'block';
        this.dom.style.left = `${x}px`;
        this.dom.style.top = `${y}px`;
    }

    hide () {
        this.dom.style.display = 'none';
    }
}

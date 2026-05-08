import CompilerTask from "./CompilerTask";

export default class Compiler {
    constructor (library) {
        this.library = library;
        this.tasks = [];
    }

    compile (components) {
        this.task = new CompilerTask(this, components);
        this.tasks.push(this.task);
        return this.task.compile();
    }

    toComponent (name, components) {
        const task = new CompilerTask(this, components);
        this.tasks.push(task);

        return {
            name: name,
            inputs: task.getTotalInputs(),
            outputs: task.getTotalOutputs(),
            externals: task.getComponentsByType("external").length,
            instanceCompilations: task.getComponentsToCompile().length,
            execute: task.compile(),
            components: components,
            scope: task.scope,
            clone: () => compile(components)
        }
    }
}
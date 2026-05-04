import CompilerTask from "./CompilerTask";

export default class Compiler {
    constructor (library) {
        this.library = library;
        this.tasks = [];
    }

    compile (components) {
        this.task = new CompilerTask(this, components);
        return this.task.compile();
    }

    toComponent (components) {
        const task = new CompilerTask(this, components);
        this.tasks.push(task);

        return {
            inputs: task.getComponentsByType("input").length,
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
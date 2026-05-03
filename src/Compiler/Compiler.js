import CompilerTask from "./CompilerTask";

export default class Compiler {
    constructor (library) {
        this.library = library;
    }

    compile (components) {
        this.task = new CompilerTask(this, components);
        return this.task.compile();
    }

    toComponent (components) {
        this.task = new CompilerTask(this, components);
        return {
            inputs: this.task.getComponentsByType("input").length,
            outputs: this.task.getTotalOutputs(),
            externals: this.task.getComponentsByType("external").length,
            instanceCompilations: this.task.getComponentsToCompile().length,
            execute: this.task.compile(),
            components: structuredClone(components),
        }
    }
}
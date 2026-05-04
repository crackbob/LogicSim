import stringUtils from "../utils/stringUtils";

export default class CompilerTask {
    constructor (compilerInstance, components, onCall = () => {}) {
        this.compilerInstance = compilerInstance;
        this.components = components;

        this.scope = {
            instanceCompiled: {},
            call: this.callFromComponent.bind(this),
            compileForThis: this.compileForComponent.bind(this),
            componentState: {}
        };

        this.ioNames = ["input", "output", "inputDigit4", "external", "outputDigit4"]
    }

    callFromComponent (rawComponentName, name, ...inputs) {
        const targetDefinition = this.compilerInstance.library?.[name] || this.scope.instanceCompiled[name];
        const returnValues = targetDefinition.execute(...inputs);
        
        this.scope.componentState[rawComponentName] = {
            inputs: [...inputs],
            outputs: returnValues,
            scope: targetDefinition.scope
        }

        return returnValues;
    }

    compileForComponent (componentName) {
        return this.compilerInstance.toComponent(componentName, structuredClone(this.compilerInstance.library[componentName].components));
    }

    getComponentNamesByType (type) {
        return Object.keys(this.components).filter(key => key.startsWith(type));
    }

    getComponentsByType (type) {
        return this.getComponentNamesByType(type).map(p => this.components[p]);
    }

    buildFunctionArguments () {
        const inputs = this.getComponentNamesByType("input");
        const returnValue = [];

        inputs.forEach(rawInputName => {
            const parsed = stringUtils.parseComponentKey(rawInputName);
            const definition = this.compilerInstance.library[parsed.type];
            
            for (let i = 0; i < definition.outputs; i++) {
                returnValue.push(`${parsed.type}_${parsed.index}_${i}`);
            }
        })

        return returnValue;
    }

    buildFunctionReturns () {
        return this.getComponentsByType("output").map(p => p.outputs).flat();
    }

    getComponentReturnArr (name, componentIndex = 0) {
        const library = this.compilerInstance.library;
        const outputs = library[name].outputs;
        const thisComponent = this.components[`${name}_${componentIndex}`];

        if (thisComponent?.outputs) {
            return thisComponent?.outputs;
        }

        return new Array(outputs).fill(name).map((p, i) => `${p}_${componentIndex}_${i}`);
    }

    getTotalOutputs () {
        return this.buildFunctionReturns().length;
    }

    buildExternalDefinitionStatements () {
        let str = "";

        this.getComponentNamesByType("external").forEach(external => {
            str += `let ${external} = ${this.components[external]}; ${stringUtils.newLine}`
        })

        return str;
    }

    buildInstanceCompileStatements () {
        let str = "";

        this.getComponentsToCompile().forEach(rawComponentName => {
            let parsed = stringUtils.parseComponentKey(rawComponentName);
            str += `this.instanceCompiled["${rawComponentName}"] = this.compileForThis("${parsed.type}");${stringUtils.newLine}`
        })

        return str;
    }

    componentUsesExternals (name) {
        return !!this.compilerInstance.library[name].externals;
    }

    componentUsesInstanceCompilation(component) {
        let parsed = stringUtils.parseComponentKey(component);
        let definition = this.compilerInstance.library[parsed.type];
        return definition?.externals || definition?.instanceCompilations;
    }

    getComponentsToCompile () {
        return Object.keys(this.components).filter(component => {
            return this.componentUsesInstanceCompilation(component);
        })
    }

    buildCallStatement (rawComponentName) {
        const componentInfo = stringUtils.parseComponentKey(rawComponentName);
        const inputs = this.components[rawComponentName].inputs;
        const returnArrayStr = stringUtils.strArray(this.getComponentReturnArr(componentInfo.type, componentInfo.index));
        const callingComponentUsesExternals = this.componentUsesInstanceCompilation(componentInfo.type);

        let nameToCall = componentInfo.type;
        let keyword = "let ";

        if (returnArrayStr.includes("external")) {
            keyword = "";
        }

        if (callingComponentUsesExternals) {
            nameToCall = rawComponentName;
        }

        return `${stringUtils.indent}${keyword}${returnArrayStr} = this.call("${rawComponentName}", "${nameToCall}", ${stringUtils.strArray(inputs, false)}); ${stringUtils.newLine}`;
    }

    resolveOwner (signalName)  {
        if (typeof signalName !== "string") return null;

        const parts = signalName.split("_");
        parts.pop();

        const componentName = parts.join("_");
        return this.components[componentName] ? componentName : null;
    }

    getExecutionOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];

        const visit = (name) => {
            if (visited.has(name)) return;
            if (visiting.has(name)) {
                console.log("cycle " + name);
            }

            visiting.add(name);

            const component = this.components[name];
            const inputs = component?.inputs || [];

            for (let input of inputs) {
                const dep = this.resolveOwner(input);
                if (dep) {
                    visit(dep);
                }
            }

            visiting.delete(name);
            visited.add(name);
            order.push(name);
        };

        for (let name in this.components) {
            const parsed = stringUtils.parseComponentKey(name);

            if (!this.ioNames.includes(parsed.type)) {
                visit(name);
            }
        }

        return order;
    }

    buildFunctionBody () {
        let str = "";

        const order = this.getExecutionOrder();

        for (let rawComponentName of order) {
            let componentInfo = stringUtils.parseComponentKey(rawComponentName);

            if (!this.ioNames.includes(componentInfo.type)) {
                str += this.buildCallStatement(rawComponentName);
            }
        }

        str += `${stringUtils.indent}return ${stringUtils.strArray(this.buildFunctionReturns())}; ${stringUtils.newLine}`;

        return str;
    }

    compile () {
        let externalFunction = Function(`${this.buildExternalDefinitionStatements()} ${this.buildInstanceCompileStatements()} return function CompiledComponent (${this.buildFunctionArguments()}) {${stringUtils.newLine}${this.buildFunctionBody()}}`);
        return externalFunction.bind(this.scope)().bind(this.scope);
    }
}
import stringUtils from "../utils/stringUtils";

export default class CompilerTask {
    constructor (compilerInstance, components, onCall = () => {}) {
        this.compilerInstance = compilerInstance;
        this.components = components;
    }

    callFromComponent (name, ...inputs) {
        return this.compilerInstance.library[name].execute(...inputs);
    }

    get scope () {
        let context = this;
        return {
            call: context.callFromComponent.bind(context)
        };
    }

    parseComponentKey (name) {
        let split = name.split("_");
        return {
            type: split[0],
            index: parseInt(split[1] || 0),
            valueIndex: parseInt(split[2] || 0)
        }
    }

    getComponentNamesByType (type) {
        return Object.keys(this.components).filter(key => key.startsWith(type));
    }

    getComponentsByType (type) {
        return this.getComponentNamesByType(type).map(p => this.components[p]);
    }

    buildFunctionArguments () {
        return this.getComponentNamesByType("input");
    }

    buildFunctionReturns () {
        return this.getComponentsByType("output").map(p => p.outputs).flat();
    }

    getComponentReturnArr (name, componentIndex = 0) {
        const library = this.compilerInstance.library;
        const outputs = library[name].outputs;

        return new Array(outputs).fill(name).map((p, i) => `${p}_${componentIndex}_${i}`);
    }

    getTotalOutputs () {
        return this.buildFunctionReturns().length;
    }

    buildCallStatement (rawComponentName) {
        const componentInfo = this.parseComponentKey(rawComponentName);
        const inputs = this.components[rawComponentName].inputs;
        const returnArrayStr = stringUtils.strArray(this.getComponentReturnArr(componentInfo.type, componentInfo.index));

        return `${stringUtils.indent}let ${returnArrayStr} = this.call("${componentInfo.type}", ${stringUtils.strArray(inputs, false)}); ${stringUtils.newLine}`;
    }

    buildFunctionBody () {
        let str = "";

        for (let rawComponentName in this.components) {
            let componentInfo = this.parseComponentKey(rawComponentName);
            
            if (componentInfo.type !== "input" && componentInfo.type !== "output") {
                str += this.buildCallStatement(rawComponentName);
            }

        }

        str += `${stringUtils.indent}return ${stringUtils.strArray(this.buildFunctionReturns())};`

        return str;
    }

    compile () {
        return Function(...this.buildFunctionArguments(), this.buildFunctionBody()).bind(this.scope);
    }
}
export default {
    indent: "    ",
    newLine: "\n",

    strArray (args, brackets = true) {
        let str = `${args.join(", ")}`;

        if (brackets) {
            str = `[${str}]`;
        }

        return str;
    },
    
    parseComponentKey (name) {
        let split = name.split("_");

        let type = split[0];
        let index = parseInt(split[1] || 0);
        let valueIndex = parseInt(split[2] || 0);

        return {
            type,
            index,
            valueIndex,
            componentId: `${type}_${index}`
        }
    }
}
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
        return {
            type: split[0],
            index: parseInt(split[1] || 0),
            valueIndex: parseInt(split[2] || 0)
        }
    }
}
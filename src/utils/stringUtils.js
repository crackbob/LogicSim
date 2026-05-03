export default {
    indent: "    ",
    newLine: "\n",

    strArray (args, brackets = true) {
        let str = `${args.join(", ")}`;

        if (brackets) {
            str = `[${str}]`;
        }

        return str;
    }
}
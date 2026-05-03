export default {
    binaryArrayToDecimal(bits) {
        let result = 0;
        for (let i = 0; i < bits.length; i++) {
            result = (result << 1) | (bits[i] ? 1 : 0);
        }
        return result;
    },

    decimalToBinaryArray(num) {
        if (num === 0) return [0];

        const bits = [];
        while (num > 0) {
            bits.unshift(num & 1);
            num >>= 1;
        }
        return bits;
    },

    padArr(arr, num) {
        const out = arr.slice(-num);
        return Array(num - out.length).fill(0).concat(out);
    }
};
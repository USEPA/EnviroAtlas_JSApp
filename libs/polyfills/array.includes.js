/**
 * Array.prototype.includes Polyfill
 */

Object.defineProperty(Array.prototype, "includes", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (searchElement, fromIndex) {
        if (this == null)
            throw new TypeError("includes called on null or undefined");

        // 1. Let O be ToObject(this value).
        var O = Object(this);

        // 2. Let len be ToLength(? Get(O, "length")).
        len = O.length >>> 0; //">>>0" implements abstract "ToLength"

        // 3. If len is 0, return false.
        if (len === 0)
            return false;

        // 4. Let n be ToInteger(fromIndex).
        var n = fromIndex | 0; // "|0" implements abstract "ToInteger"

        // 5. If n ≥ 0, then
        //  a. Let k be n.
        // 6. Else n < 0,
        //  a. Let k be len + n.
        //  b. If k < 0, let k be 0.
        var k;
        if (n >= 0)
            k = n;
        else {
            k = len + n;
            if (k < 0)
                k = 0;
        }

        // 7. Repeat, while k < len
        // a. Let elementK be the result of Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1. 
        if (typeof searchElement === "number" && isNaN(searchElement)) {
            for (; k < len; k++) {
                var elementK = O[k];
                if (typeof elementK === "number" && isNaN(elementK))
                    return true;
            }
        }
        else {
            for (; k < len; k++) {
                if (O[k] === searchElement)
                    return true;
            }
        }

        // 8. Return false
        return false;
    }
});


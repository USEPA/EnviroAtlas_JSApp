/**
 * String.prototype.includes Polyfill
 */
Object.defineProperty(String.prototype, "includes", {
    enumerable: false,
    value: function (searchString /*, position */) { //function length is defined to be 1
        "use strict";

        //Let O be RequireObjectCoercible(this value).
        var O = Object(this);

        //Let S be ToString(O).
        var S = O.toString();

        //Let isRegExp be IsRegExp(searchString).
        //If isRegExp is true, throw a TypeError exception.
        if (searchString instanceof RegExp)
            throw new TypeError();

        //Let searchStr be ToString(searchString).
        var searchStr = searchString.toString();

        //Let pos be ToInteger(position). (If position is undefined, this step produces the value 0).
        var pos = arguments[1] | 0;

        //Let len be the number of elements in S.
        var len = S.length;

        //Let start be min(max(pos, 0), len).
        var start = Math.min(Math.max(pos, 0), len);

        //Let searchLen be the number of elements in searchStr.
        var searchLen = searchStr.length;

        //If there exists any integer k not smaller than start such that
        // k + searchLen is not greater than len, and for all nonnegative
        // integers j less than searchLen, the code unit at index k+j of S is
        // the same as the code unit at index j of searchStr, return true;
        //but if there is no such integer k, return false.
        if (start + searchLen > len)
            return false;

        return S.indexOf(searchStr, start) !== -1;
    }
});

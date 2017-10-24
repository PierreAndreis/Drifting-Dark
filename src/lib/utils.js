import * as lodash    from "lodash";

/**
 * Merge two objects, summing the values if it is a number, otherwise it will replace with the newer value
 * @param {object} orig
 * @param {object} addition
 */
export const merge = (orig, addition) => {

       if (typeof orig     === "undefined" || orig     === false) return addition;
  else if (typeof addition === "undefined" || addition === false) return orig;
  else return lodash.mergeWith(orig, addition, (origChild, additionChild) => {
      if (lodash.isObject(origChild)) return merge(origChild, additionChild);
      else {
        if (typeof additionChild === "number")  return origChild + additionChild;
        else                                    return additionChild;
      }
    });
}

export const sortBy = (array, desc, field, fn = function(x){return x}) => {
  return array.sort((a, b) => {

    let fieldA;
    let fieldB;

    if (lodash.isObject(a) || lodash.isObject(b)) {
    fieldA = fn(a[field]);
    fieldB = fn(b[field]);
    } 
    else {
    fieldA = fn(a);
    fieldB = fn(b);
    };

    /**/ if (fieldA < fieldB) return (desc) ? -1 :  1;
    else if (fieldA > fieldB) return (desc) ?  1 : -1;
    else /******************/ return 0;
  })
};

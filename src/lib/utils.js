import * as lodash from "lodash";
/**
 * Merge two objects, summing the values if it is a number, otherwise it will replace with the newer value
 * @param {object} orig
 * @param {object} addition
 */
export const merge = (orig, addition) => {


  /**/ if (typeof orig     === "undefined" || orig     === false) return addition;
  else if (typeof addition === "undefined" || addition === false) return orig;
  else if (lodash.isArray(addition) && lodash.isArray(orig))      return removeDuplicatesArray([...orig, ...addition]);
  else return lodash.mergeWith(orig, addition, (origChild, additionChild) => {
      if (typeof origChild === "object") {

        if (lodash.isArray(additionChild)) {
          // ... check if orig is as well, if it is, we will concat and remove duplicates
          if (lodash.isArray(origChild)) return removeDuplicatesArray([...origChild, ...additionChild]);
          // otherwise substite with the array
          else return additionChild;
        }


        return merge(origChild, additionChild);
      }
      else {
        if (typeof additionChild === "number" && typeof origChild === "number"){
          return origChild + additionChild;
        } else return additionChild;
      }
    });
  }

const removeDuplicatesArray = (arrArg) => {
  return [...new Set(arrArg)]
}

//  Own Merge x 83.39 ops/sec ±0.82% (71 runs sampled)
// Lodash Merge x 8,250,012 ops/sec ±1.00% (92 runs sampled)
// Fastest is Lodash Merge
export const merge_two = (orig, add) => {

  const origType = typeof orig;
  const addType  = typeof add;

  /**/ if (origType === "undefined" || orig === false) return add;
  else if (addType  === "undefined" || add  === false) return orig;
  else {
    switch (addType){
      case "object":
      
      if ((!!add) && (add.constructor === Object)) {
        let res = {};

        for (let attrname in orig) { res[attrname] = merge(orig[attrname], add[attrname]) }
        for (let attrname in add)  { res[attrname] = merge(orig[attrname], add[attrname]) }

        return res;
      }

       if (Array.isArray(add)) {
        // ... check if orig is as well, if it is, we will concat and remove duplicates
        if (Array.isArray(orig)) return removeDuplicatesArray([...orig, ...add]);
        // otherwise substite with the array
        else return add;
      }

      // If add is a Date, return timestamp of the date
      if (add instanceof Date) return add;

      // null returns null, duh
      if (add === null) return null;

      break;

      case "number":
        if (origType === "number") return orig + add;
        else return add;
      break;

      case "string":
      case "boolean":
      default:
        return add;
      break;
    }
  };

}

// // new Merge
// function isObject(obj) {
//   return obj ? obj.constructor === Object : false;
// }

// const kEntries = Symbol('Kyra-Merge');

// expor (obj1, obj2) {
//   if (!isObject(obj1)) return obj2;
//   if (!obj2[kEntries])
//       obj2[kEntries] = Object.entries(obj2);

//   for (const [key, value] of obj2[kEntries]) {
//       if (typeof value === 'number') obj1[key] += value;
//       else if (isObject(value)) obj1[key] = merge(obj1[key], value);
//       else if (Array.isArray(value)) obj1[key] = Array.isArray(obj1[key]) ? [...new Set(obj1[key].concat(value))] : value;
//       else obj1[key] = value;
//   }

//   return obj1;
// }

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
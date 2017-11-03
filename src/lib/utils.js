import * as lodash    from "lodash";
import Config from "../config";
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

// WIP below
const PATCHES = [
  {
    "version": "2.2",
    "startAt": "2017-02-28T08:15:00.000Z",
    "endAt": "2017-03-28T07:15:00.000Z"
  },
  {
    "version": "2.3",
    "startAt": "2017-03-28T07:15:00.000Z",
    "endAt": "2017-04-24T07:15:00.000Z"
  },
  {
    "version": "2.4",
    "startAt": "2017-04-24T07:15:00.000Z",
    "endAt": "2017-05-30T07:15:00.000Z"
  },
  {
    "version": "2.5",
    "startAt": "2017-05-30T07:15:00.000Z",
    "endAt": "2017-06-20T07:15:00.000Z"
  },
  {
    "version": "2.6",
    "startAt": "2017-06-20T07:15:00.000Z",
    "endAt": "2017-08-08T07:15:00.000Z"
  },
  {
    "version": "2.7",
    "startAt": "2017-08-08T07:15:00.000Z",
    "endAt": "2017-09-05T07:15:00.000Z"
  },
  {
    "version": "2.8",
    "startAt": "2017-09-05T07:15:00.000Z",
    "endAt": "2017-10-11T07:15:00.000Z"
  },
  {
    "version": "2.9",
    "startAt": "2017-10-11T07:15:00.000Z"
  }
];

export const getPatchRange = (patches) => {

  patches.sort();

  let options = [];
  
  //       const patches = Object.keys(Config.VAINGLORY.PATCH_DATES);
  //       patch.forEach((r) => {
  //         options["createdAt-start"] = new Date(Date.parse(Config.VAINGLORY.PATCH_DATES[r])).toISOString();
  //         const index = patches.indexOf(r) + 1;
  //         console.log(r)
  //         options["createdAt-end"] = new Date(Date.parse(Config.VAINGLORY.PATCH_DATES[patches[index]])).toISOString();
  //         options = generateOpt(options)
  //         if (page) options.page = { offset: RESULT_PER_PAGE * page };
  //         patchData.push(this.queryMatches(region, options))
  //       })
  //       return await Promise.all(patchData)
  const patchesData = PATCHES.filter(p => patches.includes(p.version));

  patchesData.forEach(patch => {
    options["createdAt-start"] = patch.startAt;
    options["createdAt-end"] = patch.endAt;
  })

  return patchesData;



}

// console.log(getPatchRange(["2.2", "2.7"]));

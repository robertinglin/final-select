import isEqual from './value_equals';

let diffSec = function(a, b) {
  let aLong = a.lenth > b.length;
  let long = (aLong ? a : b).concat([]);
  let short = (aLong ? b : a).concat([]);
  let inter = [], diffArr = [];
  long.forEach((key) => {
    let shortIndex = short.indexOf(key);
    if(~shortIndex) {
      inter.push(key);
    } else {
      diffArr.push(key);
    }
    if(~shortIndex) {
      short.splice(shortIndex, 1);
    }
  });
  return {diff: diffArr.concat(short), inter };

}
console.log(diffSec(['1', 'a','b','c'],[1, 'b','c']));

function _processKey(key, keyValue, element, vkey, elementObjects, elements) {
  if (key === 'children') {
    element.innerHTML = '';
    keyValue.forEach((child) => {
      if (child) {
        element.appendChild(child.render && child.render || _renderElement(child, vkey, elementObjects, elements));
      }
    });
    return;
  }
  if (key === 'key') {
    keyValue = '$$' + vkey.join('.');
  }
  let listener = false;
  if (key.substring(0,2) === 'on') {
    listener = true;
  }
  if (keyValue === '' || keyValue === null || keyValue === undefined) {
    if (listener) {
      element[key.toLowerCase()] = '';
    } else {
      element.removeAttribute(key);
    }
  } else {
    if (listener) {
      element[key.toLowerCase()] = keyValue;
    } else {
      element.setAttribute(key, keyValue);
    }
  }
}

function _typeEqual(a, b) {
  var aType = typeof a,
    bType = typeof b;

  if (aType !== bType) {
    return false;
  }
  switch (aType) {
    case 'function': {
      return a.toString() === b.toString();
    }
    default: {
      return a === b;
    }
  }
  return false;
}

export const _renderElement = function(elementObject, parentKey = [], elementObjects, elements) {
  if(!elementObject) {
    return null;
  }
  if (typeof elementObject !== 'object') {
    let element = document.createTextNode(elementObject + '');
    return element;
  }
  let prevElement,
    prevElementObject,
    newElement,
    newKeys,
    prevKeys,
    differences,
    intersects,
    vkey,
    vkeyString;
  if (!elementObject.key) {
    throw new Error('No key defined');
  }
  vkey = [...parentKey, elementObject.key];
  vkeyString = '$$' + vkey.join('.');
  prevElement = elements[vkeyString],
  prevElementObject = prevElement && elementObjects[vkeyString] || {},
  newKeys = Object.keys(elementObject);
  if (prevElementObject.type === elementObject.type) {
    newElement = prevElement;
    prevKeys = Object.keys(prevElementObject);
    let di = diffSec(prevKeys, newKeys);
    differences = di.diff;//difference(prevKeys, newKeys);
    intersects = di.inter;//intersection(prevKeys, newKeys);
    intersects.forEach((key) => {
      if (!_typeEqual(elementObject[key], prevElementObject[key])) {
        _processKey(key, elementObject[key], newElement, vkey, elementObjects, elements);
      }
    });
    differences.forEach((key) => {
      _processKey(key, elementObject[key], newElement, vkey, elementObjects, elements);
    });
  } else {
    newElement = document.createElement(elementObject.type);
    newKeys.forEach((key) => {
      _processKey(key, elementObject[key], newElement, vkey, elementObjects, elements);
    });
  }
  elements[vkeyString] = newElement;
  elementObjects[vkeyString] = elementObject;
  return newElement;
}

class _renderable {
  constructor() {
    this.elements = [];
    this.elementObjects = [];
    this.state = null;
    this.element = null;
  }

  setState(updatedState, breakStack) {
    let newState = Object.assign({}, this.state, updatedState);

    if (!isEqual(this.state, newState)) {
      this.state = newState;
      this.render();
    }
  }

  render(elementObject) {
    this.element = _renderElement(elementObject, [], this.elementObjects, this.elements);
    this.postRender();
    return this.element;
  }

  postRender() {}
}


export const Renderable = _renderable;

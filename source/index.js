import {Renderable} from './render.js';

const keyCodes = {
  ARROW_DOWN: 40,
  ARROW_UP: 38,
  SPACE: 32,
  ESCAPE: 27,
  ENTER: 13,
  TAB: 9,
  SHIFT: 16
};

export default class FinalSelect extends Renderable {
  constructor({options, element, selector, label}) {
    super();
    this.element = null;
    this.state = null;
    if (options) {
    } else if (element) {
      this.populateOptions(element);
    }
    this.kpTimeoutLength = 1000;
    this.maxZindex = 999999;
    this.setState({
      options,
      hOptions: [],
      label,
      isOpen: false,
      value: options[0].value,
      valueLabel: options[0].text,
      keyPresses: ''
    }, true);

  }

  renderLabelText() {
    return [];
    return [{
      type: 'span',
      key: 'labelText',
      children: [
        this.state.label,
        this.state.isOpen? ' ' : null
      ]
    }];
  }

  renderSelectedValue() {
    return [
      this.state.isOpen ? {
        type: 'span',
        key: 'selectedValueText',
        children: [
          this.state.valueLabel
        ]
      } : null
    ]
  }

  renderBackgroundCurtain() {
    return [
      this.state.isOpen ? {
        type: 'div',
        key: 'bg-curtain',
        style: `
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index:${this.maxZindex-1};
        `
      } : null
    ]
  }

  renderIndividualOption(option, keyPrefix) {
    let liClass = this.state.value === option.value ? 'is-selected' : '';
    if (this.state.focused === option.value) {
      liClass += ' has-focus';
    }
    return {
      'type': this.state.isOpen ? 'li' : 'option',
      selected: this.state.value === option.value ? 'selected' : null,
      class: liClass,
      'children': [
        this.state.isOpen ? {
          type: 'a',
          key: 'a' + keyPrefix,
          tabIndex: 0,
          children: [
            option.text
          ],
          onClick: (e) => {
            this.closeSelect(option);
            e.preventDefault();
            e.stopPropagation();
          },
          onKeyDown: (e) => {
            switch(e.keyCode) {
              case keyCodes.SPACE: {
                if (this.state.keyPresses.length) {
                  e.preventDefault();
                  e.stopPropagation();
                  break;
                }
              }
              case keyCodes.ENTER: {
                this.closeSelect(option);
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case keyCodes.ARROW_UP: {
                this.changeFocus(option.value, -1);
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case keyCodes.ARROW_DOWN: {
                this.changeFocus(option.value, 1);
                e.preventDefault();
                e.stopPropagation();
                break;
              }
              case keyCodes.ARROW_RIGHT:
              case keyCodes.ARROW_LEFT:
              case keyCodes.SHIFT:
              case keyCodes.TAB:
              break;
              default: {
                this.addKeyPress(e.keyCode);
                this.extendKeyPressesTimeout();
              }
            }
          }
        } : option.text
      ],
      key: option.text,
      value: option.value
    };
  }

  renderOptions() {
    return this.state.options.map((option, index) => {
      return this.renderIndividualOption(option, index);
    });
  }

  renderSelect() {
    return [{
      type: this.state.isOpen ? 'ul' : 'select',
      children: this.renderOptions(),
      key: 'select',
      style: this.state.isOpen ? `
        z-index: ${this.maxZindex};
        position: absolute;
        top: 100%;
      `: '',
      onChange: (e) => {
        if (!this.state.isOpen) {
          setTimeout(() => {this.setState({
            value: e.target.value,
            valueLabel: this.getOption(e.target.value).option.text,
            focused: e.target.value
          });}, 100);
        }
      },
      onKeyDown: (e) => {
        if (!this.state.isOpen) {
          switch(e.keyCode) {
            case keyCodes.ENTER:
            case keyCodes.SPACE:
            case keyCodes.ARROW_DOWN:
            case keyCodes.ARROW_UP:
              this.openSelect();
              e.preventDefault();
              e.stopPropagation();
            break;

          }
        } else {
          switch(e.keyCode) {
            case keyCodes.ESCAPE:
              this.cancelSelect();
            break;
          }
        }
      }
    }];
  }

  render() {
    return super.render({
      type: 'label',
      style: 'position: relative',
      children: [
        ...this.renderBackgroundCurtain(),
        ...this.renderLabelText(),
        ...this.renderSelectedValue(),
        ...this.renderSelect()
      ],
      onMouseDown: (e) => {
        if (!this.state.isOpen) {
          this.openSelect();
        } else {
          // this.cancelSelect();
        }
      },
      onClick: (e) => {
        if (this.state.isOpen) {
          this.cancelSelect();
        }
      },
      key: 'hello world'
    });
  }

  postRender() {
    if (this.state.isOpen) {
      let focusElement = this.element.querySelector('.has-focus a');
      if (focusElement) {
        setTimeout(() => focusElement.focus());
      } else {
        (this.element.querySelector('select') || {focus:()=>{}}).focus();
      }
    } else {
      this.element.querySelector('select').value = this.state.value;
      this.element.querySelector('select').focus();
    }

  }

  getOption(value) {
    let returnOption = {
      option: {},
      index: -1
    };
    this.state.options.every((option, index) => {
      if (option.value === value) {
        returnOption.option = option;
        returnOption.index = index;
        return false;
      }
      return true;
    });
    return returnOption;
  }

  addKeyPress(keyCode) {
    let searchPhrase = (this.state.keyPresses || '') + String.fromCharCode(keyCode);
    let result = this.state.options.filter((option) => {
      if (~option.text.toUpperCase().indexOf(searchPhrase.trim())) {
        return true;
      }
      return false;
    })[0];
    let state = {
      keyPresses: searchPhrase
    };
    if (result) {
      state.focused = result.value;
    }
    this.setState(state);
  }

  changeFocus(value, indexOffset) {
    let currentIndex = this.getOption(value).index;
    currentIndex = Math.min(Math.max(0, currentIndex + indexOffset), this.state.options.length - 1);
    this.setState({
      focused: this.state.options[currentIndex].value
    });
  }

  cancelSelect() {
    this.clearKeyPressTimeout();
    this.setState({
      isOpen: false,
      keyPresses: ''
    });
  }

  closeSelect(option) {
    this.clearKeyPressTimeout();
    this.setState({
      isOpen: false,
      value: option.value,
      valueLabel: option.text,
      keyPresses: ''
    });
  }

  openSelect() {
    this.setState({
      isOpen: true,
      focused: this.state.value
    });
  }

  extendKeyPressesTimeout() {
    this.clearKeyPressTimeout();
    this.kpTimeout = setTimeout(() => {
      this.setState({
        keyPresses: ''
      });
    }, this.kpTimeoutLength);
  }

  clearKeyPressTimeout() {
    if (this.kpTimeout) {
      clearTimeout(this.kpTimeout);
    }
  }
}

import { validateOptions, validateSubject, validateText } from '../../validators';
import { DEFAULT_INPUT_TYPING_OPTIONS } from '../../constants';
import { USKeyboard } from '../../helpers/UsKeyboardLayout';

export default (subject, text, options = {}) => {
  // console.log('subject', subject);
  // console.log('text', text);
  // console.log('options', options);
  Cypress._.defaults(options, DEFAULT_INPUT_TYPING_OPTIONS);
  validateSubject(subject);
  validateText(text);
  validateOptions(options, DEFAULT_INPUT_TYPING_OPTIONS);

  const { delay } = options;

  const charsBetweenCurlyBracesRe = /({.+?})/;
  /**
   * @example '{foo}' => 'foo'
   */
  const parseCharsBetweenCurlyBraces = chars => {
    return /{(.+?)}/.exec(chars)[1];
  };

  const keyboardMappings = {
    // selectAll: {
    //   key: 'selectAll',
    //   simulatedDefault: el => {
    //     $selection.selectAll(el)
    //   },
    //   simulatedDefaultOnly: true,
    // },
    // moveToStart: {
    //   key: 'moveToStart',
    //   simulatedDefault: el => {
    //     $selection.moveSelectionToStart(el)
    //   },
    //   simulatedDefaultOnly: true,
    // },
    // moveToEnd: {
    //   key: 'moveToEnd',
    //   simulatedDefault: el => {
    //     $selection.moveSelectionToEnd(el)
    //   },
    //   simulatedDefaultOnly: true,
    // },
    del: USKeyboard.Delete,
    backspace: USKeyboard.Backspace,
    esc: USKeyboard.Escape,
    enter: USKeyboard.Enter,
    rightArrow: USKeyboard.ArrowRight,
    leftArrow: USKeyboard.ArrowLeft,
    upArrow: USKeyboard.ArrowUp,
    downArrow: USKeyboard.ArrowDown,
    home: USKeyboard.Home,
    end: USKeyboard.End,
    insert: USKeyboard.Insert,
    pageUp: USKeyboard.PageUp,
    pageDown: USKeyboard.PageDown,
    '{': USKeyboard.BracketLeft,
  };

  return Cypress.cy.document({ log: false }).then(async document => {
    Cypress.log({
      name: 'shadowType',
      message: text,
      consoleProps: () => ({
        text,
      }),
    });

    // separate out special character sequences
    const parts = text.split(charsBetweenCurlyBracesRe).filter(k => !!k);
    const queue = [];

    const createEvent = (eventOpts, char) => {
      // console.log('createEvent', eventOpts, char);
      return new Promise(resolve => {
        const keyDownEvent = new KeyboardEvent('keydown', eventOpts);
        document.dispatchEvent(keyDownEvent);
        const keyPressEvent = new KeyboardEvent('keydown', eventOpts);
        document.dispatchEvent(keyPressEvent);
        const keyUpEvent = new KeyboardEvent('keyup', eventOpts);
        document.dispatchEvent(keyUpEvent);
        /* eslint-disable-next-line no-param-reassign */
        subject[0].value += char;
        const changeEvent = new Event('change', {
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        subject[0].dispatchEvent(changeEvent);
        setTimeout(resolve, delay);
      });
    };

    parts.forEach(part => {
      let key;
      if (part.indexOf('{') === 0) {
        // special character
        key = parseCharsBetweenCurlyBraces(part);
        queue.push(createEvent(keyboardMappings[key]));
        // {
        //   key: key,
        //   code: keyboardMappings[key].keyCode
        // }));
      } else {
        part.split('').forEach(char => {
          queue.push(
            createEvent(
              {
                key: char,
                code: char.charCodeAt(0),
              },
              char,
            ),
          );
        });
      }
    });

    return Cypress.Promise.all(queue).then(() => subject);
  });
};

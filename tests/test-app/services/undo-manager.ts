import type { AnyFn } from '@ember/-internals/utility-types';
import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type { Store } from '#src/index.ts';

type Command = Record<'undo' | 'redo', AnyFn>;

function removeFromTo(array: Array<unknown>, from: number, to?: number) {
  array.splice(
    from,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    !to ||
      // @ts-expect-error TODO: maybe type this one day
      1 +
        to -
        from +
        // @ts-expect-error TODO: maybe type this one day
        (!((to < 0) ^ (from >= 0)) && (to < 0 || -1) * array.length),
  );
  return array.length;
}

export default class UndoManager extends Service {
  @service declare store: Store;

  commands: Array<Command> = [];
  index = -1;
  isExecuting = false;
  undoListener: (e: KeyboardEvent) => Promise<void>;
  @tracked limit = 0;
  @tracked callback?: AnyFn;

  constructor() {
    // eslint-disable-next-line prefer-rest-params
    super(...arguments);

    this.undoListener = async (e: KeyboardEvent) => {
      {
        const key = e.which || e.keyCode;
        // testing for CMD or CTRL
        const ctrl =
          e.ctrlKey || e.metaKey ? e.ctrlKey || e.metaKey : key === 17;
        const isUndo = ctrl && key === 90;
        const isRedo = isUndo && e.shiftKey;

        await this._doUndoRedo(isRedo, isUndo);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    document.addEventListener('keydown', this.undoListener, true);
  }

  willDestroy() {
    super.willDestroy();

    if (this.undoListener) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      document.removeEventListener('keydown', this.undoListener, true);
    }
  }

  /**
   * Abstracted out the undo/redo execution so we can use it either in Electron or the browser
   * @param isRedo true if operation is 'redo'
   * @param isUndo true if operation is 'undo'
   * @private
   */
  async _doUndoRedo(isRedo: boolean, isUndo: boolean) {
    if (isRedo) {
      if (!this.isExecuting && this.hasRedo()) {
        await this.redo();
      }
    } else if (isUndo) {
      if (!this.isExecuting && this.hasUndo()) {
        await this.undo();
      }
    }
  }

  async execute(command: Command, action: 'undo' | 'redo') {
    if (!command || typeof command[action] !== 'function') {
      return this;
    }
    this.isExecuting = true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const executed = await command[action]();

    this.isExecuting = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return executed;
  }

  /**
   * Add a command to the queue.
   */
  async add(command: Command) {
    if (this.isExecuting) {
      return this;
    }
    // if we are here after having called undo,
    // invalidate items higher on the stack
    this.commands.splice(this.index + 1, this.commands.length - this.index);

    this.commands.push(command);

    // if limit is set, remove items from the start
    if (this.limit && this.commands.length > this.limit) {
      removeFromTo(this.commands, 0, -(this.limit + 1));
    }

    // set the current index to the end
    this.index = this.commands.length - 1;
    if (this.callback) {
      await this.callback();
    }
    return this;
  }

  /**
   * Pass a function to be called on undo and redo actions.
   */
  setCallback(callbackFunc: AnyFn) {
    this.callback = callbackFunc;
  }

  /**
   * Perform undo: call the undo function at the current index and decrease the index by 1.
   */
  async undo() {
    const command = this.commands[this.index];
    if (!command) {
      return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const executed = await this.execute(command, 'undo');
    this.index -= 1;
    if (this.callback) {
      this.callback();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return executed;
  }

  /**
   * Perform redo: call the redo function at the next index and increase the index by 1.
   */
  async redo() {
    const command = this.commands[this.index + 1];
    if (!command) {
      return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const executed = await this.execute(command, 'redo');
    this.index += 1;
    if (this.callback) {
      this.callback();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return executed;
  }

  /**
   * Clears the memory, losing all stored states. Reset the index.
   */
  clear() {
    const prev_size = this.commands.length;

    this.commands = [];
    this.index = -1;

    if (this.callback && prev_size > 0) {
      this.callback();
    }
  }

  hasUndo() {
    return this.index !== -1;
  }

  hasRedo() {
    return this.index < this.commands.length - 1;
  }

  getCommands() {
    return this.commands;
  }

  getIndex() {
    return this.index;
  }

  setLimit(l: number) {
    this.limit = l;
  }

  setupUndoRedo() {
    const transformId = this.store.transformLog.head;
    const redoTransform = this.store.getTransform(transformId).operations;
    const undoTransform = this.store.getInverseOperations(transformId);

    const undo = async () => {
      await this.store.update(undoTransform);
    };

    const redo = async () => {
      await this.store.update(redoTransform);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.add({ undo, redo });
  }
}

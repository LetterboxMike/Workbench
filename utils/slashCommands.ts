import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { VueRenderer } from '@tiptap/vue-3';
import type { Editor, Range } from '@tiptap/core';
import type { SuggestionOptions } from '@tiptap/suggestion';
import SlashCommandMenu from '~/components/SlashCommandMenu.vue';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: { command: (args: any) => void } }) => {
          props.command({ editor, range });
        }
      } as Partial<SuggestionOptions>
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
});

export function getSuggestionOptions(
  onImageClick: () => void,
  onLinkClick: () => void,
  onFileClick: () => void,
  onTableClick: () => void
): Partial<SuggestionOptions> {
  let component: VueRenderer;
  let popup: TippyInstance[] = [];

  return {
    char: '/',
    startOfLine: false,

    items: ({ query }: { query: string }): CommandItem[] => {
      const commands: CommandItem[] = [
        {
          title: 'Heading 1',
          description: 'Large section heading',
          icon: 'H1',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
          }
        },
        {
          title: 'Heading 2',
          description: 'Medium section heading',
          icon: 'H2',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
          }
        },
        {
          title: 'Heading 3',
          description: 'Small section heading',
          icon: 'H3',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
          }
        },
        {
          title: 'Bold',
          description: 'Make text bold',
          icon: '𝐁',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBold().run();
          }
        },
        {
          title: 'Italic',
          description: 'Make text italic',
          icon: '𝐼',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleItalic().run();
          }
        },
        {
          title: 'Bullet List',
          description: 'Create a simple bullet list',
          icon: '•',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
          }
        },
        {
          title: 'Task List',
          description: 'Track tasks with a checklist',
          icon: '☑',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
          }
        },
        {
          title: 'Code Block',
          description: 'Insert a code block',
          icon: '</>',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
          }
        },
        {
          title: 'Link',
          description: 'Insert a link',
          icon: '🔗',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            onLinkClick();
          }
        },
        {
          title: 'Image',
          description: 'Insert an image',
          icon: '🖼️',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            onImageClick();
          }
        },
        {
          title: 'Table',
          description: 'Insert a spreadsheet table',
          icon: '📊',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            onTableClick();
          }
        },
        {
          title: 'File',
          description: 'Attach a file',
          icon: '📎',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            onFileClick();
          }
        },
        {
          title: 'Quote',
          description: 'Insert a blockquote',
          icon: '"',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
          }
        },
        {
          title: 'Divider',
          description: 'Insert a horizontal divider',
          icon: '―',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run();
          }
        }
      ];

      return commands.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    },

    render: () => {
      let selectedIndex = 0;
      let propsRef: any;

      return {
        onStart: (props: any) => {
          propsRef = props;
          selectedIndex = 0;

          component = new VueRenderer(SlashCommandMenu, {
            props: {
              items: props.items,
              selectedIndex: 0
            },
            editor: props.editor
          });

          const element = component.element;
          if (!element) {
            return;
          }

          // Handle select event from component (mouse click)
          element.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            const commandItem = target.closest('.command-item');
            if (commandItem) {
              const items = element.querySelectorAll('.command-item');
              const index = Array.from(items).indexOf(commandItem);
              if (index !== -1 && propsRef.items[index]) {
                propsRef.command(propsRef.items[index]);
              }
            }
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start'
          });
        },

        onUpdate(props: any) {
          propsRef = props;

          component.updateProps({
            items: props.items,
            selectedIndex
          });

          if (!props.clientRect) {
            return;
          }

          if (popup[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect
            });
          }
        },

        onKeyDown(props: any) {
          if (!props.items.length) {
            return false;
          }

          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex + props.items.length - 1) % props.items.length;
            component.updateProps({ selectedIndex });
            return true;
          }

          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % props.items.length;
            component.updateProps({ selectedIndex });
            return true;
          }

          if (props.event.key === 'Enter') {
            const item = props.items[selectedIndex];
            if (item) {
              props.command(item);
            }
            return true;
          }

          return false;
        },

        onExit() {
          popup[0]?.destroy();
          component.destroy();
          selectedIndex = 0;
        }
      };
    }
  };
}

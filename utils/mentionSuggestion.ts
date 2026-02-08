import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { VueRenderer } from '@tiptap/vue-3';
import type { Editor, Range } from '@tiptap/core';
import type { SuggestionOptions } from '@tiptap/suggestion';
import MentionSuggestionMenu from '~/components/MentionSuggestionMenu.vue';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface MentionItem {
  user: User;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const MentionSuggestion = Extension.create({
  name: 'mentionSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '@',
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

export function getMentionSuggestionOptions(
  projectMembers: Ref<User[]>,
  onMentionSelected?: (user: User) => void
): Partial<SuggestionOptions> {
  let component: VueRenderer;
  let popup: TippyInstance[] = [];

  return {
    char: '@',
    startOfLine: false,

    items: ({ query }: { query: string }): MentionItem[] => {
      const filtered = projectMembers.value.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, 10).map((user) => ({
        user,
        command: ({ editor, range }) => {
          // Insert mention in markdown format: @[Name](user-id)
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(`@[${user.name}](${user.id}) `)
            .run();

          if (onMentionSelected) {
            onMentionSelected(user);
          }
        }
      }));
    },

    render: () => {
      let selectedIndex = 0;
      let propsRef: any;

      return {
        onStart: (props: any) => {
          propsRef = props;
          selectedIndex = 0;

          component = new VueRenderer(MentionSuggestionMenu, {
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
            const mentionItem = target.closest('.mention-item');
            if (mentionItem) {
              const items = element.querySelectorAll('.mention-item');
              const index = Array.from(items).indexOf(mentionItem);
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

          if (props.event.key === 'Escape') {
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

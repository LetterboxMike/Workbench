import { Mark } from '@tiptap/core';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentMark: {
      /**
       * Set a comment mark
       */
      setCommentMark: (commentId: string) => ReturnType;
      /**
       * Toggle a comment mark
       */
      toggleCommentMark: (commentId: string) => ReturnType;
      /**
       * Unset a comment mark
       */
      unsetCommentMark: () => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'commentMark',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }

          return {
            'data-comment-id': attributes.commentId
          };
        }
      },
      commentCount: {
        default: 1,
        parseHTML: (element) => {
          const count = element.getAttribute('data-comment-count');
          return count ? parseInt(count, 10) : 1;
        },
        renderHTML: (attributes) => {
          return {
            'data-comment-count': attributes.commentCount || 1
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        class: 'comment-mark',
        title: `${HTMLAttributes['data-comment-count'] || 1} comment(s)`
      },
      [
        'span',
        {
          class: 'comment-icon',
          contenteditable: 'false'
        },
        '💬'
      ],
      0
    ];
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },
      toggleCommentMark:
        (commentId: string) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, { commentId });
        },
      unsetCommentMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        }
    };
  }
});

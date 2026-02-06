import type { OrgMember } from '~/types/domain';

export const useDeleteMemberModal = () => {
  const isOpen = useState<boolean>('delete-member-modal-open', () => false);
  const member = useState<(OrgMember & { user: any }) | null>('delete-member-target', () => null);

  const open = (targetMember: OrgMember & { user: any }) => {
    member.value = targetMember;
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
    member.value = null;
  };

  return {
    isOpen,
    member,
    open,
    close
  };
};

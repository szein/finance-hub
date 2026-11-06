import { useState, type Dispatch, type SetStateAction } from 'react';
import { addToast } from '@heroui/toast';
import { useDisclosure } from '@heroui/react';
import type { Member } from '../types';
import { UserState } from '../types';
import type { MemberFormState } from '../components/MemberModal';
import { apiFetch } from '../lib/apiClient';

export type MemberConfirmationAction =
  | { type: 'deleteMember'; memberId: number; name: string }
  | { type: 'setMemberStatus'; memberId: number; memberStatus: UserState };

interface UseMembersOptions {
  isAuthenticated: boolean;
  isAdmin: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  showError: (message: string) => void;
  onUnauthorized: () => void;
  onRequestConfirmation: (message: string, action: MemberConfirmationAction) => void;
}

const createEmptyMemberForm = (): MemberFormState => ({
  name: '',
  username: '',
  password: '',
  role: 'Member',
  status: UserState.ACTIVE
});

async function getErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useMembers({
  isAuthenticated,
  isAdmin,
  setIsLoading,
  showError,
  onUnauthorized,
  onRequestConfirmation
}: UseMembersOptions) {
  const [members, setMembers] = useState<Member[]>([]);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberFormState>(createEmptyMemberForm);
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onOpenChange: onModalOpenChange,
    onClose: closeModal
  } = useDisclosure();

  const fetchMembers = async (showLoading = true) => {
    if (!isAuthenticated) return;
    if (showLoading) setIsLoading(true);

    try {
      const res = await apiFetch('/api/finance/members');
      if (!res.ok) {
        if (res.status === 401) {
          setMembers([]);
          onUnauthorized();
          return;
        }

        showError(await getErrorMessage(res, 'Failed to fetch members'));
        return;
      }

      const membersData: Member[] = await res.json();
      setMembers(membersData);
    } catch (err) {
      console.error(err);
      showError('Network error while fetching members');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const performSetMemberStatus = async (id: number, status: UserState) => {
    setActionInProgressId(id);
    try {
      const res = await apiFetch(`/api/finance/members/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        showError(await getErrorMessage(res, 'Failed to update member status.'));
        return;
      }
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while updating member status');
    } finally {
      setActionInProgressId(null);
    }
  };

  const performDeleteMember = async (id: number, name: string) => {
    setActionInProgressId(id);
    try {
      const res = await apiFetch(`/api/finance/members/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showError(await getErrorMessage(res, 'Failed to delete member.'));
        return;
      }

      addToast({
        title: 'Member deleted',
        description: `The member "${name}" has been deleted.`,
        color: 'success'
      });
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while deleting member');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSetMemberStatus = (id: number, status: UserState) => {
    if (!isAdmin) return;
    const actionLabel = status === UserState.ACTIVE ? 'activate' : 'deactivate';
    onRequestConfirmation(
      `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} this member?`,
      { type: 'setMemberStatus', memberId: id, memberStatus: status }
    );
  };

  const handleDeleteMember = (id: number, name: string) => {
    if (!isAdmin) return;
    onRequestConfirmation(
      'Delete this member permanently? This cannot be undone.',
      { type: 'deleteMember', memberId: id, name }
    );
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm(createEmptyMemberForm());
    openModal();
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      username: member.username || '',
      password: '',
      role: member.role.trim().toLowerCase() === 'admin' ? 'Admin' : 'Member',
      status: member.status
    });
    openModal();
  };

  const handleSaveMember = async () => {
    if (!isAdmin) return;

    if (!memberForm.name.trim()) {
      showError('Member name is required.');
      return;
    }

    if (!editingMember && (!memberForm.username.trim() || !memberForm.password.trim())) {
      showError('Username and password are required for new members.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMember) {
        const res = await apiFetch('/api/finance/member/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingMember.id,
            name: memberForm.name.trim(),
            role: memberForm.role,
            status: memberForm.status
          })
        });

        if (!res.ok) {
          showError(await getErrorMessage(res, 'Failed to update member.'));
          return;
        }
      } else {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: memberForm.name.trim(),
            username: memberForm.username.trim(),
            password: memberForm.password,
            role: memberForm.role
          })
        }, false);

        if (!res.ok) {
          showError(await getErrorMessage(res, 'Failed to create member.'));
          return;
        }
      }

      closeModal();
      setEditingMember(null);
      setMemberForm(createEmptyMemberForm());
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while saving member');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMembers = () => setMembers([]);

  return {
    members,
    fetchMembers,
    actionInProgressId,
    isModalOpen,
    onModalOpenChange,
    editingMember,
    memberForm,
    setMemberForm,
    isSaving,
    handleSaveMember,
    openAddMember,
    openEditMember,
    handleSetMemberStatus,
    handleDeleteMember,
    performSetMemberStatus,
    performDeleteMember,
    clearMembers
  };
}

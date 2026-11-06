import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button, Input, Select, SelectItem } from "@heroui/react";
import { Member, UserState } from '../types';

type MemberRole = 'Admin' | 'Member';

export interface MemberFormState {
  name: string;
  username: string;
  password: string;
  role: MemberRole;
  status: UserState;
}

interface MemberModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingMember: Member | null;
  memberForm: MemberFormState;
  setMemberForm: Dispatch<SetStateAction<MemberFormState>>;
  handleSaveMember: () => void;
  isSaving: boolean;
}

export function MemberModal({
  isOpen,
  onOpenChange,
  editingMember,
  memberForm,
  setMemberForm,
  handleSaveMember,
  isSaving
}: MemberModalProps) {
  const isEditMode = Boolean(editingMember);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      size="full"
      placement="top-center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isEditMode ? 'Edit Member' : 'Add Member'}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  placeholder="Enter member name"
                  variant="bordered"
                  value={memberForm.name}
                  onValueChange={value => setMemberForm({ ...memberForm, name: value })}
                  isDisabled={isSaving}
                />
                <Input
                  label="Username"
                  placeholder="Enter username"
                  variant="bordered"
                  value={memberForm.username}
                  onValueChange={value => setMemberForm({ ...memberForm, username: value })}
                  isDisabled={isSaving || isEditMode}
                  description={isEditMode ? 'Username is currently created once and managed later via API support.' : undefined}
                />
                <Select
                  label="Role"
                  variant="bordered"
                  selectedKeys={[memberForm.role]}
                  onSelectionChange={keys =>
                    setMemberForm({ ...memberForm, role: Array.from(keys)[0] as MemberRole })
                  }
                  isDisabled={isSaving}
                >
                  <SelectItem key="Member" textValue="Member">Member</SelectItem>
                  <SelectItem key="Admin" textValue="Admin">Admin</SelectItem>
                </Select>
                <Select
                  label="Status"
                  variant="bordered"
                  selectedKeys={[memberForm.status]}
                  onSelectionChange={keys =>
                    setMemberForm({ ...memberForm, status: Array.from(keys)[0] as UserState })
                  }
                  isDisabled={isSaving}
                  description={isEditMode ? undefined : 'New members start as active.'}
                >
                  <SelectItem key={UserState.ACTIVE} textValue="Active">Active</SelectItem>
                  <SelectItem key={UserState.DEACTIVATED} textValue="Deactivated">Deactivated</SelectItem>
                </Select>
                {!isEditMode && (
                  <div className="md:col-span-2">
                    <Input
                      label="Password"
                      placeholder="Set an initial password"
                      type="password"
                      variant="bordered"
                      value={memberForm.password}
                      onValueChange={value => setMemberForm({ ...memberForm, password: value })}
                      isDisabled={isSaving}
                    />
                    <p className="mt-2 text-xs text-default-500">
                      This is used for the initial account creation flow and can be connected to the registration API.
                    </p>
                  </div>
                )}
                {isEditMode && (
                  <div className="md:col-span-2 rounded-xl border border-divider bg-default-50 px-3 py-2 text-xs text-default-600">
                    Editing currently updates name, role, and status. Username/password can be connected when the backend exposes those fields.
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSaving}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSaveMember} isLoading={isSaving} className="font-semibold">
                {isEditMode ? 'Save Member' : 'Create Member'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

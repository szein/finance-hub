import React, { useMemo, useState } from 'react';
import { PencilLine, Plus, Trash2, Users, Filter, X } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, User } from "@heroui/react";
import { Member, UserState } from '../types';

interface MembersProps {
  members: Member[];
  canManageMembers: boolean;
  currentUserId?: number;
  actionInProgressId: number | null;
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  handleSetMemberStatus: (id: number, status: UserState) => void;
  handleDeleteMember: (id: number, name: string) => void;
}

export function Members({
  members,
  canManageMembers,
  currentUserId,
  actionInProgressId,
  onAddMember,
  onEditMember,
  handleSetMemberStatus,
  handleDeleteMember
}: MembersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserState>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return members.filter(member => {
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        member.name.toLowerCase().includes(normalizedSearch) ||
        (member.username || '').toLowerCase().includes(normalizedSearch) ||
        member.role.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [members, searchTerm, statusFilter]);

  const activeMembers = members.filter(member => member.status === UserState.ACTIVE).length;
  const inactiveMembers = members.length - activeMembers;
  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="relative flex flex-col gap-4 pb-24">
      {/* Page header and filters */}
      <Card className="sticky top-20 z-20 border border-divider/60 bg-background/20 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-col gap-4 p-5">
          {/* Header row */}
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Users size={14} />
                Member management
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                startContent={<Filter size={16} />}
                variant={isFilterPanelOpen ? 'solid' : 'flat'}
                color={isFilterPanelOpen ? 'primary' : 'default'}
                aria-label={isFilterPanelOpen ? 'Collapse filter panel' : 'Expand filter panel'}
                aria-pressed={isFilterPanelOpen}
                onPress={() => setIsFilterPanelOpen((current) => !current)}
              >
                Filter
              </Button>

              {hasActiveFilters && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  radius="full"
                  aria-label="Clear filters"
                  onPress={clearFilters}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Divider />

        {/* Filter controls */}
        {isFilterPanelOpen && (
          <CardBody className="grid grid-cols-1 gap-3 p-5 pt-4 md:grid-cols-2">
            <Input
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search by name, username, or role"
              variant="bordered"
            />
            <Select
              aria-label="Filter members by status"
              selectedKeys={[statusFilter]}
              onSelectionChange={keys => setStatusFilter(Array.from(keys)[0] as 'all' | UserState)}
              variant="bordered"
            >
              <SelectItem key="all" textValue="All statuses">All statuses</SelectItem>
              <SelectItem key={UserState.ACTIVE} textValue="Active">Active</SelectItem>
              <SelectItem key={UserState.DEACTIVATED} textValue="Deactivated">Deactivated</SelectItem>
            </Select>
          </CardBody>
        )}
      </Card>

      {/* Mobile member cards */}
      <div className="grid gap-3 md:hidden">
        {filteredMembers.length === 0 ? (
          <Card className="border border-divider/60 shadow-sm">
            <CardBody className="p-4 text-center text-sm text-default-500">
              No members match the current filters.
            </CardBody>
          </Card>
        ) : (
          filteredMembers.map(member => (
            <Card key={member.id} className="border border-divider/60 shadow-sm">
              <CardBody className="gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <User
                    name={member.name}
                    description={member.username || 'No username yet'}
                    avatarProps={{
                      name: member.name.split(' ').map(n => n[0]).join(''),
                      color: "primary",
                      size: "sm"
                    }}
                  />
                  <Chip
                    variant="flat"
                    color={member.status === UserState.ACTIVE ? 'success' : 'warning'}
                  >
                    {member.status}
                  </Chip>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-default-500">Role</span>
                  <Chip variant="flat" color="secondary">
                    {member.role}
                  </Chip>
                </div>

                {canManageMembers ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<PencilLine size={14} />}
                      isDisabled={actionInProgressId === member.id}
                      onPress={() => onEditMember(member)}
                      className="flex-1"
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      startContent={<Trash2 size={14} />}
                      isDisabled={actionInProgressId === member.id || member.id === currentUserId}
                      onPress={() => handleDeleteMember(member.id, member.name)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Desktop member table */}
      <Card className="hidden border border-divider/60 shadow-sm md:block">
        <CardBody className="p-0">
          <Table aria-label="Members table" removeWrapper>
            <TableHeader>
              <TableColumn>MEMBER</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>{canManageMembers ? 'ACTIONS' : ''}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No members match the current filters.">
              {filteredMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <User
                      name={member.name}
                      description={member.username || 'No username yet'}
                      avatarProps={{
                        name: member.name.split(' ').map(n => n[0]).join(''),
                        color: "primary",
                        size: "sm"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip variant="flat" color="secondary">{member.role}</Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      variant="flat"
                      color={member.status === UserState.ACTIVE ? 'success' : 'warning'}
                    >
                      {member.status}
                    </Chip>
                  </TableCell>
                  {/* Actions */}
                  <TableCell>
                    {canManageMembers ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<PencilLine size={14} />}
                          isDisabled={actionInProgressId === member.id}
                          onPress={() => onEditMember(member)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          startContent={<Trash2 size={14} />}
                          isDisabled={actionInProgressId === member.id || member.id === currentUserId}
                          onPress={() => handleDeleteMember(member.id, member.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
       {canManageMembers && (
          <Button
            color="primary"
            className="fixed bottom-6 right-6 z-50 shadow-xl transition-transform hover:scale-105"
            startContent={<Plus size={16} />}
            onPress={onAddMember}
          >
            Add member
          </Button>
        )}
    </div>
  );
}
